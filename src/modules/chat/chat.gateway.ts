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
import { Logger } from '@nestjs/common';
import { ChatRoomService } from './services/chat-room.service';
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
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(private readonly chatRoomService: ChatRoomService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const events = this.chatRoomService.removeUser(client.id);
    
    events.forEach((event) => {
      this.server.to(event.room).emit('userLeft', event);
    });

    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { room, username } = data;

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
  handleMessage(
    @MessageBody() data: SendMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { room, message, username } = data;

    this.server.to(room).emit('message', {
      username,
      message,
      room,
      timestamp: new Date(),
    });

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