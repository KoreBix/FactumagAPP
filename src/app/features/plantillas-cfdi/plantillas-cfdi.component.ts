import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PlantillaCfdi } from '../../core/models/plantilla/PlantillaCfdi';
import { PlantillaCfdiService } from '../../core/services/plantilla/PlantillaCfdiService';

@Component({
  selector: 'app-plantillas-cfdi',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="list-wrap animate-in">

      <!-- ── Page header ── -->
      <div class="list-ph">
        <div>
          <h1>Facturas Frecuentes</h1>
          <p>{{ filtradas.length }} plantilla{{ filtradas.length !== 1 ? 's' : '' }} guardada{{ filtradas.length !== 1 ? 's' : '' }}</p>
        </div>
      </div>

      <!-- ── Filtros ── -->
      <div class="list-card animate-in delay-1" style="margin-bottom:20px">
        <div class="list-filters">

          <div class="lf-group lf-search">
            <label class="lf-lbl">Buscar</label>
            <div style="position:relative">
              <span class="material-icons-round"
                    style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:17px;color:var(--text-muted);pointer-events:none">search</span>
              <input class="lf-ctrl" style="padding-left:34px"
                     [(ngModel)]="filtroTexto" (ngModelChange)="aplicarFiltros()"
                     placeholder="Nombre o descripción...">
            </div>
          </div>

          <button class="btn-mag btn-ghost btn-sm lf-reset"
                  (click)="filtroTexto=''; aplicarFiltros()">
            <span class="material-icons-round" style="font-size:16px">refresh</span>
            Limpiar
          </button>

        </div>
      </div>

      <!-- ── Tabla ── -->
      <div class="list-card animate-in delay-2">

        <!-- Skeleton -->
        <div *ngIf="cargando" style="padding:4px 0">
          <div *ngFor="let i of [1,2,3]" class="skeleton-row">
            <div class="skeleton" style="width:140px;height:24px;border-radius:20px;flex-shrink:0"></div>
            <div class="skeleton" style="flex:1;height:16px;border-radius:6px"></div>
            <div class="skeleton" style="width:70px;height:22px;border-radius:20px"></div>
            <div class="skeleton" style="width:90px;height:16px;border-radius:6px"></div>
            <div class="skeleton" style="width:130px;height:32px;border-radius:8px"></div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!cargando && filtradas.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons-round">bookmark_border</span>
          </div>
          <div class="empty-title">No hay plantillas</div>
          <div class="empty-desc">
            {{ plantillas.length === 0
              ? 'Desde el formulario de emisión de CFDI puedes guardar cualquier configuración como plantilla.'
              : 'Ninguna plantilla coincide con el filtro.' }}
          </div>
        </div>

        <!-- Tabla de datos -->
        <table *ngIf="!cargando && filtradas.length > 0" class="plnt-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th class="hide-sm">Descripción</th>
              <th>Tipo</th>
              <th class="hide-sm">Actualizada</th>
              <th style="text-align:right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of filtradas; let odd=odd" [class.row-odd]="odd">

              <td>
                <div class="plnt-badge">
                  <span class="material-icons-round" style="font-size:14px">bookmark</span>
                  {{ p.nombre }}
                </div>
              </td>

              <td class="hide-sm">
                <span class="td-muted">{{ p.descripcion || '—' }}</span>
              </td>

              <td>
                <span class="tipo-chip tipo-{{ tipoColor(p) }}">{{ tipoLabel(p) }}</span>
              </td>

              <td class="hide-sm">
                <span class="td-muted">{{ p.updatedAt | date:'dd/MM/yyyy' }}</span>
              </td>

              <td>
                <div class="row-acts">
                  <button class="act-btn act-use" (click)="usar(p)" title="Emitir con esta plantilla">
                    <span class="material-icons-round" style="font-size:14px">flash_on</span>
                    Usar
                  </button>
                  <button class="act-btn act-edit" (click)="editarNombre(p)" title="Editar">
                    <span class="material-icons-round" style="font-size:14px">edit</span>
                  </button>
                  <button class="act-btn act-del" (click)="confirmarEliminar(p)" title="Eliminar">
                    <span class="material-icons-round" style="font-size:14px">delete</span>
                  </button>
                </div>
              </td>

            </tr>
          </tbody>
        </table>

      </div>

      <!-- ════════════════════════════════════════════════
           MODAL EDITAR
      ════════════════════════════════════════════════ -->
      <div *ngIf="modalEditar" class="mod-overlay" (click)="cerrarEditar()">
        <div class="mod-card" (click)="$event.stopPropagation()">

          <div class="mod-hdr">
            <div class="mod-icon-wrap" style="background:rgba(217,119,6,.1)">
              <span class="material-icons-round" style="color:#d97706;font-size:20px">edit</span>
            </div>
            <div style="flex:1;min-width:0">
              <div class="mod-title">Editar plantilla</div>
              <div class="mod-sub">Actualiza el nombre y descripción</div>
            </div>
            <button class="mod-close" (click)="cerrarEditar()">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <div class="mod-body">
            <div class="mod-fg">
              <label class="mod-lbl">Nombre <span style="color:#f87171">*</span></label>
              <input class="mod-input" [(ngModel)]="editNombre" maxlength="100"
                     placeholder="Ej: Factura mensual servicios"
                     (keydown.enter)="guardarEdicion()">
            </div>
            <div class="mod-fg" style="margin-bottom:0">
              <label class="mod-lbl">
                Descripción
                <span style="color:var(--text-muted);font-weight:400;text-transform:none;letter-spacing:0"> — opcional</span>
              </label>
              <input class="mod-input" [(ngModel)]="editDescripcion" maxlength="300"
                     placeholder="Descripción breve para identificarla">
            </div>
          </div>

          <div class="mod-ftr">
            <button class="btn-mag btn-ghost" (click)="cerrarEditar()">Cancelar</button>
            <button class="btn-mag btn-primary"
                    (click)="guardarEdicion()"
                    [disabled]="!editNombre.trim() || guardandoEdicion">
              <span *ngIf="guardandoEdicion" class="material-icons-round spin-ico" style="font-size:16px">refresh</span>
              Guardar cambios
            </button>
          </div>

        </div>
      </div>

      <!-- ════════════════════════════════════════════════
           MODAL ELIMINAR
      ════════════════════════════════════════════════ -->
      <div *ngIf="modalEliminar" class="mod-overlay" style="z-index:1002" (click)="cerrarEliminar()">
        <div class="mod-card mod-sm" (click)="$event.stopPropagation()">

          <div class="mod-hdr">
            <div class="mod-icon-wrap" style="background:rgba(220,38,38,.1)">
              <span class="material-icons-round" style="color:#dc2626;font-size:20px">delete_forever</span>
            </div>
            <div style="flex:1;min-width:0">
              <div class="mod-title">Eliminar plantilla</div>
              <div class="mod-sub">Esta acción no se puede deshacer</div>
            </div>
            <button class="mod-close" (click)="cerrarEliminar()">
              <span class="material-icons-round">close</span>
            </button>
          </div>

          <div class="mod-body">
            <div class="mod-name-box">
              <span class="material-icons-round" style="font-size:16px;color:var(--accent)">bookmark</span>
              {{ plantillaAEliminar?.nombre }}
            </div>
            <p style="font-size:13px;color:var(--text-muted);margin:14px 0 0">
              ¿Confirmas que deseas eliminar esta plantilla? No podrás recuperarla.
            </p>
          </div>

          <div class="mod-ftr">
            <button class="btn-mag btn-ghost" (click)="cerrarEliminar()">Cancelar</button>
            <button class="mod-btn-del" (click)="eliminar()" [disabled]="eliminando">
              <span *ngIf="eliminando" class="material-icons-round spin-ico" style="font-size:16px">refresh</span>
              <span *ngIf="!eliminando" class="material-icons-round" style="font-size:16px">delete</span>
              Eliminar
            </button>
          </div>

        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .list-wrap { padding:28px 24px; max-width:1200px; margin:0 auto; }
    .list-ph   { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:16px; flex-wrap:wrap; }
    .list-ph h1 { font-size:22px; font-weight:800; margin:0 0 4px; color:var(--text-primary); }
    .list-ph p  { font-size:13px; color:var(--text-muted); margin:0; }
    .list-card  { background:var(--bg-card); border:1px solid var(--border-light); border-radius:14px; overflow:hidden; }

    /* ── Filters ── */
    .list-filters { display:flex; align-items:flex-end; gap:12px; padding:16px 20px; flex-wrap:wrap; }
    .lf-group     { display:flex; flex-direction:column; gap:5px; }
    .lf-search    { flex:1; min-width:180px; }
    .lf-lbl       { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
    .lf-ctrl      { padding:8px 12px; border-radius:8px; border:1px solid var(--border-light); background:var(--bg-input,var(--bg-card2)); color:var(--text-primary); font-size:13px; width:100%; box-sizing:border-box; }
    .lf-ctrl:focus { outline:none; border-color:var(--accent); }
    .lf-reset     { align-self:flex-end; }

    /* ── Skeleton ── */
    .skeleton-row { display:flex; align-items:center; gap:16px; padding:14px 20px; border-bottom:1px solid var(--border-light); }
    .skeleton-row:last-child { border-bottom:none; }
    .skeleton { background:var(--border-light); border-radius:4px; animation:skel 1.4s ease-in-out infinite; }
    @keyframes skel { 0%,100%{opacity:.5} 50%{opacity:1} }

    /* ── Empty ── */
    .empty-state { text-align:center; padding:60px 20px; display:flex; flex-direction:column; align-items:center; gap:10px; }
    .empty-icon  { width:56px; height:56px; border-radius:50%; background:var(--bg-card2); display:flex; align-items:center; justify-content:center; }
    .empty-icon .material-icons-round { font-size:28px; color:var(--text-muted); }
    .empty-title { font-size:15px; font-weight:700; color:var(--text-primary); }
    .empty-desc  { font-size:13px; color:var(--text-muted); max-width:380px; line-height:1.6; }

    /* ── Table ── */
    .plnt-table { width:100%; border-collapse:collapse; }
    .plnt-table thead tr { background:var(--bg-card2); border-bottom:2px solid var(--border-light); }
    .plnt-table th { padding:11px 16px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); text-align:left; white-space:nowrap; }
    .plnt-table th:first-child { padding-left:20px; }
    .plnt-table th:last-child  { padding-right:20px; text-align:right; }
    .plnt-table td { padding:13px 16px; font-size:13px; color:var(--text-primary); border-bottom:1px solid var(--border-light); vertical-align:middle; }
    .plnt-table td:first-child { padding-left:20px; }
    .plnt-table td:last-child  { padding-right:20px; }
    .plnt-table tbody tr:last-child td { border-bottom:none; }
    .plnt-table tbody tr:hover { background:var(--bg-card2); }
    .row-odd { background:rgba(0,0,0,.015); }

    .plnt-badge { display:inline-flex; align-items:center; gap:6px; font-weight:700; font-size:13px; color:var(--accent); background:rgba(0,212,170,.09); padding:4px 12px 4px 8px; border-radius:20px; white-space:nowrap; max-width:240px; overflow:hidden; text-overflow:ellipsis; }

    .td-muted { color:var(--text-muted); font-size:13px; }

    /* ── Tipo chip ── */
    .tipo-chip { display:inline-flex; align-items:center; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.04em; white-space:nowrap; }
    .tipo-I { background:rgba(59,130,246,.12);  color:#3b82f6; }
    .tipo-E { background:rgba(234,179,8,.12);   color:#d97706; }
    .tipo-P { background:rgba(0,212,170,.12);   color:var(--accent); }
    .tipo-N { background:rgba(168,85,247,.12);  color:#a855f7; }
    .tipo-T { background:rgba(107,114,128,.12); color:#6b7280; }

    /* ── Row actions ── */
    .row-acts { display:flex; justify-content:flex-end; align-items:center; gap:6px; }
    .act-btn  { display:inline-flex; align-items:center; gap:4px; padding:5px 10px; border-radius:7px; border:1px solid; font-size:12px; font-weight:600; cursor:pointer; background:transparent; transition:background .15s; white-space:nowrap; }
    .act-use  { color:var(--accent)!important; border-color:rgba(0,212,170,.3)!important; }
    .act-use:hover { background:rgba(0,212,170,.08)!important; }
    .act-edit { color:#d97706!important; border-color:rgba(217,119,6,.3)!important; }
    .act-edit:hover { background:rgba(217,119,6,.06)!important; }
    .act-del  { color:#dc2626!important; border-color:rgba(220,38,38,.3)!important; }
    .act-del:hover { background:rgba(220,38,38,.06)!important; }

    /* ── Modals ── */
    .mod-overlay { position:fixed; inset:0; z-index:1001; background:rgba(0,0,0,.55); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:20px; }
    .mod-card    { background:var(--bg-card); border-radius:16px; width:100%; max-width:480px; box-shadow:0 24px 60px rgba(0,0,0,.3); overflow:hidden; }
    .mod-sm      { max-width:420px; }

    .mod-hdr { display:flex; align-items:center; gap:14px; padding:20px; border-bottom:1px solid var(--border-light); }
    .mod-icon-wrap { width:42px; height:42px; border-radius:10px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    .mod-title { font-size:15px; font-weight:700; color:var(--text-primary); }
    .mod-sub   { font-size:12px; color:var(--text-muted); margin-top:2px; }
    .mod-close { width:32px; height:32px; border-radius:8px; border:none; background:transparent; color:var(--text-muted); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background .15s; flex-shrink:0; }
    .mod-close:hover { background:var(--bg-card2); }
    .mod-close .material-icons-round { font-size:18px; }

    .mod-body { padding:20px; }
    .mod-fg   { display:flex; flex-direction:column; gap:6px; margin-bottom:16px; }
    .mod-lbl  { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:.06em; color:var(--text-muted); }
    .mod-input { padding:10px 12px; border-radius:8px; border:1px solid var(--border-light); background:var(--bg-card2); color:var(--text-primary); font-size:14px; width:100%; box-sizing:border-box; transition:border-color .15s; }
    .mod-input:focus { outline:none; border-color:var(--accent); box-shadow:0 0 0 3px rgba(0,212,170,.12); }

    .mod-name-box { display:flex; align-items:center; gap:8px; padding:11px 14px; background:var(--bg-card2); border-radius:8px; border-left:3px solid var(--accent); font-weight:600; font-size:14px; color:var(--text-primary); }

    .mod-ftr { display:flex; justify-content:flex-end; gap:10px; padding:16px 20px; border-top:1px solid var(--border-light); background:var(--bg-card2); }

    .mod-btn-del { display:inline-flex; align-items:center; gap:6px; padding:8px 18px; border-radius:8px; border:none; background:#dc2626; color:#fff; font-size:14px; font-weight:600; cursor:pointer; transition:background .15s; }
    .mod-btn-del:hover:not(:disabled) { background:#b91c1c; }
    .mod-btn-del:disabled { opacity:.6; cursor:default; }

    @keyframes spin { to { transform:rotate(360deg); } }
    .spin-ico { animation:spin 1s linear infinite; }

    .animate-in { animation:fadeUp .3s ease both; }
    .delay-1    { animation-delay:.05s; }
    .delay-2    { animation-delay:.1s; }
    @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

    @media (max-width:768px) {
      .list-wrap { padding:20px 16px; }
      .hide-sm   { display:none; }
      .row-acts  { gap:4px; }
    }
  `]
})
export class PlantillasCfdiComponent implements OnInit {
  plantillas: PlantillaCfdi[] = [];
  filtradas:  PlantillaCfdi[] = [];
  cargando    = true;
  filtroTexto = '';

  modalEditar       = false;
  plantillaEditando: PlantillaCfdi | null = null;
  editNombre        = '';
  editDescripcion   = '';
  guardandoEdicion  = false;

  modalEliminar       = false;
  plantillaAEliminar: PlantillaCfdi | null = null;
  eliminando          = false;

  constructor(private svc: PlantillaCfdiService, private router: Router) {}

  ngOnInit(): void {
    this.svc.listar().subscribe({
      next: ps => { this.plantillas = ps; this.aplicarFiltros(); this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  aplicarFiltros(): void {
    const q = this.filtroTexto.toLowerCase().trim();
    this.filtradas = q
      ? this.plantillas.filter(p =>
          p.nombre.toLowerCase().includes(q) ||
          (p.descripcion?.toLowerCase().includes(q) ?? false))
      : [...this.plantillas];
  }

  tipoLabel(p: PlantillaCfdi): string {
    try {
      const d = JSON.parse(p.datosJson);
      const map: Record<string, string> = { I: 'Ingreso', E: 'Egreso', P: 'Pago', N: 'Nómina', T: 'Traslado' };
      return map[d.tipoCfdi] ?? d.tipoCfdi ?? '—';
    } catch { return '—'; }
  }

  tipoColor(p: PlantillaCfdi): string {
    try { return JSON.parse(p.datosJson).tipoCfdi ?? 'I'; } catch { return 'I'; }
  }

  usar(p: PlantillaCfdi): void {
    this.router.navigate(['/cfdis/new'], { queryParams: { plantillaId: p.id } });
  }

  editarNombre(p: PlantillaCfdi): void {
    this.plantillaEditando = p;
    this.editNombre        = p.nombre;
    this.editDescripcion   = p.descripcion ?? '';
    this.modalEditar       = true;
  }

  cerrarEditar(): void { this.modalEditar = false; this.plantillaEditando = null; }

  guardarEdicion(): void {
    if (!this.plantillaEditando || !this.editNombre.trim() || this.guardandoEdicion) return;
    this.guardandoEdicion = true;
    this.svc.actualizar(this.plantillaEditando.id, {
      nombre:      this.editNombre.trim(),
      descripcion: this.editDescripcion.trim() || undefined,
      datosJson:   this.plantillaEditando.datosJson
    }).subscribe({
      next: updated => {
        const idx = this.plantillas.findIndex(p => p.id === updated.id);
        if (idx >= 0) this.plantillas[idx] = updated;
        this.aplicarFiltros();
        this.guardandoEdicion = false;
        this.cerrarEditar();
      },
      error: () => { this.guardandoEdicion = false; }
    });
  }

  confirmarEliminar(p: PlantillaCfdi): void {
    this.plantillaAEliminar = p;
    this.modalEliminar      = true;
  }

  cerrarEliminar(): void { this.modalEliminar = false; this.plantillaAEliminar = null; }

  eliminar(): void {
    if (!this.plantillaAEliminar) return;
    this.eliminando = true;
    this.svc.eliminar(this.plantillaAEliminar.id).subscribe({
      next: () => {
        this.plantillas = this.plantillas.filter(p => p.id !== this.plantillaAEliminar!.id);
        this.aplicarFiltros();
        this.eliminando = false;
        this.cerrarEliminar();
      },
      error: () => { this.eliminando = false; }
    });
  }
}
