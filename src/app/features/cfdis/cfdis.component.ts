import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CfdiList } from '../../core/models/CFDI/CfdiList';
import { CfdiDetalle } from '../../core/models/CFDI/CfdiDetalle';
import { RfcList } from '../../core/models/RFC/RfcList';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { RfcService } from '../../core/services/RFC/RfcService';

@Component({
  selector: 'app-cfdis',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="list-wrap animate-in">

      <!-- ── Page header ── -->
      <div class="list-ph">
        <div>
          <h1>Mis CFDIs</h1>
          <p>{{ total }} comprobante{{ total !== 1 ? 's' : '' }} encontrado{{ total !== 1 ? 's' : '' }}</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <a routerLink="/cfdis/masivo" class="btn-mag btn-outline">
            <span class="material-icons-round" style="font-size:18px">upload</span>
            Carga masiva
          </a>
          <a routerLink="/cfdis/new" class="btn-mag btn-primary">
            <span class="material-icons-round" style="font-size:18px">add</span>
            Emitir CFDI
          </a>
        </div>
      </div>

      <!-- ── Filtros ── -->
      <div class="list-card animate-in delay-1" style="margin-bottom:20px">
        <div class="list-filters">

          <div class="lf-group">
            <label class="lf-lbl">RFC Emisor</label>
            <div class="lf-sel-wrap">
              <select [(ngModel)]="filters.rfcId" class="lf-ctrl" (change)="load()">
                <option [ngValue]="undefined">Todos</option>
                <option *ngFor="let r of rfcs" [ngValue]="r.id">{{ r.rfc }}</option>
              </select>
              <span class="material-icons-round lf-ico">expand_more</span>
            </div>
          </div>

          <div class="lf-group">
            <label class="lf-lbl">Estado</label>
            <div class="lf-sel-wrap">
              <select [(ngModel)]="filters.estado" class="lf-ctrl" (change)="load()">
                <option value="">Todos</option>
                <option value="Timbrado">Timbrado</option>
                <option value="Borrador">Borrador</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Error">Error</option>
              </select>
              <span class="material-icons-round lf-ico">expand_more</span>
            </div>
          </div>

          <div class="lf-group">
            <label class="lf-lbl">Tipo</label>
            <div class="lf-sel-wrap">
              <select [(ngModel)]="filters.tipo" class="lf-ctrl" (change)="load()">
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

          <div class="lf-group">
            <label class="lf-lbl">Desde</label>
            <input type="date" [(ngModel)]="filters.desde" class="lf-ctrl" (change)="load()">
          </div>

          <div class="lf-group">
            <label class="lf-lbl">Hasta</label>
            <input type="date" [(ngModel)]="filters.hasta" class="lf-ctrl" (change)="load()">
          </div>

          <button class="btn-mag btn-ghost btn-sm lf-reset" (click)="resetFilters()">
            <span class="material-icons-round" style="font-size:16px">refresh</span>
            Limpiar
          </button>
        </div>
      </div>

      <!-- ── Tabla ── -->
      <div class="list-card animate-in delay-2">

        <!-- Skeleton -->
        <div *ngIf="loading" style="padding:4px 0">
          <div *ngFor="let i of [1,2,3,4,5]" class="skeleton-row">
            <div class="skeleton" style="width:60px;height:26px;border-radius:6px;flex-shrink:0"></div>
            <div style="flex:1">
              <div class="skeleton" style="height:12px;width:40%;margin-bottom:6px;border-radius:4px"></div>
              <div class="skeleton" style="height:10px;width:25%;border-radius:4px"></div>
            </div>
            <div class="skeleton" style="height:12px;width:100px;border-radius:4px"></div>
            <div class="skeleton" style="height:24px;width:80px;border-radius:20px"></div>
            <div class="skeleton" style="height:12px;width:60px;border-radius:4px"></div>
            <div class="skeleton" style="height:28px;width:120px;border-radius:8px"></div>
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

        <!-- Data -->
        <div *ngIf="!loading && cfdis.length > 0" style="overflow-x:auto">
          <table class="cfdis-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>UUID / Folio</th>
                <th>Receptor</th>
                <th class="col-right">Total</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th class="col-actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let c of cfdis"
                  class="cfdi-row"
                  (click)="abrirDetalle(c)"
                  title="Click para ver detalle">

                <td>
                  <span class="tipo-badge"
                        [style.background]="tipoColor(c.tipoComprobante).bg"
                        [style.color]="tipoColor(c.tipoComprobante).text">
                    {{ c.tipoComprobante }}
                    <span class="tipo-badge-name">{{ tipoLabel(c.tipoComprobante) }}</span>
                  </span>
                </td>

                <td class="col-uuid">
                  <div class="uuid-text">{{ c.uuid ?? 'Sin timbrar' }}</div>
                  <div class="folio-text" *ngIf="c.folio">Folio {{ c.folio }}</div>
                </td>

                <td>
                  <div class="receptor-name">{{ c.receptorNombre | slice:0:30 }}</div>
                  <div class="receptor-rfc">{{ c.receptorRfc }}</div>
                </td>

                <td class="col-right">
                  <span class="total-amount" *ngIf="c.tipoComprobante !== 'P'">
                    {{ c.total | currency:'MXN':'symbol-narrow':'1.2-2' }}
                  </span>
                  <span class="total-na" *ngIf="c.tipoComprobante === 'P'">—</span>
                </td>

                <td>
                  <span class="estado-chip" [ngClass]="'estado-' + c.estado.toLowerCase()">
                    <span class="material-icons-round" style="font-size:11px">{{ estadoIcon(c.estado) }}</span>
                    {{ c.estado }}
                  </span>
                </td>

                <td class="col-fecha">
                  {{ c.fechaTimbrado ? (c.fechaTimbrado | date:'dd/MM/yy HH:mm') : '—' }}
                </td>

                <td class="col-actions" (click)="$event.stopPropagation()">
                  <div class="action-btns">

                    <button *ngIf="c.estado==='Timbrado'"
                            class="act-btn act-xml" title="Descargar XML"
                            (click)="descargar(c,'xml')">
                      <span class="material-icons-round">code</span>
                    </button>

                    <button *ngIf="c.estado==='Timbrado'"
                            class="act-btn act-pdf" title="Descargar PDF"
                            (click)="descargar(c,'pdf')">
                      <span class="material-icons-round">picture_as_pdf</span>
                    </button>

                    <button *ngIf="c.estado==='Borrador' || c.estado==='Error'"
                            class="act-btn act-edit" title="Editar y retimbrar"
                            (click)="editar(c)">
                      <span class="material-icons-round">edit</span>
                    </button>

                    <button class="act-btn act-clone" title="Generar otra igual"
                            (click)="clonar(c)">
                      <span class="material-icons-round">content_copy</span>
                    </button>

                    <button *ngIf="c.estado==='Timbrado'"
                            class="act-btn act-cancel" title="Cancelar CFDI"
                            (click)="abrirCancelar(c)">
                      <span class="material-icons-round">cancel</span>
                    </button>

                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Paginación -->
          <div class="list-pagination">
            <span class="pag-info">
              Mostrando {{ (page-1)*pageSize+1 }}–{{ Math.min(page*pageSize, total) }} de {{ total }}
            </span>
            <div class="pag-btns">
              <button class="btn-mag btn-ghost btn-sm" [disabled]="page===1" (click)="changePage(page-1)">
                <span class="material-icons-round" style="font-size:16px">chevron_left</span>
              </button>
              <span class="pag-current">{{ page }}</span>
              <button class="btn-mag btn-ghost btn-sm" [disabled]="page*pageSize>=total" (click)="changePage(page+1)">
                <span class="material-icons-round" style="font-size:16px">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ══════════════════════════════════════════════════════════════
         Invoice Modal
    ══════════════════════════════════════════════════════════════ -->
    <div *ngIf="invoiceOpen" class="inv-overlay" (click)="cerrarDetalle()">
      <div class="inv-modal" (click)="$event.stopPropagation()">

        <!-- Top bar -->
        <div class="inv-topbar">
          <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
            <span *ngIf="drawerCfdi" class="tipo-badge"
                  [style.background]="tipoColor(drawerCfdi.tipoComprobante).bg"
                  [style.color]="tipoColor(drawerCfdi.tipoComprobante).text">
              {{ drawerCfdi.tipoComprobante }}
              <span class="tipo-badge-name">{{ tipoLabelFull(drawerCfdi.tipoComprobante) }}</span>
            </span>
            <span *ngIf="drawerCfdi" class="estado-chip"
                  [ngClass]="'estado-' + drawerCfdi.estado.toLowerCase()">
              <span class="material-icons-round" style="font-size:11px">{{ estadoIcon(drawerCfdi.estado) }}</span>
              {{ drawerCfdi.estado }}
            </span>
          </div>
          <button class="btn-mag btn-ghost btn-sm" (click)="cerrarDetalle()" style="flex-shrink:0">
            <span class="material-icons-round" style="font-size:18px">close</span>
          </button>
        </div>

        <!-- Loading spinner -->
        <div *ngIf="drawerLoading"
             style="flex:1;display:flex;align-items:center;justify-content:center;gap:12px;color:var(--text-muted);padding:60px">
          <span class="material-icons-round spin-anim" style="font-size:32px">refresh</span>
          <span style="font-size:14px">Cargando factura...</span>
        </div>

        <!-- ── Invoice paper ── -->
        <div *ngIf="!drawerLoading && drawerDetalle" class="inv-scroll">
          <div class="inv-paper">

            <!-- Cancelled watermark -->
            <div *ngIf="drawerDetalle.estado==='Cancelado'" class="inv-watermark">CANCELADO</div>

            <!-- ── Header: emisor + tipo/folio ── -->
            <div class="inv-hdr">
              <div class="inv-emisor-col">
                <div class="inv-logo">{{ firstLetter(drawerDetalle.emisorRazonSocial) }}</div>
                <div class="inv-emisor-info">
                  <div class="inv-razon">{{ drawerDetalle.emisorRazonSocial }}</div>
                  <div class="inv-rfc-tag">{{ drawerDetalle.emisorRfc }}</div>
                </div>
              </div>
              <div class="inv-doc-col">
                <div class="inv-doc-tipo">{{ tipoLabelFull(drawerDetalle.tipoComprobante) }}</div>
                <div *ngIf="drawerDetalle.serie || drawerDetalle.folio" class="inv-doc-folio">
                  {{ drawerDetalle.serie || '' }}{{ drawerDetalle.folio ? '-' + drawerDetalle.folio : '' }}
                </div>
                <div *ngIf="drawerDetalle.fechaTimbrado" class="inv-doc-fecha">
                  {{ drawerDetalle.fechaTimbrado | date:'dd/MM/yyyy · HH:mm' }}
                </div>
                <div class="inv-doc-moneda">{{ drawerDetalle.moneda }}</div>
              </div>
            </div>

            <!-- ── Accent stripe ── -->
            <div class="inv-stripe"></div>

            <!-- ── Receptor ── -->
            <div class="inv-receptor">
              <div class="inv-sec-header">
                <div class="inv-sec-dot"></div>
                <span class="inv-sec-lbl">Receptor</span>
              </div>
              <div class="inv-receptor-nombre">{{ drawerDetalle.receptorNombre }}</div>
              <div class="inv-receptor-rfc">{{ drawerDetalle.receptorRfc }}</div>
            </div>

            <!-- ── Conceptos ── -->
            <div class="inv-conceptos" *ngIf="drawerDetalle.lineas?.length">
              <div class="inv-sec-header" style="padding:0 32px;margin-bottom:0">
                <div class="inv-sec-dot"></div>
                <span class="inv-sec-lbl">Conceptos</span>
              </div>
              <table class="inv-table">
                <thead>
                  <tr>
                    <th>Clave SAT</th>
                    <th>Descripción</th>
                    <th class="ta-r">Cant.</th>
                    <th class="ta-r">Precio unit.</th>
                    <th class="ta-r" *ngIf="hayDescuentos">Descuento</th>
                    <th class="ta-r">IVA</th>
                    <th class="ta-r">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let l of drawerDetalle.lineas; let odd = odd" [class.inv-row-alt]="odd">
                    <td class="td-clave">{{ l.claveProdServ }}</td>
                    <td class="td-desc">{{ l.descripcion }}</td>
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

            <!-- ── Totals ── -->
            <div class="inv-totals" *ngIf="drawerDetalle.tipoComprobante !== 'P'">
              <div class="inv-total-row">
                <span class="inv-total-lbl">Subtotal</span>
                <span class="inv-total-val">{{ drawerDetalle.subTotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="inv-total-row" *ngIf="drawerDetalle.descuento">
                <span class="inv-total-lbl">Descuento</span>
                <span class="inv-total-val" style="color:#dc2626">
                  - {{ drawerDetalle.descuento | currency:'MXN':'symbol-narrow':'1.2-2' }}
                </span>
              </div>
              <div class="inv-total-row" *ngIf="totalIva > 0">
                <span class="inv-total-lbl">IVA (16%)</span>
                <span class="inv-total-val">{{ totalIva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="inv-total-grand">
                <span>Total</span>
                <span>{{ drawerDetalle.total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
            </div>

            <!-- ── Footer info ── -->
            <div class="inv-footer">

              <!-- UUID -->
              <div class="inv-uuid-block">
                <div class="inv-ftr-lbl">Folio fiscal (UUID)</div>
                <div class="inv-uuid-val">{{ drawerDetalle.uuid ?? 'Sin timbrar — pendiente de timbre SAT' }}</div>
              </div>

              <!-- Chips de condiciones -->
              <div class="inv-ftr-chips">
                <div class="inv-ftr-chip" *ngIf="drawerDetalle.formaPago">
                  <span class="inv-ftr-lbl">Forma de pago</span>
                  <span class="inv-ftr-val">{{ formaLabel(drawerDetalle.formaPago) }}</span>
                </div>
                <div class="inv-ftr-chip" *ngIf="drawerDetalle.metodoPago">
                  <span class="inv-ftr-lbl">Método de pago</span>
                  <span class="inv-ftr-val">{{ metodoLabel(drawerDetalle.metodoPago) }}</span>
                </div>
                <div class="inv-ftr-chip">
                  <span class="inv-ftr-lbl">Moneda</span>
                  <span class="inv-ftr-val">{{ drawerDetalle.moneda }}</span>
                </div>
                <div class="inv-ftr-chip" *ngIf="drawerDetalle.createdAt">
                  <span class="inv-ftr-lbl">Creado</span>
                  <span class="inv-ftr-val">{{ drawerDetalle.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                </div>
              </div>

              <!-- Sello -->
              <div class="inv-seal">
                <span class="material-icons-round" style="font-size:14px">verified</span>
                Comprobante Fiscal Digital por Internet · Versión 4.0 · SAT México
              </div>
            </div>

          </div>
        </div>

        <!-- ── Action footer ── -->
        <div *ngIf="!drawerLoading && drawerDetalle" class="inv-actions">
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button *ngIf="drawerDetalle.estado==='Timbrado'"
                    class="btn-mag btn-outline btn-sm"
                    (click)="descargar(drawerDetalle,'xml')">
              <span class="material-icons-round" style="font-size:15px">code</span>
              Descargar XML
            </button>
            <button *ngIf="drawerDetalle.estado==='Timbrado'"
                    class="btn-mag btn-outline btn-sm dw-pdf"
                    (click)="descargar(drawerDetalle,'pdf')">
              <span class="material-icons-round" style="font-size:15px">picture_as_pdf</span>
              Descargar PDF
            </button>
            <button *ngIf="drawerDetalle.estado==='Borrador' || drawerDetalle.estado==='Error'"
                    class="btn-mag btn-outline btn-sm dw-edit"
                    (click)="editar(drawerDetalle)">
              <span class="material-icons-round" style="font-size:15px">edit</span>
              Editar
            </button>
          </div>
          <div style="display:flex;gap:8px">
            <button class="btn-mag btn-outline btn-sm dw-clone"
                    (click)="clonar(drawerDetalle)">
              <span class="material-icons-round" style="font-size:15px">content_copy</span>
              Duplicar
            </button>
            <button *ngIf="drawerDetalle.estado==='Timbrado'"
                    class="btn-mag btn-outline btn-sm dw-cancel"
                    (click)="abrirCancelar(drawerDetalle); cerrarDetalle()">
              <span class="material-icons-round" style="font-size:15px">cancel</span>
              Cancelar CFDI
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════
         Cancel Modal
    ══════════════════════════════════════════════════════════════ -->
    <div *ngIf="cancelModal" class="modal-overlay" (click)="cancelModal=null">
      <div class="cancel-modal" (click)="$event.stopPropagation()">

        <div class="cancel-modal-hdr">
          <div class="cancel-icon-wrap">
            <span class="material-icons-round" style="font-size:22px">cancel</span>
          </div>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Cancelar CFDI</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
              Esta acción no se puede deshacer ante el SAT
            </div>
          </div>
        </div>

        <div style="margin-bottom:16px">
          <div class="modal-field-lbl">UUID</div>
          <div class="modal-uuid-box">{{ cancelModal.uuid }}</div>
        </div>

        <div style="margin-bottom:16px">
          <label class="modal-field-lbl" for="cm-motivo">Motivo de cancelación</label>
          <div class="lf-sel-wrap">
            <select id="cm-motivo" [(ngModel)]="cancelMotivo" class="lf-ctrl">
              <option value="01">01 — Comprobante con errores con relación</option>
              <option value="02">02 — Comprobante con errores sin relación</option>
              <option value="03">03 — No se llevó a cabo la operación</option>
              <option value="04">04 — Operación nominativa relacionada en factura global</option>
            </select>
            <span class="material-icons-round lf-ico">expand_more</span>
          </div>
        </div>

        <div *ngIf="cancelMotivo==='01'" style="margin-bottom:16px">
          <label class="modal-field-lbl" for="cm-sust">UUID de sustitución</label>
          <input id="cm-sust" [(ngModel)]="cancelFolioSust" class="lf-ctrl"
                 placeholder="UUID del CFDI que lo sustituye" maxlength="36">
        </div>

        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button class="btn-mag btn-ghost btn-sm" (click)="cancelModal=null">Cerrar</button>
          <button class="btn-mag btn-sm modal-btn-cancel"
                  [disabled]="cancelLoading" (click)="confirmarCancelar()">
            <span *ngIf="cancelLoading" class="material-icons-round spin-anim" style="font-size:15px">refresh</span>
            <span *ngIf="!cancelLoading" class="material-icons-round" style="font-size:15px">cancel</span>
            {{ cancelLoading ? 'Cancelando...' : 'Confirmar cancelación' }}
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
      .cfdis-table { width:100%;border-collapse:collapse; }
      .cfdis-table thead tr { background:var(--bg-card2); }
      .cfdis-table th { padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:var(--text-muted);white-space:nowrap;border-bottom:1px solid var(--border-light); }
      .cfdis-table td { padding:12px 14px;border-bottom:1px solid var(--border-light);vertical-align:middle; }
      .cfdis-table tbody tr:last-child td { border-bottom:none; }
      .cfdi-row { cursor:pointer;transition:background .1s; }
      .cfdi-row:hover { background:rgba(59,99,217,.04); }
      .col-right { text-align:right; }
      .col-actions { text-align:center;width:1%;white-space:nowrap; }
      .col-uuid { max-width:200px; }
      .col-fecha { white-space:nowrap;font-size:12px;color:var(--text-muted); }

      /* ── Tipo badge ── */
      .tipo-badge { display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:7px;font-family:var(--font-display);font-weight:800;font-size:12px;white-space:nowrap; }
      .tipo-badge-name { font-size:11px;font-weight:600;font-family:var(--font-body); }

      /* ── UUID / Folio ── */
      .uuid-text  { font-family:monospace;font-size:10px;color:var(--text-secondary);word-break:break-all;line-height:1.5; }
      .folio-text { font-size:11px;color:var(--text-muted);margin-top:2px; }

      /* ── Receptor ── */
      .receptor-name { font-size:13px;font-weight:600;color:var(--text-primary); }
      .receptor-rfc  { font-size:11px;color:var(--text-muted);font-family:monospace;margin-top:1px; }

      /* ── Total ── */
      .total-amount { font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary); }
      .total-na     { font-size:12px;color:var(--text-muted); }

      /* ── Estado chips ── */
      .estado-chip { display:inline-flex;align-items:center;gap:4px;padding:4px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap; }
      .estado-timbrado  { background:rgba(5,150,105,.10);color:#059669; }
      .estado-borrador  { background:rgba(245,158,11,.10);color:#b45309; }
      .estado-cancelado { background:rgba(107,114,128,.12);color:#6b7280; }
      .estado-error     { background:rgba(239,68,68,.10);color:#dc2626; }

      /* ── Action buttons ── */
      .action-btns { display:flex;gap:4px;align-items:center;justify-content:center; }
      .act-btn { width:30px;height:30px;border-radius:7px;border:1.5px solid;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;transition:.15s;background:transparent; }
      .act-btn .material-icons-round { font-size:16px; }
      .act-btn:hover { transform:translateY(-1px); }
      .act-xml    { color:#2563eb;border-color:rgba(37,99,235,.25); }
      .act-xml:hover    { background:rgba(37,99,235,.08);border-color:rgba(37,99,235,.5); }
      .act-pdf    { color:#dc2626;border-color:rgba(220,38,38,.25); }
      .act-pdf:hover    { background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.5); }
      .act-edit   { color:#d97706;border-color:rgba(217,119,6,.25); }
      .act-edit:hover   { background:rgba(217,119,6,.08);border-color:rgba(217,119,6,.5); }
      .act-clone  { color:#059669;border-color:rgba(5,150,105,.25); }
      .act-clone:hover  { background:rgba(5,150,105,.08);border-color:rgba(5,150,105,.5); }
      .act-cancel { color:#dc2626;border-color:rgba(220,38,38,.2); }
      .act-cancel:hover { background:rgba(220,38,38,.08);border-color:rgba(220,38,38,.5); }

      /* ── Pagination ── */
      .list-pagination { display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border-light); }
      .pag-info { font-size:13px;color:var(--text-muted); }
      .pag-btns { display:flex;align-items:center;gap:6px; }
      .pag-current { padding:5px 14px;background:var(--accent-light);color:var(--accent);border-radius:var(--radius-sm);font-weight:700;font-size:13px; }

      /* ══ Invoice modal ══ */
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

      /* ── Invoice paper (always white) ── */
      .inv-paper {
        background:#ffffff;border-radius:12px;
        box-shadow:0 8px 40px rgba(0,0,0,.15);
        overflow:hidden;position:relative;color:#1c1c2e;
      }

      /* ── Cancelled watermark ── */
      .inv-watermark {
        position:absolute;top:50%;left:50%;z-index:10;pointer-events:none;
        transform:translate(-50%,-50%) rotate(-28deg);
        font-size:88px;font-weight:900;letter-spacing:.08em;
        color:rgba(220,38,38,.07);font-family:'Plus Jakarta Sans',sans-serif;
        white-space:nowrap;text-transform:uppercase;
      }

      /* ── Invoice header ── */
      .inv-hdr {
        display:flex;align-items:flex-start;justify-content:space-between;
        gap:24px;padding:30px 36px 24px;
      }
      .inv-emisor-col { display:flex;align-items:center;gap:16px;flex:1;min-width:0; }
      .inv-logo {
        width:60px;height:60px;border-radius:14px;
        background:linear-gradient(135deg,#3B63D9,#2044b4);
        color:#fff;display:flex;align-items:center;justify-content:center;
        font-size:26px;font-weight:900;font-family:'Plus Jakarta Sans',sans-serif;
        flex-shrink:0;letter-spacing:-.02em;
      }
      .inv-emisor-info { min-width:0; }
      .inv-razon {
        font-size:18px;font-weight:800;color:#0f0f1e;
        font-family:'Plus Jakarta Sans',sans-serif;line-height:1.2;margin-bottom:6px;
      }
      .inv-rfc-tag {
        display:inline-block;font-family:monospace;font-size:11px;font-weight:700;
        color:#555;background:#f0f0f8;padding:3px 10px;border-radius:5px;
        letter-spacing:.04em;
      }
      .inv-doc-col { text-align:right;flex-shrink:0; }
      .inv-doc-tipo {
        font-size:24px;font-weight:900;color:#0f0f1e;
        font-family:'Plus Jakarta Sans',sans-serif;
        text-transform:uppercase;letter-spacing:.02em;margin-bottom:8px;
      }
      .inv-doc-folio { font-size:15px;font-weight:700;color:#333;margin-bottom:4px; }
      .inv-doc-fecha { font-size:12px;color:#888;margin-bottom:4px; }
      .inv-doc-moneda {
        display:inline-block;font-size:11px;font-weight:700;
        color:#3B63D9;background:rgba(59,99,217,.08);
        padding:3px 10px;border-radius:20px;margin-top:4px;
      }

      /* ── Accent stripe ── */
      .inv-stripe { height:4px;background:linear-gradient(90deg,#3B63D9 0%,#6d93f0 60%,rgba(59,99,217,.1) 100%); }

      /* ── Receptor ── */
      .inv-receptor { padding:20px 36px; }
      .inv-sec-header { display:flex;align-items:center;gap:8px;margin-bottom:10px; }
      .inv-sec-dot { width:8px;height:8px;border-radius:50%;background:#3B63D9;flex-shrink:0; }
      .inv-sec-lbl { font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#888; }
      .inv-receptor-nombre { font-size:16px;font-weight:700;color:#0f0f1e;margin-bottom:4px; }
      .inv-receptor-rfc { font-family:monospace;font-size:12px;color:#666; }

      /* ── Concepts table ── */
      .inv-conceptos { padding:0 0 0 0; }
      .inv-table { width:100%;border-collapse:collapse;font-size:13px; }
      .inv-table thead tr { background:#f4f4fb; }
      .inv-table th {
        padding:10px 14px;font-size:10px;font-weight:700;
        text-transform:uppercase;letter-spacing:.06em;color:#888;
        text-align:left;border-top:1px solid #eaeaf5;border-bottom:2px solid #eaeaf5;
      }
      .inv-table th:first-child { padding-left:36px; }
      .inv-table th:last-child  { padding-right:36px; }
      .inv-table td { padding:12px 14px;border-bottom:1px solid #f0f0f8;color:#333;vertical-align:middle; }
      .inv-table td:first-child { padding-left:36px; }
      .inv-table td:last-child  { padding-right:36px; }
      .inv-table tbody tr:last-child td { border-bottom:none; }
      .inv-row-alt { background:#fafafe; }
      .ta-r   { text-align:right; }
      .td-clave { font-family:monospace;font-size:11px;color:#999;white-space:nowrap; }
      .td-desc  { font-weight:500;color:#222; }
      .td-total { font-weight:700;color:#0f0f1e; }

      /* ── Totals ── */
      .inv-totals {
        padding:16px 36px 20px;
        border-top:2px solid #eaeaf5;background:#fafafe;
        display:flex;flex-direction:column;align-items:flex-end;gap:6px;
      }
      .inv-total-row  { display:flex;gap:80px;justify-content:flex-end;font-size:13px;color:#666;width:300px;justify-content:space-between; }
      .inv-total-lbl  { color:#888; }
      .inv-total-val  { font-weight:600;color:#333; }
      .inv-total-grand {
        display:flex;justify-content:space-between;align-items:center;
        width:300px;padding-top:10px;margin-top:4px;
        border-top:2px solid #d0d0e8;
        font-size:20px;font-weight:900;color:#0f0f1e;
        font-family:'Plus Jakarta Sans',sans-serif;
      }

      /* ── Footer info ── */
      .inv-footer { padding:20px 36px 28px;background:#f7f7fc;border-top:1px solid #eaeaf5; }
      .inv-uuid-block { margin-bottom:14px; }
      .inv-ftr-lbl { font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#aaa;margin-bottom:3px; }
      .inv-uuid-val { font-family:monospace;font-size:11px;color:#555;word-break:break-all;line-height:1.7; }
      .inv-ftr-chips { display:flex;gap:24px;flex-wrap:wrap;margin-bottom:14px; }
      .inv-ftr-chip { display:flex;flex-direction:column;gap:2px; }
      .inv-ftr-val { font-size:12px;font-weight:600;color:#444; }
      .inv-seal { display:flex;align-items:center;gap:5px;font-size:11px;color:#bbb; }

      /* ── Invoice action footer button variants ── */
      .dw-pdf    { color:#dc2626 !important;border-color:rgba(220,38,38,.3) !important; }
      .dw-pdf:hover  { background:rgba(220,38,38,.06) !important; }
      .dw-edit   { color:#d97706 !important;border-color:rgba(217,119,6,.3) !important; }
      .dw-edit:hover { background:rgba(217,119,6,.06) !important; }
      .dw-clone  { color:#059669 !important;border-color:rgba(5,150,105,.3) !important; }
      .dw-clone:hover { background:rgba(5,150,105,.06) !important; }
      .dw-cancel { color:#dc2626 !important;border-color:rgba(220,38,38,.3) !important; }
      .dw-cancel:hover { background:rgba(220,38,38,.06) !important; }

      /* ── Cancel modal ── */
      .modal-overlay { position:fixed;inset:0;z-index:1002;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px; }
      .cancel-modal { background:var(--bg-card);border-radius:16px;width:100%;max-width:460px;padding:24px;box-shadow:0 24px 60px rgba(0,0,0,.3); }
      .cancel-modal-hdr { display:flex;align-items:center;gap:14px;margin-bottom:20px; }
      .cancel-icon-wrap { width:44px;height:44px;border-radius:12px;background:rgba(220,38,38,.1);color:#dc2626;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
      .modal-field-lbl { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);display:block;margin-bottom:6px; }
      .modal-uuid-box  { font-family:monospace;font-size:12px;background:var(--bg-card2);padding:8px 12px;border-radius:6px;word-break:break-all;color:var(--text-secondary);margin-bottom:0; }
      .modal-btn-cancel { background:#dc2626 !important;color:#fff !important;border:none !important; }
      .modal-btn-cancel:disabled { opacity:.6; }
    </style>
  `
})
export class CfdisComponent implements OnInit {
  cfdis:   CfdiList[]    = [];
  rfcs:    RfcList[]     = [];
  loading  = true;
  total    = 0;
  page     = 1;
  pageSize = 20;
  Math     = Math;

  filters: { rfcId?: number; estado: string; tipo: string; desde: string; hasta: string } = {
    estado: '', tipo: '', desde: '', hasta: ''
  };

  /* Invoice modal */
  invoiceOpen   = false;
  drawerLoading = false;
  drawerCfdi:    CfdiList    | null = null;
  drawerDetalle: CfdiDetalle | null = null;

  /* Cancel modal */
  cancelModal:     CfdiList | null = null;
  cancelMotivo     = '02';
  cancelFolioSust  = '';
  cancelLoading    = false;

  constructor(
    private cfdiSvc: CfdiService,
    private rfcSvc:  RfcService,
    private route:   ActivatedRoute,
    private router:  Router
  ) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => this.rfcs = rs);
    const estado = this.route.snapshot.queryParams['estado'];
    if (estado) this.filters.estado = estado;
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cfdiSvc.listar({ ...this.filters, page: this.page, pageSize: this.pageSize })
      .subscribe(r => { this.cfdis = r.data; this.total = r.total; this.loading = false; });
  }

  resetFilters(): void {
    this.filters = { estado: '', tipo: '', desde: '', hasta: '' };
    this.page = 1;
    this.load();
  }

  changePage(p: number): void { this.page = p; this.load(); }

  /* ── Invoice modal ── */
  abrirDetalle(c: CfdiList): void {
    this.drawerCfdi    = c;
    this.drawerDetalle = null;
    this.drawerLoading = true;
    this.invoiceOpen   = true;
    this.cfdiSvc.obtener(c.id).subscribe({
      next:  d => { this.drawerDetalle = d; this.drawerLoading = false; },
      error: () => { this.drawerLoading = false; }
    });
  }

  cerrarDetalle(): void { this.invoiceOpen = false; }

  get totalIva(): number {
    return this.drawerDetalle?.lineas?.reduce((s, l) => s + (l.importeIva ?? 0), 0) ?? 0;
  }

  get hayDescuentos(): boolean {
    return !!this.drawerDetalle?.lineas?.some(l => l.descuento > 0);
  }

  firstLetter(s: string): string {
    return (s ?? '?').trim().charAt(0).toUpperCase();
  }

  /* ── Cancel modal ── */
  abrirCancelar(c: CfdiList): void {
    this.cancelModal     = c;
    this.cancelMotivo    = '02';
    this.cancelFolioSust = '';
    this.cancelLoading   = false;
  }

  confirmarCancelar(): void {
    if (!this.cancelModal) return;
    this.cancelLoading = true;
    this.cfdiSvc.cancelar(
      this.cancelModal.id,
      this.cancelMotivo,
      this.cancelMotivo === '01' ? this.cancelFolioSust : undefined
    ).subscribe({
      next:  () => { this.cancelModal = null; this.cancelLoading = false; this.load(); },
      error: () => { this.cancelLoading = false; }
    });
  }

  /* ── Navigation ── */
  editar(c: CfdiList): void {
    this.router.navigate(['/cfdis/new'], { queryParams: { editarId: c.id } });
  }

  clonar(c: CfdiList): void {
    this.router.navigate(['/cfdis/new'], { queryParams: { clonarId: c.id } });
  }

  descargar(c: CfdiList, tipo: 'xml' | 'pdf'): void {
    const req$ = tipo === 'xml' ? this.cfdiSvc.descargarXml(c.id) : this.cfdiSvc.descargarPdf(c.id);
    req$.subscribe(blob => this.cfdiSvc.descargarArchivo(blob, `${c.uuid}.${tipo}`));
  }

  /* ── Catalog helpers ── */
  formaLabel(clave: string): string {
    const m: Record<string, string> = {
      '01':'Efectivo', '03':'Transferencia electrónica',
      '04':'Tarjeta de crédito', '28':'Tarjeta de débito', '99':'Por definir'
    };
    return m[clave] ?? clave;
  }

  metodoLabel(clave: string): string {
    return clave === 'PUE' ? 'PUE — Una sola exhibición'
         : clave === 'PPD' ? 'PPD — Parcialidades o diferido'
         : clave;
  }

  tipoLabel(tipo: string): string {
    return ({ I:'Ingreso', E:'Egreso', T:'Traslado', N:'Nómina', P:'C.Pago' } as Record<string,string>)[tipo] ?? tipo;
  }

  tipoLabelFull(tipo: string): string {
    return ({
      I:'Ingreso', E:'Egreso', T:'Traslado',
      N:'Nómina', P:'Complemento de Pago'
    } as Record<string,string>)[tipo] ?? tipo;
  }

  tipoColor(tipo: string): { bg: string; text: string } {
    const m: Record<string, { bg: string; text: string }> = {
      I: { bg:'rgba(59,99,217,.10)',   text:'var(--accent)'   },
      E: { bg:'rgba(239,68,68,.10)',   text:'var(--danger)'   },
      T: { bg:'rgba(99,102,241,.10)',  text:'#6366f1'         },
      N: { bg:'rgba(124,58,237,.10)',  text:'#7c3aed'         },
      P: { bg:'rgba(245,158,11,.15)',  text:'#b45309'         },
    };
    return m[tipo] ?? { bg:'var(--bg-card2)', text:'var(--text-muted)' };
  }

  estadoIcon(estado: string): string {
    return ({
      Timbrado:'check_circle', Borrador:'edit',
      Cancelado:'cancel', Error:'error_outline'
    } as Record<string,string>)[estado] ?? 'help';
  }
}
