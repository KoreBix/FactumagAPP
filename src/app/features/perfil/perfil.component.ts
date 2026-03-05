import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserProfile } from '../../core/models/Auth/UserProfile';
import { AuthService } from '../../core/services/Auth/AuthService';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="animate-in" style="max-width:760px">

      <div style="margin-bottom:28px">
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Mi Perfil</h1>
        <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Administra tu información personal y seguridad</p>
      </div>

      <!-- Avatar Header -->
      <div class="card-mag animate-in delay-1" style="margin-bottom:20px">
        <div style="padding:28px 28px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
          <div style="width:72px;height:72px;background:var(--grad-accent);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:26px;font-weight:900;color:#0a0f1e;flex-shrink:0">
            {{ initials }}
          </div>
          <div>
            <div style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--text-primary)">
              {{ user?.name }}
            </div>
            <div style="font-size:14px;color:var(--text-muted);margin-top:3px">{{ user?.email }}</div>
            <div style="display:flex;gap:6px;margin-top:10px;flex-wrap:wrap">
              <span *ngFor="let role of user?.roles"
                    style="background:var(--accent-light);color:var(--accent);font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px">
                {{ role }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

        <!-- Información personal -->
        <div class="card-mag animate-in delay-2" style="grid-column:1/-1">
          <div class="card-header-mag">
            <div>
              <div class="card-title">Información personal</div>
              <div class="card-subtitle">Tu nombre y correo visible en el sistema</div>
            </div>
          </div>
          <div class="card-body-mag">
            <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="form-mag">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
                <div class="form-group">
                  <label>Nombre completo *</label>
                  <input type="text" formControlName="name" class="form-control-mag"
                         placeholder="Tu nombre completo">
                </div>
                <div class="form-group">
                  <label>Correo electrónico *</label>
                  <input type="email" formControlName="email" class="form-control-mag"
                         placeholder="correo@empresa.com">
                </div>
              </div>

              <div *ngIf="profileSuccess" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--success);margin-bottom:16px;display:flex;gap:8px;align-items:center">
                <span class="material-icons-round" style="font-size:18px">check_circle</span>
                Perfil actualizado correctamente
              </div>

              <div style="display:flex;justify-content:flex-end">
                <button type="submit" class="btn-mag btn-primary" [disabled]="savingProfile">
                  <span *ngIf="savingProfile" class="material-icons-round" style="font-size:18px;animation:spin 1s linear infinite">refresh</span>
                  <span *ngIf="!savingProfile" class="material-icons-round" style="font-size:18px">save</span>
                  {{ savingProfile ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Cambiar contraseña -->
        <div class="card-mag animate-in delay-3" style="grid-column:1/-1">
          <div class="card-header-mag">
            <div>
              <div class="card-title">Seguridad</div>
              <div class="card-subtitle">Cambia tu contraseña de acceso</div>
            </div>
          </div>
          <div class="card-body-mag">
            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()" class="form-mag">
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px">
                <div class="form-group">
                  <label>Contraseña actual *</label>
                  <div style="position:relative">
                    <input [type]="showOld ? 'text' : 'password'"
                           formControlName="oldPassword" class="form-control-mag"
                           placeholder="••••••••" style="padding-right:44px">
                    <button type="button" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex"
                            (click)="showOld=!showOld">
                      <span class="material-icons-round" style="font-size:18px">{{ showOld ? 'visibility_off' : 'visibility' }}</span>
                    </button>
                  </div>
                </div>
                <div class="form-group">
                  <label>Nueva contraseña *</label>
                  <input [type]="showNew ? 'text' : 'password'"
                         formControlName="newPassword" class="form-control-mag"
                         placeholder="Mínimo 8 caracteres">
                </div>
                <div class="form-group">
                  <label>Confirmar contraseña *</label>
                  <input [type]="showNew ? 'text' : 'password'"
                         formControlName="confirmPassword" class="form-control-mag"
                         placeholder="Repite la contraseña"
                         [class.error-field]="passwordMismatch">
                  <div class="field-error" *ngIf="passwordMismatch">Las contraseñas no coinciden</div>
                </div>
              </div>

              <div *ngIf="pwSuccess" style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--success);margin-bottom:16px;display:flex;gap:8px;align-items:center">
                <span class="material-icons-round" style="font-size:18px">check_circle</span>
                Contraseña actualizada correctamente
              </div>

              <div *ngIf="pwError" style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--danger);margin-bottom:16px;display:flex;gap:8px;align-items:center">
                <span class="material-icons-round" style="font-size:18px">error_outline</span>
                {{ pwError }}
              </div>

              <div style="display:flex;justify-content:flex-end">
                <button type="submit" class="btn-mag btn-primary" [disabled]="savingPw">
                  <span class="material-icons-round" style="font-size:18px">lock_reset</span>
                  {{ savingPw ? 'Actualizando...' : 'Cambiar contraseña' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Info de cuenta -->
        <div class="card-mag animate-in delay-4" style="grid-column:1/-1">
          <div class="card-header-mag">
            <div class="card-title">Información de cuenta</div>
          </div>
          <div class="card-body-mag" style="padding:0">
            <div style="display:grid;grid-template-columns:repeat(3,1fr)">
              <div *ngFor="let item of accountInfo; let last=last"
                   [style.border-right]="last ? 'none' : '1px solid var(--border-light)'"
                   style="padding:20px 24px">
                <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px">
                  {{ item.label }}
                </div>
                <div style="font-size:14px;font-weight:600;color:var(--text-primary)">
                  {{ item.value }}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class PerfilComponent implements OnInit {
  user:         UserProfile | null = null;
  profileForm:  FormGroup;
  passwordForm: FormGroup;
  savingProfile = false;
  savingPw      = false;
  profileSuccess = false;
  pwSuccess      = false;
  pwError        = '';
  showOld        = false;
  showNew        = false;

  accountInfo: { label: string; value: string }[] = [];

  constructor(private auth: AuthService, private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      name:  ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });

    this.passwordForm = this.fb.group({
      oldPassword:     ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    if (this.user) {
      this.profileForm.patchValue({ name: this.user.name, email: this.user.email });
      this.accountInfo = [
        { label: 'ID de usuario',  value: `#${this.user.id}` },
        { label: 'Roles',          value: this.user.roles?.join(', ') ?? '—' },
        { label: 'Estado',         value: 'Activo' }
      ];
    }
  }

  get initials(): string {
    return this.user?.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() ?? 'U';
  }

  get passwordMismatch(): boolean {
    const f = this.passwordForm;
    return f.get('confirmPassword')!.touched &&
      f.get('newPassword')!.value !== f.get('confirmPassword')!.value;
  }

  updateProfile(): void {
    if (this.profileForm.invalid) return;
    this.savingProfile  = true;
    this.profileSuccess = false;

    this.auth.updateProfile(this.profileForm.value).subscribe({
      next: () => {
        this.savingProfile  = false;
        this.profileSuccess = true;
        setTimeout(() => this.profileSuccess = false, 4000);
      },
      error: () => { this.savingProfile = false; }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || this.passwordMismatch) return;
    this.savingPw = true;
    this.pwError  = '';
    this.pwSuccess = false;

    const { oldPassword, newPassword } = this.passwordForm.value;
    this.auth.changePassword(oldPassword, newPassword).subscribe({
      next: () => {
        this.savingPw  = false;
        this.pwSuccess = true;
        this.passwordForm.reset();
        setTimeout(() => this.pwSuccess = false, 4000);
      },
      error: (err) => {
        this.savingPw = false;
        this.pwError  = err.error?.message ?? 'Error al cambiar la contraseña.';
      }
    });
  }
}