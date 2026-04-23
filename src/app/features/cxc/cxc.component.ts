import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CxcService, CxcItem, CxcResumen } from '../../core/services/CXC/CxcService';
import { CfdiService } from '../../core/services/CFDI/CfdiService';

@Component({
  selector: 'app-cxc',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
  <div class="cxc-page">

    <!-- ── HEADER ─────────────────────────────────────────────────────── -->
    <div class="cxc-header">
      <div>
        <h1 class="cxc-title">Cuentas por Cobrar</h1>
        <p class="cxc-subtitle">Seguimiento de facturas y cobros pendientes</p>
      </div>
      <a class="btn-mag btn-primary"
         [routerLink]="['/cfdis/new']"
         [queryParams]="{tipo:'I', metodoPago:'PPD', returnTo:'cuentas-cobrar'}">
        <span class="material-icons-round">add</span>
        Nueva factura PPD
      </a>
    </div>

    <!-- ── KPI CARDS ───────────────────────────────────────────────────── -->
    <div class="kpi-grid" *ngIf="resumen">

      <button class="kpi-card" [class.kpi-active]="filtroEstado===''"
              (click)="setFiltroEstado('')">
        <div class="kpi-icon kpi-amber">
          <span class="material-icons-round">hourglass_empty</span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">Pendientes</span>
          <span class="kpi-value">{{ resumen.totalPendiente | currency:'MXN':'symbol':'1.0-0' }}</span>
          <span class="kpi-count">{{ resumen.countPendiente }} facturas</span>
        </div>
        <span class="material-icons-round kpi-arrow">chevron_right</span>
      </button>

      <button class="kpi-card" [class.kpi-active]="filtroEstado==='Vencido'"
              (click)="setFiltroEstado('Vencido')">
        <div class="kpi-icon kpi-red">
          <span class="material-icons-round">warning_amber</span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">Vencidas</span>
          <span class="kpi-value">{{ resumen.totalVencido | currency:'MXN':'symbol':'1.0-0' }}</span>
          <span class="kpi-count">{{ resumen.countVencido }} facturas</span>
        </div>
        <span class="material-icons-round kpi-arrow">chevron_right</span>
      </button>

      <button class="kpi-card" [class.kpi-active]="filtroEstado==='ParcialmentePagado'"
              (click)="setFiltroEstado('ParcialmentePagado')">
        <div class="kpi-icon kpi-blue">
          <span class="material-icons-round">payments</span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">Parciales</span>
          <span class="kpi-value">{{ resumen.totalParcial | currency:'MXN':'symbol':'1.0-0' }}</span>
          <span class="kpi-count">{{ resumen.countParcial }} facturas</span>
        </div>
        <span class="material-icons-round kpi-arrow">chevron_right</span>
      </button>

      <button class="kpi-card" [class.kpi-active]="filtroEstado==='Pagado'"
              (click)="setFiltroEstado('Pagado')">
        <div class="kpi-icon kpi-green">
          <span class="material-icons-round">check_circle</span>
        </div>
        <div class="kpi-body">
          <span class="kpi-label">Cobradas</span>
          <span class="kpi-value">{{ resumen.totalCobrado | currency:'MXN':'symbol':'1.0-0' }}</span>
          <span class="kpi-count">{{ resumen.countCobrado }} facturas</span>
        </div>
        <span class="material-icons-round kpi-arrow">chevron_right</span>
      </button>

    </div>

    <!-- ── FILTROS ──────────────────────────────────────────────────────── -->
    <div class="filters-bar">

      <!-- Estado chips -->
      <div class="filter-group">
        <span class="filter-label">Estado</span>
        <div class="chips-row">
          <button class="chip" [class.chip-active]="filtroEstado===''"
                  (click)="setFiltroEstado('')">Todos</button>
          <button class="chip chip-amber" [class.chip-active]="filtroEstado==='Pendiente'"
                  (click)="setFiltroEstado('Pendiente')">Pendiente</button>
          <button class="chip chip-red" [class.chip-active]="filtroEstado==='Vencido'"
                  (click)="setFiltroEstado('Vencido')">Vencida</button>
          <button class="chip chip-blue" [class.chip-active]="filtroEstado==='ParcialmentePagado'"
                  (click)="setFiltroEstado('ParcialmentePagado')">Parcial</button>
          <button class="chip chip-green" [class.chip-active]="filtroEstado==='Pagado'"
                  (click)="setFiltroEstado('Pagado')">Cobrada</button>
        </div>
      </div>

      <!-- Separador -->
      <div class="filter-sep"></div>

      <!-- Fechas -->
      <div class="filter-group">
        <span class="filter-label">Período</span>
        <div class="date-row">
          <div class="date-input-wrap">
            <span class="material-icons-round date-icon">calendar_today</span>
            <input type="date" [(ngModel)]="filtroDesde" (change)="cargar()"
                   class="date-input" placeholder="Desde">
          </div>
          <span class="date-sep">—</span>
          <div class="date-input-wrap">
            <span class="material-icons-round date-icon">calendar_today</span>
            <input type="date" [(ngModel)]="filtroHasta" (change)="cargar()"
                   class="date-input" placeholder="Hasta">
          </div>
        </div>
      </div>

      <!-- Limpiar -->
      <button class="btn-clear" (click)="limpiarFiltros()"
              *ngIf="filtroEstado || filtroDesde || filtroHasta">
        <span class="material-icons-round">close</span>
        Limpiar
      </button>

    </div>

    <!-- ── TABLA ────────────────────────────────────────────────────────── -->
    <div class="table-card">

      <!-- Skeleton loading -->
      <div *ngIf="loading" class="skeleton-list">
        <div *ngFor="let i of [1,2,3,4,5]" class="skeleton-row">
          <div class="sk sk-avatar"></div>
          <div style="flex:1">
            <div class="sk sk-line" style="width:55%;margin-bottom:6px"></div>
            <div class="sk sk-line" style="width:30%;height:10px"></div>
          </div>
          <div class="sk sk-line" style="width:90px"></div>
          <div class="sk sk-line" style="width:70px"></div>
          <div class="sk sk-badge"></div>
        </div>
      </div>

      <!-- Empty state -->
      <div *ngIf="!loading && items.length === 0" class="empty-cxc">
        <div class="empty-cxc-icon">
          <span class="material-icons-round">account_balance_wallet</span>
        </div>
        <div class="empty-cxc-title">Sin cuentas por cobrar</div>
        <div class="empty-cxc-sub">
          {{ filtroEstado || filtroDesde || filtroHasta
             ? 'No hay facturas con los filtros aplicados.'
             : 'Emite tu primera factura PPD para comenzar.' }}
        </div>
        <a *ngIf="!filtroEstado && !filtroDesde && !filtroHasta"
           class="btn-mag btn-primary btn-sm"
           [routerLink]="['/cfdis/new']"
           [queryParams]="{tipo:'I', metodoPago:'PPD', returnTo:'cuentas-cobrar'}">
          <span class="material-icons-round" style="font-size:16px">add</span>
          Nueva factura PPD
        </a>
      </div>

      <!-- Tabla -->
      <table *ngIf="!loading && items.length > 0" class="cxc-table">
        <thead>
          <tr>
            <th style="width:36%">Cliente</th>
            <th style="text-align:right;width:14%">Total</th>
            <th style="width:20%">Progreso de cobro</th>
            <th style="width:12%">Vencimiento</th>
            <th style="width:10%">Estado</th>
            <th style="width:8%"></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let item of items" class="cxc-row"
              [routerLink]="['/cuentas-cobrar', item.id]">

            <!-- Cliente -->
            <td>
              <div class="client-cell">
                <div class="client-avatar" [style.background]="avatarColor(item.receptorNombre)">
                  {{ initials(item.receptorNombre) }}
                </div>
                <div class="client-info">
                  <span class="client-name">{{ item.receptorNombre }}</span>
                  <span class="client-rfc">{{ item.receptorRfc }}
                    <span class="metodo-badge">{{ item.metodoPago }}</span>
                  </span>
                </div>
              </div>
            </td>

            <!-- Monto total -->
            <td style="text-align:right">
              <div class="amount-total">{{ item.monto | currency:'MXN':'symbol':'1.2-2' }}</div>
              <div class="amount-sub" style="color:#059669">
                +{{ item.totalPagado | currency:'MXN':'symbol':'1.2-2' }}
              </div>
            </td>

            <!-- Progreso -->
            <td>
              <div class="progress-cell">
                <div class="progress-track">
                  <div class="progress-fill"
                       [style.width]="pct(item) + '%'"
                       [style.background]="item.saldoPendiente === 0 ? '#10b981' : '#3b82f6'">
                  </div>
                </div>
                <span class="progress-label">
                  {{ pct(item) | number:'1.0-0' }}% cobrado
                  <span *ngIf="item.saldoPendiente > 0" style="color:var(--text-muted)">
                    · {{ item.saldoPendiente | currency:'MXN':'symbol':'1.0-0' }} restante
                  </span>
                </span>
              </div>
            </td>

            <!-- Vencimiento -->
            <td>
              <div *ngIf="item.fechaVencimiento" class="venc-cell"
                   [class.venc-ok]="!esVencida(item)"
                   [class.venc-red]="esVencida(item)">
                <span class="material-icons-round" style="font-size:13px">
                  {{ esVencida(item) ? 'event_busy' : 'event_available' }}
                </span>
                {{ item.fechaVencimiento | date:'dd MMM yy' }}
              </div>
              <span *ngIf="!item.fechaVencimiento" class="no-venc">Sin fecha</span>
            </td>

            <!-- Estado -->
            <td>
              <span [class]="'estado-chip estado-' + item.estado.toLowerCase()">
                {{ estadoLabel(item.estado) }}
              </span>
            </td>

            <!-- Acciones -->
            <td (click)="$event.stopPropagation()">
              <div class="row-actions">
                <button class="action-btn" title="Descargar XML"
                        (click)="descargar(item,'xml')" *ngIf="item.cfdiUuid">
                  <span class="material-icons-round">code</span>
                </button>
                <button class="action-btn" title="Descargar PDF"
                        (click)="descargar(item,'pdf')" *ngIf="item.cfdiUuid">
                  <span class="material-icons-round">picture_as_pdf</span>
                </button>
                <button class="action-btn action-danger" title="Cancelar factura"
                        (click)="cancelarFactura(item)"
                        *ngIf="item.cfdiUuid && item.estado !== 'Pagado'">
                  <span class="material-icons-round">cancel</span>
                </button>
                <button class="action-btn action-primary" title="Ver detalle"
                        [routerLink]="['/cuentas-cobrar', item.id]">
                  <span class="material-icons-round">arrow_forward</span>
                </button>
              </div>
            </td>

          </tr>
        </tbody>
      </table>

      <!-- Footer paginación -->
      <div *ngIf="!loading && items.length > 0" class="table-footer">
        <span class="footer-info">
          Mostrando <strong>{{ items.length }}</strong> de <strong>{{ totalItems }}</strong> registros
        </span>
        <div class="pagination" *ngIf="totalPages > 1">
          <button class="page-btn" [disabled]="page === 1" (click)="irPagina(page - 1)">
            <span class="material-icons-round">chevron_left</span>
          </button>
          <span class="page-current">{{ page }} / {{ totalPages }}</span>
          <button class="page-btn" [disabled]="page >= totalPages" (click)="irPagina(page + 1)">
            <span class="material-icons-round">chevron_right</span>
          </button>
        </div>
      </div>

    </div>

    <!-- ── MODAL CANCELACIÓN ────────────────────────────────────────────── -->
    <div *ngIf="itemACancelar" class="modal-overlay" (click)="itemACancelar=null">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div class="modal-icon-wrap">
            <span class="material-icons-round modal-icon">cancel</span>
          </div>
          <div>
            <div class="modal-title">Cancelar factura</div>
            <div class="modal-sub">{{ itemACancelar.receptorNombre }}</div>
          </div>
          <button class="modal-close" (click)="itemACancelar=null">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <div class="modal-body">
          <div class="field-wrap">
            <label class="field-label">Motivo de cancelación <span class="req">*</span></label>
            <div class="select-wrap">
              <span class="material-icons-round select-icon">help_outline</span>
              <select [(ngModel)]="cancelMotivo" class="styled-select">
                <option *ngFor="let m of MOTIVOS_CANCEL" [value]="m.value">{{ m.label }}</option>
              </select>
              <span class="material-icons-round select-caret">expand_more</span>
            </div>
          </div>

          <div class="field-wrap" *ngIf="cancelMotivo === '01'">
            <label class="field-label">UUID de sustitución <span class="req">*</span></label>
            <div class="input-wrap">
              <span class="material-icons-round input-icon">link</span>
              <input type="text" [(ngModel)]="cancelFolioSust" class="styled-input"
                     placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
            </div>
          </div>

          <div class="alert-danger">
            <span class="material-icons-round" style="font-size:18px;flex-shrink:0">warning</span>
            <span>Esta acción se envía al SAT y <strong>no puede revertirse</strong>. El receptor verá la cancelación en su buzón tributario.</span>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-mag btn-ghost" (click)="itemACancelar=null" [disabled]="cancelando">
            Cancelar
          </button>
          <button class="btn-cancel-confirm"
                  (click)="confirmarCancelacion()"
                  [disabled]="cancelando || (cancelMotivo==='01' && !cancelFolioSust)">
            <span *ngIf="cancelando" class="material-icons-round spin">refresh</span>
            <span *ngIf="!cancelando" class="material-icons-round">check</span>
            {{ cancelando ? 'Enviando al SAT...' : 'Confirmar cancelación' }}
          </button>
        </div>

      </div>
    </div>

  </div>
  `,
  styles: [`
    /* ── Page layout ─────────────────────────────────── */
    .cxc-page { display:flex; flex-direction:column; gap:20px; }

    .cxc-header {
      display:flex; align-items:flex-start; justify-content:space-between; gap:16px;
    }
    .cxc-title {
      font-size:22px; font-weight:800; font-family:var(--font-display);
      color:var(--text-primary); margin:0;
    }
    .cxc-subtitle { font-size:13px; color:var(--text-muted); margin:4px 0 0; }

    /* ── KPI cards ───────────────────────────────────── */
    .kpi-grid {
      display:grid; grid-template-columns:repeat(4,1fr); gap:14px;
    }
    @media(max-width:900px) { .kpi-grid { grid-template-columns:repeat(2,1fr); } }
    @media(max-width:560px) { .kpi-grid { grid-template-columns:1fr; } }

    .kpi-card {
      background:var(--surface); border:1px solid var(--border-light);
      border-radius:var(--radius-lg); padding:18px 16px;
      display:flex; align-items:center; gap:14px;
      box-shadow:var(--shadow-sm); cursor:pointer; text-align:left;
      transition:all .18s; position:relative; overflow:hidden;
    }
    .kpi-card:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }
    .kpi-card.kpi-active {
      border-color:var(--accent); box-shadow:0 0 0 2px rgba(59,99,217,.15), var(--shadow-md);
    }
    .kpi-card.kpi-active::before {
      content:''; position:absolute; top:0; left:0; right:0; height:3px;
      background:var(--accent);
    }

    .kpi-icon {
      width:44px; height:44px; border-radius:12px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .kpi-icon .material-icons-round { font-size:22px; }
    .kpi-amber { background:#fef3c7; color:#d97706; }
    .kpi-red   { background:#fee2e2; color:#dc2626; }
    .kpi-blue  { background:#dbeafe; color:#2563eb; }
    .kpi-green { background:#d1fae5; color:#059669; }

    .kpi-body { flex:1; display:flex; flex-direction:column; gap:1px; min-width:0; }
    .kpi-label { font-size:11px; font-weight:600; text-transform:uppercase;
                 letter-spacing:.04em; color:var(--text-muted); }
    .kpi-value { font-size:18px; font-weight:800; font-family:var(--font-display);
                 color:var(--text-primary); white-space:nowrap; overflow:hidden;
                 text-overflow:ellipsis; }
    .kpi-count { font-size:11px; color:var(--text-muted); }
    .kpi-arrow { color:var(--border); font-size:20px; flex-shrink:0; }
    .kpi-active .kpi-arrow { color:var(--accent); }

    /* ── Filters bar ─────────────────────────────────── */
    .filters-bar {
      background:var(--surface); border:1px solid var(--border-light);
      border-radius:var(--radius-lg); padding:14px 20px;
      display:flex; align-items:center; gap:20px; flex-wrap:wrap;
      box-shadow:var(--shadow-sm);
    }
    .filter-group { display:flex; flex-direction:column; gap:6px; }
    .filter-label { font-size:11px; font-weight:600; text-transform:uppercase;
                    letter-spacing:.04em; color:var(--text-muted); }
    .filter-sep { width:1px; height:40px; background:var(--border-light); flex-shrink:0; }

    /* Chips */
    .chips-row { display:flex; gap:6px; flex-wrap:wrap; }
    .chip {
      height:30px; padding:0 12px; border-radius:20px; font-size:12px; font-weight:500;
      border:1px solid var(--border); background:var(--bg-card2); color:var(--text-secondary);
      cursor:pointer; transition:all .15s; white-space:nowrap;
    }
    .chip:hover { border-color:var(--accent); color:var(--accent); }
    .chip.chip-active { background:var(--accent); color:#fff; border-color:var(--accent); }
    .chip-amber.chip-active { background:#d97706; border-color:#d97706; }
    .chip-red.chip-active   { background:#dc2626; border-color:#dc2626; }
    .chip-blue.chip-active  { background:#2563eb; border-color:#2563eb; }
    .chip-green.chip-active { background:#059669; border-color:#059669; }

    /* Date inputs */
    .date-row { display:flex; align-items:center; gap:8px; }
    .date-sep { font-size:14px; color:var(--text-muted); }
    .date-input-wrap {
      position:relative; display:flex; align-items:center;
    }
    .date-icon {
      position:absolute; left:10px; font-size:16px;
      color:var(--text-muted); pointer-events:none;
    }
    .date-input {
      height:34px; padding:0 12px 0 34px; border-radius:var(--radius-sm);
      border:1px solid var(--border); background:var(--bg-card2);
      color:var(--text-primary); font-size:13px; font-family:var(--font-body);
      outline:none; transition:.15s; width:140px;
      &:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
    }

    .btn-clear {
      display:inline-flex; align-items:center; gap:4px; height:30px; padding:0 12px;
      border-radius:20px; font-size:12px; font-weight:500;
      border:1px solid var(--danger); color:var(--danger); background:var(--danger-light);
      cursor:pointer; transition:.15s; margin-left:auto;
      &:hover { background:#fca5a5; }
    }

    /* ── Table card ──────────────────────────────────── */
    .table-card {
      background:var(--surface); border:1px solid var(--border-light);
      border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-sm);
    }

    /* Skeleton */
    .skeleton-list { padding:8px 0; }
    .skeleton-row {
      display:flex; align-items:center; gap:16px;
      padding:14px 20px; border-bottom:1px solid var(--border-light);
    }
    .sk { background:linear-gradient(90deg,var(--border-light) 25%,var(--border) 50%,var(--border-light) 75%);
          background-size:600px 100%; animation:shimmer 1.5s infinite; border-radius:4px; height:13px; }
    .sk-avatar { width:38px; height:38px; border-radius:10px; flex-shrink:0; }
    .sk-badge  { width:60px; height:22px; border-radius:20px; }

    /* Empty */
    .empty-cxc { padding:56px 24px; text-align:center; }
    .empty-cxc-icon {
      width:64px; height:64px; border-radius:16px; background:var(--accent-light);
      display:flex; align-items:center; justify-content:center; margin:0 auto 16px;
    }
    .empty-cxc-icon .material-icons-round { font-size:32px; color:var(--accent); }
    .empty-cxc-title { font-size:17px; font-weight:700; color:var(--text-primary); margin-bottom:6px; }
    .empty-cxc-sub   { font-size:13px; color:var(--text-muted); margin-bottom:20px; }

    /* Table */
    .cxc-table { width:100%; border-collapse:collapse; }
    .cxc-table thead th {
      padding:10px 16px; font-size:11px; font-weight:600; letter-spacing:.05em;
      text-transform:uppercase; color:var(--text-muted); text-align:left;
      background:var(--bg-card2); border-bottom:1px solid var(--border-light);
      white-space:nowrap;
    }
    .cxc-row {
      border-bottom:1px solid var(--border-light); cursor:pointer;
      transition:background .13s;
    }
    .cxc-row:last-child { border-bottom:none; }
    .cxc-row:hover { background:var(--accent-light); }
    .cxc-row td { padding:14px 16px; vertical-align:middle; }

    /* Client cell */
    .client-cell { display:flex; align-items:center; gap:12px; }
    .client-avatar {
      width:38px; height:38px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
      font-size:13px; font-weight:700; color:#fff; font-family:var(--font-display);
    }
    .client-info { display:flex; flex-direction:column; gap:2px; min-width:0; }
    .client-name {
      font-size:13px; font-weight:600; color:var(--text-primary);
      white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:280px;
    }
    .client-rfc { font-size:11px; color:var(--text-muted); font-family:monospace;
                  display:flex; align-items:center; gap:6px; }
    .metodo-badge {
      font-size:10px; font-weight:700; padding:1px 6px; border-radius:4px;
      background:var(--accent-light); color:var(--accent); font-family:var(--font-body);
    }

    /* Amounts */
    .amount-total { font-size:13px; font-weight:700; color:var(--text-primary); }
    .amount-sub   { font-size:11px; margin-top:2px; }

    /* Progress */
    .progress-cell { display:flex; flex-direction:column; gap:5px; }
    .progress-track {
      height:5px; background:var(--border-light); border-radius:99px; overflow:hidden;
    }
    .progress-fill { height:100%; border-radius:99px; transition:width .4s; }
    .progress-label { font-size:11px; color:var(--text-muted); white-space:nowrap; }

    /* Vencimiento */
    .venc-cell {
      display:inline-flex; align-items:center; gap:4px; font-size:12px; font-weight:500;
      padding:3px 8px; border-radius:6px;
    }
    .venc-ok  { background:#d1fae5; color:#059669; }
    .venc-red { background:#fee2e2; color:#dc2626; }
    .no-venc  { font-size:12px; color:var(--text-muted); }

    /* Estado chips */
    .estado-chip {
      display:inline-block; padding:3px 10px; border-radius:20px;
      font-size:11px; font-weight:600; white-space:nowrap;
    }
    .estado-pendiente          { background:#fef3c7; color:#d97706; }
    .estado-vencido            { background:#fee2e2; color:#dc2626; }
    .estado-parcialmentepagado { background:#dbeafe; color:#2563eb; }
    .estado-pagado             { background:#d1fae5; color:#059669; }

    /* Row actions */
    .row-actions { display:flex; gap:2px; justify-content:flex-end; }
    .action-btn {
      width:30px; height:30px; border-radius:6px; border:none; background:transparent;
      color:var(--text-muted); cursor:pointer; display:flex; align-items:center;
      justify-content:center; transition:.13s;
    }
    .action-btn .material-icons-round { font-size:17px; }
    .action-btn:hover { background:var(--border-light); color:var(--text-primary); }
    .action-btn.action-danger:hover { background:#fee2e2; color:#dc2626; }
    .action-btn.action-primary { color:var(--accent); }
    .action-btn.action-primary:hover { background:var(--accent-light); }

    /* Footer */
    .table-footer {
      display:flex; align-items:center; justify-content:space-between;
      padding:12px 20px; border-top:1px solid var(--border-light);
    }
    .footer-info { font-size:13px; color:var(--text-muted); }
    .pagination  { display:flex; align-items:center; gap:6px; }
    .page-btn {
      width:32px; height:32px; border-radius:var(--radius-sm); border:1px solid var(--border);
      background:var(--bg-card2); cursor:pointer; display:flex; align-items:center;
      justify-content:center; color:var(--text-secondary); transition:.13s;
      &:hover:not([disabled]) { border-color:var(--accent); color:var(--accent); }
      &:disabled { opacity:.4; cursor:not-allowed; }
    }
    .page-btn .material-icons-round { font-size:18px; }
    .page-current {
      font-size:13px; font-weight:600; padding:0 12px;
      color:var(--text-primary);
    }

    /* ── Modal ───────────────────────────────────────── */
    .modal-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000;
      display:flex; align-items:center; justify-content:center; padding:20px;
      backdrop-filter:blur(2px);
    }
    .modal-box {
      background:var(--surface); border-radius:var(--radius-lg);
      box-shadow:var(--shadow-lg); width:100%; max-width:460px;
      overflow:hidden;
    }
    .modal-header {
      display:flex; align-items:center; gap:14px;
      padding:20px 24px; border-bottom:1px solid var(--border-light);
    }
    .modal-icon-wrap {
      width:40px; height:40px; border-radius:10px; background:#fee2e2;
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
    }
    .modal-icon { font-size:22px; color:#dc2626; }
    .modal-title { font-size:16px; font-weight:700; color:var(--text-primary); }
    .modal-sub   { font-size:12px; color:var(--text-muted); margin-top:2px; }
    .modal-close {
      margin-left:auto; width:32px; height:32px; border-radius:6px; border:none;
      background:transparent; cursor:pointer; color:var(--text-muted);
      display:flex; align-items:center; justify-content:center;
      &:hover { background:var(--border-light); color:var(--text-primary); }
    }
    .modal-body { padding:24px; display:flex; flex-direction:column; gap:16px; }
    .modal-footer {
      display:flex; gap:10px; justify-content:flex-end;
      padding:16px 24px; border-top:1px solid var(--border-light);
      background:var(--bg-card2);
    }

    .field-wrap { display:flex; flex-direction:column; gap:6px; }
    .field-label { font-size:12px; font-weight:600; color:var(--text-secondary); }
    .req { color:var(--danger); }

    .select-wrap {
      position:relative; display:flex; align-items:center;
    }
    .select-icon {
      position:absolute; left:10px; font-size:18px;
      color:var(--text-muted); pointer-events:none;
    }
    .select-caret {
      position:absolute; right:10px; font-size:18px;
      color:var(--text-muted); pointer-events:none;
    }
    .styled-select {
      width:100%; height:40px; padding:0 36px 0 38px;
      border:1px solid var(--border); border-radius:var(--radius-sm);
      background:var(--bg-card); color:var(--text-primary);
      font-size:13px; font-family:var(--font-body);
      appearance:none; cursor:pointer; outline:none; transition:.15s;
      &:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
    }

    .input-wrap { position:relative; display:flex; align-items:center; }
    .input-icon {
      position:absolute; left:10px; font-size:18px;
      color:var(--text-muted); pointer-events:none;
    }
    .styled-input {
      width:100%; height:40px; padding:0 12px 0 38px;
      border:1px solid var(--border); border-radius:var(--radius-sm);
      background:var(--bg-card); color:var(--text-primary);
      font-size:13px; font-family:var(--font-body); outline:none; transition:.15s;
      &:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
      &::placeholder { color:var(--text-muted); }
    }

    .alert-danger {
      display:flex; align-items:flex-start; gap:10px;
      background:#fef2f2; border:1px solid #fca5a5; border-radius:var(--radius-sm);
      padding:12px 14px; font-size:12px; color:#dc2626; line-height:1.5;
    }

    .btn-cancel-confirm {
      display:inline-flex; align-items:center; gap:6px; padding:9px 18px;
      border-radius:var(--radius-sm); border:none; font-size:13px; font-weight:600;
      background:#dc2626; color:#fff; cursor:pointer; transition:.15s;
      &:hover:not([disabled]) { background:#b91c1c; }
      &:disabled { opacity:.5; cursor:not-allowed; }
    }
    .spin { animation:spin 1s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
  `]
})
export class CxcComponent implements OnInit {
  items:      CxcItem[] = [];
  resumen:    CxcResumen | null = null;
  loading     = false;
  totalItems  = 0;
  page        = 1;
  pageSize    = 20;

  filtroEstado = '';
  filtroDesde  = '';
  filtroHasta  = '';

  get totalPages(): number { return Math.ceil(this.totalItems / this.pageSize); }

  constructor(private svc: CxcService, private cfdiSvc: CfdiService) {}

  ngOnInit(): void {
    this.cargar();
    this.svc.resumen().subscribe(r => this.resumen = r);
  }

  cargar(): void {
    this.loading = true;
    this.svc.listar({
      estado: this.filtroEstado || undefined,
      desde:  this.filtroDesde  || undefined,
      hasta:  this.filtroHasta  || undefined,
      page:   this.page,
      pageSize: this.pageSize,
    }).subscribe({
      next:  r => { this.items = r.data; this.totalItems = r.total; this.loading = false; },
      error: () => this.loading = false,
    });
  }

  setFiltroEstado(estado: string): void {
    this.filtroEstado = estado;
    this.page = 1;
    this.cargar();
  }

  limpiarFiltros(): void {
    this.filtroEstado = '';
    this.filtroDesde  = '';
    this.filtroHasta  = '';
    this.page = 1;
    this.cargar();
  }

  irPagina(p: number): void { this.page = p; this.cargar(); }

  descargar(item: CxcItem, tipo: 'xml' | 'pdf'): void {
    const req$ = tipo === 'xml'
      ? this.cfdiSvc.descargarXml(item.cfdiId)
      : this.cfdiSvc.descargarPdf(item.cfdiId);
    req$.subscribe(blob => this.cfdiSvc.descargarArchivo(blob, `${item.cfdiUuid ?? item.cfdiId}.${tipo}`));
  }

  // Modal cancelación
  itemACancelar: CxcItem | null = null;
  cancelMotivo = '02';
  cancelFolioSust = '';
  cancelando = false;
  readonly MOTIVOS_CANCEL = [
    { value: '01', label: '01 – Con errores con relación (requiere UUID sustituto)' },
    { value: '02', label: '02 – Con errores sin relación' },
    { value: '03', label: '03 – No se llevó a cabo la operación' },
    { value: '04', label: '04 – Operación nominativa en factura global' },
  ];

  cancelarFactura(item: CxcItem): void {
    this.itemACancelar = item;
    this.cancelMotivo = '02';
    this.cancelFolioSust = '';
  }

  confirmarCancelacion(): void {
    if (!this.itemACancelar) return;
    this.cancelando = true;
    this.cfdiSvc.cancelar(
      this.itemACancelar.cfdiId,
      this.cancelMotivo,
      this.cancelMotivo === '01' ? this.cancelFolioSust || undefined : undefined
    ).subscribe({
      next: () => { this.cancelando = false; this.itemACancelar = null; this.cargar(); },
      error: () => { this.cancelando = false; }
    });
  }

  pct(item: CxcItem): number {
    if (item.monto === 0) return 0;
    return Math.min(100, (item.totalPagado / item.monto) * 100);
  }

  initials(nombre: string): string {
    return nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  avatarColor(nombre: string): string {
    const colors = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316'];
    let h = 0;
    for (let i = 0; i < nombre.length; i++) h = (h * 31 + nombre.charCodeAt(i)) & 0xffffffff;
    return colors[Math.abs(h) % colors.length];
  }

  esVencida(item: CxcItem): boolean {
    return item.estado === 'Vencido' ||
      (!!item.fechaVencimiento && new Date(item.fechaVencimiento) < new Date() && item.estado !== 'Pagado');
  }

  estadoLabel(e: string): string {
    const m: Record<string, string> = {
      Pendiente: 'Pendiente', Vencido: 'Vencida',
      ParcialmentePagado: 'Parcial', Pagado: 'Cobrada',
    };
    return m[e] ?? e;
  }
}
