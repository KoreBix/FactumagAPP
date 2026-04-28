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

          <div class="lf-group">
            <label class="lf-lbl">Tipo</label>
            <div class="lf-sel-wrap">
              <select [(ngModel)]="filtroTipo" class="lf-ctrl" (change)="aplicarFiltros()">
                <option value="">Todos</option>
                <option value="I">Ingreso</option>
                <option value="E">Egreso</option>
                <option value="T">Traslado</option>
                <option value="N">Nómina</option>
                <option value="P">C. Pago</option>
              </select>
              <span class="material-icons-round lf-ico">expand_more</span>
            </div>
          </div>

          <button class="btn-mag btn-ghost btn-sm lf-reset"
                  (click)="resetFiltros()">
            <span class="material-icons-round" style="font-size:16px">refresh</span>
            Limpiar
          </button>

        </div>
      </div>

      <!-- ── Tabla ── -->
      <div class="list-card animate-in delay-2">

        <!-- Skeleton -->
        <div *ngIf="cargando" style="padding:4px 0">
          <div *ngFor="let i of [1,2,3,4,5]" class="skeleton-row">
            <div class="skeleton" style="width:60px;height:26px;border-radius:6px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:12px;width:40%;margin-bottom:6px;border-radius:4px"></div>
              <div class="skeleton" style="height:10px;width:25%;border-radius:4px"></div>
            </div>
            <div class="skeleton" style="height:12px;width:100px;border-radius:4px"></div>
            <div class="skeleton" style="height:24px;width:80px;border-radius:20px"></div>
            <div class="skeleton" style="height:28px;width:100px;border-radius:8px"></div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!cargando && filtradas.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons-round">bookmark_border</span>
          </div>
          <div class="empty-title">Sin plantillas</div>
          <div class="empty-desc">
            {{ plantillas.length === 0
              ? 'Desde el formulario de emisión de CFDI puedes guardar cualquier configuración como plantilla.'
              : 'No hay plantillas que coincidan con el filtro.' }}
          </div>
        </div>

        <!-- Data -->
        <div *ngIf="!cargando && filtradas.length > 0" style="overflow-x:auto">
          <table class="cfdis-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th>Descripción</th>
                <th>Actualizada</th>
                <th class="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let p of filtradas" class="cfdi-row" (click)="editarNombre(p)" title="Click para editar">

                <td>
                  <span class="tipo-badge"
                        [style.background]="tipoColor(p).bg"
                        [style.color]="tipoColor(p).text">
                    {{ tipoKey(p) }}
                    <span class="tipo-badge-name">{{ tipoLabel(p) }}</span>
                  </span>
                </td>

                <td>
                  <div class="receptor-name">{{ p.nombre }}</div>
                </td>

                <td>
                  <div class="receptor-rfc" style="font-family:inherit;font-size:12px">
                    {{ p.descripcion || '—' }}
                  </div>
                </td>

                <td class="col-fecha">
                  {{ p.updatedAt | date:'dd/MM/yy HH:mm' }}
                </td>

                <td class="col-actions" (click)="$event.stopPropagation()">
                  <div class="action-btns">

                    <button class="act-btn act-use" title="Emitir CFDI con esta plantilla"
                            (click)="usar(p)">
                      <span class="material-icons-round">flash_on</span>
                    </button>

                    <button class="act-btn act-edit" title="Editar nombre y descripción"
                            (click)="editarNombre(p)">
                      <span class="material-icons-round">edit</span>
                    </button>

                    <button class="act-btn act-cancel" title="Eliminar plantilla"
                            (click)="confirmarEliminar(p)">
                      <span class="material-icons-round">delete</span>
                    </button>

                  </div>
                </td>

              </tr>
            </tbody>
          </table>
        </div>

      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════════════
         Modal Editar
    ══════════════════════════════════════════════════════════════ -->
    <div *ngIf="modalEditar" class="modal-overlay" (click)="cerrarEditar()">
      <div class="cancel-modal" style="max-width:500px" (click)="$event.stopPropagation()">

        <div class="cancel-modal-hdr">
          <div class="cancel-icon-wrap" style="background:rgba(217,119,6,.1);color:#d97706">
            <span class="material-icons-round" style="font-size:22px">edit</span>
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Editar plantilla</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
              Actualiza el nombre y descripción
            </div>
          </div>
        </div>

        <div style="margin-bottom:16px">
          <label class="modal-field-lbl" for="ed-nombre">Nombre <span style="color:#f87171">*</span></label>
          <input id="ed-nombre" class="lf-ctrl" [(ngModel)]="editNombre"
                 maxlength="100" placeholder="Ej: Factura mensual servicios"
                 (keydown.enter)="guardarEdicion()"
                 style="height:40px">
        </div>

        <div style="margin-bottom:20px">
          <label class="modal-field-lbl" for="ed-desc">Descripción <span style="color:var(--text-muted);font-weight:400;text-transform:none;letter-spacing:0">— opcional</span></label>
          <input id="ed-desc" class="lf-ctrl" [(ngModel)]="editDescripcion"
                 maxlength="300" placeholder="Descripción breve para identificarla"
                 style="height:40px">
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-mag btn-ghost btn-sm" (click)="cerrarEditar()">Cancelar</button>
          <button class="btn-mag btn-primary btn-sm"
                  [disabled]="!editNombre.trim() || guardandoEdicion"
                  (click)="guardarEdicion()">
            <span *ngIf="guardandoEdicion" class="material-icons-round spin-anim" style="font-size:15px">refresh</span>
            Guardar cambios
          </button>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         Modal Eliminar
    ══════════════════════════════════════════════════════════════ -->
    <div *ngIf="modalEliminar" class="modal-overlay" style="z-index:1002" (click)="cerrarEliminar()">
      <div class="cancel-modal" (click)="$event.stopPropagation()">

        <div class="cancel-modal-hdr">
          <div class="cancel-icon-wrap">
            <span class="material-icons-round" style="font-size:22px">delete_forever</span>
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Eliminar plantilla</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
              Esta acción no se puede deshacer
            </div>
          </div>
        </div>

        <div style="margin-bottom:20px">
          <div class="modal-field-lbl">Plantilla</div>
          <div class="modal-uuid-box">
            <span class="material-icons-round" style="font-size:14px;vertical-align:middle;margin-right:6px;color:var(--accent)">bookmark</span>
            {{ plantillaAEliminar?.nombre }}
          </div>
          <p style="font-size:13px;color:var(--text-muted);margin:10px 0 0">
            ¿Confirmas que deseas eliminar esta plantilla?
          </p>
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-mag btn-ghost btn-sm" (click)="cerrarEliminar()">Cancelar</button>
          <button class="btn-mag btn-sm modal-btn-cancel"
                  [disabled]="eliminando" (click)="eliminar()">
            <span *ngIf="eliminando" class="material-icons-round spin-anim" style="font-size:15px">refresh</span>
            <span *ngIf="!eliminando" class="material-icons-round" style="font-size:15px">delete</span>
            {{ eliminando ? 'Eliminando...' : 'Eliminar' }}
          </button>
        </div>

      </div>
    </div>

    <!-- ════════════════════  STYLES  ════════════════════ -->
    <style>
      @keyframes spin { to { transform:rotate(360deg); } }
      .spin-anim { animation:spin 1s linear infinite; }

      /* ── Page layout ── */
      .list-wrap { width:100%; }
      .list-ph { display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:24px; }
      .list-ph h1 { font-family:var(--font-display);font-size:22px;font-weight:800;margin:0 0 4px; }
      .list-ph p  { font-size:13px;color:var(--text-muted);margin:0; }

      /* ── Card ── */
      .list-card { background:var(--bg-card);border:1px solid var(--border-light);border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05); }

      /* ── Filters ── */
      .list-filters { display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;padding:16px 20px; }
      .lf-group { display:flex;flex-direction:column;gap:5px;flex:1;min-width:120px; }
      .lf-search { min-width:200px; }
      .lf-lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted); }
      .lf-sel-wrap { position:relative; }
      .lf-ico { position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted);pointer-events:none; }
      .lf-ctrl {
        display:block;width:100%;height:38px;padding:0 12px;
        border:1.5px solid var(--border);border-radius:var(--radius-sm,6px);
        font-family:var(--font-body);font-size:13px;
        color:var(--text-primary);background:var(--bg-card);
        outline:none;box-sizing:border-box;
        -webkit-appearance:none;appearance:none;
        transition:border-color .15s,box-shadow .15s;
      }
      .lf-ctrl:focus { border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,99,217,.1); }
      .lf-sel-wrap .lf-ctrl { padding-right:34px; }
      .lf-reset { flex-shrink:0;align-self:flex-end; }

      /* ── Skeleton ── */
      .skeleton-row { display:flex;gap:16px;padding:14px 20px;border-bottom:1px solid var(--border-light);align-items:center; }
      .skeleton-row:last-child { border-bottom:none; }

      /* ── Empty ── */
      .empty-state { text-align:center;padding:60px 20px;display:flex;flex-direction:column;align-items:center;gap:10px; }
      .empty-icon  { width:56px;height:56px;border-radius:50%;background:var(--bg-card2);display:flex;align-items:center;justify-content:center; }
      .empty-icon .material-icons-round { font-size:28px;color:var(--text-muted); }
      .empty-title { font-size:15px;font-weight:700;color:var(--text-primary); }
      .empty-desc  { font-size:13px;color:var(--text-muted);max-width:380px;line-height:1.6; }

      /* ── Table ── */
      .cfdis-table { width:100%;border-collapse:collapse; }
      .cfdis-table thead tr { background:var(--bg-card2); }
      .cfdis-table th { padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);white-space:nowrap;border-bottom:1px solid var(--border-light); }
      .cfdis-table td { padding:12px 14px;border-bottom:1px solid var(--border-light);vertical-align:middle; }
      .cfdis-table tbody tr:last-child td { border-bottom:none; }
      .cfdi-row { cursor:pointer;transition:background .1s; }
      .cfdi-row:hover { background:rgba(59,99,217,.04); }
      .col-actions { text-align:center;width:1%;white-space:nowrap; }
      .col-fecha { white-space:nowrap;font-size:12px;color:var(--text-muted); }

      /* ── Tipo badge ── */
      .tipo-badge { display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:7px;font-family:var(--font-display);font-weight:800;font-size:12px;white-space:nowrap; }
      .tipo-badge-name { font-size:11px;font-weight:600;font-family:var(--font-body); }

      /* ── Name / desc ── */
      .receptor-name { font-size:13px;font-weight:600;color:var(--text-primary); }

      /* ── Action buttons ── */
      .action-btns { display:flex;gap:4px;align-items:center;justify-content:center; }
      .act-btn { width:30px;height:30px;border-radius:7px;border:1.5px solid;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;background:transparent; }
      .act-btn .material-icons-round { font-size:16px; }
      .act-btn:hover { transform:translateY(-1px); }
      .act-use    { color:#059669;border-color:rgba(5,150,105,.25); }
      .act-use:hover    { background:rgba(5,150,105,.08);border-color:rgba(5,150,105,.5); }
      .act-edit   { color:#d97706;border-color:rgba(217,119,6,.25); }
      .act-edit:hover   { background:rgba(217,119,6,.08);border-color:rgba(217,119,6,.5); }
      .act-cancel { color:#dc2626;border-color:rgba(220,38,38,.2); }
      .act-cancel:hover { background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.5); }

      /* ── Modals ── */
      .modal-overlay { position:fixed;inset:0;z-index:1001;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px; }
      .cancel-modal { background:var(--bg-card);border-radius:16px;width:100%;max-width:460px;padding:24px;box-shadow:0 24px 60px rgba(0,0,0,.3); }
      .cancel-modal-hdr { display:flex;align-items:center;gap:14px;margin-bottom:20px; }
      .cancel-icon-wrap { width:44px;height:44px;border-radius:12px;background:rgba(220,38,38,.1);color:#dc2626;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
      .modal-field-lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);display:block;margin-bottom:6px; }
      .modal-uuid-box  { font-family:inherit;font-size:13px;background:var(--bg-card2);padding:10px 12px;border-radius:6px;word-break:break-all;color:var(--text-secondary);font-weight:600; }
      .modal-btn-cancel { background:#dc2626 !important;color:#fff !important;border:none !important;display:inline-flex;align-items:center;gap:6px; }
      .modal-btn-cancel:disabled { opacity:.6; }

      /* ── Animations ── */
      .animate-in { animation:fadeUp .3s ease both; }
      .delay-1    { animation-delay:.05s; }
      .delay-2    { animation-delay:.1s; }
      @keyframes fadeUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    </style>
  `
})
export class PlantillasCfdiComponent implements OnInit {
  plantillas: PlantillaCfdi[] = [];
  filtradas:  PlantillaCfdi[] = [];
  cargando    = true;
  filtroTexto = '';
  filtroTipo  = '';

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
    let result = [...this.plantillas];
    const q = this.filtroTexto.toLowerCase().trim();
    if (q) {
      result = result.filter(p =>
        p.nombre.toLowerCase().includes(q) ||
        (p.descripcion?.toLowerCase().includes(q) ?? false));
    }
    if (this.filtroTipo) {
      result = result.filter(p => this.tipoKey(p) === this.filtroTipo);
    }
    this.filtradas = result;
  }

  resetFiltros(): void {
    this.filtroTexto = '';
    this.filtroTipo  = '';
    this.aplicarFiltros();
  }

  tipoKey(p: PlantillaCfdi): string {
    try { return JSON.parse(p.datosJson).tipoCfdi ?? 'I'; } catch { return 'I'; }
  }

  tipoLabel(p: PlantillaCfdi): string {
    const map: Record<string, string> = { I: 'Ingreso', E: 'Egreso', P: 'C.Pago', N: 'Nómina', T: 'Traslado' };
    return map[this.tipoKey(p)] ?? this.tipoKey(p);
  }

  tipoColor(p: PlantillaCfdi): { bg: string; text: string } {
    const m: Record<string, { bg: string; text: string }> = {
      I: { bg: 'rgba(59,99,217,.10)',  text: 'var(--accent)'  },
      E: { bg: 'rgba(239,68,68,.10)',  text: 'var(--danger)'  },
      T: { bg: 'rgba(99,102,241,.10)', text: '#6366f1'        },
      N: { bg: 'rgba(124,58,237,.10)', text: '#7c3aed'        },
      P: { bg: 'rgba(245,158,11,.15)', text: '#b45309'        },
    };
    return m[this.tipoKey(p)] ?? { bg: 'var(--bg-card2)', text: 'var(--text-muted)' };
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
