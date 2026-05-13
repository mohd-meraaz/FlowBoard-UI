import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { NotificationService } from '../../core/services/notification.service';
import * as NotificationActions from './notification.actions';

@Injectable()
export class NotificationEffects {
  private actions$ = inject(Actions);
  private notificationService = inject(NotificationService);

  loadNotifications$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.loadNotifications),
      switchMap(() =>
        this.notificationService.getNotifications().pipe(
          map(notifications => NotificationActions.loadNotificationsSuccess({ notifications })),
          catchError(error => of(NotificationActions.loadNotificationsFailure({ error: error.error?.message || 'Failed to load notifications' })))
        )
      )
    )
  );

  markAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.markAsRead),
      switchMap(({ id }) =>
        this.notificationService.markAsRead(id).pipe(
          map(() => NotificationActions.markAsReadSuccess({ id })),
          catchError(error => of(NotificationActions.markAsReadFailure({
            error: error.error?.message || 'Failed to mark notification as read'
          })))
        )
      )
    )
  );

  markAllAsRead$ = createEffect(() =>
    this.actions$.pipe(
      ofType(NotificationActions.markAllAsRead),
      switchMap(() =>
        this.notificationService.markAllAsRead().pipe(
          map(() => NotificationActions.markAllAsReadSuccess()),
          catchError(error => of(NotificationActions.markAllAsReadFailure({
            error: error.error?.message || 'Failed to mark all notifications as read'
          })))
        )
      )
    )
  );
}
