import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RfcList } from '../../core/models/RFC/RfcList';
import { ConceptoCatalogoService } from '../../core/services/conceptoc.atalogo/ConceptoCatalogoService';
import { RfcService } from '../../core/services/RFC/RfcService';
import { ClienteService } from '../../core/services/cliente/ClienteService';
import { ConceptoCatalogoFullDto } from '../../core/models/concepto/ConceptoCatalogoFullDto';
import { ClienteListDto } from '../../core/models/cliente/ClienteListDto';

@Component({
  selector: 'app-conceptos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in">

      <!-- Header + Stats -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Conceptos</h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Catálogo de productos y servicios frecuentes</p>
        </div>
        <a routerLink="/conceptos/new" class="btn-mag btn-primary">
          <span class="material-icons-round" style="font-size:18px">add</span> Nuevo Concepto
        </a>
      </div>

      <!-- Stats -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:20px" class="animate-in delay-1">
        <div class="card-mag" style="cursor:default">
          <div class="card-body-mag" style="display:flex;align-items:center;gap:14px;padding:16px 20px">
            <div style="width:42px;height:42px;border-radius:10px;background:rgba(99,102,241,.12);display:flex;align-items:center;justify-content:center">
              <span class="material-icons-round" style="color:#6366f1;font-size:20px">inventory_2</span>
            </div>
            <div><div style="font-family:var(--font-display);font-size:24px;font-weight:800">{{ conceptos.length }}</div>
                 <div style="font-size:12px;color:var(--text-muted)">Total</div></div>
          </div>
        </div>
        <div class="card-mag" style="cursor:default">
          <div class="card-body-mag" style="display:flex;align-items:center;gap:14px;padding:16px 20px">
            <div style="width:42px;height:42px;border-radius:10px;background:rgba(59,99,217,.1);display:flex;align-items:center;justify-content:center">
              <span class="material-icons-round" style="color:var(--accent);font-size:20px">check_circle</span>
            </div>
            <div><div style="font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--accent)">{{ activos }}</div>
                 <div style="font-size:12px;color:var(--text-muted)">Activos</div></div>
          </div>
        </div>
        <div class="card-mag" style="cursor:default">
          <div class="card-body-mag" style="display:flex;align-items:center;gap:14px;padding:16px 20px">
            <div style="width:42px;height:42px;border-radius:10px;background:rgba(245,158,11,.1);display:flex;align-items:center;justify-content:center">
              <span class="material-icons-round" style="color:var(--warning);font-size:20px">archive</span>
            </div>
            <div><div style="font-family:var(--font-display);font-size:24px;font-weight:800;color:var(--warning)">{{ archivados }}</div>
                 <div style="font-size:12px;color:var(--text-muted)">Archivados</div></div>
          </div>
        </div>
      </div>

      <!-- Filtros -->
      <div class="card-mag animate-in delay-2" style="margin-bottom:16px">
        <div class="card-body-mag" style="padding:14px 20px;display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <div class="lf-search-wrap" style="flex:1;min-width:180px">
            <span class="material-icons-round lf-search-ico">search</span>
            <input class="lf-ctrl lf-search" [(ngModel)]="busqueda" (input)="filtrar()" placeholder="Buscar...">
          </div>
          <div class="lf-sel-wrap" style="width:200px">
            <select class="lf-ctrl" [(ngModel)]="filtroRfc" (change)="filtrar()">
              <option value="">Todos los emisores</option>
              <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }}</option>
            </select>
            <span class="material-icons-round lf-ico">expand_more</span>
          </div>
          <div class="lf-sel-wrap" style="width:220px">
            <select class="lf-ctrl" [(ngModel)]="filtroCliente" (change)="filtrar()">
              <option value="">Todos los clientes</option>
              <option *ngFor="let c of clientes" [value]="c.id">{{ c.rfc }} — {{ c.nombre | slice:0:25 }}</option>
            </select>
            <span class="material-icons-round lf-ico">expand_more</span>
          </div>
          <div class="lf-sel-wrap" style="width:130px">
            <select class="lf-ctrl" [(ngModel)]="filtroEstado" (change)="filtrar()">
              <option value="activos">Activos</option>
              <option value="archivados">Archivados</option>
              <option value="todos">Todos</option>
            </select>
            <span class="material-icons-round lf-ico">expand_more</span>
          </div>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-mag animate-in delay-3">
        <div *ngIf="loading" style="padding:56px;text-align:center">
          <span class="material-icons-round" style="font-size:36px;color:var(--text-muted);animation:spin 1s linear infinite">refresh</span>
        </div>
        <div *ngIf="!loading && conceptosFiltrados.length===0" style="padding:64px;text-align:center;color:var(--text-muted)">
          <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:14px;opacity:.3">inventory_2</span>
          <p style="font-size:15px;font-weight:700">Sin conceptos</p>
          <p style="font-size:13px;margin-top:4px;opacity:.7">Crea conceptos frecuentes para agilizar tus facturas</p>
          <a routerLink="/conceptos/new" class="btn-mag btn-primary" style="margin-top:20px;display:inline-flex;gap:6px">
            <span class="material-icons-round" style="font-size:16px">add</span> Nuevo Concepto
          </a>
        </div>

        <table *ngIf="!loading && conceptosFiltrados.length>0" style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:2px solid var(--border-light)">
              <th class="th-col">Emisor</th>
              <th class="th-col">Cliente</th>
              <th class="th-col">Clave SAT</th>
              <th class="th-col">Descripción</th>
              <th class="th-col">Unidad</th>
              <th class="th-col" style="text-align:right">Cant.</th>
              <th class="th-col" style="text-align:right">P. Unitario</th>
              <th class="th-col" style="text-align:right">Importe</th>
              <th class="th-col" style="text-align:center">Obj. Imp.</th>
              <th class="th-col">Estatus</th>
              <th class="th-col" style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of paginados"
                style="border-bottom:1px solid var(--border-light);transition:background .15s"
                [style.opacity]="c.activo ? '1' : '0.5'"
                (mouseenter)="hoverRow($event,true)" (mouseleave)="hoverRow($event,false)">
              <td style="padding:11px 20px;font-size:12px;color:var(--text-muted)">{{ rfcLabel(c.rfcId) }}</td>
              <td style="padding:11px 20px;font-size:12px;color:var(--text-muted)">{{ clienteLabel(c.clienteId) }}</td>
              <td style="padding:11px 20px">
                <span style="font-family:var(--font-display);font-size:12px;font-weight:700;color:var(--accent)">{{ c.claveProdServ }}</span>
              </td>
              <td style="padding:11px 20px;max-width:220px">
                <div style="font-weight:600;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" [title]="c.descripcion">
                  {{ c.descripcion | slice:0:30 }}{{ c.descripcion.length > 30 ? '...' : '' }}
                </div>
              </td>
              <td style="padding:11px 20px;font-size:12px">{{ c.claveUnidad }} - {{ c.unidad | slice:0:12 }}</td>
              <td style="padding:11px 20px;text-align:right;font-size:13px;font-weight:700">{{ c.cantidad }}</td>
              <td style="padding:11px 20px;text-align:right;font-weight:700;font-size:13px">{{ c.precioUnitario | currency }}</td>
              <td style="padding:11px 20px;text-align:right;font-weight:700;font-size:13px">{{ c.importe | currency }}</td>
              <td style="padding:11px 20px;text-align:center">
                <span style="background:rgba(99,102,241,.12);color:#6366f1;padding:3px 8px;border-radius:6px;font-size:11px;font-weight:800">{{ c.objetoImpuesto }}</span>
              </td>
              <td style="padding:11px 20px">
                <span [style]="c.activo ? badgeOn : badgeOff">{{ c.activo ? 'Activo' : 'Archivado' }}</span>
              </td>
              <td style="padding:11px 20px;text-align:right">
                <div style="display:flex;gap:3px;justify-content:flex-end">
                  <a [routerLink]="['/conceptos', c.id]" class="btn-mag btn-ghost btn-sm" title="Editar" style="padding:5px 7px">
                    <span class="material-icons-round" style="font-size:15px">edit</span>
                  </a>
                  <button type="button" class="btn-mag btn-ghost btn-sm" title="Archivar"
                          *ngIf="c.activo" (click)="archivar(c)" style="padding:5px 7px">
                    <span class="material-icons-round" style="font-size:15px">archive</span>
                  </button>
                  <button type="button" class="btn-mag btn-ghost btn-sm" title="Eliminar"
                          (click)="confirmarEliminar(c)" style="padding:5px 7px">
                    <span class="material-icons-round" style="font-size:15px;color:var(--danger)">delete_outline</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="conceptosFiltrados.length>pageSize"
             style="padding:12px 20px;border-top:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:12px;color:var(--text-muted)">Mostrando {{ offset+1 }} - {{ min(offset+pageSize, conceptosFiltrados.length) }} de {{ conceptosFiltrados.length }}</span>
          <div style="display:flex;gap:8px">
            <button class="btn-mag btn-ghost btn-sm" [disabled]="page===0" (click)="page=page-1">Anterior</button>
            <button class="btn-mag btn-ghost btn-sm" [disabled]="offset+pageSize>=conceptosFiltrados.length" (click)="page=page+1">Siguiente</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Eliminar -->
    <div *ngIf="conceptoAEliminar"
         style="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1000;display:flex;align-items:center;justify-content:center">
      <div class="card-mag" style="width:400px"><div class="card-body-mag" style="padding:28px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <span class="material-icons-round" style="color:var(--danger);font-size:28px">delete_forever</span>
          <span style="font-weight:800;font-size:16px">Eliminar concepto</span>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:22px">
          ¿Eliminar <strong style="color:var(--text-primary)">{{ conceptoAEliminar.descripcion | slice:0:40 }}</strong>? Esta acción no se puede deshacer.
        </p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-mag btn-ghost btn-sm" (click)="conceptoAEliminar=null">Cancelar</button>
          <button style="background:var(--danger);color:#fff;border:none;padding:8px 20px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:13px"
                  (click)="eliminar()">Eliminar</button>
        </div>
      </div></div>
    </div>

    <style>
      .th-col{padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase}
      @keyframes spin{to{transform:rotate(360deg)}}
      .lf-ctrl { height:38px; padding:0 12px; background:var(--bg-card2); border:1.5px solid var(--border); border-radius:6px; color:var(--text-primary); font-size:13px; outline:none; box-sizing:border-box; -webkit-appearance:none; appearance:none; transition:border-color .15s,box-shadow .15s; width:100%; }
      .lf-ctrl:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
      .lf-sel-wrap { position:relative; display:inline-flex; align-items:center; }
      .lf-sel-wrap .lf-ctrl { padding-right:32px; }
      .lf-ico { position:absolute; right:8px; top:50%; transform:translateY(-50%); font-size:18px; color:var(--text-muted); pointer-events:none; }
      .lf-search-wrap { position:relative; display:flex; align-items:center; }
      .lf-search-ico { position:absolute; left:10px; top:50%; transform:translateY(-50%); font-size:17px; color:var(--text-muted); pointer-events:none; }
      .lf-search { padding-left:34px !important; }
    </style>
  `
})
export class ConceptosComponent implements OnInit {
  conceptos: ConceptoCatalogoFullDto[] = [];
  conceptosFiltrados: ConceptoCatalogoFullDto[] = [];
  rfcs:     RfcList[] = [];
  clientes: ClienteListDto[] = [];
  loading = false;
  busqueda = ''; filtroRfc = ''; filtroCliente = ''; filtroEstado = 'activos';
  page = 0; pageSize = 10;
  conceptoAEliminar: ConceptoCatalogoFullDto | null = null;

  badgeOn  = 'background:rgba(59,99,217,.12);color:var(--accent);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700';
  badgeOff = 'background:rgba(100,100,100,.12);color:var(--text-muted);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700';

  constructor(
    private conceptoSvc: ConceptoCatalogoService,
    private rfcSvc: RfcService,
    private clienteSvc: ClienteService
  ) {}

  ngOnInit() {
    this.rfcSvc.listar().subscribe(rs => this.rfcs = rs);
    this.clienteSvc.listar().subscribe(cs => this.clientes = cs);
    this.cargar();
  }

  cargar() {
    this.loading = true;
    this.conceptoSvc.listar().subscribe({
      next: cs => { this.conceptos = cs; this.filtrar(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  filtrar() {
    const q = this.busqueda.toLowerCase();
    this.conceptosFiltrados = this.conceptos.filter(c => {
      const mQ  = !q || c.descripcion.toLowerCase().includes(q) || c.claveProdServ.includes(q);
      const mR  = !this.filtroRfc    || c.rfcId      === +this.filtroRfc;
      const mC  = !this.filtroCliente|| c.clienteId  === +this.filtroCliente;
      const mE  = this.filtroEstado === 'todos' ? true : this.filtroEstado === 'activos' ? c.activo : !c.activo;
      return mQ && mR && mC && mE;
    });
    this.page = 0;
  }

  get activos()    { return this.conceptos.filter(c => c.activo).length; }
  get archivados() { return this.conceptos.filter(c => !c.activo).length; }
  get offset()     { return this.page * this.pageSize; }
  get paginados()  { return this.conceptosFiltrados.slice(this.offset, this.offset + this.pageSize); }
  min(a: number, b: number) { return Math.min(a, b); }
  rfcLabel(id: number | null)     { return id ? (this.rfcs.find(r => r.id === id)?.rfc ?? '—') : '—'; }
  clienteLabel(id: number | null) { return id ? (this.clientes.find(c => c.id === id)?.rfc ?? '—') : '—'; }
  hoverRow(e: MouseEvent, h: boolean) { (e.currentTarget as HTMLElement).style.background = h ? 'var(--bg-card2)' : ''; }

  archivar(c: ConceptoCatalogoFullDto) {
    this.conceptoSvc.archivar(c.id).subscribe(() => this.cargar());
  }
  confirmarEliminar(c: ConceptoCatalogoFullDto) { this.conceptoAEliminar = c; }
  eliminar() {
    if (!this.conceptoAEliminar) return;
    this.conceptoSvc.eliminar(this.conceptoAEliminar.id).subscribe(() => { this.conceptoAEliminar = null; this.cargar(); });
  }
}