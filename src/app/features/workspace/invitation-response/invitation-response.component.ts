import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { finalize } from 'rxjs/operators';
import { WorkspaceService } from '../../../core/services/workspace.service';

@Component({
  selector: 'app-invitation-response',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  templateUrl: './invitation-response.component.html',
  styleUrl: './invitation-response.component.scss'
})
export class InvitationResponseComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private workspaceService = inject(WorkspaceService);
  private snack = inject(MatSnackBar);

  token = this.route.snapshot.queryParamMap.get('token') ?? '';
  actionInFlight: 'accept' | 'decline' | null = null;

  respond(action: 'accept' | 'decline'): void {
    if (!this.token || this.actionInFlight) {
      return;
    }

    this.actionInFlight = action;
    const request$ = action === 'accept'
      ? this.workspaceService.acceptInvitation(this.token)
      : this.workspaceService.declineInvitation(this.token);

    request$
      .pipe(finalize(() => { this.actionInFlight = null; }))
      .subscribe({
        next: message => {
          this.snack.open(message, 'Close', { duration: 4000 });
          this.router.navigateByUrl(action === 'accept' ? '/dashboard' : '/notifications');
        },
        error: err => {
          this.snack.open(err.error?.message ?? `Failed to ${action} invitation`, 'Close', { duration: 5000 });
        }
      });
  }
}
