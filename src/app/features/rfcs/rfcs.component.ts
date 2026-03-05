import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RfcList } from '../../core/models/RFC/RfcList';
import { RfcService } from '../../core/services/RFC/RfcService';

@Component({
  selector: 'app-rfcs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="animate-in">

      <div class="page-header">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
          <div>
            <h1 class="page-header-title">Mis RFCs</h1>
            <p class="page-header-sub">Empresas registradas para emitir facturas</p>
          </div>
          <a routerLink="/rfcs/new" class="btn-mag btn-primary">
            <span class="material-icons-round" style="font-size:18px">add</span>
            Nuevo RFC
          </a>
        </div>
      </div>

      <!-- Skeleton -->
      <div *ngIf="loading" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">
        <div *ngFor="let i of [1,2,3]" class="card-mag" style="padding:24px">
          <div class="skeleton" style="height:16px;width:70%;margin-bottom:10px;border-radius:4px"></div>
          <div class="skeleton" style="height:13px;width:45%;margin-bottom:20px;border-radius:4px"></div>
          <div style="display:flex;gap:8px">
            <div class="skeleton" style="height:28px;width:80px;border-radius:20px"></div>
            <div class="skeleton" style="height:28px;width:80px;border-radius:20px"></div>
          </div>
        </div>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && rfcs.length === 0" class="card-mag">
        <div class="empty-state">
          <div class="empty-icon">
            <span class="material-icons-round">business</span>
          </div>
          <div class="empty-title">Sin RFCs registrados</div>
          <div class="empty-desc">
            Registra tu primera empresa para comenzar a emitir facturas electrónicas.
          </div>
          <a routerLink="/rfcs/new" class="btn-mag btn-primary">
            <span class="material-icons-round" style="font-size:18px">add</span>
            Registrar RFC
          </a>
        </div>
      </div>

      <!-- Grid de RFC Cards -->
      <div *ngIf="!loading && rfcs.length > 0"
           style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:16px">

        <div *ngFor="let rfc of rfcs; let i=index" class="card-mag animate-in" [class]="'delay-'+i" style="cursor:pointer"
             [routerLink]="['/rfcs', rfc.id]">

          <div style="padding:20px 22px">
            <!-- Header -->
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:16px">
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:44px;height:44px;background:var(--accent-light);border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0">
                  <span class="material-icons-round" style="color:var(--accent);font-size:22px">business</span>
                </div>
                <div>
                  <div style="font-family:var(--font-display);font-size:15px;font-weight:700;color:var(--text-primary);line-height:1.2">
                    {{ rfc.razonSocial }}
                  </div>
                  <div style="font-size:12px;color:var(--text-muted);font-family:monospace;margin-top:2px">
                    {{ rfc.rfc }}
                  </div>
                </div>
              </div>
              <span class="badge-mag" [class]="rfc.activo ? 'activo' : 'inactivo'">
                {{ rfc.activo ? 'Activo' : 'Inactivo' }}
              </span>
            </div>

            <!-- Stats row -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding:14px;background:var(--bg-card2);border-radius:var(--radius-sm)">
              <div>
                <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);margin-bottom:3px">Timbres</div>
                <div style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--text-primary)">{{ rfc.saldoTimbres }}</div>
              </div>
              <div>
                <div style="font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:var(--text-muted);margin-bottom:3px">CSD</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px">
                  <span class="material-icons-round" [style.color]="rfc.csdActivo ? 'var(--success)' : 'var(--warning)'" style="font-size:18px">
                    {{ rfc.csdActivo ? 'verified' : 'warning_amber' }}
                  </span>
                  <span style="font-size:13px;font-weight:600;" [style.color]="rfc.csdActivo ? 'var(--success)' : 'var(--warning)'">
                    {{ rfc.csdActivo ? 'Activo' : 'Sin CSD' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex;gap:8px;margin-top:14px">
              <a [routerLink]="['/rfcs', rfc.id]" class="btn-mag btn-ghost btn-sm" style="flex:1;justify-content:center"
                 (click)="$event.stopPropagation()">
                <span class="material-icons-round" style="font-size:15px">edit</span>
                Editar
              </a>
              <a routerLink="/cfdis/new" [queryParams]="{rfcId: rfc.id}"
                 class="btn-mag btn-outline btn-sm" style="flex:1;justify-content:center"
                 (click)="$event.stopPropagation()">
                <span class="material-icons-round" style="font-size:15px">receipt_long</span>
                Facturar
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RfcsComponent implements OnInit {
  rfcs: RfcList[] = [];
  loading = true;

  constructor(private rfcSvc: RfcService) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe({
      next:  rfcs => { this.rfcs = rfcs; this.loading = false; },
      error: ()   => { this.loading = false; }
    });
  }
}