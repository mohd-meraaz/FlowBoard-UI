import {
  Component, inject, OnInit, OnDestroy, Input, Output, EventEmitter
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';

import {
  Card, CardActivity, CardStatus, Priority
} from '../../../core/models/card.model';
import { CardService } from '../../../core/services/card.service';
import { AuthService } from '../../../core/services/auth.service';
import * as BoardActions from '../../../store/board/board.actions';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-card-detail',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule, DatePipe,
    MatIconModule, MatButtonModule, MatDividerModule,
    MatProgressSpinnerModule, MatMenuModule, MatProgressBarModule,
    MatSnackBarModule
  ],
  templateUrl: './card-detail.component.html',
  styleUrl: './card-detail.component.scss'
})
export class CardDetailComponent implements OnInit, OnDestroy {
  private fb          = inject(FormBuilder);
  private store       = inject(Store);
  private cardService = inject(CardService);
  private authService = inject(AuthService);
  private snack       = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);
  private destroy$    = new Subject<void>();

  @Input() card!: Card;
  @Input() boardMembers: Array<{ userId: number; displayName?: string; avatarUrl?: string }> = [];
  @Input() readOnly = false;
  @Output() cardUpdated = new EventEmitter<Card>();
  @Output() cardDeleted = new EventEmitter<{ cardId: number; listId: number }>();
  @Output() closed      = new EventEmitter<void>();

  editMode     = false;
  saving       = false;
  editTitle    = false;
  activity: CardActivity[] = [];
  loadingActivity = false;

  editedTitle       = '';
  editedDescription = '';
  newDueDate        = '';
  newStartDate      = '';
  commentText       = '';

  statuses:  CardStatus[] = ['TO_DO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  priorities: Priority[]  = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  statusLabels: Record<CardStatus, string> = {
    TO_DO: 'To Do', IN_PROGRESS: 'In Progress',
    IN_REVIEW: 'In Review', DONE: 'Done'
  };
  statusIcons: Record<CardStatus, string> = {
    TO_DO: 'radio_button_unchecked', IN_PROGRESS: 'sync',
    IN_REVIEW: 'rate_review', DONE: 'check_circle'
  };
  priorityColors: Record<Priority, string> = {
    LOW: '#22c55e', MEDIUM: '#f59e0b',
    HIGH: '#ef4444', CRITICAL: '#7c3aed'
  };

  ngOnInit(): void {
    this.editedTitle       = this.card.title;
    this.editedDescription = this.card.description || '';
    this.newDueDate        = this.card.dueDate || '';
    this.newStartDate      = this.card.startDate || '';
    this.loadActivity();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Activity ────────────────────────────────────────────────────────────────
  loadActivity(): void {
    this.loadingActivity = true;
    this.cardService.getActivity(this.card.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: logs => {
          this.activity = logs;
          this.loadingActivity = false;
        },
        error: () => this.loadingActivity = false
      });
  }

  // ── Title ───────────────────────────────────────────────────────────────────
  beginTitleEdit(): void {
    if (this.readOnly) return;
    this.editTitle = true;
    this.editedTitle = this.card.title;
  }

  saveTitle(): void {
    if (this.readOnly) return;
    if (!this.editedTitle.trim() || this.editedTitle === this.card.title) {
      this.editTitle = false;
      return;
    }
    this.saving = true;
    this.cardService.update(this.card.id, {
      title: this.editedTitle,
      description: this.card.description ?? undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => {
        this.saving    = false;
        this.editTitle = false;
        this.emitUpdate(updated);
        this.snack.open('Title updated', 'Close', { duration: 2000 });
      },
      error: () => { this.saving = false; this.snack.open('Failed to update title', 'Close', { duration: 3000 }); }
    });
  }

  // ── Description ─────────────────────────────────────────────────────────────
  saveDescription(): void {
    if (this.readOnly) return;
    this.saving = true;
    this.cardService.update(this.card.id, {
      title: this.card.title,
      description: this.editedDescription
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => {
        this.saving   = false;
        this.editMode = false;
        this.emitUpdate(updated);
        this.snack.open('Description saved', 'Close', { duration: 2000 });
      },
      error: () => { this.saving = false; }
    });
  }

  // ── Status ──────────────────────────────────────────────────────────────────
  setStatus(status: CardStatus): void {
    if (this.readOnly) return;
    this.saving = true;
    this.cardService.setStatus(this.card.id, status)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: updated => { this.saving = false; this.emitUpdate(updated); this.loadActivity(); },
        error: () => { this.saving = false; this.snack.open('Failed to update status', 'Close', { duration: 3000 }); }
      });
  }

  // ── Priority ─────────────────────────────────────────────────────────────────
  setPriority(priority: Priority): void {
    if (this.readOnly) return;
    this.saving = true;
    this.cardService.setPriority(this.card.id, priority)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: updated => { this.saving = false; this.emitUpdate(updated); this.loadActivity(); },
        error: () => { this.saving = false; this.snack.open('Failed to update priority', 'Close', { duration: 3000 }); }
      });
  }

  // ── Due Date ─────────────────────────────────────────────────────────────────
  saveDueDate(): void {
    if (this.readOnly) return;
    this.saving = true;
    this.cardService.update(this.card.id, {
      title:   this.card.title,
      dueDate: this.newDueDate || undefined
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: updated => {
        this.saving = false;
        this.emitUpdate(updated);
        this.snack.open('Due date updated', 'Close', { duration: 2000 });
      },
      error: () => { this.saving = false; this.snack.open('Failed to update due date', 'Close', { duration: 3000 }); }
    });
  }

  clearDueDate(): void {
    if (this.readOnly) return;
    this.newDueDate = '';
    this.saveDueDate();
  }

  // ── Assignee ─────────────────────────────────────────────────────────────────
  assignTo(userId: number | null): void {
    if (this.readOnly) return;
    this.saving = true;
    this.cardService.setAssignee(this.card.id, userId)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: updated => {
          this.saving = false;
          this.emitUpdate(updated);
          this.snack.open(userId ? 'Card assigned' : 'Assignee removed', 'Close', { duration: 2000 });
          this.loadActivity();
        },
        error: () => { this.saving = false; this.snack.open('Failed to assign card', 'Close', { duration: 3000 }); }
      });
  }

  // ── Archive / Delete ─────────────────────────────────────────────────────────
  archiveCard(): void {
    if (this.readOnly) return;
    this.cardService.archive(this.card.id)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: updated => {
          this.emitUpdate(updated);
          this.snack.open('Card archived', 'Close', { duration: 2000 });
          this.close();
        },
        error: () => this.snack.open('Failed to archive card', 'Close', { duration: 3000 })
      });
  }

  deleteCard(): void {
    if (this.readOnly) return;
    this.confirmDialog.confirm({
      title: 'Delete card permanently?',
      message: 'This card will be removed and cannot be restored.',
      confirmText: 'Delete',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.cardService.delete(this.card.id)
        .pipe(takeUntil(this.destroy$)).subscribe({
          next: () => {
            this.cardDeleted.emit({ cardId: this.card.id, listId: this.card.listId });
            this.snack.open('Card deleted', 'Close', { duration: 2000 });
            this.close();
          },
          error: () => this.snack.open('Failed to delete card', 'Close', { duration: 3000 })
        });
    });
  }

  // ── Copy Card ────────────────────────────────────────────────────────────────
  copyCard(): void {
    if (this.readOnly) return;
    this.cardService.copyCard(this.card.id)
      .pipe(takeUntil(this.destroy$)).subscribe({
        next: copy => {
          this.store.dispatch(BoardActions.addCard({ card: copy }));
          this.snack.open('Card copied!', 'Close', { duration: 2000 });
        },
        error: () => this.snack.open('Failed to copy card', 'Close', { duration: 3000 })
      });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────
  private emitUpdate(updated: Card): void {
    this.card = updated;
    this.cardUpdated.emit(updated);
    this.store.dispatch(BoardActions.updateCard({ card: updated }));
  }

  close(): void { this.closed.emit(); }

  getAssigneeName(userId: number | null): string {
    if (!userId) return 'Unassigned';
    const m = this.boardMembers.find(m => m.userId === userId);
    return m?.displayName || `User #${userId}`;
  }

  isOverdue(): boolean {
    if (!this.card.dueDate || this.card.status === 'DONE') return false;
    return new Date(this.card.dueDate) < new Date();
  }
}
