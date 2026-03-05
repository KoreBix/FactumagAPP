import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CfdiList } from '../../core/models/CFDI/CfdiList';
import { RfcList } from '../../core/models/RFC/RfcList';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { RfcService } from '../../core/services/RFC/RfcService';

@Component({
  selector: 'app-cfdis',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in">

      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Mis CFDIs</h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">{{ total }} comprobantes encontrados</p>
        </div>
        <a routerLink="/cfdis/new" class="btn-mag btn-primary">
          <span class="material-icons-round" style="font-size:18px">add</span>
          Emitir CFDI
        </a>
      </div>

      <!-- Filtros -->
      <div class="card-mag animate-in delay-1" style="margin-bottom:20px">
        <div class="card-body-mag" style="padding:16px 20px">
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end">

            <div style="flex:1;min-width:160px">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px">RFC</div>
              <select [(ngModel)]="filters.rfcId" class="form-control-mag" style="padding:9px 12px" (change)="load()">
                <option [ngValue]="undefined">Todos</option>
                <option *ngFor="let r of rfcs" [ngValue]="r.id">{{ r.rfc }}</option>
              </select>
            </div>

            <div style="flex:1;min-width:130px">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px">Estado</div>
              <select [(ngModel)]="filters.estado" class="form-control-mag" style="padding:9px 12px" (change)="load()">
                <option value="">Todos</option>
                <option value="Timbrado">Timbrado</option>
                <option value="Borrador">Borrador</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Error">Error</option>
              </select>
            </div>

            <div style="flex:1;min-width:100px">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px">Tipo</div>
              <select [(ngModel)]="filters.tipo" class="form-control-mag" style="padding:9px 12px" (change)="load()">
                <option value="">Todos</option>
                <option value="I">Ingreso</option>
                <option value="E">Egreso</option>
                <option value="T">Traslado</option>
                <option value="N">Nómina</option>
                <option value="P">Pago</option>
              </select>
            </div>

            <div style="flex:1;min-width:140px">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px">Desde</div>
              <input type="date" [(ngModel)]="filters.desde" class="form-control-mag" style="padding:9px 12px" (change)="load()">
            </div>

            <div style="flex:1;min-width:140px">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);margin-bottom:5px">Hasta</div>
              <input type="date" [(ngModel)]="filters.hasta" class="form-control-mag" style="padding:9px 12px" (change)="load()">
            </div>

            <button class="btn-mag btn-ghost btn-sm" (click)="resetFilters()" style="white-space:nowrap;flex-shrink:0">
              <span class="material-icons-round" style="font-size:16px">refresh</span>
              Limpiar
            </button>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-mag animate-in delay-2">

        <!-- Skeleton -->
        <div *ngIf="loading" style="padding:24px">
          <div *ngFor="let i of [1,2,3,4,5,6]" style="display:flex;gap:16px;padding:12px 0;border-bottom:1px solid var(--border-light)">
            <div class="skeleton" style="width:34px;height:34px;border-radius:8px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:13px;width:55%;margin-bottom:6px;border-radius:4px"></div>
              <div class="skeleton" style="height:11px;width:35%;border-radius:4px"></div>
            </div>
            <div class="skeleton" style="height:22px;width:80px;border-radius:20px"></div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!loading && cfdis.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons-round">receipt_long</span>
          </div>
          <div class="empty-title">Sin CFDIs</div>
          <div class="empty-desc">No se encontraron comprobantes con los filtros seleccionados.</div>
          <a routerLink="/cfdis/new" class="btn-mag btn-primary btn-sm">
            <span class="material-icons-round" style="font-size:16px">add</span>
            Emitir primer CFDI
          </a>
        </div>

        <!-- Tabla de datos -->
        <div *ngIf="!loading && cfdis.length > 0" style="overflow-x:auto">
          <table class="table-mag">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>UUID / Folio</th>
                <th>Receptor</th>
                <th style="text-align:right">Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th style="text-align:center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of cfdis">
                <td>
                  <span style="display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:8px;font-family:var(--font-display);font-weight:800;font-size:13px"
                        [style.background]="tipoColor(c.tipoComprobante).bg"
                        [style.color]="tipoColor(c.tipoComprobante).text">
                    {{ c.tipoComprobante }}
                  </span>
                </td>
                <td>
                  <div style="font-family:monospace;font-size:11px;color:var(--text-secondary)">
                    {{ c.uuid ? (c.uuid | slice:0:18)+'...' : 'Sin UUID' }}
                  </div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ c.folio ? 'Folio: '+c.folio : '' }}</div>
                </td>
                <td>
                  <div style="font-size:13px;font-weight:600">{{ c.receptorNombre | slice:0:25 }}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ c.receptorRfc }}</div>
                </td>
                <td style="text-align:right">
                  <span style="font-family:var(--font-display);font-weight:700;font-size:14px">
                    {{ c.total | currency:'MXN':'symbol-narrow':'1.2-2' }}
                  </span>
                </td>
                <td>
                  <span class="badge-mag" [class]="c.estado.toLowerCase()">
                    <span class="material-icons-round" style="font-size:12px">{{ estadoIcon(c.estado) }}</span>
                    {{ c.estado }}
                  </span>
                </td>
                <td style="font-size:12px;color:var(--text-muted)">
                  {{ c.fechaTimbrado ? (c.fechaTimbrado | date:'dd/MM/yy') : '—' }}
                </td>
                <td>
                  <div style="display:flex;gap:4px;justify-content:center">
                    <button class="topbar-btn" title="Descargar XML" (click)="descargar(c,'xml')" *ngIf="c.estado==='Timbrado'">
                      <span class="material-icons-round" style="font-size:17px">code</span>
                    </button>
                    <button class="topbar-btn" title="Descargar PDF" (click)="descargar(c,'pdf')" *ngIf="c.estado==='Timbrado'">
                      <span class="material-icons-round" style="font-size:17px">picture_as_pdf</span>
                    </button>
                    <button class="topbar-btn" title="Cancelar" (click)="cancelar(c)"
                            *ngIf="c.estado==='Timbrado'"
                            style="color:var(--danger)">
                      <span class="material-icons-round" style="font-size:17px">cancel</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Paginación -->
          <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-top:1px solid var(--border-light)">
            <span style="font-size:13px;color:var(--text-muted)">
              Mostrando {{ (page-1)*pageSize+1 }}–{{ Math.min(page*pageSize,total) }} de {{ total }}
            </span>
            <div style="display:flex;gap:6px">
              <button class="btn-mag btn-ghost btn-sm" [disabled]="page===1" (click)="changePage(page-1)">
                <span class="material-icons-round" style="font-size:16px">chevron_left</span>
              </button>
              <span style="padding:6px 14px;background:var(--accent-light);color:var(--accent);border-radius:var(--radius-sm);font-weight:700;font-size:13px">
                {{ page }}
              </span>
              <button class="btn-mag btn-ghost btn-sm" [disabled]="page*pageSize>=total" (click)="changePage(page+1)">
                <span class="material-icons-round" style="font-size:16px">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CfdisComponent implements OnInit {
  cfdis:    CfdiList[] = [];
  rfcs:     RfcList[]  = [];
  loading   = true;
  total     = 0;
  page      = 1;
  pageSize  = 20;
  Math      = Math;

  filters: { rfcId?: number; estado: string; tipo: string; desde: string; hasta: string } = {
    estado: '', tipo: '', desde: '', hasta: ''
  };

  constructor(
    private cfdiSvc: CfdiService,
    private rfcSvc:  RfcService,
    private route:   ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => this.rfcs = rs);
    const estado = this.route.snapshot.queryParams['estado'];
    if (estado) this.filters.estado = estado;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cfdiSvc.listar({
      ...this.filters,
      page: this.page, pageSize: this.pageSize
    }).subscribe(r => {
      this.cfdis   = r.data;
      this.total   = r.total;
      this.loading = false;
    });
  }

  resetFilters(): void {
    this.filters = { estado: '', tipo: '', desde: '', hasta: '' };
    this.page = 1;
    this.load();
  }

  changePage(p: number): void { this.page = p; this.load(); }

  descargar(c: CfdiList, tipo: 'xml' | 'pdf'): void {
    const req$ = tipo === 'xml' ? this.cfdiSvc.descargarXml(c.id) : this.cfdiSvc.descargarPdf(c.id);
    req$.subscribe(blob => this.cfdiSvc.descargarArchivo(blob, `${c.uuid}.${tipo}`));
  }

  cancelar(c: CfdiList): void {
    if (!confirm(`¿Cancelar CFDI ${c.uuid}?\n\nMotivo: 02 (Error sin relación)`)) return;
    this.cfdiSvc.cancelar(c.id, '02').subscribe(() => this.load());
  }

  tipoColor(tipo: string): { bg: string; text: string } {
    const map: Record<string, {bg:string;text:string}> = {
      'I': { bg: 'rgba(0,212,170,0.1)',   text: 'var(--accent)'   },
      'E': { bg: 'rgba(239,68,68,0.1)',   text: 'var(--danger)'   },
      'T': { bg: 'rgba(59,130,246,0.1)',  text: 'var(--info)'     },
      'N': { bg: 'rgba(139,92,246,0.1)',  text: '#8b5cf6'         },
      'P': { bg: 'rgba(245,158,11,0.1)',  text: 'var(--warning)'  },
    };
    return map[tipo] ?? { bg: 'var(--bg-card2)', text: 'var(--text-muted)' };
  }

  estadoIcon(estado: string): string {
    return { Timbrado: 'check_circle', Borrador: 'edit', Cancelado: 'cancel', Error: 'error_outline' }[estado] ?? 'help';
  }
}