import { AfterViewInit, Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

declare global {
  interface Window {
    lucide?: { createIcons: () => void };
  }
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet />`
})
export class AppComponent implements AfterViewInit, OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly zone = inject(NgZone);
  private readonly destroy$ = new Subject<void>();
  private observer?: MutationObserver;

  ngOnInit(): void {
    this.applyStoredTheme();
  }

  ngAfterViewInit(): void {
    this.refreshIcons();

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.refreshIcons());

    this.zone.runOutsideAngular(() => {
      this.observer = new MutationObserver(() => this.refreshIcons());
      this.observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-lucide']
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
  }

  private refreshIcons(): void {
    requestAnimationFrame(() => window.lucide?.createIcons());
  }

  private applyStoredTheme(): void {
    localStorage.setItem('flowboard-theme', 'light');
    document.body.classList.remove('dark', 'dark-theme');
    document.body.classList.add('light');
  }
}
