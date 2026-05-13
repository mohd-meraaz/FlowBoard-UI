import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Store } from '@ngrx/store';
import { MatTabChangeEvent, MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { combineLatest, map } from 'rxjs';

import * as AdminActions from '../../../store/admin/admin.actions';
import * as AdminSelectors from '../../../store/admin/admin.selectors';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatTabsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './admin-panel.component.html',
  styleUrl: './admin-panel.component.scss'
})
export class AdminPanelComponent implements OnInit {
  private store = inject(Store);

  users$   = this.store.select(AdminSelectors.selectAdminUsers);
  stats$   = this.store.select(AdminSelectors.selectAdminStats);
  workspaces$ = this.store.select(AdminSelectors.selectAdminWorkspaces);
  boards$ = this.store.select(AdminSelectors.selectAdminBoards);
  loading$ = this.store.select(AdminSelectors.selectAdminLoading);
  error$   = this.store.select(AdminSelectors.selectAdminError);

  userColumns = ['avatar', 'name', 'email', 'role', 'actions'];
  workspaceColumns = ['id', 'name', 'ownerId', 'visibility', 'members'];
  boardColumns = ['id', 'name', 'workspaceId', 'visibility', 'members', 'status'];
  selectedTabIndex = 0;
  liveStats$ = combineLatest([this.stats$, this.users$, this.workspaces$, this.boards$]).pipe(
    map(([stats, users, workspaces, boards]) => ({
      totalUsers: users.length || stats?.totalUsers || 0,
      totalWorkspaces: workspaces.length || stats?.totalWorkspaces || 0,
      totalBoards: boards.length || stats?.totalBoards || 0,
      activeUsersToday: stats?.activeUsersToday || users.filter((u) => u.active).length || 0
    }))
  );

  ngOnInit(): void {
    this.store.dispatch(AdminActions.loadAdminStats());
    this.store.dispatch(AdminActions.loadAllUsers());
    this.store.dispatch(AdminActions.loadAdminWorkspaces());
    this.store.dispatch(AdminActions.loadAdminBoards());
  }

  changeRole(userId: number, role: string): void {
    this.store.dispatch(AdminActions.updateUserRole({ userId, role }));
  }

  deactivateUser(userId: number): void {
    this.store.dispatch(AdminActions.deactivateUser({ userId }));
  }

  toggleUserActive(userId: number, active: boolean): void {
    if (active) {
      this.store.dispatch(AdminActions.deactivateUser({ userId }));
      return;
    }
    this.store.dispatch(AdminActions.reactivateUser({ userId }));
  }

  loadWorkspaces(): void {
    this.store.dispatch(AdminActions.loadAdminWorkspaces());
  }

  openWorkspacesTab(): void {
    this.selectedTabIndex = 1;
    this.loadWorkspaces();
  }

  openBoardsTab(): void {
    this.selectedTabIndex = 2;
    this.store.dispatch(AdminActions.loadAdminBoards());
  }

  openUsersTab(): void {
    this.selectedTabIndex = 0;
    this.store.dispatch(AdminActions.loadAllUsers());
  }

  isStatActive(tabIndex: number): boolean {
    return this.selectedTabIndex === tabIndex;
  }

  onTabChanged(event: MatTabChangeEvent): void {
    if (event.index === 1) {
      this.loadWorkspaces();
    }
    if (event.index === 2) {
      this.store.dispatch(AdminActions.loadAdminBoards());
    }
  }
}
