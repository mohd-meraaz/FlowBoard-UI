import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { Board, BoardSharedEmail } from '../../../core/models/board.model';
import { BoardService } from '../../../core/services/board.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-board-share-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './board-share-modal.component.html',
  styleUrl: './board-share-modal.component.scss'
})
export class BoardShareModalComponent {
  private boardService = inject(BoardService);
  private snack = inject(MatSnackBar);
  private frontendBaseUrl = environment.frontendBaseUrl.replace(/\/$/, '');

  @Input({ required: true }) board!: Board;
  @Output() closed = new EventEmitter<void>();
  @Output() boardUpdated = new EventEmitter<Board>();

  inviteInput = '';
  publicShareUrl = '';
  sharedEmails: BoardSharedEmail[] = [];
  loadingShareLink = false;
  enablingPublicLink = false;
  loadingShared = false;
  copyingLink = false;
  sendingInvites = false;
  removingEmail: string | null = null;

  ngOnInit(): void {
    if (this.isPublicBoard) {
      this.preparePublicLink();
    }
    this.loadSharedEmails();
  }

  get isPublicBoard(): boolean {
    return this.board?.visibility === 'PUBLIC';
  }

  close(): void {
    this.closed.emit();
  }

  loadSharedEmails(): void {
    this.loadingShared = true;
    this.boardService.getSharedEmails(this.board.id).subscribe({
      next: shared => {
        this.sharedEmails = shared;
        this.loadingShared = false;
      },
      error: () => {
        this.loadingShared = false;
        this.snack.open('Failed to load shared emails', 'Close', { duration: 3000 });
      }
    });
  }

  async copyPublicLink(): Promise<void> {
    if (!this.isPublicBoard) return;
    if (!this.publicShareUrl) {
      this.snack.open('Share link is still being prepared', 'Close', { duration: 2500 });
      return;
    }

    this.copyingLink = true;
    try {
      await this.copyToClipboard(this.publicShareUrl);
      this.snack.open('Link copied', 'Close', { duration: 2500 });
    } catch {
      this.selectShareLinkField();
      this.snack.open('Link selected. Press Cmd+C or Ctrl+C to copy.', 'Close', { duration: 3500 });
    } finally {
      this.copyingLink = false;
    }
  }

  enablePublicLink(): void {
    if (this.isPublicBoard || this.enablingPublicLink) return;

    this.enablingPublicLink = true;
    this.boardService.update(this.board.id, {
      name: this.board.name,
      description: this.board.description ?? undefined,
      background: this.board.background ?? undefined,
      visibility: 'PUBLIC'
    }).subscribe({
      next: updated => {
        this.board = updated;
        this.boardUpdated.emit(updated);
        this.enablingPublicLink = false;
        this.snack.open('Board is now public. Preparing link...', 'Close', { duration: 2500 });
        this.preparePublicLink(true);
      },
      error: () => {
        this.enablingPublicLink = false;
        this.snack.open('Failed to enable public link sharing', 'Close', { duration: 3000 });
      }
    });
  }

  sendInvites(): void {
    const emails = this.parseEmails(this.inviteInput);
    if (emails.length === 0) {
      this.snack.open('Enter at least one valid email', 'Close', { duration: 2500 });
      return;
    }

    this.sendingInvites = true;
    this.boardService.shareByEmail(this.board.id, emails).subscribe({
      next: response => {
        this.sendingInvites = false;
        this.inviteInput = '';
        this.sharedEmails = response.shared;
        this.snack.open('Invitation sent', 'Close', { duration: 2500 });
      },
      error: err => {
        this.sendingInvites = false;
        this.snack.open(err.error?.message || 'Failed to send invitation', 'Close', { duration: 3000 });
      }
    });
  }

  revoke(email: string): void {
    this.removingEmail = email;
    this.boardService.revokeSharedEmail(this.board.id, email).subscribe({
      next: () => {
        this.sharedEmails = this.sharedEmails.filter(entry => entry.email !== email);
        this.removingEmail = null;
        this.snack.open('Shared access removed', 'Close', { duration: 2500 });
      },
      error: () => {
        this.removingEmail = null;
        this.snack.open('Failed to remove shared access', 'Close', { duration: 3000 });
      }
    });
  }

  private parseEmails(value: string): string[] {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return Array.from(
      new Set(
        value
          .split(/[\s,;]+/)
          .map(email => email.trim().toLowerCase())
          .filter(email => emailPattern.test(email))
      )
    );
  }

  private preparePublicLink(copyWhenReady = false): void {
    this.loadingShareLink = true;
    this.boardService.createShareLink(this.board.id).subscribe({
      next: res => {
        this.publicShareUrl = `${this.frontendBaseUrl}${res.path}`;
        this.loadingShareLink = false;
        if (copyWhenReady) {
          void this.copyPublicLink();
        }
      },
      error: () => {
        this.loadingShareLink = false;
        this.publicShareUrl = '';
        this.snack.open('Failed to generate share link', 'Close', { duration: 3000 });
      }
    });
  }

  private async copyToClipboard(value: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }

    const textArea = document.createElement('textarea');
    textArea.value = value;
    textArea.setAttribute('readonly', '');
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    textArea.style.pointerEvents = 'none';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    textArea.setSelectionRange(0, value.length);

    const copied = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (!copied) {
      throw new Error('Clipboard copy failed');
    }
  }

  private selectShareLinkField(): void {
    const input = document.getElementById(`share-link-${this.board.id}`) as HTMLInputElement | null;
    if (!input) return;
    input.focus();
    input.select();
    input.setSelectionRange(0, input.value.length);
  }
}
