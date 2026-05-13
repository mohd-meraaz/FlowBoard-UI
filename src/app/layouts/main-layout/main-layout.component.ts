import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { Store } from '@ngrx/store';
import { Observable, filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import * as AuthSelectors from '../../store/auth/auth.selectors';
import * as AuthActions from '../../store/auth/auth.actions';
import { UserProfile } from '../../core/models/user.model';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule, RouterModule, RouterOutlet,
    MatButtonModule
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly store = inject(Store);
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);

  user$: Observable<UserProfile | null> = this.store.select(AuthSelectors.selectUser);
  sidebarOpen = signal(false);

  readonly navItems = [
    { label: 'Dashboard', route: '/dashboard', icon: 'layout-dashboard', exact: true },
    { label: 'Notifications', route: '/notifications', icon: 'bell', exact: true },
    { label: 'Profile', route: '/profile', icon: 'settings-2', exact: true },
    { label: 'Pricing', route: '/pricing', icon: 'sparkles', exact: true }
  ];

  planName = computed(() => {
    const p = this.paymentService.currentPlan();
    if (!p || p.status !== 'ACTIVE') return 'Free';
    return p.planDisplayName ?? 'Free';
  });

  isFreeUser = computed(() => {
    const p = this.paymentService.currentPlan();
    return !p || p.planName === 'FREE' || p.status !== 'ACTIVE';
  });

  ngOnInit(): void {
    this.store.dispatch(AuthActions.getProfile());
    this.paymentService.getSubscription().subscribe();

    localStorage.setItem('flowboard-theme', 'light');
    this.applyTheme();

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.sidebarOpen.set(false);
      });
  }

  private applyTheme(): void {
    document.body.classList.remove('dark', 'dark-theme');
    document.body.classList.add('light');
  }

  toggleSidebar(): void {
    this.sidebarOpen.update((open) => !open);
  }

  closeSidebar(): void {
    this.sidebarOpen.set(false);
  }

  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
}
