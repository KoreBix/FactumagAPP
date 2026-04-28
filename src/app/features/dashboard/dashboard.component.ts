import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule }   from '@angular/common';
import { RouterModule }   from '@angular/router';
import { AuthService }    from '../../core/services/Auth/AuthService';
import { CfdiService }    from '../../core/services/CFDI/CfdiService';
import { RfcService }     from '../../core/services/RFC/RfcService';
import { DashboardService, DashboardResumen } from '../../core/services/dashboard/DashboardService';
import { CfdiList }       from '../../core/models/CFDI/CfdiList';
import { RfcList }        from '../../core/models/RFC/RfcList';
import { UserProfile }    from '../../core/models/Auth/UserProfile';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="db-page">

      <!-- ── Hero header ─────────────────────────────────────────── -->
      <div class="db-hero">
        <div class="db-hero-left">
          <div class="db-empresa-badge" *ngIf="user?.tenantNombre">
            <span class="material-icons-round" style="font-size:14px">business</span>
            {{ user?.tenantNombre }}
          </div>
          <h1 class="db-bienvenida">
            Hola, {{ firstName() }} 👋
          </h1>
          <p class="db-fecha">{{ today }}</p>
        </div>
        <a routerLink="/cfdis/new" class="db-btn-emitir">
          <span class="material-icons-round">add</span>
          Emitir CFDI
        </a>
      </div>

      <!-- ── Stat cards ───────────────────────────────────────────── -->
      <div class="db-stats">

        <div class="db-stat-card animate-in delay-1">
          <div class="db-stat-icon db-icon-teal">
            <span class="material-icons-round">receipt_long</span>
          </div>
          <div class="db-stat-body">
            <div class="db-stat-label">CFDIs este mes</div>
            <div class="db-stat-value">
              <span *ngIf="!loadingResumen">{{ resumen().cfdisMes }}</span>
              <span *ngIf="loadingResumen" class="db-skeleton db-skeleton-num"></span>
            </div>
            <div class="db-stat-sub">{{ monthName }}</div>
          </div>
        </div>

        <div class="db-stat-card animate-in delay-2">
          <div class="db-stat-icon db-icon-blue">
            <span class="material-icons-round">today</span>
          </div>
          <div class="db-stat-body">
            <div class="db-stat-label">CFDIs hoy</div>
            <div class="db-stat-value">
              <span *ngIf="!loadingResumen">{{ resumen().cfdisHoy }}</span>
              <span *ngIf="loadingResumen" class="db-skeleton db-skeleton-num"></span>
            </div>
            <div class="db-stat-sub">Emitidos hoy</div>
          </div>
        </div>

        <div class="db-stat-card animate-in delay-3">
          <div class="db-stat-icon db-icon-green">
            <span class="material-icons-round">people</span>
          </div>
          <div class="db-stat-body">
            <div class="db-stat-label">Clientes</div>
            <div class="db-stat-value">
              <span *ngIf="!loadingResumen">{{ resumen().clientesTotal }}</span>
              <span *ngIf="loadingResumen" class="db-skeleton db-skeleton-num"></span>
            </div>
            <div class="db-stat-sub">Registrados</div>
          </div>
        </div>

        <div class="db-stat-card animate-in delay-4">
          <div class="db-stat-icon db-icon-amber">
            <span class="material-icons-round">business</span>
          </div>
          <div class="db-stat-body">
            <div class="db-stat-label">RFCs activos</div>
            <div class="db-stat-value">
              <span *ngIf="!loadingResumen">{{ resumen().rfcsTotal }}</span>
              <span *ngIf="loadingResumen" class="db-skeleton db-skeleton-num"></span>
            </div>
            <div class="db-stat-sub">En este grupo</div>
          </div>
        </div>

      </div>

      <!-- ── Contenido principal ─────────────────────────────────── -->
      <div class="db-content">

        <!-- Últimos CFDIs -->
        <div class="card-mag animate-in delay-2">
          <div class="card-header-mag">
            <div>
              <div class="card-title">Últimos CFDIs</div>
              <div class="card-subtitle">Actividad reciente de facturación</div>
            </div>
            <a routerLink="/cfdis" class="btn-mag btn-ghost btn-sm">Ver todos</a>
          </div>

          <div class="card-body-mag" style="padding:0">
            <div *ngIf="loadingCfdis" style="padding:24px 20px">
              <div *ngFor="let i of [1,2,3,4,5]"
                   style="display:flex;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--border-light)">
                <div class="skeleton" style="width:34px;height:34px;border-radius:8px;flex-shrink:0"></div>
                <div style="flex:1">
                  <div class="skeleton" style="height:13px;width:55%;margin-bottom:6px;border-radius:4px"></div>
                  <div class="skeleton" style="height:11px;width:35%;border-radius:4px"></div>
                </div>
                <div class="skeleton" style="height:22px;width:70px;border-radius:20px"></div>
              </div>
            </div>

            <div *ngIf="!loadingCfdis && cfdis.length === 0" class="empty-state">
              <div class="empty-icon">
                <span class="material-icons-round" style="font-size:48px">receipt_long</span>
              </div>
              <div class="empty-title">Sin CFDIs aún</div>
              <div class="empty-desc">Emite tu primer CFDI para verlo aquí</div>
              <a routerLink="/cfdis/new" class="btn-mag btn-primary btn-sm">
                <span class="material-icons-round" style="font-size:16px">add</span>
                Emitir CFDI
              </a>
            </div>

            <table class="table-mag table-compact" *ngIf="!loadingCfdis && cfdis.length > 0">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Receptor</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of cfdis" style="cursor:pointer" [routerLink]="['/cfdis']">
                  <td>
                    <span class="db-tipo-badge">{{ c.tipoComprobante }}</span>
                  </td>
                  <td>
                    <div style="font-weight:600;font-size:13px">
                      {{ c.receptorNombre | slice:0:24 }}{{ c.receptorNombre.length > 24 ? '...' : '' }}
                    </div>
                    <div style="font-size:11px;color:var(--text-muted)">{{ c.receptorRfc }}</div>
                  </td>
                  <td>
                    <span style="font-family:var(--font-display);font-weight:700;font-size:14px">
                      {{ c.total | currency:'MXN':'symbol-narrow':'1.2-2' }}
                    </span>
                  </td>
                  <td>
                    <span class="badge-mag" [class]="c.estado.toLowerCase()">{{ c.estado }}</span>
                  </td>
                  <td style="font-size:12px;color:var(--text-muted)">
                    {{ c.fechaTimbrado ? (c.fechaTimbrado | date:'dd/MM/yy') : '—' }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Panel lateral -->
        <div class="db-aside">

          <!-- RFCs -->
          <div class="card-mag animate-in delay-3">
            <div class="card-header-mag">
              <div>
                <div class="card-title">Mis RFCs</div>
                <div class="card-subtitle">{{ rfcs.length }} empresa(s) activa(s)</div>
              </div>
              <a routerLink="/rfcs" class="btn-mag btn-ghost btn-sm">Ver</a>
            </div>
            <div class="card-body-mag" style="padding:12px 16px">
              <div *ngIf="rfcs.length === 0"
                   style="text-align:center;padding:20px 0;color:var(--text-muted);font-size:13px">
                Sin RFCs registrados
              </div>
              <div *ngFor="let r of rfcs; let last=last"
                   [style.border-bottom]="last ? 'none' : '1px solid var(--border-light)'"
                   style="padding:10px 0;display:flex;align-items:center;gap:10px">
                <div class="db-rfc-icon">
                  <span class="material-icons-round" style="font-size:16px;color:var(--accent)">business</span>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                    {{ r.razonSocial }}
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ r.rfc }}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-family:var(--font-display);font-size:15px;font-weight:800;color:var(--text-primary)">
                    {{ r.saldoTimbres }}
                  </div>
                  <div style="font-size:10px;color:var(--text-muted)">timbres</div>
                </div>
              </div>
              <a routerLink="/rfcs/new" class="btn-mag btn-outline btn-sm"
                 style="width:100%;justify-content:center;margin-top:12px">
                <span class="material-icons-round" style="font-size:16px">add</span>
                Agregar RFC
              </a>
            </div>
          </div>

          <!-- Acciones rápidas -->
          <div class="card-mag animate-in delay-4">
            <div class="card-header-mag">
              <div class="card-title">Acciones rápidas</div>
            </div>
            <div class="card-body-mag" style="padding:12px 16px;display:flex;flex-direction:column;gap:8px">
              <a routerLink="/cfdis/new" [queryParams]="{tipo:'I'}"
                 class="btn-mag btn-primary btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">add_circle</span>
                Factura de Ingreso
              </a>
              <a routerLink="/cfdis/new" [queryParams]="{tipo:'P'}"
                 class="btn-mag btn-ghost btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">payments</span>
                Complemento de Pago
              </a>
              <a routerLink="/clientes"
                 class="btn-mag btn-ghost btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">people</span>
                Ver Clientes
              </a>
              <a routerLink="/wallet"
                 class="btn-mag btn-ghost btn-sm" style="justify-content:center">
                <span class="material-icons-round" style="font-size:16px">account_balance_wallet</span>
                Ver Timbres
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .db-page { display: flex; flex-direction: column; gap: 20px; }

    /* ── Hero ── */
    .db-hero {
      display: flex; align-items: flex-start; justify-content: space-between;
      flex-wrap: wrap; gap: 12px; margin-bottom: 4px;
    }
    .db-empresa-badge {
      display: inline-flex; align-items: center; gap: 5px;
      font-size: 11.5px; font-weight: 600; color: var(--accent);
      background: var(--accent-light); padding: 3px 10px; border-radius: 20px;
      margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.04em;
    }
    .db-bienvenida {
      font-family: var(--font-display); font-size: 22px; font-weight: 800;
      color: var(--text-primary); margin: 0;
    }
    .db-fecha { font-size: 13px; color: var(--text-muted); margin-top: 2px; }

    .db-btn-emitir {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 20px; font-size: 14px; font-weight: 600;
      background: var(--accent); color: #fff; border-radius: 10px;
      text-decoration: none; border: none; cursor: pointer;
      transition: filter 0.15s, transform 0.12s;
      white-space: nowrap; align-self: center;
      .material-icons-round { font-size: 18px; }
      &:hover { filter: brightness(0.92); transform: translateY(-1px); }
    }

    /* ── Stats ── */
    .db-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }
    .db-stat-card {
      display: flex; align-items: center; gap: 14px;
      padding: 16px 18px;
      background: var(--bg-card); border: 1px solid var(--border-light);
      border-radius: 12px;
      transition: box-shadow 0.15s;
      &:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    }
    .db-stat-icon {
      width: 42px; height: 42px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      .material-icons-round { font-size: 20px; }
    }
    .db-icon-teal  { background: rgba(20,184,166,0.12); color: #14b8a6; }
    .db-icon-blue  { background: rgba(59,130,246,0.12); color: #3b82f6; }
    .db-icon-green { background: rgba(34,197,94,0.12);  color: #22c55e; }
    .db-icon-amber { background: rgba(245,158,11,0.12); color: #f59e0b; }

    .db-stat-body { flex: 1; min-width: 0; }
    .db-stat-label {
      font-size: 11.5px; color: var(--text-muted); font-weight: 500;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }
    .db-stat-value {
      font-family: var(--font-display); font-size: 24px; font-weight: 800;
      color: var(--text-primary); line-height: 1.2;
    }
    .db-stat-sub { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

    /* ── Skeleton for numbers ── */
    .db-skeleton-num {
      display: inline-block; width: 48px; height: 28px;
      background: var(--border-light); border-radius: 6px;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.4; }
    }

    /* ── Content grid ── */
    .db-content {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 16px;
      align-items: start;
    }
    .db-aside { display: flex; flex-direction: column; gap: 14px; }

    /* ── CFDI tipo badge ── */
    .db-tipo-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 32px; height: 32px;
      background: var(--accent-light); color: var(--accent);
      border-radius: 8px; font-family: var(--font-display);
      font-weight: 800; font-size: 13px;
    }

    /* ── RFC icon ── */
    .db-rfc-icon {
      width: 32px; height: 32px; background: var(--accent-light);
      border-radius: 8px; display: flex; align-items: center;
      justify-content: center; flex-shrink: 0;
    }

    /* ── Responsive ── */
    @media (max-width: 1024px) {
      .db-stats { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .db-content { grid-template-columns: 1fr; }
      .db-stats   { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 480px) {
      .db-stats { grid-template-columns: 1fr; }
    }
  `]
})
export class DashboardComponent implements OnInit {

  private auth      = inject(AuthService);
  private cfdiSvc   = inject(CfdiService);
  private rfcSvc    = inject(RfcService);
  private dashSvc   = inject(DashboardService);

  user: UserProfile | null = null;
  cfdis:         CfdiList[]        = [];
  rfcs:          RfcList[]         = [];
  loadingCfdis   = true;
  loadingResumen = true;

  resumen = signal<DashboardResumen>({ cfdisMes: 0, cfdisHoy: 0, clientesTotal: 0, rfcsTotal: 0 });

  get today(): string {
    return new Date().toLocaleDateString('es-MX',
      { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  get monthName(): string {
    return new Date().toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
  }

  firstName(): string {
    return (this.user?.name ?? '').split(' ')[0];
  }

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.auth.user$.subscribe(u => this.user = u);
    this.loadData();
  }

  loadData(): void {
    // Resumen agregado (1 sola llamada al backend)
    this.dashSvc.getResumen().subscribe({
      next:  r => { this.resumen.set(r); this.loadingResumen = false; },
      error: () => { this.loadingResumen = false; }
    });

    // Últimos CFDIs del mes
    const now   = new Date();
    const desde = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const hasta = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    this.cfdiSvc.listar({ pageSize: 8, desde, hasta }).subscribe({
      next:  r => { this.cfdis = r.data; this.loadingCfdis = false; },
      error: () => { this.loadingCfdis = false; }
    });

    // RFCs (panel lateral)
    this.rfcSvc.listar().subscribe({
      next:  rs => this.rfcs = rs,
      error: ()  => {}
    });
  }
}
