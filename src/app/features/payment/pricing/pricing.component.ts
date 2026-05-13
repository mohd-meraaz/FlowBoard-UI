import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable } from 'rxjs';
import { PaymentService, Plan, Subscription, CheckoutSession, UpgradeCheckoutSession } from '../../../core/services/payment.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule,
            MatSnackBarModule, MatDividerModule, MatProgressSpinnerModule],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss'
})
export class PricingComponent implements OnInit {
  private paymentService = inject(PaymentService);
  private snack          = inject(MatSnackBar);
  private confirmDialog  = inject(ConfirmDialogService);

  plans       = signal<Plan[]>([]);
  subscription = signal<Subscription | null>(null);
  billing     = signal<'MONTHLY' | 'YEARLY'>('MONTHLY');
  loading     = signal(true);
  purchasing  = signal(false);
  loadError   = signal<string | null>(null);
  fallbackPlans = signal<Plan[]>([
    {
      id: 1001,
      name: 'FREE',
      displayName: 'Free',
      description: 'Get started for free',
      priceMonthly: 0,
      priceYearly: 0,
      maxWorkspaces: 3,
      maxBoardsPerWorkspace: 5,
      maxMembersPerWorkspace: 10,
      hasAdvancedAnalytics: false,
      hasPrioritySupport: false,
      hasCustomFields: false,
      hasAutomation: false
    },
    {
      id: 1002,
      name: 'PRO',
      displayName: 'Pro',
      description: 'For growing teams',
      priceMonthly: 9.99,
      priceYearly: 99,
      maxWorkspaces: -1,
      maxBoardsPerWorkspace: -1,
      maxMembersPerWorkspace: 50,
      hasAdvancedAnalytics: true,
      hasPrioritySupport: false,
      hasCustomFields: true,
      hasAutomation: false
    },
    {
      id: 1003,
      name: 'BUSINESS',
      displayName: 'Business',
      description: 'For enterprises',
      priceMonthly: 29.99,
      priceYearly: 299,
      maxWorkspaces: -1,
      maxBoardsPerWorkspace: -1,
      maxMembersPerWorkspace: -1,
      hasAdvancedAnalytics: true,
      hasPrioritySupport: true,
      hasCustomFields: true,
      hasAutomation: true
    }
  ]);

  ngOnInit() {
    this.loadPlans();
    this.paymentService.getSubscription().subscribe({
      next: s => this.subscription.set(s), error: () => {}
    });
  }

  loadPlans(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.paymentService.getPlans().subscribe({
      next: p => {
        this.plans.set(p);
        if (!p.length) {
          this.loadError.set('No pricing plans available right now. Please restart payment-service and refresh.');
        }
        this.loading.set(false);
      },
      error: err => {
        const message =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.message ||
          'Failed to load pricing plans';
        this.loadError.set(message);
        this.loading.set(false);
      }
    });
  }

  getPrice(p: Plan): number {
    return this.billing() === 'YEARLY' ? +(p.priceYearly / 12).toFixed(2) : p.priceMonthly;
  }

  getYearlySavings(p: Plan): number {
    if (!p.priceMonthly) return 0;
    return Math.round(((p.priceMonthly * 12) - p.priceYearly) / (p.priceMonthly * 12) * 100);
  }

  hasManagedSubscription(): boolean {
    const s = this.subscription();
    return !!s && s.planName !== 'FREE';
  }

  isCurrentPlan(p: Plan): boolean {
    const s = this.subscription();
    return !!s && s.planName === p.name && s.status === 'ACTIVE';
  }

  isBusinessActive(): boolean {
    const s = this.subscription();
    return !!s && s.planName === 'BUSINESS' && s.status === 'ACTIVE';
  }

  isProratedUpgradeTarget(p: Plan): boolean {
    const s = this.subscription();
    return !!s && s.status === 'ACTIVE' && s.planName === 'PRO' && p.name === 'BUSINESS';
  }

  subscribe(p: Plan): void {
    if (this.loadError()) {
      this.snack.open('Pricing service is unavailable. Retry after it recovers.', 'Close', { duration: 4000 });
      return;
    }
    if (p.name === 'FREE' || this.purchasing()) return;
    this.purchasing.set(true);
    const request$: Observable<CheckoutSession | UpgradeCheckoutSession> = this.isProratedUpgradeTarget(p)
      ? this.paymentService.createUpgradeCheckout('BUSINESS')
      : this.paymentService.createCheckout(p.id, this.billing());

    request$.subscribe({
      next: (s: CheckoutSession | UpgradeCheckoutSession) => {
        if (!s?.checkoutUrl) {
          this.purchasing.set(false);
          this.snack.open('Stripe checkout URL missing from server response', 'Close', { duration: 5000 });
          return;
        }
        window.location.href = s.checkoutUrl;
      },
      error: (err: any) => {
        this.purchasing.set(false);
        const fallback = `Payment failed${err?.status ? ` (${err.status})` : ''}`;
        const message =
          err?.error?.message ||
          (typeof err?.error === 'string' ? err.error : null) ||
          err?.message ||
          fallback;
        this.snack.open(message, 'Close', { duration: 7000 });
      }
    });
  }

  ctaText(plan: Plan): string {
    if (this.loadError()) return 'Service unavailable';
    if (this.isCurrentPlan(plan)) return '✓ Current Plan';
    if (this.isBusinessActive() && plan.name === 'PRO') return 'Included in Business';
    if (plan.name === 'FREE') return 'Get Started';
    if (this.purchasing()) return 'Redirecting...';
    if (this.isProratedUpgradeTarget(plan)) return 'Upgrade to Business (prorated)';
    return 'Upgrade to ' + plan.displayName;
  }

  cancel(): void {
    this.confirmDialog.confirm({
      title: 'Cancel subscription?',
      message: 'You keep access until your current billing period ends.',
      confirmText: 'Cancel plan',
      danger: true
    }).subscribe(confirmed => {
      if (!confirmed) return;
      this.paymentService.cancelSubscription().subscribe({
        next: () => {
          this.paymentService.refreshSubscription().subscribe({
            next: sub => {
              this.subscription.set(sub);
              this.snack.open('Subscription cancelled', 'Close', { duration: 3000 });
            },
            error: () => this.snack.open('Cancelled, but failed to refresh subscription state', 'Close', { duration: 3500 })
          });
        },
        error: () => this.snack.open('Failed to cancel', 'Close', { duration: 3000 })
      });
    });
  }
}
