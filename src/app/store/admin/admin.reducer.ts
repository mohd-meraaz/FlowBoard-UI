import { createReducer, on } from '@ngrx/store';
import { initialAdminState } from './admin.state';
import * as AdminActions from './admin.actions';

export const adminReducer = createReducer(
  initialAdminState,
  on(AdminActions.loadAdminStats, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AdminActions.loadAllUsers, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AdminActions.loadAdminWorkspaces, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AdminActions.loadAdminBoards, state => ({
    ...state,
    loading: true,
    error: null
  })),
  on(AdminActions.loadAdminStatsSuccess, (state, { stats }) => ({
    ...state,
    stats,
    loading: false
  })),
  on(AdminActions.loadAllUsersSuccess, (state, { users }) => ({
    ...state,
    users,
    loading: false
  })),
  on(AdminActions.loadAdminWorkspacesSuccess, (state, { workspaces }) => ({
    ...state,
    workspaces,
    loading: false
  })),
  on(AdminActions.loadAdminBoardsSuccess, (state, { boards }) => ({
    ...state,
    boards,
    loading: false
  })),
  on(AdminActions.updateUserRoleSuccess, state => ({
    ...state,
    loading: false
  })),
  on(AdminActions.deactivateUserSuccess, state => ({
    ...state,
    loading: false
  })),
  on(AdminActions.reactivateUserSuccess, state => ({
    ...state,
    loading: false
  })),
  on(AdminActions.loadAdminStatsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AdminActions.loadAllUsersFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AdminActions.loadAdminWorkspacesFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AdminActions.loadAdminBoardsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AdminActions.updateUserRoleFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AdminActions.deactivateUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(AdminActions.reactivateUserFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  }))
);
