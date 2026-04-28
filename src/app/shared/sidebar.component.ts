import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../core/services/Auth/AuthService';
import { WallEEBalanceService } from '../core/services/wallet/WallEEBalanceService';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar" [class.open]="open" [class.collapsed]="collapsed">

      <!-- Logo full -->
      <div class="sidebar-logo sidebar-logo-full">
        <a routerLink="/" class="nav-brand" aria-label="Korebix - Inicio">
          <img src="assets/logo.png" alt="Korebix" class="logo-img" style="width:100%"/>
        </a>
      </div>

      <!-- Logo mini (solo favicon) -->
      <div class="sidebar-logo sidebar-logo-mini" style="display:none;justify-content:center;align-items:center;padding:12px 0">
        <a routerLink="/" aria-label="Inicio">
          <img src="/favicon.ico" alt="Logo" style="width:32px;height:32px;border-radius:6px"/>
        </a>
      </div>

      <!-- Wallet Widget -->
      <div style="padding:0 12px;margin-top:8px">
        <div class="wallet-widget" [class.wallet-alerta]="wallEE.alerta()">
          <div class="wallet-label">🪙 Timbres disponibles</div>
          <div class="wallet-saldo">{{ wallEE.total() | number }}</div>
          <div class="wallet-sub">
            Empresa: {{ wallEE.tenantBalance()?.saldoTotal ?? 0 | number }} ·
            Bolsa: {{ wallEE.personalBalance()?.saldoTotal ?? 0 | number }}
          </div>
          <div *ngIf="wallEE.alerta()" class="wallet-alerta-msg">
            ⚠️ {{ wallEE.alerta() }}
          </div>
          <a routerLink="/wallet" class="wallet-comprar-btn" (click)="close()">
            {{ wallEE.alerta() ? '+ Comprar timbres' : 'Gestionar wallet' }}
          </a>
        </div>
      </div>

      <!-- Nav -->
      <nav class="sidebar-nav">

        <!-- ── Dashboard ─────────────────────────────────────────────── -->
        <a class="nav-item"
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{exact:true}"
          title="Dashboard"
          (click)="close()">
          <span class="material-icons-round nav-icon">dashboard</span>
          <span class="nav-label">Dashboard</span>
        </a>

        <!-- ══ EMITIR ═════════════════════════════════════════════════════ -->
        <ng-container *ngIf="tienePermiso('emitir_cfdi')">
          <div class="sidebar-section-title" style="padding-top:14px">Emitir CFDI</div>

          <a class="nav-item"
            [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'I'}"
            routerLinkActive="active"
            title="Factura"
            (click)="close()">
            <span class="material-icons-round nav-icon">receipt</span>
            <span class="nav-label">Factura</span>
          </a>

          <a class="nav-item"
            [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'E'}"
            routerLinkActive="active"
            title="Nota de Crédito"
            (click)="close()">
            <span class="material-icons-round nav-icon">remove_circle_outline</span>
            <span class="nav-label">Nota de Crédito</span>
          </a>

          <a class="nav-item"
            [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'P'}"
            routerLinkActive="active"
            title="Complemento de Pago"
            (click)="close()">
            <span class="material-icons-round nav-icon">payments</span>
            <span class="nav-label">Complemento de Pago</span>
          </a>

          <a class="nav-item"
            [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'T'}"
            routerLinkActive="active"
            title="Carta Porte"
            (click)="close()">
            <span class="material-icons-round nav-icon">local_shipping</span>
            <span class="nav-label">Carta Porte</span>
          </a>

          <a class="nav-item"
            [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'N'}"
            routerLinkActive="active"
            title="Recibo de Nómina"
            (click)="close()">
            <span class="material-icons-round nav-icon">people</span>
            <span class="nav-label">Recibo de Nómina</span>
          </a>

          <a class="nav-item"
            routerLink="/cfdis/masivo"
            routerLinkActive="active"
            title="Carga Masiva"
            (click)="close()">
            <span class="material-icons-round nav-icon">upload_file</span>
            <span class="nav-label">Carga Masiva</span>
          </a>
        </ng-container>

        <!-- ══ MIS DOCUMENTOS ═════════════════════════════════════════════ -->
        <ng-container *ngIf="tienePermiso('ver_cfdis') || tienePermiso('emitir_cfdi')">
          <div class="sidebar-section-title" style="padding-top:14px">Mis Documentos</div>

          <a *ngIf="tienePermiso('ver_cfdis')"
            class="nav-item"
            routerLink="/cfdis"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact:true}"
            title="Mis CFDIs"
            (click)="close()">
            <span class="material-icons-round nav-icon">receipt_long</span>
            <span class="nav-label">Mis CFDIs</span>
          </a>

          <a *ngIf="tienePermiso('ver_cfdis')"
            class="nav-item"
            routerLink="/cuentas-cobrar"
            routerLinkActive="active"
            title="Cuentas por Cobrar"
            (click)="close()">
            <span class="material-icons-round nav-icon">account_balance_wallet</span>
            <span class="nav-label">Cuentas por Cobrar</span>
          </a>

          <a *ngIf="tienePermiso('emitir_cfdi')"
            class="nav-item"
            routerLink="/cotizaciones"
            routerLinkActive="active"
            title="Cotizaciones"
            (click)="close()">
            <span class="material-icons-round nav-icon">request_quote</span>
            <span class="nav-label">Cotizaciones</span>
          </a>

          <a *ngIf="tienePermiso('emitir_cfdi')"
            class="nav-item"
            routerLink="/plantillas-cfdi"
            routerLinkActive="active"
            title="Plantillas"
            (click)="close()">
            <span class="material-icons-round nav-icon">bookmark</span>
            <span class="nav-label">Plantillas</span>
          </a>
        </ng-container>

        <!-- ══ CATÁLOGOS ══════════════════════════════════════════════════ -->
        <ng-container *ngIf="tienePermiso('ver_clientes') || tienePermiso('ver_rfcs') || tienePermiso('ver_productos') || tienePermiso('ver_series')">
          <div class="sidebar-section-title" style="padding-top:14px">Catálogos</div>

          <a *ngIf="tienePermiso('ver_clientes')"
            class="nav-item"
            routerLink="/clientes"
            routerLinkActive="active"
            title="Clientes"
            (click)="close()">
            <span class="material-icons-round nav-icon">group</span>
            <span class="nav-label">Clientes</span>
          </a>

          <a *ngIf="tienePermiso('ver_rfcs')"
            class="nav-item"
            routerLink="/rfcs"
            routerLinkActive="active"
            title="Empresas Emisoras"
            (click)="close()">
            <span class="material-icons-round nav-icon">business</span>
            <span class="nav-label">Empresas Emisoras</span>
          </a>

          <a *ngIf="tienePermiso('ver_productos')"
            class="nav-item"
            routerLink="/conceptos"
            routerLinkActive="active"
            title="Productos y Servicios"
            (click)="close()">
            <span class="material-icons-round nav-icon">inventory_2</span>
            <span class="nav-label">Productos y Servicios</span>
          </a>

          <a *ngIf="tienePermiso('ver_series')"
            class="nav-item"
            routerLink="/series"
            routerLinkActive="active"
            title="Series y Folios"
            (click)="close()">
            <span class="material-icons-round nav-icon">format_list_numbered</span>
            <span class="nav-label">Series y Folios</span>
          </a>
        </ng-container>

        <!-- ══ NÓMINA ══════════════════════════════════════════════════════ -->
        <ng-container *ngIf="tienePermiso('ver_empleados')">
          <div class="sidebar-section-title" style="padding-top:14px">Nómina</div>

          <a class="nav-item"
            routerLink="/empleados"
            routerLinkActive="active"
            title="Empleados"
            (click)="close()">
            <span class="material-icons-round nav-icon">badge</span>
            <span class="nav-label">Empleados</span>
          </a>

          <a class="nav-item"
            routerLink="/nomina/generar"
            routerLinkActive="active"
            title="Generar Nómina"
            (click)="close()">
            <span class="material-icons-round nav-icon" style="color:var(--accent)">bolt</span>
            <span class="nav-label" style="color:var(--accent)">Generar Nómina</span>
          </a>

          <a class="nav-item"
            routerLink="/nomina/lotes"
            routerLinkActive="active"
            title="Historial de Lotes"
            (click)="close()">
            <span class="material-icons-round nav-icon">history</span>
            <span class="nav-label">Historial de Lotes</span>
          </a>
        </ng-container>

      </nav>

    </aside>
  `
})
export class SidebarComponent implements OnInit {
  @Input()  open = false;
  @Input()  collapsed = false;
  @Output() closed = new EventEmitter<void>();

  constructor(private auth: AuthService, readonly wallEE: WallEEBalanceService) {}

  ngOnInit(): void {
    this.wallEE.load();
  }

  tieneModulo(slug: string): boolean   { return this.auth.tieneModulo(slug); }
  tienePermiso(clave: string): boolean { return this.auth.tienePermiso(clave); }

  close(): void { this.closed.emit(); }
}