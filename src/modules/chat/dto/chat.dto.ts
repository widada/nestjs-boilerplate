export class JoinRoomDto {
  room: string;
  username: string;
}

export class LeaveRoomDto {
  room: string;
}

export class SendMessageDto {
  room: string;
  message: string;
  username: string;
}

export class TypingDto {
  room: string;
  username: string;
  isTyping: boolean;
}

export class GetRoomUsersDto {
  room: string;
}