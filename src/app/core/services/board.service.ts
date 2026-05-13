import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Board, CreateBoardRequest,
  UpdateBoardRequest, BoardAnalytics,
  BoardShareLinkResponse, ShareBoardByEmailResponse, BoardSharedEmail,
  PublicBoardDetailsResponse
} from '../models/board.model';

@Injectable({ providedIn: 'root' })
export class BoardService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/boards`;

  getByWorkspace(workspaceId: number): Observable<Board[]> {
    return this.http.get<Board[]>(
      `${this.base}/workspace/${workspaceId}`);
  }

  getById(id: number): Observable<Board> {
    return this.http.get<Board>(`${this.base}/${id}`);
  }

  getPublicByToken(token: string): Observable<Board> {
    return this.http.get<Board>(`${this.base}/public/${token}`);
  }

  getPublicDetailsByToken(token: string): Observable<PublicBoardDetailsResponse> {
    return this.http.get<PublicBoardDetailsResponse>(`${this.base}/public/${token}/details`);
  }

  getByMember(userId: number): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.base}/member/${userId}`);
  }

  create(data: CreateBoardRequest): Observable<Board> {
    return this.http.post<Board>(this.base, data);
  }

  update(id: number, data: UpdateBoardRequest): Observable<Board> {
    return this.http.put<Board>(`${this.base}/${id}`, data);
  }

  close(id: number): Observable<Board> {
    return this.http.put<Board>(`${this.base}/${id}/close`, {});
  }

  reopen(id: number): Observable<Board> {
    return this.http.put<Board>(`${this.base}/${id}/reopen`, {});
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`,
      { responseType: 'text' });
  }

  addMember(boardId: number,
    userId: number, role: string): Observable<unknown> {
    return this.http.post(
      `${this.base}/${boardId}/members`, { userId, role }
    );
  }

  removeMember(boardId: number, userId: number): Observable<string> {
    return this.http.delete(
      `${this.base}/${boardId}/members/${userId}`,
      { responseType: 'text' }
    );
  }

  updateMemberRole(boardId: number,
    userId: number, role: string): Observable<string> {
    return this.http.put(
      `${this.base}/${boardId}/members/${userId}/role`,
      { role }, { responseType: 'text' }
    );
  }

  getAnalytics(id: number): Observable<BoardAnalytics> {
    return this.http.get<BoardAnalytics>(`${this.base}/${id}/analytics`);
  }

  createShareLink(boardId: number): Observable<BoardShareLinkResponse> {
    return this.http.post<BoardShareLinkResponse>(
      `${this.base}/${boardId}/share/link`,
      {}
    );
  }

  shareByEmail(boardId: number, emails: string[]): Observable<ShareBoardByEmailResponse> {
    return this.http.post<ShareBoardByEmailResponse>(
      `${this.base}/${boardId}/share/email`,
      { emails }
    );
  }

  getSharedEmails(boardId: number): Observable<BoardSharedEmail[]> {
    return this.http.get<BoardSharedEmail[]>(
      `${this.base}/${boardId}/share/email`
    );
  }

  revokeSharedEmail(boardId: number, email: string): Observable<string> {
    return this.http.delete(
      `${this.base}/${boardId}/share/email?email=${encodeURIComponent(email)}`,
      { responseType: 'text' }
    );
  }

  search(keyword: string): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.base}/search?keyword=${keyword}`);
  }
}
