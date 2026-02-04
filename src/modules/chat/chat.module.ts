import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './chat.gateway';
import { ChatController } from './chat.controller';
import { ChatRoomService } from './services/chat-room.service';
import { ChatService } from './services/chat.service';
import { ChatMessageService } from './services/chat-message.service';
import { ChatRoom } from './entities/chat-room.entity';
import { ChatMessage } from './entities/chat-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatRoom, ChatMessage])],
  controllers: [ChatController],
  providers: [ChatGateway, ChatRoomService, ChatService, ChatMessageService],
  exports: [ChatRoomService, ChatService, ChatMessageService],
})
export class ChatModule {}
