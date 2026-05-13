import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { BoardService } from '../../../core/services/board.service';
import { ListService } from '../../../core/services/list.service';
import { CardService } from '../../../core/services/card.service';
import { Board } from '../../../core/models/board.model';
import { TaskList } from '../../../core/models/list.model';
import { Card } from '../../../core/models/card.model';
import { CardCreateComponent } from '../card-create/card-create.component';
import { CardDetailComponent } from '../card-detail/card-detail.component';
import { BoardAnalyticsComponent } from '../board-analytics/board-analytics.component';
import { ArchiveManagerComponent } from '../archive-manager/archive-manager.component';
import { BoardShareModalComponent } from '../board-share-modal/board-share-modal.component';
import { Store } from '@ngrx/store';
import * as BoardActions from '../../../store/board/board.actions';
import { selectLists, selectCards, selectBoardLoading } from '../../../store/board/board.selectors';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-board-view',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    DragDropModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatMenuModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatTooltipModule,
    MatDividerModule,
    CardCreateComponent, CardDetailComponent,
    BoardAnalyticsComponent, ArchiveManagerComponent, BoardShareModalComponent
  ],
  templateUrl: './board-view.component.html',
  styleUrl: './board-view.component.scss'
})
export class BoardViewComponent implements OnInit, OnDestroy {
  private readonly fallbackListAccents = ['#64748b', '#f59e0b', '#10b981', '#6366f1'];
  private readonly priorityColors: Record<string, string> = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#ef4444',
    CRITICAL: '#7c3aed'
  };
  private readonly statusColors: Record<string, string> = {
    TO_DO: '#64748b',
    IN_PROGRESS: '#f59e0b',
    IN_REVIEW: '#0ea5e9',
    DONE: '#10b981'
  };

  private route        = inject(ActivatedRoute);
  private router       = inject(Router);
  private fb           = inject(FormBuilder);
  private boardService = inject(BoardService);
  private listService  = inject(ListService);
  private cardService  = inject(CardService);
  private snack        = inject(MatSnackBar);
  private confirmDialog = inject(ConfirmDialogService);

  private store        = inject(Store);
  private destroy$     = new Subject<void>();

  board: Board | null = null;
  lists: TaskList[]   = [];
  allCards: Card[]    = [];
  loading      = true;
  addingList   = false;
  showAddList  = false;
  selectedCard: Card | null = null;
  showCardDetail = false;
  activeAddCardListId: number | null = null;
  
  showAnalytics = false;
  showArchive   = false;
  showShareModal = false;
  isPublicPreview = false;
  publicShareToken: string | null = null;

  boardMembers: Array<{ userId: number; displayName?: string; avatarUrl?: string }> = [];

  listForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]]
  });

  ngOnInit(): void {
    this.store.select(selectBoardLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        if (!this.isPublicPreview) this.loading = loading;
      });

    this.store.select(selectLists)
      .pipe(takeUntil(this.destroy$))
      .subscribe(lists => {
        if (!this.isPublicPreview) this.lists = lists;
      });

    this.store.select(selectCards)
      .pipe(takeUntil(this.destroy$))
      .subscribe(cards => {
        if (!this.isPublicPreview) this.allCards = cards;
      });

    const publicToken = this.route.snapshot.paramMap.get('token');
    if (publicToken) {
      this.isPublicPreview = true;
      this.publicShareToken = publicToken;
      this.loadPublicBoard(publicToken);
      return;
    }

    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.store.dispatch(BoardActions.selectBoard({ id }));
    this.loadBoard(id);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadBoard(id: number): void {
    this.loading = true;
    this.boardService.getById(id).subscribe({
      next: b => {
        this.board = b;
        this.setBoardMembers(b);
        this.store.dispatch(BoardActions.loadBoardDetails({ boardId: id }));
      },
      error: () => {
        this.loading = false;
        this.snack.open('Board not found', 'Close', { duration: 3000 });
      }
    });
  }

  loadPublicBoard(token: string): void {
    this.loading = true;
    this.boardService.getPublicDetailsByToken(token).subscribe({
      next: details => {
        this.board = details.board;
        this.setBoardMembers(details.board);
        this.lists = details.lists;
        this.allCards = details.cards;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snack.open('Board share link is not available', 'Close', { duration: 3000 });
        this.router.navigate(['/']);
      }
    });
  }

  getCards(listId: number): Card[] {
    return this.allCards.filter(c => c.listId === listId);
  }

  getConnectedLists(): string[] {
    return this.lists.map(l => 'list-' + l.id);
  }

  onListDrop(event: CdkDragDrop<TaskList[]>): void {
    if (this.isReadOnly || !this.board) return;
    if (event.previousIndex === event.currentIndex) return;
    this.store.dispatch(BoardActions.moveList({
      boardId: this.board.id,
      prevIndex: event.previousIndex,
      currentIndex: event.currentIndex,
      orderedListIds: this.lists.map(l => l.id)
    }));
  }

  onCardDrop(event: CdkDragDrop<Card[]>,
    targetListId: number): void {
    if (this.isReadOnly) return;
    const card = event.previousContainer.data[event.previousIndex];
    if (event.previousContainer === event.container) {
      if (event.previousIndex === event.currentIndex) return;
    }
    
    this.store.dispatch(BoardActions.moveCard({
      cardId: card.id,
      fromListId: card.listId,
      toListId: targetListId,
      prevIndex: event.previousIndex,
      currentIndex: event.currentIndex
    }));
  }

  addList(): void {
    if (this.isReadOnly || !this.board) return;
    if (this.listForm.invalid) return;
    this.addingList = true;
    this.store.dispatch(BoardActions.addList({
      boardId: this.board.id,
      name: this.listForm.value.name!
    }));
    this.listForm.reset();
    this.showAddList = false;
    this.addingList  = false;
  }

  onCardCreated(card: Card, listId: number): void {
    if (this.isReadOnly) return;
    this.store.dispatch(BoardActions.addCard({ card }));
  }

  openCardDetail(card: Card): void {
    this.selectedCard  = card;
    this.showCardDetail = true;
  }

  closeCardDetail(): void {
    this.showCardDetail = false;
    this.selectedCard   = null;
  }

  onCardUpdated(updated: Card): void {
    if (!this.isPublicPreview) {
      this.store.dispatch(BoardActions.updateCard({ card: updated }));
    } else {
      this.allCards = this.allCards.map(card => card.id === updated.id ? updated : card);
    }
    this.selectedCard = updated;
  }

  onCardDeleted(data: { cardId: number; listId: number }): void {
    if (!this.isPublicPreview) {
      this.store.dispatch(BoardActions.deleteCard({ cardId: data.cardId, listId: data.listId }));
    } else {
      this.allCards = this.allCards.filter(card => card.id !== data.cardId);
    }
    this.closeCardDetail();
  }

  archiveList(listId: number): void {
    if (this.isReadOnly) return;
    this.store.dispatch(BoardActions.archiveList({ listId }));
    this.snack.open('List archived!', 'Close', { duration: 3000 });
  }

  deleteList(listId: number): void {
    if (this.isReadOnly) return;
    this.confirmDialog.confirm({
      title: 'Delete list?',
      message: 'All cards in this list will be deleted.',
      confirmText: 'Delete',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.store.dispatch(BoardActions.deleteList({ listId }));
    });
  }

  getPriorityColor(p: string): string {
    return this.priorityColors[p] ?? '#94a3b8';
  }

  getBoardLayoutStyle(): Record<string, string> {
    return {
      background: this.board?.background || '#10131d'
    };
  }

  getListTheme(list: TaskList, index: number): Record<string, string> {
    const accent = this.getListAccent(list, index);
    const rgb = this.hexToRgb(accent) ?? { r: 99, g: 102, b: 241 };

    return {
      '--column-accent': accent,
      '--column-accent-rgb': `${rgb.r}, ${rgb.g}, ${rgb.b}`,
      '--column-accent-contrast': this.getContrastColor(accent)
    };
  }

  getPriorityBadgeStyle(priority: string): Record<string, string> {
    return this.getTintedBadgeStyle(this.getPriorityColor(priority));
  }

  getStatusBadgeStyle(status: string): Record<string, string> {
    const color = this.statusColors[status] ?? '#64748b';
    return this.getTintedBadgeStyle(color);
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      TO_DO: 'To Do',
      IN_PROGRESS: 'In Progress',
      IN_REVIEW: 'In Review',
      DONE: 'Done'
    };
    return map[status] ?? status;
  }

  goBack(): void {
    if (this.isPublicPreview) {
      this.router.navigate(['/']);
      return;
    }
    window.history.back();
  }

  openShareModal(): void {
    if (!this.board || this.isReadOnly) return;
    this.showShareModal = true;
  }

  closeShareModal(): void {
    this.showShareModal = false;
  }

  // --- Advanced Analytics & Archive ---

  getAllCards(): Card[] {
    return this.allCards;
  }

  getArchivedCards(): Card[] {
    return this.getAllCards().filter(c => c.isArchived);
  }

  getArchivedLists(): TaskList[] {
    return this.lists.filter(l => l.isArchived);
  }

  restoreCard(card: Card): void {
    if (this.isReadOnly) return;
    const request = {
      title: card.title,
      isArchived: false,
      description: card.description ?? undefined
    };
    this.cardService.update(card.id, request as any).subscribe({
      next: () => {
        const updated = { ...card, isArchived: false };
        if (!this.isPublicPreview) {
          this.store.dispatch(BoardActions.updateCard({ card: updated }));
        }
        this.snack.open('Card restored!', 'Close', { duration: 3000 });
      }
    });
  }

  restoreList(listId: number): void {
    if (this.isReadOnly || !this.board) return;
    const boardId = this.board.id;
    this.listService.unarchive(listId).subscribe({
      next: () => {
        const list = this.lists.find(l => l.id === listId);
        if (list && !this.isPublicPreview) {
          this.store.dispatch(BoardActions.loadBoardDetails({ boardId }));
        }
        this.snack.open('List restored!', 'Close', { duration: 3000 });
      }
    });
  }

  updateVisibility(visibility: 'PUBLIC' | 'PRIVATE'): void {
    if (!this.board || this.isReadOnly) return;
    this.boardService.update(this.board.id, {
      name: this.board.name,
      visibility
    }).subscribe({
      next: updated => {
        this.board = updated;
        this.snack.open(`Board is now ${visibility}`, 'Close', { duration: 3000 });
      },
      error: () => this.snack.open('Failed to update visibility', 'Close', { duration: 3000 })
    });
  }

  deleteBoard(): void {
    if (!this.board || this.isReadOnly) return;
    this.confirmDialog.confirm({
      title: 'Delete board?',
      message: 'This action cannot be undone.',
      confirmText: 'Delete',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed || !this.board) return;
      const workspaceId = this.board.workspaceId;
      this.boardService.delete(this.board.id).subscribe({
        next: () => {
          this.snack.open('Board deleted', 'Close', { duration: 3000 });
          this.router.navigate(['/workspace', workspaceId]);
        },
        error: () => this.snack.open('Failed to delete board', 'Close', { duration: 3000 })
      });
    });
  }

  get isReadOnly(): boolean {
    return this.isPublicPreview;
  }

  private setBoardMembers(board: Board): void {
    this.boardMembers = (board.members || []).map((m: any) => ({
      userId: m.userId,
      displayName: m.user?.fullName,
      avatarUrl: m.user?.avatarUrl
    }));
  }

  private getListAccent(list: TaskList, index: number): string {
    return list.color || this.fallbackListAccents[index % this.fallbackListAccents.length];
  }

  private getTintedBadgeStyle(color: string): Record<string, string> {
    const rgb = this.hexToRgb(color) ?? { r: 100, g: 116, b: 139 };

    return {
      color: this.getContrastColor(color),
      background: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.18)`,
      borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.34)`
    };
  }

  private getContrastColor(color: string): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return '#0f172a';

    const luminance = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
    return luminance > 0.62 ? '#0f172a' : '#f8fafc';
  }

  private hexToRgb(color: string): { r: number; g: number; b: number } | null {
    const normalized = color.trim().replace('#', '');
    const hex = normalized.length === 3
      ? normalized.split('').map(char => char + char).join('')
      : normalized;

    if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;

    const value = Number.parseInt(hex, 16);

    return {
      r: (value >> 16) & 255,
      g: (value >> 8) & 255,
      b: value & 255
    };
  }
}
