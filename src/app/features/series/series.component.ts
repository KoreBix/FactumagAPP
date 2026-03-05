import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SerieConfig } from '../../core/models/serie/SerieConfig';
import { TIPOS_COMPROBANTE } from '../../core/models/CFDI/Catálogos/TIPOS_COMPROBANTE';
import { SerieService } from '../../core/services/serie/SerieService';

@Component({
  selector: 'app-series',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in">

      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Series</h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">
            Gestiona las series y folios de tus comprobantes
          </p>
        </div>
        <a routerLink="/series/new" class="btn-mag btn-primary">
          <span class="material-icons-round" style="font-size:18px">add</span>
          Nueva Serie
        </a>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px" class="animate-in delay-1">

        <div class="card-mag" style="cursor:default">
          <div class="card-body-mag" style="display:flex;align-items:center;gap:16px;padding:18px 20px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(99,102,241,0.12);display:flex;align-items:center;justify-content:center">
              <span class="material-icons-round" style="color:#6366f1;font-size:22px">format_list_numbered</span>
            </div>
            <div>
              <div style="font-family:var(--font-display);font-size:26px;font-weight:800">{{ series.length }}</div>
              <div style="font-size:12px;color:var(--text-muted)">Total</div>
            </div>
          </div>
        </div>

        <div class="card-mag" style="cursor:default">
          <div class="card-body-mag" style="display:flex;align-items:center;gap:16px;padding:18px 20px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(20,184,166,0.1);display:flex;align-items:center;justify-content:center">
              <span class="material-icons-round" style="color:var(--accent);font-size:22px">check_circle</span>
            </div>
            <div>
              <div style="font-family:var(--font-display);font-size:26px;font-weight:800;color:var(--accent)">
                {{ activas }}
              </div>
              <div style="font-size:12px;color:var(--text-muted)">Activas</div>
            </div>
          </div>
        </div>

        <div class="card-mag" style="cursor:default">
          <div class="card-body-mag" style="display:flex;align-items:center;gap:16px;padding:18px 20px">
            <div style="width:44px;height:44px;border-radius:10px;background:rgba(245,158,11,0.1);display:flex;align-items:center;justify-content:center">
              <span class="material-icons-round" style="color:var(--warning);font-size:22px">inventory</span>
            </div>
            <div>
              <div style="font-family:var(--font-display);font-size:26px;font-weight:800;color:var(--warning)">
                {{ archivadas }}
              </div>
              <div style="font-size:12px;color:var(--text-muted)">Archivadas</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Filtros -->
      <div class="card-mag animate-in delay-2" style="margin-bottom:16px">
        <div class="card-body-mag" style="padding:14px 20px;display:flex;gap:12px;align-items:center">
          <div style="flex:1;position:relative">
            <span class="material-icons-round" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted)">search</span>
            <input [(ngModel)]="busqueda" (input)="filtrar()"
                   placeholder="Buscar por código, nombre..."
                   style="width:100%;padding:9px 14px 9px 38px;background:var(--bg-card2);border:1.5px solid var(--border-light);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;outline:none">
          </div>
          <select [(ngModel)]="filtroEstado" (change)="filtrar()"
                  class="form-control-mag" style="width:150px;padding:9px 14px">
            <option value="todas">Todas</option>
            <option value="activas">Activas</option>
            <option value="archivadas">Archivadas</option>
          </select>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-mag animate-in delay-3">

        <div *ngIf="loading" style="padding:40px;text-align:center">
          <span class="material-icons-round" style="font-size:32px;color:var(--text-muted);animation:spin 1s linear infinite">refresh</span>
        </div>

        <div *ngIf="!loading && seriesFiltradas.length === 0"
             style="padding:48px;text-align:center;color:var(--text-muted)">
          <span class="material-icons-round" style="font-size:40px;display:block;margin-bottom:12px;opacity:0.4">format_list_numbered</span>
          <p style="font-size:15px;font-weight:600">Sin series</p>
          <p style="font-size:13px;margin-top:4px">Crea tu primera serie para empezar a numerar tus CFDIs</p>
          <a routerLink="/series/new" class="btn-mag btn-primary" style="margin-top:16px;display:inline-flex">
            <span class="material-icons-round" style="font-size:16px">add</span> Nueva Serie
          </a>
        </div>

        <table *ngIf="!loading && seriesFiltradas.length > 0"
               style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:2px solid var(--border-light)">
              <th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase">Código</th>
              <th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase">Nombre</th>
              <th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase">Tipo</th>
              <th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase">Próximo Folio</th>
              <th style="padding:12px 20px;text-align:center;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase">Default</th>
              <th style="padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase">Estatus</th>
              <th style="padding:12px 20px;text-align:right;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:0.8px;text-transform:uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let s of paginadas"
                style="border-bottom:1px solid var(--border-light);transition:background .15s"
                [style.opacity]="s.activa ? '1' : '0.55'"
                (mouseenter)="hoverRow($event, true)"
                (mouseleave)="hoverRow($event, false)">

              <!-- Código -->
              <td style="padding:14px 20px">
                <span style="font-family:var(--font-display);font-size:15px;font-weight:800;color:var(--accent)">
                  {{ s.codigo }}
                </span>
              </td>

              <!-- Nombre -->
              <td style="padding:14px 20px">
                <div style="font-weight:600;font-size:13px">{{ s.nombre }}</div>
                <div *ngIf="s.descripcion" style="font-size:11px;color:var(--text-muted);margin-top:2px">{{ s.descripcion }}</div>
              </td>

              <!-- Tipo -->
              <td style="padding:14px 20px">
                <span [style]="badgeTipo(s.tipoComprobante)">
                  {{ labelTipo(s.tipoComprobante) }}
                </span>
              </td>

              <!-- Próximo folio -->
              <td style="padding:14px 20px">
                <code style="font-size:13px;font-family:monospace;font-weight:700;color:var(--text-primary)">
                  {{ s.proximoFolio }}
                </code>
              </td>

              <!-- Default -->
              <td style="padding:14px 20px;text-align:center">
                <button type="button"
                        (click)="toggleDefault(s)"
                        [title]="s.porDefecto ? 'Quitar como default' : 'Marcar como default'"
                        style="background:none;border:none;cursor:pointer;padding:4px">
                  <span class="material-icons-round"
                        [style.color]="s.porDefecto ? '#f59e0b' : 'var(--text-muted)'"
                        style="font-size:20px">
                    {{ s.porDefecto ? 'star' : 'star_border' }}
                  </span>
                </button>
              </td>

              <!-- Estatus -->
              <td style="padding:14px 20px">
                <span [style]="badgeEstatus(s.activa)">
                  {{ s.activa ? 'Activa' : 'Archivada' }}
                </span>
              </td>

              <!-- Acciones -->
              <td style="padding:14px 20px;text-align:right">
                <div style="display:flex;gap:4px;justify-content:flex-end">
                  <a [routerLink]="['/series', s.id]"
                     class="btn-mag btn-ghost btn-sm" title="Editar"
                     style="padding:6px 8px">
                    <span class="material-icons-round" style="font-size:16px">edit</span>
                  </a>
                  <button type="button" class="btn-mag btn-ghost btn-sm"
                          title="Resetear folio" (click)="resetFolio(s)"
                          style="padding:6px 8px">
                    <span class="material-icons-round" style="font-size:16px">restart_alt</span>
                  </button>
                  <button type="button"
                          [class]="s.activa ? 'btn-mag btn-ghost btn-sm' : 'btn-mag btn-outline btn-sm'"
                          [title]="s.activa ? 'Archivar' : 'Ya archivada'"
                          [disabled]="!s.activa"
                          (click)="archivar(s)"
                          style="padding:6px 8px">
                    <span class="material-icons-round" style="font-size:16px">{{ s.activa ? 'archive' : 'inventory_2' }}</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Paginación -->
        <div *ngIf="seriesFiltradas.length > pageSize"
             style="padding:12px 20px;border-top:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:12px;color:var(--text-muted)">
            Mostrando {{ offset + 1 }} - {{ min(offset + pageSize, seriesFiltradas.length) }} de {{ seriesFiltradas.length }}
          </span>
          <div style="display:flex;gap:8px">
            <button class="btn-mag btn-ghost btn-sm" [disabled]="page === 0" (click)="prevPage()">Anterior</button>
            <button class="btn-mag btn-ghost btn-sm" [disabled]="offset + pageSize >= seriesFiltradas.length" (click)="nextPage()">Siguiente</button>
          </div>
        </div>

      </div>

    </div>

    <!-- Confirm modal -->
    <div *ngIf="confirmMsg"
         style="position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:1000;display:flex;align-items:center;justify-content:center">
      <div class="card-mag" style="width:380px;padding:0">
        <div class="card-body-mag" style="padding:24px">
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
            <span class="material-icons-round" style="color:var(--warning);font-size:24px">warning_amber</span>
            <span style="font-weight:700;font-size:15px">{{ confirmMsg }}</span>
          </div>
          <div style="display:flex;gap:10px;justify-content:flex-end">
            <button class="btn-mag btn-ghost btn-sm" (click)="cancelConfirm()">Cancelar</button>
            <button class="btn-mag btn-primary btn-sm" (click)="doConfirm()">Confirmar</button>
          </div>
        </div>
      </div>
    </div>

    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class SeriesComponent implements OnInit {
  series:         SerieConfig[] = [];
  seriesFiltradas: SerieConfig[] = [];
  loading = false;

  busqueda    = '';
  filtroEstado = 'activas';
  page         = 0;
  pageSize     = 10;

  confirmMsg: string | null   = null;
  confirmAction: (() => void) | null = null;

  tipos = TIPOS_COMPROBANTE;

  constructor(private serieSvc: SerieService) {}

  ngOnInit(): void { this.cargar(); }

  cargar(): void {
    this.loading = true;
    this.serieSvc.listar().subscribe({
      next: ss => {
        this.series = ss;
        this.filtrar();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  filtrar(): void {
    const q = this.busqueda.toLowerCase();
    this.seriesFiltradas = this.series.filter(s => {
      const matchBusq = !q || s.codigo.toLowerCase().includes(q) || s.nombre.toLowerCase().includes(q);
      const matchEstado =
        this.filtroEstado === 'todas'     ? true :
        this.filtroEstado === 'activas'   ? s.activa :
        !s.activa;
      return matchBusq && matchEstado;
    });
    this.page = 0;
  }

  get activas():    number { return this.series.filter(s => s.activa).length; }
  get archivadas(): number { return this.series.filter(s => !s.activa).length; }
  get offset():     number { return this.page * this.pageSize; }
  get paginadas():  SerieConfig[] {
    return this.seriesFiltradas.slice(this.offset, this.offset + this.pageSize);
  }

  prevPage(): void { if (this.page > 0) this.page--; }
  nextPage(): void { if (this.offset + this.pageSize < this.seriesFiltradas.length) this.page++; }
  min(a: number, b: number): number { return Math.min(a, b); }

  labelTipo(t: string): string {
    const found = this.tipos.find(x => x.value === t);
    return found ? found.label.split(' - ')[0] + ' - ' + found.label.split(' - ')[1] : t;
  }

  badgeTipo(t: string): string {
    const colors: Record<string, string> = {
      'I': 'background:rgba(20,184,166,0.1);color:var(--accent)',
      'E': 'background:rgba(239,68,68,0.1);color:var(--danger)',
      'P': 'background:rgba(99,102,241,0.1);color:#6366f1',
      'T': 'background:rgba(245,158,11,0.1);color:var(--warning)',
      'N': 'background:rgba(156,163,175,0.1);color:var(--text-secondary)',
    };
    const style = colors[t] ?? 'background:rgba(100,100,100,0.1);color:var(--text-secondary)';
    return `${style};padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap`;
  }

  badgeEstatus(activa: boolean): string {
    return activa
      ? 'background:rgba(20,184,166,0.1);color:var(--accent);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700'
      : 'background:rgba(100,100,100,0.1);color:var(--text-muted);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700';
  }

  toggleDefault(s: SerieConfig): void {
    if (s.porDefecto) return; // Ya es default, no hacer nada
    this.confirm(`¿Marcar "${s.codigo}" como serie por defecto para tipo "${s.tipoComprobante}"?`, () => {
      this.serieSvc.actualizar(s.id, {
        nombre: s.nombre, descripcion: s.descripcion ?? undefined,
        tipoComprobante: s.tipoComprobante, prefijo: s.prefijo ?? undefined,
        sufijo: s.sufijo ?? undefined, digitos: s.digitos, porDefecto: true
      }).subscribe(() => this.cargar());
    });
  }

  archivar(s: SerieConfig): void {
    this.confirm(`¿Archivar la serie "${s.codigo} — ${s.nombre}"? Ya no estará disponible al emitir CFDIs.`, () => {
      this.serieSvc.archivar(s.id).subscribe(() => this.cargar());
    });
  }

  resetFolio(s: SerieConfig): void {
    this.confirm(`¿Resetear el folio de "${s.codigo}" al inicial (${s.folioInicial})? Esta acción no se puede deshacer.`, () => {
      this.serieSvc.resetFolio(s.id).subscribe(() => this.cargar());
    });
  }

  confirm(msg: string, action: () => void): void {
    this.confirmMsg    = msg;
    this.confirmAction = action;
  }
  doConfirm(): void {
    this.confirmAction?.();
    this.confirmMsg = null; this.confirmAction = null;
  }
  cancelConfirm(): void {
    this.confirmMsg = null; this.confirmAction = null;
  }

  hoverRow(event: MouseEvent, hover: boolean): void {
    const el = event.currentTarget as HTMLElement;
    el.style.background = hover ? 'var(--bg-card2)' : 'transparent';
  }
}