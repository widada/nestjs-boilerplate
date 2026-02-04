import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ChatRoomService } from './services/chat-room.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatService } from './services/chat.service';
import {
  JoinRoomDto,
  LeaveRoomDto,
  SendMessageDto,
  TypingDto,
  GetRoomUsersDto,
} from './dto/chat.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatRoomService: ChatRoomService,
    private readonly chatMessageService: ChatMessageService,
    private readonly chatService: ChatService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    client.emit('connected', { clientId: client.id });
  }

  handleDisconnect(client: Socket) {
    const events = this.chatRoomService.removeUser(client.id);

    events.forEach((event) => {
      this.server.to(event.room).emit('userLeft', event);
    });

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { room, username } = data;

    // Check if room exists in database
    const roomExists = await this.chatService.getRoomByName(room);
    if (!roomExists) {
      client.emit('error', { message: 'Room does not exist' });
      return { success: false, error: 'Room does not exist' };
    }

    client.join(room);
    this.chatRoomService.addUser(client.id, username, room);

    this.server.to(room).emit('userJoined', {
      username,
      room,
      timestamp: new Date(),
    });

    const usersInRoom = this.chatRoomService.getUsersInRoom(room);
    client.emit('roomUsers', {
      room,
      users: usersInRoom,
    });

    // Send recent messages to the user
    const messages = await this.chatMessageService.getMessagesByRoom(
      roomExists.id,
      20,
    );
    client.emit('previousMessages', messages.reverse());

    this.logger.log(`${username} joined room: ${room}`);
    return { success: true, room, username };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: LeaveRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = data;
    const event = this.chatRoomService.removeUserFromRoom(client.id, room);

    if (event) {
      client.leave(room);
      this.server.to(room).emit('userLeft', event);
      this.logger.log(`${event.username} left room: ${room}`);
    }

    return { success: true, room };
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { room, message, username } = data;

    // Get room from database to get roomId
    const roomData = await this.chatService.getRoomByName(room);
    if (!roomData) {
      client.emit('error', { message: 'Room not found' });
      return { success: false };
    }

    // Get user info from active users
    const user = this.chatRoomService.getUser(client.id);
    if (!user) {
      client.emit('error', { message: 'User not found' });
      return { success: false };
    }

    const messageData = {
      username,
      message,
      room,
      timestamp: new Date(),
      clientId: client.id,
    };

    this.server.to(room).emit('message', messageData);

    this.logger.log(`Message in ${room} from ${username}: ${message}`);
    return { success: true };
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody() data: TypingDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { room, username, isTyping } = data;

    client.to(room).emit('userTyping', {
      username,
      isTyping,
      room,
    });

    return { success: true };
  }

  @SubscribeMessage('getRoomUsers')
  handleGetRoomUsers(@MessageBody() data: GetRoomUsersDto) {
    const users = this.chatRoomService.getUsersInRoom(data.room);
    return { room: data.room, users };
  }
}
