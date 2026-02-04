import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../entities/chat-message.entity';

@Injectable()
export class ChatMessageService {
  constructor(
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
  ) {}

  async createMessage(
    content: string,
    userId: string,
    roomId: string,
  ): Promise<ChatMessage> {
    const message = this.messageRepository.create({
      content,
      userId,
      roomId,
    });
    return this.messageRepository.save(message);
  }

  async getMessagesByRoom(
    roomId: string,
    limit: number = 50,
  ): Promise<ChatMessage[]> {
    return this.messageRepository.find({
      where: { roomId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async deleteMessage(id: string, userId: string): Promise<boolean> {
    const result = await this.messageRepository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }
}
