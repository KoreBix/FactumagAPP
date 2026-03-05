import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteListDto } from '../../core/models/cliente/ClienteListDto';
import { ClienteService } from '../../core/services/cliente/ClienteService';

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Clientes</h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Catálogo de receptores para tus CFDIs</p>
        </div>
        <a routerLink="/clientes/new" class="btn-mag btn-primary">
          <span class="material-icons-round" style="font-size:18px">person_add</span> Nuevo Cliente
        </a>
      </div>

      <!-- Filtros -->
      <div class="card-mag animate-in delay-1" style="margin-bottom:16px">
        <div class="card-body-mag" style="padding:14px 20px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
          <div style="flex:1;min-width:220px;position:relative">
            <span class="material-icons-round" style="position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted)">search</span>
            <input [(ngModel)]="busqueda" (input)="filtrar()"
                   placeholder="Buscar por RFC, razón social, email..."
                   style="width:100%;box-sizing:border-box;padding:9px 14px 9px 38px;background:var(--bg-card2);border:1.5px solid var(--border-light);border-radius:var(--radius-sm);color:var(--text-primary);font-size:13px;outline:none">
          </div>
          <select [(ngModel)]="filtroEstado" (change)="filtrar()" class="form-control-mag" style="width:190px;padding:9px 14px">
            <option value="todos">Todos los estatus</option>
            <option value="activos">Activos</option>
            <option value="inactivos">Inactivos</option>
          </select>
        </div>
      </div>

      <!-- Tabla -->
      <div class="card-mag animate-in delay-2">
        <div *ngIf="loading" style="padding:56px;text-align:center">
          <span class="material-icons-round" style="font-size:36px;color:var(--text-muted);animation:spin 1s linear infinite">refresh</span>
        </div>
        <div *ngIf="!loading && clientesFiltrados.length===0" style="padding:64px;text-align:center;color:var(--text-muted)">
          <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:14px;opacity:.3">people</span>
          <p style="font-size:15px;font-weight:700">Sin clientes registrados</p>
          <p style="font-size:13px;margin-top:4px;opacity:.7">Agrega tu primer cliente para empezar a facturar</p>
          <a routerLink="/clientes/new" class="btn-mag btn-primary" style="margin-top:20px;display:inline-flex;gap:6px">
            <span class="material-icons-round" style="font-size:16px">add</span> Nuevo Cliente
          </a>
        </div>
        <table *ngIf="!loading && clientesFiltrados.length>0" style="width:100%;border-collapse:collapse">
          <thead>
            <tr style="border-bottom:2px solid var(--border-light)">
              <th class="th-col">RFC</th>
              <th class="th-col">Razón Social</th>
              <th class="th-col">Régimen</th>
              <th class="th-col">Contacto</th>
              <th class="th-col">C.P.</th>
              <th class="th-col">Estatus</th>
              <th class="th-col" style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let c of paginados"
                style="border-bottom:1px solid var(--border-light);transition:background .15s"
                [style.opacity]="c.activo ? '1' : '0.5'"
                (mouseenter)="hoverRow($event,true)" (mouseleave)="hoverRow($event,false)">
              <td style="padding:13px 20px">
                <span style="font-family:var(--font-display);font-size:13px;font-weight:800;color:var(--accent)">{{ c.rfc }}</span>
                <span *ngIf="c.predeterminado" class="material-icons-round" title="Predeterminado"
                      style="font-size:13px;color:#f59e0b;margin-left:4px;vertical-align:middle">star</span>
              </td>
              <td style="padding:13px 20px">
                <div style="font-weight:600;font-size:13px">{{ c.nombre }}</div>
                <div *ngIf="c.personaContacto" style="font-size:11px;color:var(--text-muted)">{{ c.personaContacto }}</div>
              </td>
              <td style="padding:13px 20px;font-size:12px;color:var(--text-secondary)">{{ labelRegimen(c.regimenFiscal) }}</td>
              <td style="padding:13px 20px">
                <div *ngIf="primerEmail(c.emails)" style="font-size:12px">{{ primerEmail(c.emails) }}</div>
                <div *ngIf="c.telefono" style="font-size:11px;color:var(--text-muted)">{{ c.telefono }}</div>
                <span *ngIf="!primerEmail(c.emails) && !c.telefono" style="color:var(--text-muted);font-size:12px">—</span>
              </td>
              <td style="padding:13px 20px;font-weight:700;font-size:13px">{{ c.codigoPostal }}</td>
              <td style="padding:13px 20px">
                <span [style]="c.activo ? badgeOn : badgeOff">{{ c.activo ? 'Activo' : 'Inactivo' }}</span>
              </td>
              <td style="padding:13px 20px;text-align:right">
                <div style="display:flex;gap:4px;justify-content:flex-end">
                  <a [routerLink]="['/clientes', c.id]" class="btn-mag btn-ghost btn-sm" title="Ver / Editar" style="padding:6px 8px">
                    <span class="material-icons-round" style="font-size:16px">visibility</span>
                  </a>
                  <a [routerLink]="['/clientes', c.id]" class="btn-mag btn-ghost btn-sm" title="Editar" style="padding:6px 8px">
                    <span class="material-icons-round" style="font-size:16px">edit</span>
                  </a>
                  <button type="button" class="btn-mag btn-ghost btn-sm" title="Eliminar"
                          (click)="confirmarEliminar(c)" style="padding:6px 8px">
                    <span class="material-icons-round" style="font-size:16px;color:var(--danger)">delete_outline</span>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div *ngIf="clientesFiltrados.length>pageSize"
             style="padding:12px 20px;border-top:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:12px;color:var(--text-muted)">Mostrando {{ offset+1 }} - {{ min(offset+pageSize, clientesFiltrados.length) }} de {{ clientesFiltrados.length }}</span>
          <div style="display:flex;gap:8px">
            <button class="btn-mag btn-ghost btn-sm" [disabled]="page===0" (click)="page=page-1">Anterior</button>
            <button class="btn-mag btn-ghost btn-sm" [disabled]="offset+pageSize>=clientesFiltrados.length" (click)="page=page+1">Siguiente</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Eliminar -->
    <div *ngIf="clienteAEliminar"
         style="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1000;display:flex;align-items:center;justify-content:center">
      <div class="card-mag" style="width:400px"><div class="card-body-mag" style="padding:28px">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
          <span class="material-icons-round" style="color:var(--danger);font-size:28px">delete_forever</span>
          <span style="font-weight:800;font-size:16px">Eliminar cliente</span>
        </div>
        <p style="font-size:13px;color:var(--text-muted);margin-bottom:22px">
          ¿Eliminar a <strong style="color:var(--text-primary)">{{ clienteAEliminar.nombre }}</strong>
          (<span style="color:var(--accent)">{{ clienteAEliminar.rfc }}</span>)? Esta acción no se puede deshacer.
        </p>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn-mag btn-ghost btn-sm" (click)="clienteAEliminar=null">Cancelar</button>
          <button style="background:var(--danger);color:#fff;border:none;padding:8px 20px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:13px"
                  (click)="eliminar()">Eliminar</button>
        </div>
      </div></div>
    </div>

    <style>
      .th-col{padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase}
      @keyframes spin{to{transform:rotate(360deg)}}
    </style>
  `
})
export class ClientesComponent implements OnInit {
  clientes: ClienteListDto[] = [];
  clientesFiltrados: ClienteListDto[] = [];
  loading = false;
  busqueda = ''; filtroEstado = 'todos';
  page = 0; pageSize = 10;
  clienteAEliminar: ClienteListDto | null = null;

  badgeOn  = 'background:rgba(20,184,166,.12);color:var(--accent);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700';
  badgeOff = 'background:rgba(100,100,100,.12);color:var(--text-muted);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700';

  regimenes = [
    {value:'601',label:'601 - General de Ley PM'},{value:'603',label:'603 - PM Sin Fines Lucrativos'},
    {value:'605',label:'605 - Sueldos y Salarios'},{value:'612',label:'612 - PF Act. Empresariales'},
    {value:'616',label:'616 - Sin obligaciones fiscales'},{value:'626',label:'626 - RESICO'},
  ];

  constructor(private clienteSvc: ClienteService) {}
  ngOnInit() { this.cargar(); }

  cargar() {
    this.loading = true;
    this.clienteSvc.listar().subscribe({
      next: cs => { this.clientes = cs; this.filtrar(); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  filtrar() {
    const q = this.busqueda.toLowerCase();
    this.clientesFiltrados = this.clientes.filter(c => {
      const mQ = !q || c.rfc.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q) || (c.emails?.toLowerCase().includes(q) ?? false);
      const mE = this.filtroEstado === 'todos' ? true : this.filtroEstado === 'activos' ? c.activo : !c.activo;
      return mQ && mE;
    });
    this.page = 0;
  }

  get offset()    { return this.page * this.pageSize; }
  get paginados() { return this.clientesFiltrados.slice(this.offset, this.offset + this.pageSize); }
  min(a: number, b: number) { return Math.min(a, b); }
  primerEmail(e: string | null) { return e?.split(',')[0]?.trim() ?? null; }
  labelRegimen(v: string) { return this.regimenes.find(r => r.value === v)?.label ?? v; }
  hoverRow(e: MouseEvent, h: boolean) { (e.currentTarget as HTMLElement).style.background = h ? 'var(--bg-card2)' : ''; }
  confirmarEliminar(c: ClienteListDto) { this.clienteAEliminar = c; }
  eliminar() {
    if (!this.clienteAEliminar) return;
    this.clienteSvc.eliminar(this.clienteAEliminar.id).subscribe(() => { this.clienteAEliminar = null; this.cargar(); });
  }
}