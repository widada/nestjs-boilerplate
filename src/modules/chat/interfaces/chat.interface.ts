export interface ActiveUser {
  username: string;
  rooms: Set<string>;
}

export interface UserEvent {
  username: string;
  room: string;
  timestamp: Date;
}

export interface MessageEvent extends UserEvent {
  message: string;
}

export interface TypingEvent {
  username: string;
  isTyping: boolean;
  room: string;
}

export interface RoomUsersResponse {
  room: string;
  users: string[];
}