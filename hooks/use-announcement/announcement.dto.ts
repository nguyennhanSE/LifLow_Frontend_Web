import { EAnnouncementType } from "@/entities/announcements/announcements.entity";

export interface AnnouncementPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface AnnouncementListResponse {
  data: unknown[]
  pagination: AnnouncementPagination
}

export interface QueryAnnouncementDto {
  page?: number
  limit?: number
  
    type?: EAnnouncementType;
  
    status?: 'active' | 'inactive';
  
    search?: string;
}

export interface CreateAnnouncementDto {
    title?: string;

    type?: EAnnouncementType;
    
    authorName?: string;
  
    isFixed?: boolean;
  
    content?: string;

    status?: 'active' | 'inactive';
}

export interface UpdateAnnouncementDto extends CreateAnnouncementDto {}