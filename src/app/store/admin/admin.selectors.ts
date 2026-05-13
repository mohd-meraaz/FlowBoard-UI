import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AdminState } from './admin.state';

export const selectAdminState = createFeatureSelector<AdminState>('admin');

export const selectAdminUsers = createSelector(
  selectAdminState,
  (state: AdminState) => state.users
);

export const selectAdminStats = createSelector(
  selectAdminState,
  (state: AdminState) => state.stats
);

export const selectAdminWorkspaces = createSelector(
  selectAdminState,
  (state: AdminState) => state.workspaces
);

export const selectAdminBoards = createSelector(
  selectAdminState,
  (state: AdminState) => state.boards
);

export const selectAdminLoading = createSelector(
  selectAdminState,
  (state: AdminState) => state.loading
);

export const selectAdminError = createSelector(
  selectAdminState,
  (state: AdminState) => state.error
);
