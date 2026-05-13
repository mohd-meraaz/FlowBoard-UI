import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="flow-page-shell">
      <div class="flow-page-content" style="max-width: 720px;">
        <div class="glass" style="border-radius: 30px; padding: 34px; text-align: center;">
          <div style="width: 82px; height: 82px; border-radius: 26px; margin: 0 auto 18px; display: grid; place-items: center; background: rgba(194, 122, 58, 0.14); border: 1px solid rgba(194, 122, 58, 0.18);">
            <mat-icon style="font-size:40px;width:40px;height:40px;color: var(--warning);">info</mat-icon>
          </div>
          <span style="display:inline-flex; padding: 8px 14px; border-radius: 999px; background: rgba(var(--primary-rgb),0.1); color: var(--primary); font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.72rem;">
            No Charge Made
          </span>
          <h1 style="margin: 14px 0 10px; font-size: 2rem; font-weight: 900; letter-spacing: -0.04em; color: var(--text-primary);">
            Payment Cancelled
          </h1>
          <p style="margin: 0 auto 22px; color: var(--text-secondary); max-width: 520px; line-height: 1.7;">
            No worries. Your free plan is still active, and you can upgrade anytime.
          </p>
          <div style="display:flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button mat-flat-button routerLink="/pricing">View Plans</button>
            <button mat-button routerLink="/dashboard">Back to Dashboard</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentCancelComponent {}