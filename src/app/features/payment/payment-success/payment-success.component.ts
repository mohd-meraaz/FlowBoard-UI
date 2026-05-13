import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentService } from '../../../core/services/payment.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="flow-page-shell">
      <div class="flow-page-content" style="max-width: 720px;">
        <div class="glass" style="border-radius: 30px; padding: 34px; text-align: center;">
          <div style="width: 82px; height: 82px; border-radius: 26px; margin: 0 auto 18px; display: grid; place-items: center; background: rgba(79, 139, 108, 0.14); border: 1px solid rgba(79, 139, 108, 0.18);">
            <mat-icon style="font-size:40px;width:40px;height:40px;color: var(--success);">check_circle</mat-icon>
          </div>
          <span style="display:inline-flex; padding: 8px 14px; border-radius: 999px; background: rgba(var(--primary-rgb),0.1); color: var(--primary); font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.72rem;">
            Payment Confirmed
          </span>
          <h1 style="margin: 14px 0 10px; font-size: 2rem; font-weight: 900; letter-spacing: -0.04em; color: var(--text-primary);">
            Payment Successful
          </h1>
          <p style="margin: 0 auto 6px; color: var(--text-secondary); max-width: 520px; line-height: 1.7;">
            Your subscription has been activated successfully.
          </p>
          <p style="margin: 0 auto 22px; color: var(--text-muted); font-weight: 700;">
            Redirecting to dashboard in {{ countdown }}s...
          </p>
          <p *ngIf="statusMessage" style="margin: 0 auto 14px; color: var(--text-secondary); font-weight: 700;">
            {{ statusMessage }}
          </p>
          <div style="display:flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button mat-flat-button routerLink="/dashboard">Go to Dashboard</button>
            <button mat-button [routerLink]="detailsLink">View subscription details</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentSuccessComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private paymentService = inject(PaymentService);
  countdown = 5;
  statusMessage = 'Finalizing your subscription...';
  detailsLink = '/pricing';

  async ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    await this.finalizeSubscription(sessionId);
    const t = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) { clearInterval(t); this.router.navigate(['/dashboard']); }
    }, 1000);
  }

  private async finalizeSubscription(sessionId: string | null): Promise<void> {
    if (!sessionId) {
      const sub = await firstValueFrom(this.paymentService.getSubscription());
      this.detailsLink = this.getDetailsLink(sub?.planName);
      this.statusMessage = 'Subscription refreshed.';
      return;
    }

    const maxAttempts = 8;
    const delayMs = 1200;

    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await firstValueFrom(this.paymentService.confirmCheckoutSession(sessionId));
        const sub = await firstValueFrom(this.paymentService.getSubscription());
        this.detailsLink = this.getDetailsLink(result.planName ?? sub?.planName);

        if (result.status === 'ACTIVE') {
          this.statusMessage = `Plan activated${result.planName ? `: ${result.planName}` : ''}.`;
          return;
        }

        if (result.status === 'FAILED') {
          this.statusMessage = result.message || 'Payment confirmation failed. Please check pricing page.';
          return;
        }
      } catch {
        // keep retrying below
      }

      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    // Webhook might still process after timeout.
    const sub = await firstValueFrom(this.paymentService.getSubscription());
    this.detailsLink = this.getDetailsLink(sub?.planName);
    this.statusMessage = 'Payment received. Plan update may take a few seconds.';
  }

  private getDetailsLink(planName?: string): string {
    if (planName === 'PRO') return '/subscription/pro';
    if (planName === 'BUSINESS') return '/subscription/business';
    return '/pricing';
  }
}
