import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { ActiveUser, UserEvent } from '../interfaces/chat.interface';

@Injectable()
export class ChatRoomService {
  private readonly logger = new Logger(ChatRoomService.name);
  private activeUsers: Map<string, ActiveUser> = new Map();

  addUser(clientId: string, username: string, room: string): void {
    if (!this.activeUsers.has(clientId)) {
      this.activeUsers.set(clientId, {
        username,
        rooms: new Set([room]),
      });
    } else {
      this.activeUsers.get(clientId).rooms.add(room);
    }
    this.logger.log(`${username} added to room: ${room}`);
  }

  removeUserFromRoom(clientId: string, room: string): UserEvent | null {
    const user = this.activeUsers.get(clientId);
    if (!user) return null;

    user.rooms.delete(room);
    this.logger.log(`${user.username} removed from room: ${room}`);

    return {
      username: user.username,
      room,
      timestamp: new Date(),
    };
  }

  removeUser(clientId: string): UserEvent[] {
    const user = this.activeUsers.get(clientId);
    if (!user) return [];

    const events: UserEvent[] = [];
    user.rooms.forEach((room) => {
      events.push({
        username: user.username,
        room,
        timestamp: new Date(),
      });
    });

    this.activeUsers.delete(clientId);
    return events;
  }

  getUser(clientId: string): ActiveUser | undefined {
    return this.activeUsers.get(clientId);
  }

  getUsersInRoom(room: string): string[] {
    const users: string[] = [];
    this.activeUsers.forEach((user) => {
      if (user.rooms.has(room)) {
        users.push(user.username);
      }
    });
    return users;
  }

  getAllActiveUsers(): number {
    return this.activeUsers.size;
  }
}