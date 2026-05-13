import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../models/notification.model';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/notifications`;

  private _unreadCount = new BehaviorSubject<number>(0);
  unreadCount$ = this._unreadCount.asObservable();

  getNotifications(): Observable<Notification[]> {
    return this.http.get<any[]>(this.base).pipe(
      map(notifications => notifications.map(n => this.normalizeNotification(n)))
    );
  }

  // Legacy alias for getNotifications
  getAll(): Observable<Notification[]> {
    return this.getNotifications();
  }

  getUnread(): Observable<Notification[]> {
    return this.http.get<any[]>(`${this.base}/unread`).pipe(
      map(notifications => notifications.map(n => this.normalizeNotification(n)))
    );
  }

  refreshUnreadCount(): void {
    this.http.get<number>(`${this.base}/unread/count`).subscribe({
      next: c => this._unreadCount.next(c),
      error: () => {}
    });
  }

  markAsRead(id: number): Observable<Notification> {
    return this.http.put<any>(`${this.base}/${id}/read`, {}).pipe(
      map(n => this.normalizeNotification(n))
    );
  }

  markAllAsRead(): Observable<string> {
    return this.http.put(
      `${this.base}/read/all`, {},
      { responseType: 'text' }
    );
  }

  delete(id: number): Observable<string> {
    return this.http.delete(`${this.base}/${id}`,
      { responseType: 'text' }
    );
  }

  deleteRead(): Observable<string> {
    return this.http.delete(`${this.base}/read/all`,
      { responseType: 'text' });
  }

  private normalizeNotification(raw: any): Notification {
    return {
      ...raw,
      isRead: typeof raw?.isRead === 'boolean' ? raw.isRead : !!raw?.read
    } as Notification;
  }
}
