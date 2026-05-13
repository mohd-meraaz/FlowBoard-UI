import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/services/auth.service';
import { UserProfile } from '../../../core/models/user.model';

@Component({
  selector: 'app-profile-view',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterModule,
    MatCardModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatSnackBarModule
  ],
  templateUrl: './profile-view.component.html',
  styleUrl: './profile-view.component.scss'
})
export class ProfileViewComponent implements OnInit {

  private fb    = inject(FormBuilder);
  private auth  = inject(AuthService);
  private snack = inject(MatSnackBar);

  user: UserProfile | null = null;
  loading        = true;
  savingProfile  = false;
  savingPassword = false;
  hideOld = true;
  hideNew = true;
  error: string | null = null;
  avatarLoadFailed = false;
  originalProfileData: any = null;

  profileForm = this.fb.group({
    fullname:  ['', [Validators.required, Validators.minLength(1)]],
    username:  ['', [
      Validators.required, Validators.minLength(1)
    ]],
    avatarUrl: [''],
    bio:       ['']
  });

  passwordForm = this.fb.group({
    oldPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(6)]]
  });

  ngOnInit(): void {
    this.loadProfile();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      console.warn('Profile form is invalid', this.profileForm.errors);
      this.profileForm.markAllAsTouched();
      return;
    }
    this.savingProfile = true;
    console.log('Saving profile with data:', this.profileForm.value);

    const normalizedAvatar = this.normalizeAvatarUrl(this.profileForm.value.avatarUrl ?? '');
    this.profileForm.patchValue({ avatarUrl: normalizedAvatar }, { emitEvent: false });

    this.auth.updateProfile(this.profileForm.value as any).subscribe({
      next: () => {
        this.savingProfile = false;
        console.log('Profile updated successfully');
        const updatedProfile = {
          fullname: this.profileForm.value.fullname ?? '',
          username: this.profileForm.value.username ?? '',
          avatarUrl: normalizedAvatar,
          bio: this.profileForm.value.bio ?? ''
        };

        if (this.user) {
          this.user = {
            ...this.user,
            fullName: updatedProfile.fullname || this.user.fullName,
            username: updatedProfile.username || this.user.username,
            avatarUrl: normalizedAvatar || null,
            bio: updatedProfile.bio || null
          };
        }

        this.profileForm.patchValue(updatedProfile, { emitEvent: false });
        this.originalProfileData = { ...updatedProfile };
        this.profileForm.markAsPristine();

        this.snack.open('Profile updated!', 'Close',
          { duration: 3000 });
      },
      error: err => {
        this.savingProfile = false;
        console.error('Profile update failed:', err);
        this.snack.open(
          err.error?.message ?? 'Update failed',
          'Close', { duration: 4000 });
      }
    });
  }

  private loadProfile(): void {
    this.loading = true;
    this.avatarLoadFailed = false;
    this.auth.getProfile().subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
        this.error = null;
        this.avatarLoadFailed = false;
        
        // Patch the form values with fresh data
        this.profileForm.patchValue({
          fullname:  user.fullName,
          username:  user.username,
          avatarUrl: user.avatarUrl ?? '',
          bio:       user.bio ?? ''
        });
        
        // Store original data to detect changes
        this.originalProfileData = this.profileForm.value;
        
        // Mark form as pristine since we just loaded fresh data
        this.profileForm.markAsPristine();
        
        // Explicitly enable all form controls
        Object.keys(this.profileForm.controls).forEach(key => {
          this.profileForm.get(key)?.enable();
        });
        
        console.log('Profile loaded successfully', user);
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.loading = false;
        this.error = err?.error?.message ?? 'Failed to load profile';
        this.snack.open(this.error ?? 'Failed to load profile', 'Close', { duration: 5000 });
      }
    });
  }

  hasProfileChanges(): boolean {
    if (!this.originalProfileData || this.profileForm.pristine) {
      return false;
    }
    return JSON.stringify(this.originalProfileData) !== JSON.stringify(this.profileForm.value);
  }

  changePassword(): void {
    if (this.passwordForm.invalid) return;
    this.savingPassword = true;

    this.auth.changePassword(this.passwordForm.value as any).subscribe({
      next: () => {
        this.savingPassword = false;
        this.passwordForm.reset();
        this.snack.open('Password changed!', 'Close',
          { duration: 3000 });
      },
      error: err => {
        this.savingPassword = false;
        this.snack.open(
          err.error?.message ?? 'Change failed',
          'Close', { duration: 4000 });
      }
    });
  }

  getInitials(): string {
    return (this.user?.fullName ?? 'U')
      .split(' ').map(n => n[0])
      .join('').toUpperCase().slice(0, 2);
  }

  onAvatarError(event: Event): void {
    console.warn('Avatar image failed to load');
    this.avatarLoadFailed = true;
  }

  onAvatarLoad(): void {
    console.log('Avatar image loaded successfully');
    this.avatarLoadFailed = false;
  }

  getAvatarUrl(): string {
    if (!this.user?.avatarUrl || this.avatarLoadFailed) {
      return '';
    }
    // Add cache buster to force image reload
    return this.withCacheBuster(this.user.avatarUrl);
  }

  getHeaderAvatarUrl(): string {
    if (!this.user?.avatarUrl) {
      return '';
    }
    return this.normalizeAvatarUrl(this.user.avatarUrl);
  }

  private withCacheBuster(url: string): string {
    const joiner = url.includes('?') ? '&' : '?';
    return `${url}${joiner}t=${Date.now()}`;
  }

  private normalizeAvatarUrl(rawUrl: string): string {
    const url = (rawUrl || '').trim();
    if (!url) return '';

    // Convert Pexels page URL to direct image CDN URL
    // Example:
    // https://www.pexels.com/photo/yellow-entrance-door-of-a-residential-building-1870376/
    // -> https://images.pexels.com/photos/1870376/pexels-photo-1870376.jpeg
    const pexelsPageRegex = /^https?:\/\/(?:www\.)?pexels\.com\/photo\/[^/]*-(\d+)\/?$/i;
    const match = url.match(pexelsPageRegex);
    if (match?.[1]) {
      const id = match[1];
      return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg`;
    }

    return url;
  }
}
