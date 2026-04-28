import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WallEEBalanceService, WallEETx } from '../../core/services/wallet/WallEEBalanceService';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="wl-page animate-in">

      <!-- ══ HERO ══════════════════════════════════════════════════ -->
      <div class="wl-hero">
        <div class="wl-hero-left">
          <div class="wl-hero-eyebrow">
            <span class="material-icons-round" style="font-size:16px">account_balance_wallet</span>
            Wallet & Timbres
          </div>
          <div class="wl-hero-total">{{ svc.total() | number }}</div>
          <div class="wl-hero-label">timbres disponibles en total</div>

          <!-- Alerta timbres bajos -->
          <div class="wl-alerta" *ngIf="svc.alerta()">
            <span class="material-icons-round" style="font-size:16px;flex-shrink:0">warning_amber</span>
            {{ svc.alerta() }}
            <a [href]="walletUrl" target="_blank" class="wl-alerta-btn">Comprar ahora</a>
          </div>
        </div>

        <div class="wl-hero-actions">
          <a [href]="walletUrl" target="_blank" class="btn-mag btn-primary">
            <span class="material-icons-round" style="font-size:18px">add_circle_outline</span>
            Comprar timbres
          </a>
          <a [href]="walletUrl" target="_blank" class="btn-mag btn-outline">
            <span class="material-icons-round" style="font-size:18px">open_in_new</span>
            Ir a WallEE
          </a>
        </div>
      </div>

      <!-- ══ BALANCE CARDS ══════════════════════════════════════════ -->
      <div class="wl-cards animate-in delay-1">

        <!-- Empresa -->
        <div class="wl-card wl-card-empresa"
             [class.wl-card-active]="vistaActiva() === 'tenant'"
             (click)="setVista('tenant')">
          <div class="wl-card-header">
            <div class="wl-card-icon wl-icon-empresa">
              <span class="material-icons-round">business</span>
            </div>
            <div>
              <div class="wl-card-title">Empresa</div>
              <div class="wl-card-sub">Wallet del tenant</div>
            </div>
            <div class="wl-active-chip" *ngIf="vistaActiva() === 'tenant'">Activo</div>
          </div>
          <div class="wl-card-num">{{ svc.tenantBalance()?.saldoTotal ?? 0 | number }}</div>
          <div class="wl-card-breakdown">
            <div class="wl-breakdown-item">
              <span class="wl-breakdown-dot wl-dot-bolsa"></span>
              <span>Bolsa</span>
              <span class="wl-breakdown-val">{{ svc.tenantBalance()?.saldoBolsa ?? 0 }}</span>
            </div>
            <div class="wl-breakdown-item">
              <span class="wl-breakdown-dot wl-dot-plan"></span>
              <span>Plan</span>
              <span class="wl-breakdown-val">{{ svc.tenantBalance()?.saldoPlan ?? 0 }}</span>
            </div>
          </div>
          <div class="wl-card-hint">
            <span class="material-icons-round" style="font-size:13px">touch_app</span>
            {{ vistaActiva() === 'tenant' ? 'Viendo movimientos' : 'Clic para ver movimientos' }}
          </div>
        </div>

        <!-- Personal / Bolsa General -->
        <div class="wl-card wl-card-personal"
             [class.wl-card-active-personal]="vistaActiva() === 'personal'"
             (click)="setVista('personal')">
          <div class="wl-card-header">
            <div class="wl-card-icon wl-icon-personal">
              <span class="material-icons-round">person</span>
            </div>
            <div>
              <div class="wl-card-title">Personal</div>
              <div class="wl-card-sub">Bolsa General · Sin caducidad</div>
            </div>
            <div class="wl-active-chip wl-active-chip-green" *ngIf="vistaActiva() === 'personal'">Activo</div>
          </div>
          <div class="wl-card-num wl-card-num-green">{{ svc.personalBalance()?.saldoTotal ?? 0 | number }}</div>
          <div class="wl-card-breakdown">
            <div class="wl-breakdown-item">
              <span class="wl-breakdown-dot wl-dot-bolsa"></span>
              <span>Bolsa prepagada</span>
              <span class="wl-breakdown-val">{{ svc.personalBalance()?.saldoBolsa ?? 0 }}</span>
            </div>
          </div>
          <div class="wl-card-hint">
            <span class="material-icons-round" style="font-size:13px">touch_app</span>
            {{ vistaActiva() === 'personal' ? 'Viendo movimientos' : 'Clic para ver movimientos' }}
          </div>
        </div>

        <!-- Resumen total -->
        <div class="wl-card wl-card-total">
          <div class="wl-total-label">Total disponible</div>
          <div class="wl-total-num">{{ svc.total() | number }}</div>
          <div class="wl-total-sub">timbres combinados</div>
          <div class="wl-total-rows">
            <div class="wl-total-row">
              <span class="wl-tr-dot wl-dot-empresa"></span>
              <span>Empresa</span>
              <span class="wl-tr-val">{{ svc.tenantBalance()?.saldoTotal ?? 0 | number }}</span>
            </div>
            <div class="wl-total-divider"></div>
            <div class="wl-total-row">
              <span class="wl-tr-dot wl-dot-personal"></span>
              <span>Personal</span>
              <span class="wl-tr-val">{{ svc.personalBalance()?.saldoTotal ?? 0 | number }}</span>
            </div>
          </div>
          <div class="wl-total-note">
            <span class="material-icons-round" style="font-size:13px">info_outline</span>
            Al facturar se descuenta primero de Empresa, luego Personal
          </div>
        </div>

      </div>

      <!-- ══ HISTORIAL ══════════════════════════════════════════════ -->
      <div class="wl-hist-wrapper animate-in delay-2">

        <!-- Header historial -->
        <div class="wl-hist-header">
          <div>
            <div class="wl-hist-title">
              Movimientos ·
              <span *ngIf="vistaActiva() === 'tenant'">Empresa</span>
              <span *ngIf="vistaActiva() === 'personal'">Personal</span>
            </div>
            <div class="wl-hist-sub">Historial de créditos y débitos</div>
          </div>

          <!-- Filtro tipo -->
          <div class="wl-filter-tabs">
            <button class="wl-filter-btn" [class.active]="filtro() === 'todos'"   (click)="filtro.set('todos')">Todos</button>
            <button class="wl-filter-btn" [class.active]="filtro() === 'credito'" (click)="filtro.set('credito')">Créditos</button>
            <button class="wl-filter-btn" [class.active]="filtro() === 'debito'"  (click)="filtro.set('debito')">Débitos</button>
          </div>
        </div>

        <!-- Loading -->
        <div *ngIf="loadingTx()" class="wl-skeleton-wrap">
          <div *ngFor="let i of [1,2,3,4,5]" class="wl-skeleton-row">
            <div class="wl-sk wl-sk-icon"></div>
            <div class="wl-sk-body">
              <div class="wl-sk wl-sk-line1"></div>
              <div class="wl-sk wl-sk-line2"></div>
            </div>
            <div class="wl-sk wl-sk-amount"></div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!loadingTx() && txFiltradas().length === 0" class="wl-empty">
          <span class="material-icons-round" style="font-size:40px;color:var(--text-muted)">receipt_long</span>
          <div style="margin-top:12px">Sin movimientos registrados</div>
        </div>

        <!-- Lista movimientos -->
        <div *ngIf="!loadingTx() && txFiltradas().length > 0" class="wl-tx-list">
          <div *ngFor="let tx of txFiltradas()" class="wl-tx-row">

            <!-- Icono tipo -->
            <div class="wl-tx-icon"
                 [class.wl-tx-credito]="tx.tipo === 'credito'"
                 [class.wl-tx-debito]="tx.tipo === 'debito'">
              <span class="material-icons-round" style="font-size:18px">
                {{ tx.tipo === 'credito' ? 'arrow_downward' : 'arrow_upward' }}
              </span>
            </div>

            <!-- Info -->
            <div class="wl-tx-info">
              <div class="wl-tx-concepto">{{ tx.concepto }}</div>
              <div class="wl-tx-meta">
                <span class="wl-fuente-chip wl-fuente-{{tx.fuente}}">{{ tx.fuente }}</span>
                <span>{{ tx.appSource }}</span>
                <span>{{ tx.createdAt | date:'dd/MM/yy HH:mm' }}</span>
              </div>
            </div>

            <!-- Monto -->
            <div class="wl-tx-amount"
                 [class.wl-amount-pos]="tx.tipo === 'credito'"
                 [class.wl-amount-neg]="tx.tipo === 'debito'">
              {{ tx.tipo === 'credito' ? '+' : '-' }}{{ tx.cantidad | number }}
            </div>

            <!-- Saldo nuevo -->
            <div class="wl-tx-saldo">
              <div class="wl-saldo-val">{{ tx.saldoNuevo | number }}</div>
              <div class="wl-saldo-label">saldo</div>
            </div>

          </div>
        </div>

        <!-- Paginación -->
        <div class="wl-pagination" *ngIf="totalPages() > 1">
          <button class="wl-page-btn" [disabled]="page() === 1" (click)="changePage(page() - 1)">
            <span class="material-icons-round">chevron_left</span>
          </button>
          <span class="wl-page-info">{{ page() }} / {{ totalPages() }}</span>
          <button class="wl-page-btn" [disabled]="page() === totalPages()" (click)="changePage(page() + 1)">
            <span class="material-icons-round">chevron_right</span>
          </button>
        </div>

      </div>

    </div>

    <!-- ════════════════════  STYLES  ════════════════════ -->
    <style>
      /* ── Page ── */
      .wl-page { padding: 0 0 60px; }
      .animate-in { animation: fadeUp .3s ease both; }
      .delay-1 { animation-delay: .05s; }
      .delay-2 { animation-delay: .1s; }
      @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

      /* ── Hero ── */
      .wl-hero {
        display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap;
        gap: 20px; margin-bottom: 28px;
        padding: 28px 32px; border-radius: 20px;
        background: var(--grad-dark, linear-gradient(135deg,#0f1729 0%,#1a2540 100%));
        border: 1px solid rgba(0,212,170,.15); position: relative; overflow: hidden;
      }
      .wl-hero::before {
        content: ''; position: absolute; top: -60px; right: -60px;
        width: 220px; height: 220px; border-radius: 50%;
        background: radial-gradient(circle, rgba(0,212,170,.18) 0%, transparent 70%);
        pointer-events: none;
      }
      .wl-hero-eyebrow {
        display: flex; align-items: center; gap: 6px;
        font-size: 11px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase;
        color: var(--accent); margin-bottom: 10px;
      }
      .wl-hero-total {
        font-family: var(--font-display); font-size: 64px; font-weight: 900;
        color: #fff; line-height: 1; margin-bottom: 6px;
      }
      .wl-hero-label { font-size: 14px; color: rgba(255,255,255,.45); }
      .wl-alerta {
        display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 16px;
        padding: 10px 14px; border-radius: 10px;
        background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.3);
        font-size: 13px; color: #fcd34d;
      }
      .wl-alerta-btn {
        margin-left: auto; padding: 4px 12px; border-radius: 6px;
        background: rgba(245,158,11,.25); color: #fcd34d;
        font-size: 12px; font-weight: 700; text-decoration: none; white-space: nowrap;
      }
      .wl-alerta-btn:hover { background: rgba(245,158,11,.45); }
      .wl-hero-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      .wl-hero-actions .btn-mag { gap: 6px; }

      /* ── Balance cards ── */
      .wl-cards {
        display: grid;
        grid-template-columns: 1fr 1fr 280px;
        gap: 16px; margin-bottom: 24px;
      }
      @media(max-width:1100px) { .wl-cards { grid-template-columns: 1fr 1fr; } }
      @media(max-width:600px)  { .wl-cards { grid-template-columns: 1fr; } }

      .wl-card {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: 16px; padding: 22px; cursor: pointer;
        transition: border-color .2s, box-shadow .2s; position: relative; overflow: hidden;
      }
      .wl-card:hover { box-shadow: 0 4px 20px rgba(0,0,0,.1); }
      .wl-card-active { border-color: #3b63d9; box-shadow: 0 0 0 3px rgba(59,99,217,.12); }
      .wl-card-active-personal { border-color: #10b981; box-shadow: 0 0 0 3px rgba(16,185,129,.12); }

      .wl-card-empresa { border-left: 3px solid #3b63d9; }
      .wl-card-personal { border-left: 3px solid #10b981; }
      .wl-card-total {
        background: linear-gradient(135deg,#1e1b4b 0%,#312e81 100%);
        border: 1px solid rgba(99,102,241,.25); cursor: default;
      }

      .wl-card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .wl-card-icon {
        width: 38px; height: 38px; border-radius: 10px; display: flex;
        align-items: center; justify-content: center; flex-shrink: 0;
      }
      .wl-card-icon .material-icons-round { font-size: 20px; }
      .wl-icon-empresa  { background: rgba(59,99,217,.12); color: #3b63d9; }
      .wl-icon-personal { background: rgba(16,185,129,.12); color: #10b981; }

      .wl-card-title { font-size: 14px; font-weight: 700; color: var(--text-primary); }
      .wl-card-sub   { font-size: 11px; color: var(--text-muted); margin-top: 1px; }

      .wl-active-chip {
        margin-left: auto; padding: 3px 10px; border-radius: 20px; font-size: 10px;
        font-weight: 700; background: rgba(59,99,217,.12); color: #3b63d9;
      }
      .wl-active-chip-green { background: rgba(16,185,129,.12); color: #10b981; }

      .wl-card-num {
        font-family: var(--font-display); font-size: 44px; font-weight: 900;
        color: var(--text-primary); line-height: 1; margin-bottom: 12px;
      }
      .wl-card-num-green { color: #10b981; }

      .wl-card-breakdown { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
      .wl-breakdown-item {
        display: flex; align-items: center; gap: 7px;
        font-size: 12px; color: var(--text-muted);
      }
      .wl-breakdown-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .wl-dot-bolsa  { background: #3b63d9; }
      .wl-dot-plan   { background: #8b5cf6; }
      .wl-breakdown-val { margin-left: auto; font-weight: 700; color: var(--text-primary); }

      .wl-card-hint {
        display: flex; align-items: center; gap: 4px;
        font-size: 11px; color: var(--text-muted); margin-top: 2px;
      }

      /* Total card */
      .wl-total-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.45); margin-bottom: 8px; }
      .wl-total-num { font-family: var(--font-display); font-size: 52px; font-weight: 900; color: #fff; line-height: 1; }
      .wl-total-sub { font-size: 13px; color: rgba(255,255,255,.4); margin-top: 4px; margin-bottom: 16px; }
      .wl-total-rows { display: flex; flex-direction: column; gap: 6px; padding: 12px; background: rgba(255,255,255,.06); border-radius: 10px; margin-bottom: 12px; }
      .wl-total-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,.5); }
      .wl-tr-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
      .wl-dot-empresa  { background: #3b63d9; }
      .wl-dot-personal { background: #10b981; }
      .wl-tr-val { margin-left: auto; font-family: var(--font-display); font-weight: 700; font-size: 15px; color: rgba(255,255,255,.8); }
      .wl-total-divider { height: 1px; background: rgba(255,255,255,.08); }
      .wl-total-note { display: flex; align-items: center; gap: 5px; font-size: 11px; color: rgba(255,255,255,.3); }

      /* ── Historial ── */
      .wl-hist-wrapper {
        background: var(--bg-card); border: 1px solid var(--border-light);
        border-radius: 16px; overflow: hidden;
      }
      .wl-hist-header {
        display: flex; align-items: center; justify-content: space-between;
        flex-wrap: wrap; gap: 12px;
        padding: 18px 22px; border-bottom: 1px solid var(--border-light);
      }
      .wl-hist-title { font-size: 15px; font-weight: 700; color: var(--text-primary); }
      .wl-hist-sub   { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

      /* Filter tabs */
      .wl-filter-tabs { display: flex; gap: 4px; }
      .wl-filter-btn {
        padding: 5px 14px; border-radius: 8px; font-size: 12px; font-weight: 600;
        border: 1px solid var(--border-light); background: transparent;
        color: var(--text-muted); cursor: pointer; transition: all .15s;
      }
      .wl-filter-btn.active {
        background: rgba(59,99,217,.1); border-color: rgba(59,99,217,.3);
        color: #3b63d9;
      }
      .wl-filter-btn:hover:not(.active) { background: var(--bg-card2); }

      /* Skeleton */
      .wl-skeleton-wrap { padding: 4px 0; }
      .wl-skeleton-row {
        display: flex; align-items: center; gap: 14px;
        padding: 14px 22px; border-bottom: 1px solid var(--border-light);
      }
      .wl-skeleton-row:last-child { border-bottom: none; }
      .wl-sk { background: var(--bg-card2); border-radius: 6px; animation: shimmer 1.4s ease infinite; }
      .wl-sk-icon   { width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; }
      .wl-sk-body   { flex: 1; display: flex; flex-direction: column; gap: 6px; }
      .wl-sk-line1  { height: 13px; width: 55%; }
      .wl-sk-line2  { height: 11px; width: 35%; }
      .wl-sk-amount { height: 18px; width: 50px; border-radius: 6px; }
      @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }

      /* Empty */
      .wl-empty {
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        padding: 56px 20px; color: var(--text-muted); font-size: 14px;
      }

      /* TX list */
      .wl-tx-list { }
      .wl-tx-row {
        display: flex; align-items: center; gap: 14px;
        padding: 13px 22px; border-bottom: 1px solid var(--border-light);
        transition: background .1s;
      }
      .wl-tx-row:last-child { border-bottom: none; }
      .wl-tx-row:hover { background: var(--bg-card2); }

      .wl-tx-icon {
        width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
      }
      .wl-tx-credito { background: rgba(16,185,129,.1); color: #10b981; }
      .wl-tx-debito  { background: rgba(239,68,68,.1);  color: #ef4444; }

      .wl-tx-info { flex: 1; min-width: 0; }
      .wl-tx-concepto {
        font-size: 13px; font-weight: 600; color: var(--text-primary);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .wl-tx-meta {
        display: flex; align-items: center; gap: 8px;
        font-size: 11px; color: var(--text-muted); margin-top: 3px; flex-wrap: wrap;
      }

      /* Fuente chip */
      .wl-fuente-chip {
        padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700;
        text-transform: uppercase; letter-spacing: .04em;
      }
      .wl-fuente-bolsa  { background: rgba(59,99,217,.1);  color: #3b63d9; }
      .wl-fuente-plan   { background: rgba(139,92,246,.1); color: #8b5cf6; }
      .wl-fuente-bonus  { background: rgba(245,158,11,.1); color: #f59e0b; }

      .wl-tx-amount {
        font-family: var(--font-display); font-size: 16px; font-weight: 800;
        white-space: nowrap; flex-shrink: 0;
      }
      .wl-amount-pos { color: #10b981; }
      .wl-amount-neg { color: #ef4444; }

      .wl-tx-saldo {
        text-align: right; flex-shrink: 0; min-width: 60px;
      }
      .wl-saldo-val   { font-size: 13px; font-weight: 700; color: var(--text-primary); }
      .wl-saldo-label { font-size: 10px; color: var(--text-muted); }

      /* Pagination */
      .wl-pagination {
        display: flex; align-items: center; justify-content: center; gap: 12px;
        padding: 18px; border-top: 1px solid var(--border-light);
      }
      .wl-page-btn {
        width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--border-light);
        background: transparent; cursor: pointer; color: var(--text-muted);
        display: flex; align-items: center; justify-content: center; transition: all .15s;
      }
      .wl-page-btn:hover:not(:disabled) { background: var(--bg-card2); color: var(--text-primary); }
      .wl-page-btn:disabled { opacity: .35; cursor: not-allowed; }
      .wl-page-info { font-size: 13px; color: var(--text-muted); }

      @media(max-width:600px) {
        .wl-hero { padding: 20px; }
        .wl-hero-total { font-size: 48px; }
        .wl-tx-saldo { display: none; }
        .wl-hist-header { flex-direction: column; align-items: flex-start; }
      }
    </style>
  `
})
export class WalletComponent implements OnInit {

  readonly walletUrl = `${environment.principalLoginUrl}/wallet`;

  vistaActiva = signal<'tenant' | 'personal'>('tenant');
  filtro      = signal<'todos' | 'credito' | 'debito'>('todos');
  txAll       = signal<WallEETx[]>([]);
  loadingTx   = signal(false);
  page        = signal(1);
  totalPages  = signal(1);

  txFiltradas = computed(() => {
    const f = this.filtro();
    if (f === 'todos') return this.txAll();
    return this.txAll().filter(t => t.tipo === f);
  });

  constructor(readonly svc: WallEEBalanceService) {}

  ngOnInit(): void {
    this.svc.load();
    // Esperar a que cargue el balance para poder leer el walletId
    const interval = setInterval(() => {
      const b = this.vistaActiva() === 'tenant'
        ? this.svc.tenantBalance()
        : this.svc.personalBalance();
      if (b) { clearInterval(interval); this.loadTx(); }
    }, 300);
    setTimeout(() => clearInterval(interval), 5000);
  }

  setVista(v: 'tenant' | 'personal'): void {
    this.vistaActiva.set(v);
    this.page.set(1);
    this.filtro.set('todos');
    this.loadTx();
  }

  loadTx(): void {
    const balance = this.vistaActiva() === 'tenant'
      ? this.svc.tenantBalance()
      : this.svc.personalBalance();
    if (!balance) { this.txAll.set([]); this.totalPages.set(1); return; }

    this.loadingTx.set(true);
    this.svc.getTransactions(balance.walletId, this.page()).subscribe({
      next: r => {
        this.txAll.set(r.data);
        this.totalPages.set(r.totalPages);
        this.loadingTx.set(false);
      },
      error: () => this.loadingTx.set(false)
    });
  }

  changePage(p: number): void {
    this.page.set(p);
    this.loadTx();
  }
}
