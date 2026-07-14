import { User } from "../user.entity";

export interface AnnouncementEntity {
    id: string;
  
    title: string;
  
    type: EAnnouncementType;
  
    imageUrl?: string | null;
  
    content: string;
  
    authorId?: string | null;
  
    views: number;
  
    status: 'active' | 'inactive';
  
    isFixed?: boolean;
  
    createdAt?: Date;
  
    updatedAt?: Date;
  
    author?: User | null;

    /** From API when present */
    authorName?: string | null;
  }

export enum EAnnouncementType {
GENERAL = 'GENERAL',
RECIPE = 'RECIPE',
USER = 'USER',
}
  

  