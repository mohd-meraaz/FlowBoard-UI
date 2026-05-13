import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { WorkspaceService } from '../../../core/services/workspace.service';
import { BoardService } from '../../../core/services/board.service';
import { AuthService } from '../../../core/services/auth.service';
import { Workspace } from '../../../core/models/workspace.model';
import { Board } from '../../../core/models/board.model';
import { WorkspaceInvitation } from '../../../core/models/invitation.model';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-workspace-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatMenuModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatChipsModule
  ],
  templateUrl: './workspace-detail.component.html',
  styleUrl: './workspace-detail.component.scss'
})
export class WorkspaceDetailComponent implements OnInit {

  private route            = inject(ActivatedRoute);
  private router           = inject(Router);
  private fb               = inject(FormBuilder);
  private workspaceService = inject(WorkspaceService);
  private boardService     = inject(BoardService);
  private auth             = inject(AuthService);
  private snack            = inject(MatSnackBar);
  private confirmDialog    = inject(ConfirmDialogService);

  workspace: Workspace | null = null;
  boards: Board[]             = [];
  invitations: WorkspaceInvitation[] = [];
  loading        = true;
  loadingInvitations = false;
  showCreateBoard = false;
  showInviteForm  = false;
  creatingBoard  = false;
  inviting       = false;
  userId         = 0;

  activeTab: 'boards' | 'members' | 'settings' = 'boards';

  boardForm = this.fb.group({
    name:       ['', [Validators.required, Validators.minLength(2)]],
    description:[''],
    background: ['#4f46e5'],
    visibility: ['PRIVATE', Validators.required]
  });

  inviteForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    role:  ['MEMBER', Validators.required]
  });

  get boardName() { return this.boardForm.get('name')!; }

  ngOnInit(): void {
    this.userId = this.auth.getUserId();
    const id    = Number(this.route.snapshot.paramMap.get('id'));
    this.loadWorkspace(id);
  }

  loadWorkspace(id: number): void {
    this.workspaceService.getById(id).subscribe({
      next: ws => {
        this.workspace = ws;
        this.loadBoards(id);
      },
      error: () => {
        this.loading = false;
        this.snack.open('Workspace not found', 'Close',
          { duration: 3000 });
      }
    });
  }

  loadBoards(workspaceId: number): void {
    this.boardService.getByWorkspace(workspaceId).subscribe({
      next: boards => {
        this.boards  = boards;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  createBoard(): void {
    if (this.boardForm.invalid) return;
    this.creatingBoard = true;

    this.boardService.create({
      workspaceId: this.workspace!.id,
      ...this.boardForm.value
    } as any).subscribe({
      next: board => {
        this.boards.unshift(board);
        this.creatingBoard   = false;
        this.showCreateBoard = false;
        this.boardForm.reset({
          background: '#4f46e5', visibility: 'PRIVATE'
        });
        this.snack.open('Board created!', 'Close',
          { duration: 3000 });
      },
      error: err => {
        this.creatingBoard = false;
        this.snack.open(
          err.error?.message ?? 'Create failed',
          'Close', { duration: 4000 });
      }
    });
  }

  openBoard(id: number): void {
    this.router.navigate(['/board', id]);
  }

  deleteBoard(id: number, e: Event): void {
    e.stopPropagation();
    this.confirmDialog.confirm({
      title: 'Delete board?',
      message: 'This board and its cards will be removed permanently.',
      confirmText: 'Delete',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.boardService.delete(id).subscribe({
        next: () => {
          this.boards = this.boards.filter(b => b.id !== id);
          this.snack.open('Board deleted', 'Close', { duration: 3000 });
        }
      });
    });
  }

  loadInvitations(): void {
    if (!this.workspace) return;
    this.loadingInvitations = true;
    this.workspaceService.getPendingInvitations(this.workspace.id).subscribe({
      next: invites => {
        this.invitations = invites;
        this.loadingInvitations = false;
      },
      error: () => { this.loadingInvitations = false; }
    });
  }

  inviteMember(): void {
    if (this.inviteForm.invalid || !this.workspace) return;
    this.inviting = true;
    const { email, role } = this.inviteForm.value;

    this.workspaceService.inviteMember(this.workspace.id, email!, role!).subscribe({
      next: () => {
        this.inviting = false;
        this.showInviteForm = false;
        this.inviteForm.reset({ role: 'MEMBER' });
        this.snack.open(`Invitation sent to ${email}`, 'Close', { duration: 3000 });
        this.loadInvitations();
      },
      error: err => {
        this.inviting = false;
        const message =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.message ||
          'Invitation failed';
        this.snack.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  revokeInvitation(inviteId: number): void {
    if (!this.workspace) return;
    this.workspaceService.revokeInvitation(this.workspace.id, inviteId).subscribe({
      next: () => {
        this.invitations = this.invitations.filter(i => i.id !== inviteId);
        this.snack.open('Invitation revoked', 'Close', { duration: 2000 });
      },
      error: err => {
        const message =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.message ||
          'Failed to revoke invitation';
        this.snack.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  removeMember(userId: number): void {
    if (!this.workspace) return;
    this.confirmDialog.confirm({
      title: 'Remove member?',
      message: 'This member will lose access to the workspace.',
      confirmText: 'Remove',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed || !this.workspace) return;
      this.workspaceService.removeMember(this.workspace.id, userId).subscribe({
        next: () => {
          if (this.workspace) {
            this.workspace.members = this.workspace.members.filter((m: any) => m.userId !== userId);
          }
          this.snack.open('Member removed', 'Close', { duration: 2000 });
        }
      });
    });
  }

  updateWorkspaceVisibility(visibility: 'PUBLIC' | 'PRIVATE'): void {
    if (!this.workspace || !this.isOwner()) return;
    this.workspaceService.update(this.workspace.id, {
      name: this.workspace.name,
      visibility 
    }).subscribe({
      next: updated => {
        this.workspace = updated;
        this.snack.open(`Workspace is now ${visibility}`, 'Close', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to update visibility', 'Close', { duration: 3000 })
    });
  }

  deleteWorkspace(): void {
    if (!this.workspace || !this.isOwner()) return;
    this.confirmDialog.confirm({
      title: 'Delete workspace permanently?',
      message: 'This deletes the workspace and all boards. This action cannot be undone.',
      confirmText: 'Delete forever',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed || !this.workspace) return;
      this.workspaceService.delete(this.workspace.id).subscribe({
        next: () => {
          this.snack.open('Workspace deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/dashboard']);
        },
        error: () => this.snack.open('Failed to delete workspace', 'Close', { duration: 3000 })
      });
    });
  }

  goBack(): void { this.router.navigate(['/dashboard']); }

  getInitials(name: string): string {
    return name.split(' ')
      .map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  isOwner(): boolean {
    return this.workspace?.ownerId === this.userId;
  }
}
