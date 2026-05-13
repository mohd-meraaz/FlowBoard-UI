import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterModule } from '@angular/router';
import { Notification } from '../../../core/models/notification.model';
import { NotificationService } from '../../../core/services/notification.service';
import { WorkspaceService } from '../../../core/services/workspace.service';
import * as NotificationActions from '../../../store/notification/notification.actions';
import * as NotificationSelectors from '../../../store/notification/notification.selectors';

@Component({
  selector: 'app-notification-page',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './notification-page.component.html',
  styleUrl: './notification-page.component.scss'
})
export class NotificationPageComponent implements OnInit {
  private store = inject(Store);
  private workspaceService = inject(WorkspaceService);
  private notificationService = inject(NotificationService);
  private snack = inject(MatSnackBar);

  notifications$: Observable<Notification[]> = this.store.select(NotificationSelectors.selectAllNotifications);
  loading$: Observable<boolean> = this.store.select(NotificationSelectors.selectNotificationLoading);
  invitationActionState: Record<number, 'accept' | 'decline' | null> = {};
  resolvedInvitationIds = new Set<number>();

  ngOnInit(): void {
    this.store.dispatch(NotificationActions.loadNotifications());
  }

  markAsRead(n: Notification): void {
    if (!n.isRead) this.store.dispatch(NotificationActions.markAsRead({ id: n.id }));
  }

  markAllAsRead(): void {
    this.store.dispatch(NotificationActions.markAllAsRead());
  }

  respondToInvitation(notification: Notification, action: 'accept' | 'decline', event: Event): void {
    event.stopPropagation();

    const token = this.extractInvitationToken(notification);
    if (!token || this.invitationActionState[notification.id]) {
      return;
    }

    this.invitationActionState[notification.id] = action;
    const request$ = action === 'accept'
      ? this.workspaceService.acceptInvitation(token)
      : this.workspaceService.declineInvitation(token);

    request$
      .pipe(finalize(() => { this.invitationActionState[notification.id] = null; }))
      .subscribe({
        next: message => {
          this.resolvedInvitationIds.add(notification.id);
          this.notificationService.delete(notification.id).subscribe({
            next: () => {
              this.notificationService.refreshUnreadCount();
              this.store.dispatch(NotificationActions.loadNotifications());
            },
            error: () => {
              this.markAsRead(notification);
            }
          });
          this.snack.open(message, 'Close', { duration: 4000 });
        },
        error: err => {
          this.snack.open(err.error?.message ?? `Failed to ${action} invitation`, 'Close', { duration: 5000 });
        }
      });
  }

  isInvitationActionLoading(notificationId: number, action: 'accept' | 'decline'): boolean {
    return this.invitationActionState[notificationId] === action;
  }

  isWorkspaceInvitation(notification: Notification): boolean {
    return notification.title === 'Workspace invitation'
      && !notification.isRead
      && !this.resolvedInvitationIds.has(notification.id)
      && !!this.extractInvitationToken(notification);
  }

  private extractInvitationToken(notification: Notification): string | null {
    if (!notification.deepLinkUrl) {
      return null;
    }

    try {
      const url = new URL(notification.deepLinkUrl, window.location.origin);
      return url.searchParams.get('token');
    } catch {
      return null;
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'ASSIGNMENT': return 'user-plus';
      case 'DUE_DATE': return 'calendar-clock';
      case 'OVERDUE': return 'triangle-alert';
      case 'COMMENT': return 'messages-square';
      case 'MOVE': return 'move-right';
      default: return 'bell';
    }
  }
}
