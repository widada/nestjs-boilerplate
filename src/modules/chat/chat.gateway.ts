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

interface JoinRoomDto {
  room: string;
  username: string;
}

interface SendMessageDto {
  room: string;
  message: string;
  username: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ChatGateway');
  private activeUsers: Map<string, { username: string; rooms: Set<string> }> =
    new Map();

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const user = this.activeUsers.get(client.id);
    if (user) {
      user.rooms.forEach((room) => {
        this.server.to(room).emit('userLeft', {
          username: user.username,
          room,
          timestamp: new Date(),
        });
      });
      this.activeUsers.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @MessageBody() data: JoinRoomDto,
    @ConnectedSocket() client: Socket,
  ) {
    const { room, username } = data;

    client.join(room);

    if (!this.activeUsers.has(client.id)) {
      this.activeUsers.set(client.id, {
        username,
        rooms: new Set([room]),
      });
    } else {
      this.activeUsers.get(client.id).rooms.add(room);
    }

    this.server.to(room).emit('userJoined', {
      username,
      room,
      timestamp: new Date(),
    });

    const usersInRoom = this.getUsersInRoom(room);
    client.emit('roomUsers', {
      room,
      users: usersInRoom,
    });

    this.logger.log(`${username} joined room: ${room}`);

    return { success: true, room, username };
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(
    @MessageBody() data: { room: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { room } = data;
    const user = this.activeUsers.get(client.id);

    if (user) {
      client.leave(room);
      user.rooms.delete(room);

      this.server.to(room).emit('userLeft', {
        username: user.username,
        room,
        timestamp: new Date(),
      });

      this.logger.log(`${user.username} left room: ${room}`);
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
    @MessageBody() data: { room: string; username: string; isTyping: boolean },
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
  handleGetRoomUsers(@MessageBody() data: { room: string }) {
    const users = this.getUsersInRoom(data.room);
    return { room: data.room, users };
  }

  private getUsersInRoom(room: string): string[] {
    const users: string[] = [];
    this.activeUsers.forEach((user) => {
      if (user.rooms.has(room)) {
        users.push(user.username);
      }
    });
    return users;
  }
}