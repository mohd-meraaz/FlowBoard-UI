import { createAction, props } from '@ngrx/store';
import { UserProfile } from '../../core/models/user.model';
import { Workspace } from '../../core/models/workspace.model';
import { Board } from '../../core/models/board.model';

export const loadAdminStats = createAction('[Admin] Load Stats');
export const loadAdminStatsSuccess = createAction(
  '[Admin] Load Stats Success',
  props<{ stats: any }>()
);
export const loadAdminStatsFailure = createAction(
  '[Admin] Load Stats Failure',
  props<{ error: string }>()
);

export const loadAllUsers = createAction('[Admin] Load All Users');
export const loadAllUsersSuccess = createAction(
  '[Admin] Load All Users Success',
  props<{ users: UserProfile[] }>()
);
export const loadAllUsersFailure = createAction(
  '[Admin] Load All Users Failure',
  props<{ error: string }>()
);

export const updateUserRole = createAction(
  '[Admin] Update User Role',
  props<{ userId: number; role: string }>()
);

export const updateUserRoleSuccess = createAction('[Admin] Update User Role Success');
export const updateUserRoleFailure = createAction(
  '[Admin] Update User Role Failure',
  props<{ error: string }>()
);

export const deactivateUser = createAction(
  '[Admin] Deactivate User',
  props<{ userId: number }>()
);
export const deactivateUserSuccess = createAction('[Admin] Deactivate User Success');
export const deactivateUserFailure = createAction(
  '[Admin] Deactivate User Failure',
  props<{ error: string }>()
);

export const reactivateUser = createAction(
  '[Admin] Reactivate User',
  props<{ userId: number }>()
);
export const reactivateUserSuccess = createAction('[Admin] Reactivate User Success');
export const reactivateUserFailure = createAction(
  '[Admin] Reactivate User Failure',
  props<{ error: string }>()
);

export const loadAdminWorkspaces = createAction('[Admin] Load Workspaces');
export const loadAdminWorkspacesSuccess = createAction(
  '[Admin] Load Workspaces Success',
  props<{ workspaces: Workspace[] }>()
);
export const loadAdminWorkspacesFailure = createAction(
  '[Admin] Load Workspaces Failure',
  props<{ error: string }>()
);

export const loadAdminBoards = createAction('[Admin] Load Boards');
export const loadAdminBoardsSuccess = createAction(
  '[Admin] Load Boards Success',
  props<{ boards: Board[] }>()
);
export const loadAdminBoardsFailure = createAction(
  '[Admin] Load Boards Failure',
  props<{ error: string }>()
);
