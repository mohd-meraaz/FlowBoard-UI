import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentService, Subscription } from '../../../core/services/payment.service';

@Component({
  selector: 'app-subscription-pro',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="flow-page-shell">
      <div class="flow-page-content" style="max-width: 900px;">
        <div class="glass" style="border-radius: 28px; padding: 28px;">
          <p style="margin:0 0 8px; font-size: 12px; font-weight: 900; letter-spacing: 0.08em; text-transform: uppercase; color: var(--primary);">Subscription Details</p>
          <h1 style="margin:0 0 10px; font-size: clamp(1.8rem, 3vw, 2.4rem); color: var(--text-primary);">FlowBoard Pro</h1>
          <p style="margin:0 0 18px; color: var(--text-secondary);">Built for growing teams that need advanced collaboration at scale.</p>

          @if (loading()) {
            <p style="margin:0; color: var(--text-secondary);">Loading subscription...</p>
          } @else if (subscription()) {
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 18px;">
              <div class="section-glass" style="padding:14px; border-radius:14px;">
                <p style="margin:0; color:var(--text-muted); font-size:12px; font-weight:700;">Plan</p>
                <p style="margin:6px 0 0; color:var(--text-primary); font-weight:900;">{{ subscription()!.planDisplayName }}</p>
              </div>
              <div class="section-glass" style="padding:14px; border-radius:14px;">
                <p style="margin:0; color:var(--text-muted); font-size:12px; font-weight:700;">Status</p>
                <p style="margin:6px 0 0; color:var(--text-primary); font-weight:900;">{{ statusLabel() }}</p>
              </div>
              <div class="section-glass" style="padding:14px; border-radius:14px;">
                <p style="margin:0; color:var(--text-muted); font-size:12px; font-weight:700;">Billing cycle</p>
                <p style="margin:6px 0 0; color:var(--text-primary); font-weight:900;">{{ subscription()!.billingCycle }}</p>
              </div>
              <div class="section-glass" style="padding:14px; border-radius:14px;">
                <p style="margin:0; color:var(--text-muted); font-size:12px; font-weight:700;">Renews / ends</p>
                <p style="margin:6px 0 0; color:var(--text-primary); font-weight:900;">{{ subscription()!.currentPeriodEnd | date:'MMM d, y' }}</p>
              </div>
            </div>

            <h3 style="margin:0 0 10px; color: var(--text-primary);">Included features</h3>
            <ul style="margin:0; padding:0 0 0 18px; color: var(--text-secondary); line-height: 1.7; font-weight: 700;">
              <li>Unlimited workspaces</li>
              <li>Unlimited boards</li>
              <li>Up to 50 members per workspace</li>
              <li>Advanced analytics & board stats</li>
              <li>Custom card fields</li>
            </ul>
          }

          <div style="margin-top:22px; display:flex; gap:10px; flex-wrap:wrap;">
            <button mat-flat-button routerLink="/pricing">Manage subscription</button>
            <button mat-button routerLink="/dashboard">Back to dashboard</button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionProComponent implements OnInit {
  private paymentService = inject(PaymentService);

  loading = signal(true);
  subscription = signal<Subscription | null>(null);

  statusLabel = computed(() => {
    const s = this.subscription();
    if (!s) return 'Unknown';
    if (s.status === 'CANCELLED') return 'Canceled';
    if (s.status === 'ACTIVE') return 'Active';
    if (s.status === 'PAST_DUE') return 'Past due';
    return s.status;
  });

  ngOnInit(): void {
    this.paymentService.getSubscription().subscribe({
      next: sub => {
        this.subscription.set(sub);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
