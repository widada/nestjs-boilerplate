import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { ChatRoomService } from './services/chat-room.service';

@Module({
  providers: [ChatGateway, ChatRoomService],
  exports: [ChatRoomService],
})
export class ChatModule {}