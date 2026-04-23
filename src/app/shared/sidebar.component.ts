import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { UserProfile } from '../core/models/Auth/UserProfile';
import { Wallet } from '../core/models/Wallet/Wallet';
import { AuthService } from '../core/services/Auth/AuthService';
import { WalletService } from '../core/services/wallet/WalletService';

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

      <!-- Usuario -->
      <div class="sidebar-user" [routerLink]="['/perfil']">
        <div class="avatar">{{ initials }}</div>
        <div class="user-info">
          <div class="user-name">{{ user?.name }}</div>
          <div class="user-email">{{ user?.email }}</div>
        </div>
        <span class="material-icons-round" style="font-size:16px;color:rgba(255,255,255,0.3)">chevron_right</span>
      </div>

      <!-- Wallet Widget -->
      <div style="padding:0 12px;margin-top:8px">
        <div class="wallet-widget">
          <div class="wallet-label">🪙 Timbres disponibles</div>
          <div class="wallet-saldo">{{ totalTimbres }}</div>
          <div class="wallet-sub">Global + todos tus RFC</div>
        </div>
      </div>

      <!-- Nav -->
      <div class="sidebar-section-title">Principal</div>
      <nav class="sidebar-nav">

        <a class="nav-item"
          routerLink="/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{exact:true}"
          title="Dashboard"
          (click)="close()">
          <span class="material-icons-round nav-icon">dashboard</span>
          <span class="nav-label">Dashboard</span>
        </a>

        <!-- ══ FACTURACIÓN ════════════════════════════════════════════════ -->
        <ng-container>
          <div class="sidebar-section-title" style="padding-top:12px">Facturación</div>

          <!-- ── FACTURAS (siempre expandido) ─────────────────────────── -->
          <ng-container *ngIf="tienePermiso('emitir_cfdi')">
            <div class="nav-group-label">
              <span class="material-icons-round" style="font-size:16px;margin-right:6px;color:var(--accent)">receipt</span>
              Facturas
            </div>

            <a class="nav-item nav-sub"
              [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'I'}"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon" style="font-size:16px">arrow_right</span>
              <span class="nav-label">Factura de Ingreso</span>
            </a>

            <a class="nav-item nav-sub"
              [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'E'}"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon" style="font-size:16px">arrow_right</span>
              <span class="nav-label">Nota de Crédito</span>
            </a>

            <a class="nav-item nav-sub"
              [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'P'}"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon" style="font-size:16px">arrow_right</span>
              <span class="nav-label">Complemento de Pago</span>
            </a>

            <a class="nav-item nav-sub"
              [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'N'}"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon" style="font-size:16px">arrow_right</span>
              <span class="nav-label">Nómina</span>
            </a>

            <a class="nav-item nav-sub"
              [routerLink]="['/cfdis/new']" [queryParams]="{tipo:'T'}"
              routerLinkActive="active"
              (click)="close()">
              <span class="material-icons-round nav-icon" style="font-size:16px">arrow_right</span>
              <span class="nav-label">Traslado</span>
            </a>
          </ng-container>

          <!-- Ver CFDIs: permiso ver_cfdis -->
          <a *ngIf="tienePermiso('ver_cfdis')"
            class="nav-item"
            routerLink="/cfdis"
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact:true}"
            title="CFDIs Emitidos"
            (click)="close()">
            <span class="material-icons-round nav-icon">receipt_long</span>
            <span class="nav-label">CFDIs Emitidos</span>
          </a>

          <!-- Facturas Frecuentes -->
          <a *ngIf="tienePermiso('emitir_cfdi')"
            class="nav-item"
            routerLink="/plantillas-cfdi"
            routerLinkActive="active"
            title="Facturas Frecuentes"
            (click)="close()">
            <span class="material-icons-round nav-icon">bookmark</span>
            <span class="nav-label">Facturas Frecuentes</span>
          </a>

          <!-- Cotizaciones -->
          <a *ngIf="tienePermiso('emitir_cfdi')"
            class="nav-item"
            routerLink="/cotizaciones"
            routerLinkActive="active"
            title="Cotizaciones"
            (click)="close()">
            <span class="material-icons-round nav-icon">request_quote</span>
            <span class="nav-label">Cotizaciones</span>
          </a>

          <!-- Cuentas por Cobrar -->
          <a *ngIf="tienePermiso('ver_cfdis')"
            class="nav-item"
            routerLink="/cuentas-cobrar"
            routerLinkActive="active"
            title="Cuentas por Cobrar"
            (click)="close()">
            <span class="material-icons-round nav-icon">account_balance</span>
            <span class="nav-label">Cuentas por Cobrar</span>
          </a>

          <!-- Series y Folios: permiso ver_series -->
          <a *ngIf="tienePermiso('ver_series')"
            class="nav-item"
            routerLink="/series"
            routerLinkActive="active"
            title="Series y Folios"
            (click)="close()">
            <span class="material-icons-round nav-icon">format_list_numbered</span>
            <span class="nav-label">Series y Folios</span>
          </a>

          <!-- Clientes: permiso ver_clientes -->
          <ng-container *ngIf="tienePermiso('ver_clientes')">
            <div class="sidebar-section-title" style="padding-top:12px">Clientes</div>
            <a class="nav-item"
              routerLink="/clientes"
              routerLinkActive="active"
              title="Clientes"
              (click)="close()">
              <span class="material-icons-round nav-icon">people</span>
              <span class="nav-label">Clientes</span>
            </a>
          </ng-container>

          <!-- RFCs / Empresas emisoras: permiso ver_rfcs -->
          <ng-container *ngIf="tienePermiso('ver_rfcs')">
            <div class="sidebar-section-title" style="padding-top:12px">Empresas</div>
            <a class="nav-item"
              routerLink="/rfcs"
              routerLinkActive="active"
              title="Mis RFCs"
              (click)="close()">
              <span class="material-icons-round nav-icon">business</span>
              <span class="nav-label">Mis RFCs</span>
            </a>
          </ng-container>

          <!-- Wallet / Timbres: permiso ver_wallet -->
          <ng-container *ngIf="tienePermiso('ver_wallet')">
            <div class="sidebar-section-title" style="padding-top:12px">Finanzas</div>
            <a class="nav-item"
              routerLink="/wallet"
              routerLinkActive="active"
              title="Timbres y Consumo"
              (click)="close()">
              <span class="material-icons-round nav-icon">account_balance_wallet</span>
              <span class="nav-label">Timbres y Consumo</span>
            </a>
          </ng-container>
        </ng-container>
        <!-- ══ INVENTARIO ══════════════════════════════════════════════════ -->
        <ng-container *ngIf="tienePermiso('ver_productos')">
          <div class="sidebar-section-title" style="padding-top:12px">Inventario</div>
          <a class="nav-item"
            routerLink="/conceptos"
            routerLinkActive="active"
            title="Productos / Conceptos"
            (click)="close()">
            <span class="material-icons-round nav-icon">inventory_2</span>
            <span class="nav-label">Productos / Conceptos</span>
          </a>
        </ng-container>

        <!-- ══ NÓMINA ══════════════════════════════════════════════════════ -->
        <ng-container *ngIf="tienePermiso('ver_empleados')">
          <div class="sidebar-section-title" style="padding-top:12px">Nómina</div>
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
            (click)="close()"
            style="margin-bottom:6px;border:1px dashed rgba(0,212,170,0.15)">
            <span class="material-icons-round nav-icon" style="color:var(--accent)">payments</span>
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

      <!-- Footer -->
      <div class="sidebar-footer">
        <button class="nav-item" style="width:100%;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.4)"
                (click)="logout()">
          <span class="material-icons-round nav-icon">logout</span>
          <span class="nav-label" style="font-size:13px">Cerrar sesión</span>
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent implements OnInit {
  @Input()  open = false;
  @Input()  collapsed = false;
  @Output() closed = new EventEmitter<void>();

  user: UserProfile | null = null;
  wallets: Wallet[] = [];
  totalTimbres = 0;

  constructor(private auth: AuthService, private walletSvc: WalletService) {}

  ngOnInit(): void {
    this.user = this.auth.currentUser();
    this.auth.user$.subscribe(u => this.user = u);
    this.loadWallets();
  }

  get initials(): string {
    if (!this.user?.name) return 'U';
    return this.user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }

  loadWallets(): void {
    this.walletSvc.saldos().subscribe(ws => {
      this.wallets      = ws;
      this.totalTimbres = ws.reduce((sum, w) => sum + w.saldo, 0);
    });
  }

  tieneModulo(slug: string): boolean   { return this.auth.tieneModulo(slug); }
  tienePermiso(clave: string): boolean { return this.auth.tienePermiso(clave); }

  close(): void  { this.closed.emit(); }
  logout(): void { this.auth.logout(); }
}