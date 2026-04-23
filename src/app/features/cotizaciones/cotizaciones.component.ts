import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CotizacionList, Cotizacion, EstadoCotizacion } from '../../core/models/cotizacion/Cotizacion';
import { CotizacionService } from '../../core/services/cotizacion/CotizacionService';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="list-wrap animate-in">

      <!-- ── Page header ── -->
      <div class="list-ph">
        <div>
          <h1>Cotizaciones</h1>
          <p>{{ filtradas.length }} propuesta{{ filtradas.length !== 1 ? 's' : '' }} encontrada{{ filtradas.length !== 1 ? 's' : '' }}</p>
        </div>
        <a routerLink="/cotizaciones/new" class="btn-mag btn-primary">
          <span class="material-icons-round" style="font-size:18px">add</span>
          Nueva cotización
        </a>
      </div>

      <!-- ── Filtros ── -->
      <div class="list-card animate-in delay-1" style="margin-bottom:20px">
        <div class="list-filters">

          <div class="lf-group lf-search">
            <label class="lf-lbl">Buscar</label>
            <div style="position:relative">
              <span class="material-icons-round" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:17px;color:var(--text-muted);pointer-events:none">search</span>
              <input class="lf-ctrl" style="padding-left:34px" [(ngModel)]="filtroTexto"
                     placeholder="Folio, cliente, RFC...">
            </div>
          </div>

          <div class="lf-group">
            <label class="lf-lbl">Estado</label>
            <div class="lf-sel-wrap">
              <select [(ngModel)]="filtroEstado" class="lf-ctrl">
                <option value="">Todos</option>
                <option value="Borrador">Borrador</option>
                <option value="Enviada">Enviada</option>
                <option value="Aceptada">Aceptada</option>
                <option value="Rechazada">Rechazada</option>
                <option value="Cancelada">Cancelada</option>
                <option value="Convertida">Convertida</option>
              </select>
              <span class="material-icons-round lf-ico">expand_more</span>
            </div>
          </div>

          <div class="lf-group">
            <label class="lf-lbl">Desde</label>
            <input type="date" [(ngModel)]="filtroDesde" class="lf-ctrl">
          </div>

          <div class="lf-group">
            <label class="lf-lbl">Hasta</label>
            <input type="date" [(ngModel)]="filtroHasta" class="lf-ctrl">
          </div>

          <button class="btn-mag btn-ghost btn-sm lf-reset" (click)="resetFiltros()">
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
            <div class="skeleton" style="width:90px;height:24px;border-radius:20px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:12px;width:45%;margin-bottom:6px;border-radius:4px"></div>
              <div class="skeleton" style="height:10px;width:28%;border-radius:4px"></div>
            </div>
            <div class="skeleton" style="height:12px;width:80px;border-radius:4px"></div>
            <div class="skeleton" style="height:24px;width:90px;border-radius:20px"></div>
            <div class="skeleton" style="height:12px;width:70px;border-radius:4px"></div>
            <div class="skeleton" style="height:28px;width:110px;border-radius:8px"></div>
          </div>
        </div>

        <!-- Empty -->
        <div *ngIf="!cargando && filtradas.length === 0" class="empty-state">
          <div class="empty-icon">
            <span class="material-icons-round">request_quote</span>
          </div>
          <div class="empty-title">Sin cotizaciones</div>
          <div class="empty-desc">{{ cotizaciones.length === 0 ? 'Aún no has creado ninguna propuesta.' : 'No hay resultados para los filtros aplicados.' }}</div>
          <a *ngIf="cotizaciones.length === 0" routerLink="/cotizaciones/new" class="btn-mag btn-primary btn-sm">
            <span class="material-icons-round" style="font-size:16px">add</span>
            Crear primera cotización
          </a>
        </div>

        <!-- Data -->
        <div *ngIf="!cargando && filtradas.length > 0" style="overflow-x:auto">
          <table class="cots-table">
            <thead>
              <tr>
                <th>Folio</th>
                <th>Cliente</th>
                <th>Fecha</th>
                <th>Vigencia</th>
                <th class="col-right">Total</th>
                <th>Estado</th>
                <th class="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of filtradas"
                  class="cot-row"
                  (click)="abrirDetalle(c)"
                  title="Ver detalle">

                <td>
                  <span class="folio-badge">{{ c.folio }}</span>
                </td>

                <td>
                  <div class="receptor-name">{{ c.receptorNombre | slice:0:32 }}</div>
                  <div class="receptor-rfc">{{ c.receptorRfc }}</div>
                </td>

                <td class="col-fecha">{{ c.fecha | date:'dd/MM/yy' }}</td>

                <td class="col-fecha">
                  <span *ngIf="c.fechaVigencia" [class.vencida]="estaVencida(c.fechaVigencia!)">
                    {{ c.fechaVigencia | date:'dd/MM/yy' }}
                  </span>
                  <span *ngIf="!c.fechaVigencia" style="opacity:.35">—</span>
                </td>

                <td class="col-right">
                  <span class="total-amount">{{ c.total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
                  <div class="col-moneda">{{ c.moneda }}</div>
                </td>

                <td>
                  <span class="estado-chip" [attr.data-estado]="c.estado">
                    <span class="material-icons-round" style="font-size:11px">{{ estadoIcon(c.estado) }}</span>
                    {{ c.estado }}
                  </span>
                </td>

                <td class="col-actions" (click)="$event.stopPropagation()">
                  <div class="action-btns">
                    <button class="act-btn act-pdf" title="Descargar PDF"
                            (click)="descargarPdf(c)">
                      <span class="material-icons-round">picture_as_pdf</span>
                    </button>
                    <button *ngIf="c.estado !== 'Cancelada' && c.estado !== 'Convertida' && c.estado !== 'Aceptada'"
                            class="act-btn act-edit" title="Editar"
                            (click)="router.navigate(['/cotizaciones', c.id, 'editar'])">
                      <span class="material-icons-round">edit</span>
                    </button>
                    <button *ngIf="c.estado === 'Aceptada'" class="act-btn act-convert" title="Convertir a factura"
                            (click)="router.navigate(['/cfdis/new'], {queryParams:{cotizacionId:c.id}})">
                      <span class="material-icons-round">receipt</span>
                    </button>
                    <button *ngIf="c.cfdiUuid" class="act-btn act-cfdi" title="Ver CFDI timbrado"
                            (click)="router.navigate(['/cfdis'])">
                      <span class="material-icons-round">verified</span>
                    </button>
                    <button class="act-btn act-delete" title="Eliminar"
                            (click)="confirmarEliminar(c)">
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

    <!-- ══════════════════════════════════════════════════
         DRAWER DETALLE
    ══════════════════════════════════════════════════ -->
    <div *ngIf="drawerOpen" class="inv-overlay" (click)="cerrarDetalle()">
      <div class="inv-modal" (click)="$event.stopPropagation()">

        <!-- Top bar -->
        <div class="inv-topbar">
          <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0">
            <span *ngIf="drawerCot" class="folio-badge">{{ drawerCot.folio }}</span>
            <span *ngIf="drawerDetalle" class="estado-chip" [attr.data-estado]="drawerDetalle.estado">
              <span class="material-icons-round" style="font-size:11px">{{ estadoIcon(drawerDetalle.estado) }}</span>
              {{ drawerDetalle.estado }}
            </span>
            <span *ngIf="drawerDetalle?.cfdiUuid"
                  style="font-size:11px;color:#059669;background:rgba(5,150,105,.1);padding:3px 8px;border-radius:20px;display:flex;align-items:center;gap:4px">
              <span class="material-icons-round" style="font-size:11px">verified</span>
              CFDI vinculado
            </span>
          </div>
          <button class="btn-mag btn-ghost btn-sm" (click)="cerrarDetalle()" style="flex-shrink:0">
            <span class="material-icons-round" style="font-size:18px">close</span>
          </button>
        </div>

        <!-- Loading -->
        <div *ngIf="drawerLoading"
             style="flex:1;display:flex;align-items:center;justify-content:center;gap:12px;color:var(--text-muted);padding:60px">
          <span class="material-icons-round spin-anim" style="font-size:32px">refresh</span>
          <span style="font-size:14px">Cargando cotización...</span>
        </div>

        <!-- Paper -->
        <div *ngIf="!drawerLoading && drawerDetalle" class="inv-scroll">
          <div class="inv-paper">

            <!-- Header paper -->
            <div class="inv-hdr">
              <div class="inv-emisor-col">
                <div class="inv-logo">{{ drawerDetalle.receptorNombre.charAt(0) }}</div>
                <div class="inv-emisor-info">
                  <div class="inv-razon">{{ drawerDetalle.receptorNombre }}</div>
                  <div class="inv-rfc-tag">{{ drawerDetalle.receptorRfc }}</div>
                  <div *ngIf="drawerDetalle.receptorEmail" style="font-size:12px;color:#666;margin-top:4px">{{ drawerDetalle.receptorEmail }}</div>
                </div>
              </div>
              <div class="inv-doc-col">
                <div class="inv-doc-tipo">COTIZACIÓN</div>
                <div class="inv-doc-folio">{{ drawerDetalle.folio }}</div>
                <div class="inv-doc-fecha">{{ drawerDetalle.fecha | date:'dd/MM/yyyy' }}</div>
                <div *ngIf="drawerDetalle.fechaVigencia"
                     class="inv-doc-fecha"
                     [style.color]="estaVencida(drawerDetalle.fechaVigencia!) ? '#dc2626' : '#888'">
                  Vigencia: {{ drawerDetalle.fechaVigencia | date:'dd/MM/yyyy' }}
                </div>
                <div class="inv-doc-moneda">{{ drawerDetalle.moneda }}</div>
              </div>
            </div>

            <!-- Stripe accent -->
            <div class="inv-stripe" style="background:linear-gradient(90deg,#7c3aed 0%,#a78bfa 60%,rgba(124,58,237,.1) 100%)"></div>

            <!-- Aviso no fiscal -->
            <div style="margin:16px 32px;padding:8px 14px;background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;display:flex;align-items:center;gap:8px">
              <span style="font-size:16px">⚠</span>
              <span style="font-size:11px;color:#b45309;font-weight:600">DOCUMENTO NO FISCAL — Propuesta comercial. No es un CFDI.</span>
            </div>

            <!-- Conceptos -->
            <div class="inv-conceptos" *ngIf="drawerDetalle.lineas?.length">
              <div class="inv-sec-header" style="padding:0 32px;margin-bottom:0">
                <div class="inv-sec-dot" style="background:#7c3aed"></div>
                <span class="inv-sec-lbl">Conceptos</span>
              </div>
              <table class="inv-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Descripción</th>
                    <th class="ta-r">Cant.</th>
                    <th class="ta-r">P.U.</th>
                    <th class="ta-r" *ngIf="hayDescuentos">Descuento</th>
                    <th class="ta-r">IVA</th>
                    <th class="ta-r">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let l of drawerDetalle.lineas; let odd=odd" [class.inv-row-alt]="odd">
                    <td class="td-clave">{{ l.orden }}</td>
                    <td class="td-desc">
                      {{ l.descripcion }}
                      <div style="font-size:10px;color:#aaa;margin-top:2px">{{ l.claveProdServ }} · {{ l.claveUnidad }} · {{ l.unidad }}</div>
                    </td>
                    <td class="ta-r">{{ l.cantidad | number:'1.2-2' }}</td>
                    <td class="ta-r">{{ l.precioUnitario | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                    <td class="ta-r" *ngIf="hayDescuentos">
                      {{ l.descuento ? (l.descuento | currency:'MXN':'symbol-narrow':'1.2-2') : '—' }}
                    </td>
                    <td class="ta-r">{{ l.importeIva | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                    <td class="ta-r td-total">{{ l.total | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Totales -->
            <div class="inv-totals">
              <div class="inv-total-row">
                <span class="inv-total-lbl">Subtotal</span>
                <span class="inv-total-val">{{ drawerDetalle.subTotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div *ngIf="drawerDetalle.descuento > 0" class="inv-total-row">
                <span class="inv-total-lbl">Descuento</span>
                <span class="inv-total-val" style="color:#dc2626">- {{ drawerDetalle.descuento | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="inv-total-row">
                <span class="inv-total-lbl">IVA</span>
                <span class="inv-total-val">{{ drawerDetalle.iva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="inv-total-grand">
                <span>Total</span>
                <span>{{ drawerDetalle.total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="inv-footer">
              <div *ngIf="drawerDetalle.cfdiUuid" class="inv-uuid-block">
                <div class="inv-ftr-lbl">CFDI timbrado</div>
                <div class="inv-uuid-val" style="color:#059669">{{ drawerDetalle.cfdiUuid }}</div>
              </div>
              <div class="inv-ftr-chips">
                <div class="inv-ftr-chip">
                  <span class="inv-ftr-lbl">Folio</span>
                  <span class="inv-ftr-val">{{ drawerDetalle.folio }}</span>
                </div>
                <div class="inv-ftr-chip">
                  <span class="inv-ftr-lbl">Moneda</span>
                  <span class="inv-ftr-val">{{ drawerDetalle.moneda }}</span>
                </div>
                <div class="inv-ftr-chip">
                  <span class="inv-ftr-lbl">Creada</span>
                  <span class="inv-ftr-val">{{ drawerDetalle.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>
              <div *ngIf="drawerDetalle.notas" style="margin-top:12px">
                <div class="inv-ftr-lbl">Notas y condiciones</div>
                <div style="font-size:12px;color:#555;margin-top:4px;white-space:pre-line;line-height:1.6">{{ drawerDetalle.notas }}</div>
              </div>
              <div class="inv-seal">
                <span class="material-icons-round" style="font-size:14px">request_quote</span>
                Propuesta Comercial · No constituye un CFDI · Korebix
              </div>
            </div>

          </div>
        </div>

        <!-- Action footer -->
        <div *ngIf="!drawerLoading && drawerDetalle" class="inv-actions">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn-mag btn-outline btn-sm dw-pdf" (click)="descargarPdf(drawerCot!)">
              <span class="material-icons-round" style="font-size:15px">picture_as_pdf</span>
              Descargar PDF
            </button>
            <button *ngIf="drawerDetalle.estado !== 'Cancelada' && drawerDetalle.estado !== 'Convertida' && drawerDetalle.estado !== 'Aceptada'"
                    class="btn-mag btn-outline btn-sm dw-edit"
                    (click)="router.navigate(['/cotizaciones', drawerDetalle.id, 'editar']); cerrarDetalle()">
              <span class="material-icons-round" style="font-size:15px">edit</span>
              Editar
            </button>
            <button *ngIf="drawerDetalle.estado === 'Aceptada'"
                    class="btn-mag btn-primary btn-sm"
                    (click)="router.navigate(['/cfdis/new'], {queryParams:{cotizacionId:drawerDetalle.id}}); cerrarDetalle()">
              <span class="material-icons-round" style="font-size:15px">receipt</span>
              Convertir a factura
            </button>
            <a *ngIf="drawerDetalle.cfdiUuid" routerLink="/cfdis"
               class="btn-mag btn-outline btn-sm"
               style="color:#059669;border-color:rgba(5,150,105,.35)"
               (click)="cerrarDetalle()">
              <span class="material-icons-round" style="font-size:15px">verified</span>
              Ver CFDI
            </a>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-mag btn-outline btn-sm dw-view"
                    (click)="router.navigate(['/cotizaciones', drawerDetalle!.id]); cerrarDetalle()">
              <span class="material-icons-round" style="font-size:15px">open_in_new</span>
              Ver detalle
            </button>
            <button *ngIf="drawerDetalle.estado !== 'Cancelada' && drawerDetalle.estado !== 'Convertida'"
                    class="btn-mag btn-outline btn-sm dw-cancel"
                    (click)="cambiarEstadoDetalle('cancelar')">
              <span class="material-icons-round" style="font-size:15px">block</span>
              Cancelar
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════
         MODAL ELIMINAR
    ══════════════════════════════════════════════════ -->
    <div *ngIf="cotizacionAEliminar" class="modal-overlay" (click)="cerrarEliminar()">
      <div class="cancel-modal" (click)="$event.stopPropagation()">
        <div class="cancel-modal-hdr">
          <div class="cancel-icon-wrap">
            <span class="material-icons-round" style="font-size:22px">delete</span>
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Eliminar cotización</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">Esta acción no se puede deshacer</div>
          </div>
        </div>
        <div style="margin-bottom:20px">
          <div class="modal-field-lbl">Cotización</div>
          <div class="modal-uuid-box">{{ cotizacionAEliminar.folio }} — {{ cotizacionAEliminar.receptorNombre }}</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-mag btn-ghost btn-sm" (click)="cerrarEliminar()">Cancelar</button>
          <button class="btn-mag btn-sm modal-btn-cancel" [disabled]="eliminando" (click)="eliminar()">
            <span *ngIf="eliminando" class="material-icons-round spin-anim" style="font-size:15px">refresh</span>
            <span *ngIf="!eliminando" class="material-icons-round" style="font-size:15px">delete</span>
            {{ eliminando ? 'Eliminando...' : 'Confirmar eliminación' }}
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

      /* ── Table ── */
      .cots-table { width:100%;border-collapse:collapse; }
      .cots-table thead tr { background:var(--bg-card2); }
      .cots-table th { padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);white-space:nowrap;border-bottom:1px solid var(--border-light); }
      .cots-table td { padding:12px 14px;border-bottom:1px solid var(--border-light);vertical-align:middle; }
      .cots-table tbody tr:last-child td { border-bottom:none; }
      .cot-row { cursor:pointer;transition:background .1s; }
      .cot-row:hover { background:rgba(124,58,237,.03); }
      .col-right   { text-align:right; }
      .col-actions { text-align:center;width:1%;white-space:nowrap; }
      .col-fecha   { white-space:nowrap;font-size:12px;color:var(--text-muted); }
      .col-moneda  { font-size:10px;color:var(--text-muted);margin-top:1px;text-align:right; }

      /* ── Folio badge ── */
      .folio-badge { font-family:monospace;font-size:12px;font-weight:700;background:rgba(124,58,237,.1);color:#7c3aed;padding:4px 10px;border-radius:7px;white-space:nowrap; }

      /* ── Receptor ── */
      .receptor-name { font-size:13px;font-weight:600;color:var(--text-primary); }
      .receptor-rfc  { font-size:11px;color:var(--text-muted);font-family:monospace;margin-top:1px; }

      /* ── Total ── */
      .total-amount { font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary); }
      .vencida { color:#f87171; }

      /* ── Estado chips ── */
      .estado-chip { display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap; }
      .estado-chip[data-estado="Borrador"]   { background:rgba(107,114,128,.12);color:#6b7280; }
      .estado-chip[data-estado="Enviada"]    { background:rgba(37,99,235,.10);color:#2563eb; }
      .estado-chip[data-estado="Aceptada"]   { background:rgba(5,150,105,.10);color:#059669; }
      .estado-chip[data-estado="Rechazada"]  { background:rgba(239,68,68,.10);color:#ef4444; }
      .estado-chip[data-estado="Cancelada"]  { background:rgba(107,114,128,.10);color:#9ca3af; }
      .estado-chip[data-estado="Convertida"] { background:rgba(5,150,105,.15);color:#059669; }

      /* ── Action buttons ── */
      .action-btns { display:flex;gap:4px;align-items:center;justify-content:center; }
      .act-btn { width:30px;height:30px;border-radius:7px;border:1.5px solid;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;background:transparent; }
      .act-btn .material-icons-round { font-size:16px; }
      .act-btn:hover { transform:translateY(-1px); }
      .act-pdf     { color:#dc2626;border-color:rgba(220,38,38,.25); }
      .act-pdf:hover     { background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.5); }
      .act-edit    { color:#d97706;border-color:rgba(217,119,6,.25); }
      .act-edit:hover    { background:rgba(217,119,6,.08);border-color:rgba(217,119,6,.5); }
      .act-convert { color:#059669;border-color:rgba(5,150,105,.25); }
      .act-convert:hover { background:rgba(5,150,105,.08);border-color:rgba(5,150,105,.5); }
      .act-cfdi    { color:#059669;border-color:rgba(5,150,105,.25); }
      .act-cfdi:hover    { background:rgba(5,150,105,.08);border-color:rgba(5,150,105,.5); }
      .act-delete  { color:#dc2626;border-color:rgba(220,38,38,.2); }
      .act-delete:hover  { background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.5); }

      /* ── Empty state ── */
      .empty-state { padding:60px 20px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:12px; }
      .empty-icon { width:64px;height:64px;border-radius:50%;background:var(--bg-card2);display:flex;align-items:center;justify-content:center; }
      .empty-icon .material-icons-round { font-size:30px;color:var(--text-muted); }
      .empty-title { font-size:16px;font-weight:700;color:var(--text-primary); }
      .empty-desc  { font-size:13px;color:var(--text-muted);max-width:340px; }

      /* ══ DRAWER ══ */
      .inv-overlay {
        position:fixed;inset:0;z-index:1001;
        background:rgba(0,0,0,.6);backdrop-filter:blur(5px);
        display:flex;align-items:center;justify-content:center;padding:20px;
      }
      .inv-modal {
        background:var(--bg-card2);border-radius:18px;
        width:100%;max-width:860px;max-height:92vh;
        display:flex;flex-direction:column;
        box-shadow:0 40px 100px rgba(0,0,0,.4);overflow:hidden;
      }
      .inv-topbar {
        display:flex;align-items:center;justify-content:space-between;
        padding:14px 20px;border-bottom:1px solid var(--border-light);
        background:var(--bg-card);flex-shrink:0;
      }
      .inv-scroll { flex:1;overflow-y:auto;padding:24px; }
      .inv-actions {
        display:flex;align-items:center;justify-content:space-between;
        padding:14px 20px;border-top:1px solid var(--border-light);
        background:var(--bg-card);flex-shrink:0;flex-wrap:wrap;gap:8px;
      }

      /* ── Invoice paper ── */
      .inv-paper { background:#ffffff;border-radius:12px;box-shadow:0 8px 40px rgba(0,0,0,.15);overflow:hidden;position:relative;color:#1c1c2e; }
      .inv-hdr { display:flex;align-items:flex-start;justify-content:space-between;gap:24px;padding:30px 36px 24px; }
      .inv-emisor-col { display:flex;align-items:center;gap:16px;flex:1;min-width:0; }
      .inv-logo { width:60px;height:60px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#a78bfa);color:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;font-family:'Plus Jakarta Sans',sans-serif;flex-shrink:0; }
      .inv-emisor-info { min-width:0; }
      .inv-razon { font-size:18px;font-weight:800;color:#0f0f1e;font-family:'Plus Jakarta Sans',sans-serif;line-height:1.2;margin-bottom:6px; }
      .inv-rfc-tag { display:inline-block;font-family:monospace;font-size:11px;font-weight:700;color:#555;background:#f0f0f8;padding:3px 10px;border-radius:5px;letter-spacing:.04em; }
      .inv-doc-col { text-align:right;flex-shrink:0; }
      .inv-doc-tipo { font-size:22px;font-weight:900;color:#0f0f1e;font-family:'Plus Jakarta Sans',sans-serif;text-transform:uppercase;letter-spacing:.02em;margin-bottom:8px; }
      .inv-doc-folio { font-family:monospace;font-size:15px;font-weight:700;color:#333;margin-bottom:4px; }
      .inv-doc-fecha { font-size:12px;color:#888;margin-bottom:4px; }
      .inv-doc-moneda { display:inline-block;font-size:11px;font-weight:700;color:#7c3aed;background:rgba(124,58,237,.08);padding:3px 10px;border-radius:20px;margin-top:4px; }
      .inv-stripe { height:4px; }
      .inv-sec-header { display:flex;align-items:center;gap:8px;margin-bottom:10px; }
      .inv-sec-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
      .inv-sec-lbl { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888; }

      /* ── Conceptos table ── */
      .inv-conceptos { padding:0; }
      .inv-table { width:100%;border-collapse:collapse;font-size:13px; }
      .inv-table thead tr { background:#f4f4fb; }
      .inv-table th { padding:10px 14px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;text-align:left;border-top:1px solid #eaeaf5;border-bottom:2px solid #eaeaf5; }
      .inv-table th:first-child { padding-left:36px; }
      .inv-table th:last-child  { padding-right:36px; }
      .inv-table td { padding:12px 14px;border-bottom:1px solid #f0f0f8;color:#333;vertical-align:middle; }
      .inv-table td:first-child { padding-left:36px; }
      .inv-table td:last-child  { padding-right:36px; }
      .inv-table tbody tr:last-child td { border-bottom:none; }
      .inv-row-alt { background:#fafafe; }
      .ta-r     { text-align:right; }
      .td-clave { font-family:monospace;font-size:11px;color:#999;white-space:nowrap; }
      .td-desc  { font-weight:500;color:#222; }
      .td-total { font-weight:700;color:#0f0f1e; }

      /* ── Totals ── */
      .inv-totals { padding:16px 36px 20px;border-top:2px solid #eaeaf5;background:#fafafe;display:flex;flex-direction:column;align-items:flex-end;gap:6px; }
      .inv-total-row  { display:flex;justify-content:space-between;font-size:13px;color:#666;width:300px; }
      .inv-total-lbl  { color:#888; }
      .inv-total-val  { font-weight:600;color:#333; }
      .inv-total-grand { display:flex;justify-content:space-between;align-items:center;width:300px;padding-top:10px;margin-top:4px;border-top:2px solid #d0d0e8;font-size:20px;font-weight:900;color:#0f0f1e;font-family:'Plus Jakarta Sans',sans-serif; }

      /* ── Footer ── */
      .inv-footer { padding:20px 36px 28px;background:#f7f7fc;border-top:1px solid #eaeaf5; }
      .inv-uuid-block { margin-bottom:14px; }
      .inv-ftr-lbl { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#aaa;margin-bottom:3px; }
      .inv-uuid-val { font-family:monospace;font-size:11px;color:#555;word-break:break-all;line-height:1.7; }
      .inv-ftr-chips { display:flex;gap:24px;flex-wrap:wrap;margin-bottom:14px; }
      .inv-ftr-chip { display:flex;flex-direction:column;gap:2px; }
      .inv-ftr-val { font-size:12px;font-weight:600;color:#444; }
      .inv-seal { display:flex;align-items:center;gap:5px;font-size:11px;color:#bbb;margin-top:12px; }

      /* ── Drawer action button variants ── */
      .dw-pdf    { color:#dc2626 !important;border-color:rgba(220,38,38,.3) !important; }
      .dw-pdf:hover  { background:rgba(220,38,38,.06) !important; }
      .dw-edit   { color:#d97706 !important;border-color:rgba(217,119,6,.3) !important; }
      .dw-edit:hover { background:rgba(217,119,6,.06) !important; }
      .dw-view   { color:var(--accent) !important;border-color:rgba(59,99,217,.3) !important; }
      .dw-view:hover { background:rgba(59,99,217,.06) !important; }
      .dw-cancel { color:#dc2626 !important;border-color:rgba(220,38,38,.3) !important; }
      .dw-cancel:hover { background:rgba(220,38,38,.06) !important; }

      /* ── Modal eliminar ── */
      .modal-overlay { position:fixed;inset:0;z-index:1002;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px; }
      .cancel-modal { background:var(--bg-card);border-radius:16px;width:100%;max-width:460px;padding:24px;box-shadow:0 24px 60px rgba(0,0,0,.3); }
      .cancel-modal-hdr { display:flex;align-items:center;gap:14px;margin-bottom:20px; }
      .cancel-icon-wrap { width:44px;height:44px;border-radius:12px;background:rgba(220,38,38,.1);color:#dc2626;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
      .modal-field-lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);display:block;margin-bottom:6px; }
      .modal-uuid-box  { font-family:monospace;font-size:12px;background:var(--bg-card2);padding:8px 12px;border-radius:6px;word-break:break-all;color:var(--text-secondary); }
      .modal-btn-cancel { background:#dc2626 !important;color:#fff !important;border:none !important; }
      .modal-btn-cancel:disabled { opacity:.6; }
    </style>
  `
})
export class CotizacionesComponent implements OnInit {
  cotizaciones: CotizacionList[] = [];
  cargando = true;

  filtroTexto  = '';
  filtroEstado = '';
  filtroDesde  = '';
  filtroHasta  = '';

  /* Drawer detalle */
  drawerOpen    = false;
  drawerLoading = false;
  drawerCot:     CotizacionList | null = null;
  drawerDetalle: Cotizacion     | null = null;

  /* Modal eliminar */
  cotizacionAEliminar: CotizacionList | null = null;
  eliminando = false;

  constructor(
    public  router: Router,
    private svc:    CotizacionService
  ) {}

  ngOnInit(): void {
    this.svc.listar().subscribe({
      next: cs => { this.cotizaciones = cs; this.cargando = false; },
      error: ()  => { this.cargando = false; }
    });
  }

  get filtradas(): CotizacionList[] {
    const txt = this.filtroTexto.toLowerCase().trim();
    return this.cotizaciones.filter(c => {
      const matchTxt = !txt ||
        c.folio.toLowerCase().includes(txt) ||
        c.receptorNombre.toLowerCase().includes(txt) ||
        c.receptorRfc.toLowerCase().includes(txt);
      const matchEst  = !this.filtroEstado || c.estado === this.filtroEstado;
      const matchDes  = !this.filtroDesde  || c.fecha >= this.filtroDesde;
      const matchHas  = !this.filtroHasta  || c.fecha <= this.filtroHasta;
      return matchTxt && matchEst && matchDes && matchHas;
    });
  }

  resetFiltros(): void {
    this.filtroTexto = ''; this.filtroEstado = '';
    this.filtroDesde = ''; this.filtroHasta  = '';
  }

  /* ── Drawer ── */
  abrirDetalle(c: CotizacionList): void {
    this.drawerCot    = c;
    this.drawerDetalle = null;
    this.drawerLoading = true;
    this.drawerOpen   = true;
    this.svc.obtener(c.id).subscribe({
      next:  d => { this.drawerDetalle = d; this.drawerLoading = false; },
      error: () => { this.drawerLoading = false; }
    });
  }

  cerrarDetalle(): void { this.drawerOpen = false; }

  get hayDescuentos(): boolean {
    return !!this.drawerDetalle?.lineas?.some(l => l.descuento > 0);
  }

  cambiarEstadoDetalle(accion: string): void {
    if (!this.drawerDetalle) return;
    this.svc.cambiarEstado(this.drawerDetalle.id, accion).subscribe({
      next: d => {
        this.drawerDetalle = d;
        const idx = this.cotizaciones.findIndex(c => c.id === d.id);
        if (idx >= 0) this.cotizaciones[idx] = { ...this.cotizaciones[idx], estado: d.estado as EstadoCotizacion };
      }
    });
  }

  /* ── PDF ── */
  descargarPdf(c: CotizacionList): void {
    const token = localStorage.getItem('accessToken') || '';
    const url   = this.svc.pdfUrl(c.id);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.blob(); })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `cotizacion-${c.folio}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => console.error('Error PDF:', err));
  }

  /* ── Eliminar ── */
  confirmarEliminar(c: CotizacionList): void { this.cotizacionAEliminar = c; }
  cerrarEliminar():                    void { this.cotizacionAEliminar = null; this.eliminando = false; }

  eliminar(): void {
    if (!this.cotizacionAEliminar) return;
    this.eliminando = true;
    this.svc.eliminar(this.cotizacionAEliminar.id).subscribe({
      next: () => {
        this.cotizaciones = this.cotizaciones.filter(c => c.id !== this.cotizacionAEliminar!.id);
        this.cerrarEliminar();
      },
      error: () => { this.eliminando = false; }
    });
  }

  /* ── Helpers ── */
  estaVencida(fecha: string): boolean { return new Date(fecha) < new Date(); }

  estadoIcon(estado: EstadoCotizacion): string {
    return ({
      Borrador:   'edit',
      Enviada:    'send',
      Aceptada:   'check_circle',
      Rechazada:  'cancel',
      Cancelada:  'block',
      Convertida: 'receipt'
    } as Record<string, string>)[estado] ?? 'help';
  }
}
