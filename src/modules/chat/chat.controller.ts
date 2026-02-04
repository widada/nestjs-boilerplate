import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatMessageService } from './services/chat-message.service';
import { CreateRoomDto, CreateMessageDto } from './dto/chat.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatMessageService: ChatMessageService,
  ) {}

  @Post('rooms')
  @UseGuards(JwtAuthGuard)
  createRoom(@Body() createRoomDto: CreateRoomDto, @Request() req) {
    return this.chatService.createRoom(createRoomDto, req.user.id);
  }

  @Get('rooms')
  getAllRooms() {
    return this.chatService.getAllRooms();
  }

  @Get('rooms/:id')
  getRoomById(@Param('id') id: string) {
    return this.chatService.getRoomById(id);
  }

  @Delete('rooms/:id')
  @UseGuards(JwtAuthGuard)
  deleteRoom(@Param('id') id: string, @Request() req) {
    return this.chatService.deleteRoom(id, req.user.id);
  }

  @Get('rooms/:roomId/messages')
  getMessages(@Param('roomId') roomId: string) {
    return this.chatMessageService.getMessagesByRoom(roomId, 100);
  }

  @Post('messages')
  @UseGuards(JwtAuthGuard)
  createMessage(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    return this.chatMessageService.createMessage(
      createMessageDto.content,
      req.user.id,
      createMessageDto.roomId,
    );
  }

  @Delete('messages/:id')
  @UseGuards(JwtAuthGuard)
  deleteMessage(@Param('id') id: string, @Request() req) {
    return this.chatMessageService.deleteMessage(id, req.user.id);
  }
}
