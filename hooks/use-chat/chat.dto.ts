export class RoomEntity {
  id!: string;
  user1Id!: string;
  user2Id?: string | null;
  lastMessageAt?: Date | null;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  user1?: UserEntity | null;
  user2?: UserEntity | null;
  messages?: MessageEntity[] | null;
}

interface UserEntity {
  id: string | null;
  name: string | null;
  email: string | null;
}

export class MessageEntity {
  id!: string;
  roomId!: string;
  senderId?: string | null;
  content!: string;
  isRead!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
  // Relations
  room?: RoomEntity | null;
  sender?: UserEntity | null;
}


export interface GetRoomsQueryDto {
  page?: number;
  limit?: number;
  q?: string;
  sortBy?: 'lastMessageAt' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export type MessageCursor = {
  id: string;
  createdAt: Date;
};
export interface RoomMessagesPage {
  data: MessageEntity[];
  more: {
    hasMore: boolean;
    nextCursor: MessageCursor | null;
  };
};
