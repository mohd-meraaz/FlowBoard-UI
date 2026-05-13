import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Plan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  maxWorkspaces: number;
  maxBoardsPerWorkspace: number;
  maxMembersPerWorkspace: number;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasCustomFields: boolean;
  hasAutomation: boolean;
}

export interface Subscription {
  id: number;
  planName: string;
  planDisplayName: string;
  status: 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'INACTIVE';
  billingCycle: string;
  currentPeriodEnd: string;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasCustomFields: boolean;
  hasAutomation: boolean;
  maxWorkspaces: number;
  maxBoardsPerWorkspace: number;
}

export interface CheckoutSession { sessionId: string; checkoutUrl: string; }
export interface UpgradeCheckoutSession {
  sessionId?: string;
  checkoutUrl?: string;
  proratedAmount?: number;
  daysLeft?: number;
  message?: string;
}
export interface CheckoutSessionStatus {
  status: 'PENDING' | 'ACTIVE' | 'FAILED';
  planName?: string;
  billingCycle?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/payments`;

  readonly currentPlan = signal<Subscription | null>(null);
  readonly isPro = signal(false);
  readonly isBusiness = signal(false);

  getPlans(): Observable<Plan[]> {
    return this.http.get<Plan[]>(`${this.base}/plans`);
  }

  getSubscription(): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.base}/subscription`).pipe(
      tap(sub => {
        this.currentPlan.set(sub);
        this.isPro.set(sub.planName === 'PRO' && sub.status === 'ACTIVE');
        this.isBusiness.set(sub.planName === 'BUSINESS' && sub.status === 'ACTIVE');
      })
    );
  }

  createCheckout(planId: number, billingCycle: 'MONTHLY' | 'YEARLY'): Observable<CheckoutSession> {
    return this.http.post<CheckoutSession>(`${this.base}/checkout`, { planId, billingCycle });
  }

  createUpgradeCheckout(targetPlanName: 'BUSINESS'): Observable<UpgradeCheckoutSession> {
    return this.http.post<UpgradeCheckoutSession>(`${this.base}/checkout/upgrade`, { targetPlanName });
  }

  confirmCheckoutSession(sessionId: string): Observable<CheckoutSessionStatus> {
    return this.http.get<CheckoutSessionStatus>(`${this.base}/checkout/session/${sessionId}`);
  }

  cancelSubscription(): Observable<string> {
    return this.http.post(`${this.base}/cancel`, {}, { responseType: 'text' });
  }

  refreshSubscription(): Observable<Subscription> {
    return this.getSubscription();
  }

  hasFeature(feature: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.base}/feature/${feature}`);
  }

  getPaymentHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/history`);
  }

  isPaidPlan(): boolean {
    const plan = this.currentPlan();
    return plan !== null && plan.planName !== 'FREE' && plan.status === 'ACTIVE';
  }

  canCreateWorkspace(currentCount: number): boolean {
    const plan = this.currentPlan();
    if (!plan || plan.status !== 'ACTIVE') return currentCount < 3;
    return plan.maxWorkspaces === -1 || currentCount < plan.maxWorkspaces;
  }
}
