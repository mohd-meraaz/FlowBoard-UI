import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import * as AdminActions from './admin.actions';
import { Workspace } from '../../core/models/workspace.model';
import { Board } from '../../core/models/board.model';

@Injectable()
export class AdminEffects {
  private actions$ = inject(Actions);
  private http = inject(HttpClient);
  private authAdminBase = `${environment.apiUrl}/auth/admin`;
  private workspaceBase = `${environment.apiUrl}/workspaces`;
  private boardBase = `${environment.apiUrl}/boards`;

  loadStats$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminStats),
      switchMap(() =>
        this.http.get(`${this.authAdminBase}/stats`).pipe(
          map(stats => AdminActions.loadAdminStatsSuccess({ stats })),
          catchError((error: HttpErrorResponse) =>
            of(AdminActions.loadAdminStatsFailure({
              error: error.error?.message || error.message || `Failed to load admin stats (${error.status})`
            }))
          )
        )
      )
    )
  );

  loadAllUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAllUsers),
      switchMap(() =>
        this.http.get<any[]>(`${this.authAdminBase}/users`).pipe(
          map(users => AdminActions.loadAllUsersSuccess({ users })),
          catchError((error: HttpErrorResponse) =>
            of(AdminActions.loadAllUsersFailure({
              error: error.error?.message || error.message || `Failed to load users (${error.status})`
            }))
          )
        )
      )
    )
  );

  updateUserRole$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.updateUserRole),
      switchMap(({ userId, role }) =>
        this.http.put(`${this.authAdminBase}/users/${userId}/role`, { role }, { responseType: 'text' }).pipe(
          map(() => AdminActions.updateUserRoleSuccess()),
          catchError((error: HttpErrorResponse) =>
            of(AdminActions.updateUserRoleFailure({
              error: error.error?.message || error.message || `Failed to update user role (${error.status})`
            }))
          )
        )
      )
    )
  );

  updateUserRoleSuccessReload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.updateUserRoleSuccess),
      map(() => AdminActions.loadAllUsers())
    )
  );

  deactivateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.deactivateUser),
      switchMap(({ userId }) =>
        this.http.put(`${this.authAdminBase}/users/${userId}/suspend`, {}, { responseType: 'text' }).pipe(
          map(() => AdminActions.deactivateUserSuccess()),
          catchError((error: HttpErrorResponse) =>
            of(AdminActions.deactivateUserFailure({
              error: error.error?.message || error.message || `Failed to deactivate user (${error.status})`
            }))
          )
        )
      )
    )
  );

  deactivateUserSuccessReload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.deactivateUserSuccess),
      map(() => AdminActions.loadAllUsers())
    )
  );

  reactivateUser$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.reactivateUser),
      switchMap(({ userId }) =>
        this.http.put(`${this.authAdminBase}/users/${userId}/reactivate`, {}, { responseType: 'text' }).pipe(
          map(() => AdminActions.reactivateUserSuccess()),
          catchError((error: HttpErrorResponse) =>
            of(AdminActions.reactivateUserFailure({
              error: error.error?.message || error.message || `Failed to reactivate user (${error.status})`
            }))
          )
        )
      )
    )
  );

  reactivateUserSuccessReload$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.reactivateUserSuccess),
      map(() => AdminActions.loadAllUsers())
    )
  );

  loadAdminWorkspaces$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminWorkspaces),
      switchMap(() =>
        this.http.get<any[]>(`${this.workspaceBase}/admin`).pipe(
          map(workspaces => AdminActions.loadAdminWorkspacesSuccess({ workspaces })),
          catchError((error: HttpErrorResponse) =>
            of(AdminActions.loadAdminWorkspacesFailure({
              error: error.error?.message || error.message || `Failed to load workspaces (${error.status})`
            }))
          )
        )
      )
    )
  );

  loadAdminBoards$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AdminActions.loadAdminBoards),
      switchMap(() =>
        this.http.get<Workspace[]>(`${this.workspaceBase}/admin`).pipe(
          switchMap((workspaces) => {
            if (!workspaces.length) {
              return of(AdminActions.loadAdminBoardsSuccess({ boards: [] }));
            }

            const boardCalls = workspaces.map((workspace) =>
              this.http.get<Board[]>(`${this.boardBase}/workspace/${workspace.id}`).pipe(
                catchError(() => of([] as Board[]))
              )
            );

            return forkJoin(boardCalls).pipe(
              map((boardsPerWorkspace) => {
                const merged = boardsPerWorkspace.flat();
                const uniqueById = Array.from(new Map(merged.map((b) => [b.id, b])).values());
                return AdminActions.loadAdminBoardsSuccess({ boards: uniqueById });
              })
            );
          }),
          catchError((error: HttpErrorResponse) =>
            of(AdminActions.loadAdminBoardsFailure({
              error: error.error?.message || error.message || `Failed to load boards (${error.status})`
            }))
          )
        )
      )
    )
  );
}
