import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatRoom } from '../entities/chat-room.entity';
import { CreateRoomDto } from '../dto/chat.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatRoom)
    private roomRepository: Repository<ChatRoom>,
  ) {}

  async createRoom(createRoomDto: CreateRoomDto, userId: string): Promise<ChatRoom> {
    const room = this.roomRepository.create({
      ...createRoomDto,
      createdBy: userId,
    });
    return this.roomRepository.save(room);
  }

  async getAllRooms(): Promise<ChatRoom[]> {
    return this.roomRepository.find({
      where: { isPrivate: false },
      relations: ['creator'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRoomById(id: string): Promise<ChatRoom> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['creator'],
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  async getRoomByName(name: string): Promise<ChatRoom | null> {
    return this.roomRepository.findOne({ where: { name } });
  }

  async deleteRoom(id: string, userId: string): Promise<boolean> {
    const room = await this.getRoomById(id);
    if (room.createdBy !== userId) {
      return false;
    }
    await this.roomRepository.delete(id);
    return true;
  }
}
