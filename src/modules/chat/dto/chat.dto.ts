import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

export class LeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  room: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  username: string;
}

export class TypingDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsBoolean()
  isTyping: boolean;
}

export class GetRoomUsersDto {
  @IsString()
  @IsNotEmpty()
  room: string;
}

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isPrivate?: boolean;
}

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  roomId: string;
}
