import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/services/Auth/AuthService';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-equipo',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="eq-page">

      <!-- Header -->
      <div class="eq-header">
        <div class="eq-header-left">
          <span class="material-icons-round eq-header-icon">group</span>
          <div>
            <div class="eq-header-title">Equipo & Accesos</div>
            <div class="eq-header-sub">Gestiona quién puede operar en esta empresa</div>
          </div>
        </div>
      </div>

      <!-- Error de sesión -->
      <div class="eq-error" *ngIf="sinToken()">
        <span class="material-icons-round" style="font-size:36px;color:var(--warning)">lock_outline</span>
        <div class="eq-error-title">Sesión no disponible</div>
        <div class="eq-error-sub">No se pudo obtener tu sesión para cargar el panel de administración.</div>
        <a [href]="loginUrl" class="eq-btn-primary">Volver a iniciar sesión</a>
      </div>

      <!-- Frame admin -->
      <div class="eq-frame-wrapper" *ngIf="!sinToken()">
        <div class="eq-loading" *ngIf="cargando()">
          <span class="material-icons-round eq-spin">autorenew</span>
          Cargando panel de equipo...
        </div>
        <iframe
          *ngIf="iframeSrc()"
          [src]="iframeSrc()!"
          class="eq-iframe"
          [class.visible]="!cargando()"
          (load)="cargando.set(false)"
          title="Panel de administración de equipo"
          allow="clipboard-write">
        </iframe>
      </div>

    </div>

    <style>
      .eq-page { display:flex; flex-direction:column; height:calc(100vh - 64px); overflow:hidden; }

      .eq-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:18px 28px 16px; flex-shrink:0;
        background:var(--bg-card); border-bottom:1px solid var(--border-light);
      }
      .eq-header-left { display:flex; align-items:center; gap:12px; }
      .eq-header-icon {
        width:38px; height:38px; border-radius:10px; display:flex;
        align-items:center; justify-content:center; flex-shrink:0;
        background:var(--accent-light); color:var(--accent); font-size:20px;
      }
      .eq-header-title { font-size:16px; font-weight:700; color:var(--text-primary); }
      .eq-header-sub   { font-size:12px; color:var(--text-muted); margin-top:2px; }

      .eq-error {
        display:flex; flex-direction:column; align-items:center; justify-content:center;
        flex:1; gap:12px; padding:40px; text-align:center;
      }
      .eq-error-title { font-size:16px; font-weight:700; color:var(--text-primary); }
      .eq-error-sub   { font-size:13px; color:var(--text-muted); max-width:360px; }
      .eq-btn-primary {
        display:inline-flex; align-items:center; gap:6px;
        padding:8px 20px; border-radius:8px; background:var(--accent);
        color:#fff; font-size:13px; font-weight:600; text-decoration:none;
        margin-top:8px;
      }

      .eq-frame-wrapper {
        flex:1; position:relative; overflow:hidden;
        background:var(--bg-card2);
      }
      .eq-loading {
        position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        gap:10px; font-size:14px; color:var(--text-muted);
        background:var(--bg-card2); z-index:1;
      }
      .eq-spin { animation:eqSpin 1s linear infinite; }
      @keyframes eqSpin { to { transform:rotate(360deg); } }

      .eq-iframe {
        width:100%; height:100%; border:none;
        opacity:0; transition:opacity .25s;
      }
      .eq-iframe.visible { opacity:1; }
    </style>
  `
})
export class EquipoComponent implements OnInit {

  cargando  = signal(true);
  sinToken  = signal(false);
  iframeSrc = signal<SafeResourceUrl | null>(null);

  readonly loginUrl = environment.principalLoginUrl;

  constructor(
    private auth:      AuthService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    const token = this.auth.getToken();
    if (!token) { this.sinToken.set(true); return; }

    const url = `${environment.principalLoginUrl}/admin?embedded=1&token=${encodeURIComponent(token)}`;
    this.iframeSrc.set(this.sanitizer.bypassSecurityTrustResourceUrl(url));
  }
}
