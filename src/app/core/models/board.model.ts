import { Card } from './card.model';
import { TaskList } from './list.model';
import { UserProfile } from './user.model';

export type BoardMemberRole = 'OBSERVER' | 'MEMBER' | 'ADMIN';

export interface BoardMember {
  userId: number;
  role: BoardMemberRole;
  addedAt: string;
  user?: UserProfile;
}

export interface BoardAnalytics {
  totalMembers: number;
  observerCount: number;
  memberCount: number;
  adminCount: number;
}

export interface Board {
  id: number;
  workspaceId: number;
  name: string;
  description: string | null;
  background: string | null;
  visibility: 'PUBLIC' | 'PRIVATE';
  createdById: number;
  isClosed: boolean;
  createdAt: string;
  updatedAt: string | null;
  memberCount: number;
  members: BoardMember[];
  analytics: BoardAnalytics;
}

export interface BoardShareLinkResponse {
  shareToken: string;
  path: string;
}

export interface PublicBoardDetailsResponse {
  board: Board;
  lists: TaskList[];
  cards: Card[];
}

export interface BoardSharedEmail {
  email: string;
  userId: number | null;
  createdAt: string;
}

export interface ShareBoardByEmailResponse {
  invitedCount: number;
  skippedCount: number;
  shared: BoardSharedEmail[];
}

export interface CreateBoardRequest {
  workspaceId: number;
  name: string;
  description?: string;
  background?: string;
  visibility: 'PUBLIC' | 'PRIVATE';
}

export interface UpdateBoardRequest {
  name: string;
  description?: string;
  background?: string;
  visibility?: 'PUBLIC' | 'PRIVATE';
}
