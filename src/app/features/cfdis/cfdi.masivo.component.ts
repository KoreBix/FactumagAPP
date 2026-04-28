import * as XLSX from 'xlsx';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { from, concatMap, catchError, of, toArray, map, tap } from 'rxjs';
import { RfcService } from '../../core/services/RFC/RfcService';
import { RfcList } from '../../core/models/RFC/RfcList';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { EmitirCfdiRequest } from '../../core/models/CFDI/EmitirCfdiRequest';

// ── Interfaces ────────────────────────────────────────────────────────────────
interface CfdiImport {
  receptorRfc: string; receptorNombre: string; receptorCp: string;
  receptorRegimen: string; usoCfdi: string; tipoComprobante: string;
  formaPago: string; metodoPago: string; moneda: string;
  lugarExpedicion: string; serie: string;
  claveProdServ: string; claveUnidad: string; unidad: string;
  descripcion: string; cantidad: number; precioUnitario: number;
  descuento: number; tasaIva: number;
}
interface BulkRow {
  rowNum: number;
  raw: Record<string, string>;
  parsed?: CfdiImport;
  errors: Record<string, string>;
  valid: boolean;
}
interface ImportResult {
  fila: number; receptor: string;
  exito: boolean; uuid?: string | null; error?: string;
}

// ── SAT catalogs ──────────────────────────────────────────────────────────────
const TIPOS_COMPROBANTE_SAT = ['I','E','T','N','P'];
const FORMAS_PAGO_SAT = ['01','02','03','04','05','06','08','12','13','14',
                          '15','17','23','24','25','26','27','28','29','30','31','99'];
const METODOS_PAGO_SAT = ['PUE','PPD'];
const MONEDAS_SAT = ['MXN','USD','EUR','GBP','JPY','CAD','CHF','AUD'];
const USOS_CFDI_SAT = ['G01','G02','G03','I01','I02','I03','I04','I05','I06','I07','I08',
                        'D01','D02','D03','D04','D05','D06','D07','D08','D09','D10',
                        'S01','CP01','CN01'];
const REGIMENES_SAT = ['601','603','605','606','607','608','610','611','612','614',
                        '615','616','620','621','622','623','624','625','626','628','629','630'];
const TASAS_IVA_SAT = ['0','0.08','0.16'];

// ── Template headers / example ────────────────────────────────────────────────
const TPL_HEADERS = [
  'receptorRfc','receptorNombre','receptorCp','receptorRegimen','usoCfdi',
  'tipoComprobante','formaPago','metodoPago','moneda','lugarExpedicion','serie',
  'claveProdServ','claveUnidad','unidad','descripcion',
  'cantidad','precioUnitario','descuento','tasaIva'
];
const TPL_EXAMPLE = [
  'XAXX010101000','PÚBLICO EN GENERAL','06600','616','S01',
  'I','03','PUE','MXN','06600','A',
  '84111506','E48','Servicio','Servicio de consultoría',
  '1','5000.00','0','0.16'
];

@Component({
  selector: 'app-cfdi-masivo',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `

    <!-- ══════════════════════════════════════════════════════════════════════
         OVERLAY / MODAL — estructura idéntica al modal de empleados
    ══════════════════════════════════════════════════════════════════════════ -->
    <div class="bm-overlay">
      <div class="bm-modal">

        <!-- ── Header con steps ──────────────────────────────────────────── -->
        <div class="bm-header">
          <div class="bm-steps">
            <div class="bm-step"
                 [class.bm-step-active]="bulkStep==='upload'||bulkStep==='editor'"
                 [class.bm-step-done]="bulkStep==='preview'||bulkStep==='done'">
              <div class="bm-step-circle">{{ (bulkStep==='preview'||bulkStep==='done') ? '✓' : '1' }}</div>
              <span>{{ bulkStep==='editor' ? 'Editor en línea' : 'Subir archivo' }}</span>
            </div>
            <div class="bm-step-line"></div>
            <div class="bm-step"
                 [class.bm-step-active]="bulkStep==='preview'"
                 [class.bm-step-done]="bulkStep==='done'">
              <div class="bm-step-circle">{{ bulkStep==='done' ? '✓' : '2' }}</div>
              <span>Vista previa</span>
            </div>
            <div class="bm-step-line"></div>
            <div class="bm-step" [class.bm-step-active]="bulkStep==='done'">
              <div class="bm-step-circle">3</div>
              <span>Resultados</span>
            </div>
          </div>
          <button class="bm-close-btn" (click)="cerrar()">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <!-- ══ STEP 1: UPLOAD ════════════════════════════════════════════ -->
        <div *ngIf="bulkStep==='upload'" class="bm-body">

          <!-- Selector de RFC -->
          <div style="margin-bottom:20px">
            <label style="display:block;font-size:12px;font-weight:700;color:var(--text-secondary);text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px">
              RFC Emisor
            </label>
            <div class="lf-sel-wrap" style="width:100%">
              <select class="lf-ctrl" [(ngModel)]="rfcIdSeleccionado" style="width:100%">
                <option [value]="0">— Selecciona el RFC desde el que emitirás —</option>
                <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
              </select>
              <span class="material-icons-round lf-ico">expand_more</span>
            </div>
            <div *ngIf="!rfcIdSeleccionado" style="margin-top:6px;font-size:12px;color:#f59e0b;display:flex;align-items:center;gap:4px">
              <span class="material-icons-round" style="font-size:14px">warning_amber</span>
              Selecciona un RFC para poder continuar.
            </div>
          </div>

          <div class="bm-two-col">

            <!-- Descargar plantilla -->
            <div class="bm-card">
              <div class="bm-card-icon" style="background:#eff6ff;color:#3b82f6">
                <span class="material-icons-round">download</span>
              </div>
              <div class="bm-card-title">1. Descarga la plantilla</div>
              <div class="bm-card-desc">
                Llena los datos de tus facturas en el formato correcto.
                La plantilla incluye catálogos SAT y un ejemplo de referencia.
              </div>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                <button class="btn-mag btn-primary btn-sm" (click)="downloadExcelTemplate()">
                  <span class="material-icons-round" style="font-size:15px">download</span>
                  Excel (.xlsx)
                </button>
                <button class="btn-mag btn-ghost btn-sm" (click)="downloadCsvTemplate()">
                  <span class="material-icons-round" style="font-size:15px">table_chart</span>
                  CSV
                </button>
              </div>
            </div>

            <!-- Subir archivo -->
            <div class="bm-card">
              <div class="bm-card-icon" style="background:#f0fdf4;color:#10b981">
                <span class="material-icons-round">upload_file</span>
              </div>
              <div class="bm-card-title">2. Sube tu archivo</div>
              <div class="bm-card-desc">
                Formatos aceptados: <strong>.xlsx · .csv · .tsv</strong><br>
                Sube directo el Excel de la plantilla sin convertirlo.
              </div>
              <div class="bm-drop-zone"
                   [class.bm-drag-over]="dragOver"
                   (dragover)="$event.preventDefault(); dragOver=true"
                   (dragleave)="dragOver=false"
                   (drop)="onDrop($event)"
                   (click)="rfcIdSeleccionado ? fileInputRef.click() : null"
                   [style.opacity]="rfcIdSeleccionado ? 1 : 0.4"
                   [style.cursor]="rfcIdSeleccionado ? 'pointer' : 'not-allowed'"
                   style="margin-top:12px">
                <span class="material-icons-round" style="font-size:32px;color:var(--text-muted)">cloud_upload</span>
                <div style="font-size:13px;color:var(--text-secondary);margin-top:6px">
                  <strong>Arrastra aquí</strong> o haz clic para seleccionar
                </div>
              </div>
              <input #fileInputRef type="file" accept=".xlsx,.xls,.csv,.tsv,.txt" style="display:none"
                     (change)="onFileChange($event)">
            </div>
          </div>

          <!-- Editor en línea -->
          <div style="margin-top:16px;padding:14px 18px;background:linear-gradient(135deg,rgba(59,99,217,.06) 0%,rgba(59,99,217,.02) 100%);border:1.5px solid rgba(59,99,217,.18);border-radius:10px;display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div>
              <div style="font-weight:700;font-size:13px;color:var(--text-primary);display:flex;align-items:center;gap:6px">
                <span class="material-icons-round" style="font-size:16px;color:var(--accent)">table_view</span>
                Editor en línea
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:3px">
                Llena o pega desde Excel directamente en el navegador, sin descargar ni subir archivos.
              </div>
            </div>
            <button class="btn-mag btn-primary" style="white-space:nowrap;flex-shrink:0"
                    [disabled]="!rfcIdSeleccionado"
                    (click)="openEditor()">
              <span class="material-icons-round" style="font-size:16px">edit_note</span>
              Abrir editor
            </button>
          </div>

          <!-- Referencia de columnas -->
          <div class="bm-columns-ref">
            <div class="bm-columns-ref-title">Columnas requeridas en la plantilla</div>
            <div class="bm-columns-grid">
              <div *ngFor="let col of REQUIRED_COLS" class="bm-col-chip bm-col-required">{{ col }}</div>
              <div *ngFor="let col of OPTIONAL_COLS" class="bm-col-chip bm-col-optional">{{ col }}</div>
            </div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
              <span style="background:#fee2e2;color:#dc2626;padding:1px 5px;border-radius:3px;font-size:10px">rojo = obligatorio</span>
              &nbsp;
              <span style="background:var(--bg-card2);color:var(--text-muted);padding:1px 5px;border-radius:3px;font-size:10px">gris = opcional</span>
            </div>
          </div>
        </div>

        <!-- ══ STEP EDITOR: INLINE ═══════════════════════════════════════ -->
        <div *ngIf="bulkStep==='editor'" style="display:flex;flex-direction:column;flex:1;overflow:hidden">

          <!-- Toolbar -->
          <div style="padding:10px 20px;border-bottom:1px solid var(--border-light);background:var(--bg-card2);flex-shrink:0;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted)">
              <span class="material-icons-round" style="font-size:15px;color:var(--accent)">info</span>
              Escribe o pega desde Excel (Ctrl+V en cualquier celda).
              Campos <span style="color:#dc2626;font-weight:700;margin:0 2px">*</span> son obligatorios.
            </div>
            <div style="margin-left:auto;display:flex;align-items:center;gap:10px">
              <span *ngIf="editorHasErrors" style="font-size:12px;color:#ef4444;font-weight:600;display:flex;align-items:center;gap:4px">
                <span class="material-icons-round" style="font-size:14px">error_outline</span>
                Corrige los campos en rojo
              </span>
              <span style="font-size:12px;color:var(--text-secondary);font-weight:600">
                {{ editorFilledRows }} fila(s) con datos
              </span>
            </div>
          </div>

          <!-- Tabla editable -->
          <div style="overflow:auto;flex:1" (paste)="onEditorPaste($event)">
            <table class="ed-table">
              <thead>
                <tr>
                  <th class="ed-th ed-th-num">#</th>
                  <th *ngFor="let lbl of EDITOR_COL_LABELS; let ci=index"
                      class="ed-th"
                      [style.min-width.px]="EDITOR_COL_WIDTHS[ci]"
                      [title]="TPL_HEADERS[ci]">
                    {{ lbl }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of editorRows; let ri=index; trackBy:editorTrackRow">
                  <td class="ed-td ed-td-num">{{ ri + 1 }}</td>
                  <td *ngFor="let lbl of EDITOR_COL_LABELS; let ci=index"
                      class="ed-td"
                      [class.ed-td-filled]="row[ci]?.trim()"
                      [class.ed-td-focus]="editorFocused.ri===ri && editorFocused.ci===ci"
                      [class.ed-td-error]="editorErrors[ri]?.[ci]"
                      [title]="editorErrors[ri]?.[ci] || ''">
                    <!-- Catálogo → select -->
                    <select *ngIf="EDITOR_SELECT_OPTS[ci]"
                            class="ed-select"
                            (focus)="onEditorFocus(ri, ci)"
                            (change)="onEditorSelect(ri, ci, $any($event.target).value)">
                      <option value="" [selected]="!row[ci]">— Selecciona —</option>
                      <option *ngFor="let opt of EDITOR_SELECT_OPTS[ci]"
                              [value]="opt.value"
                              [selected]="opt.value === row[ci]">
                        {{ opt.label }}
                      </option>
                    </select>
                    <!-- Texto libre -->
                    <input *ngIf="!EDITOR_SELECT_OPTS[ci]"
                           class="ed-input"
                           [class.ed-input-mono]="EDITOR_MONO_COLS.has(ci)"
                           [value]="row[ci]"
                           (focus)="onEditorFocus(ri, ci)"
                           (input)="onEditorInput(ri, ci, $any($event.target).value)"
                           autocomplete="off" spellcheck="false">
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ══ STEP 2: PREVIEW ════════════════════════════════════════════ -->
        <div *ngIf="bulkStep==='preview'" class="bm-body bm-body-preview">

          <!-- Resumen -->
          <div class="bm-preview-summary">
            <div class="bm-ps-item bm-ps-ok">
              <span class="material-icons-round" style="font-size:20px">check_circle</span>
              <div>
                <div class="bm-ps-num">{{ bulkValidos.length }}</div>
                <div class="bm-ps-lbl">Listos para emitir</div>
              </div>
            </div>
            <div class="bm-ps-item bm-ps-err" *ngIf="bulkConErrores.length > 0">
              <span class="material-icons-round" style="font-size:20px">error_outline</span>
              <div>
                <div class="bm-ps-num">{{ bulkConErrores.length }}</div>
                <div class="bm-ps-lbl">Con errores (no se emitirán)</div>
              </div>
            </div>
            <div class="bm-ps-item" style="background:var(--bg-card2)">
              <span class="material-icons-round" style="font-size:20px;color:var(--text-muted)">table_rows</span>
              <div>
                <div class="bm-ps-num" style="color:var(--text-secondary)">{{ bulkRows.length }}</div>
                <div class="bm-ps-lbl">Total filas procesadas</div>
              </div>
            </div>
          </div>

          <!-- Tabla preview -->
          <div class="bm-table-wrap">
            <table class="bm-table">
              <thead>
                <tr>
                  <th style="width:40px">#</th>
                  <th style="width:36px"></th>
                  <th>RFC Receptor</th>
                  <th>Nombre Receptor</th>
                  <th>Descripción</th>
                  <th style="text-align:right">Cant.</th>
                  <th style="text-align:right">Precio</th>
                  <th style="text-align:right">Subtotal</th>
                  <th style="text-align:right">IVA</th>
                  <th style="text-align:right">Total</th>
                  <th>Errores</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of bulkRows"
                    [class.bm-row-ok]="row.valid"
                    [class.bm-row-err]="!row.valid">
                  <td style="color:var(--text-muted);font-size:11px">{{ row.rowNum }}</td>
                  <td>
                    <span *ngIf="row.valid" class="bm-status-ok">
                      <span class="material-icons-round" style="font-size:14px">check</span>
                    </span>
                    <span *ngIf="!row.valid" class="bm-status-err">
                      <span class="material-icons-round" style="font-size:14px">close</span>
                    </span>
                  </td>
                  <td style="font-family:monospace;font-size:11px">{{ row.raw['receptorRfc'] || '—' }}</td>
                  <td style="font-weight:600;max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    {{ row.raw['receptorNombre'] || '—' }}
                  </td>
                  <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px">
                    {{ row.raw['descripcion'] || '—' }}
                  </td>
                  <td style="text-align:right;font-size:12px">{{ row.raw['cantidad'] || '—' }}</td>
                  <td style="text-align:right;font-family:var(--font-display);font-size:12px">{{ formatMoney(row.raw['precioUnitario']) }}</td>
                  <td style="text-align:right;font-family:var(--font-display);font-size:12px">{{ calcSubtotal(row.raw) | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                  <td style="text-align:right;font-size:12px;color:var(--text-muted)">{{ calcIva(row.raw) | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                  <td style="text-align:right;font-family:var(--font-display);font-weight:700;font-size:12px">{{ calcTotal(row.raw) | currency:'MXN':'symbol-narrow':'1.2-2' }}</td>
                  <td>
                    <div *ngIf="row.valid" style="font-size:11px;color:#10b981">Sin errores</div>
                    <div *ngFor="let e of getErrorEntries(row.errors)" class="bm-err-chip">
                      <strong>{{ e.campo }}:</strong> {{ e.msg }}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- ══ STEP 3: DONE ════════════════════════════════════════════════ -->
        <div *ngIf="bulkStep==='done'" class="bm-body">
          <div class="bm-done-header">
            <div class="bm-done-icon">
              <span class="material-icons-round" style="font-size:36px;color:#10b981">check_circle</span>
            </div>
            <div class="bm-done-title">Emisión completada</div>
            <div class="bm-done-sub">
              <span class="bm-done-ok-badge">✓ {{ importOk }} timbrado{{ importOk !== 1 ? 's' : '' }}</span>
              <span *ngIf="importErr > 0" class="bm-done-err-badge">✗ {{ importErr }} fallido{{ importErr !== 1 ? 's' : '' }}</span>
            </div>
          </div>

          <div class="bm-results-list">
            <div *ngFor="let r of importResults" class="bm-result-row"
                 [class.bm-result-ok]="r.exito"
                 [class.bm-result-err]="!r.exito">
              <span class="material-icons-round" style="font-size:16px;flex-shrink:0">
                {{ r.exito ? 'check_circle' : 'cancel' }}
              </span>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                  {{ r.receptor }}
                </div>
                <div *ngIf="r.exito && r.uuid" style="font-size:11px;color:#059669;font-family:monospace;margin-top:1px">{{ r.uuid }}</div>
                <div *ngIf="!r.exito" style="font-size:11px;color:#dc2626;margin-top:2px">{{ r.error }}</div>
              </div>
              <span style="font-size:11px;color:var(--text-muted);flex-shrink:0">Fila {{ r.fila }}</span>
            </div>
          </div>
        </div>

        <!-- ── Footer ─────────────────────────────────────────────────────── -->
        <div class="bm-footer">

          <!-- Upload step -->
          <ng-container *ngIf="bulkStep==='upload'">
            <button class="btn-mag btn-ghost" (click)="cerrar()">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span>
              Volver
            </button>
            <span></span>
          </ng-container>

          <!-- Editor step -->
          <ng-container *ngIf="bulkStep==='editor'">
            <button class="btn-mag btn-ghost" (click)="bulkStep='upload'">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span>
              Volver
            </button>
            <button class="btn-mag btn-primary"
                    [disabled]="editorFilledRows===0 || editorHasErrors"
                    (click)="submitEditor()">
              <span class="material-icons-round" style="font-size:16px">fact_check</span>
              Vista previa · {{ editorFilledRows }} fila(s)
            </button>
          </ng-container>

          <!-- Preview step -->
          <ng-container *ngIf="bulkStep==='preview'">
            <button class="btn-mag btn-ghost" (click)="volverDesdePreview()">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span>
              {{ bulkSource==='editor' ? 'Volver al editor' : 'Volver' }}
            </button>
            <div style="display:flex;align-items:center;gap:10px">
              <span *ngIf="bulkConErrores.length > 0" style="font-size:12px;color:#f59e0b">
                <span class="material-icons-round" style="font-size:14px;vertical-align:middle">warning</span>
                {{ bulkConErrores.length }} fila(s) con errores serán omitidas
              </span>
              <button class="btn-mag btn-primary"
                      [disabled]="importing || bulkValidos.length === 0"
                      (click)="importarValidos()">
                <span *ngIf="importing" class="material-icons-round" style="animation:spin 1s linear infinite;font-size:16px">refresh</span>
                <span *ngIf="!importing" class="material-icons-round" style="font-size:16px">receipt_long</span>
                {{ importing ? 'Emitiendo ' + importProgress + '%…' : 'Emitir ' + bulkValidos.length + ' CFDI(s)' }}
              </button>
            </div>
          </ng-container>

          <!-- Done step -->
          <ng-container *ngIf="bulkStep==='done'">
            <button class="btn-mag btn-ghost" (click)="resetear()">
              Nueva carga
            </button>
            <div style="display:flex;gap:8px">
              <button *ngIf="importErr > 0" class="btn-mag btn-outline"
                      (click)="corregirEnEditor()"
                      style="border-color:#ef4444;color:#ef4444">
                <span class="material-icons-round" style="font-size:16px">edit_note</span>
                Corregir {{ importErr }} error(es)
              </button>
              <button class="btn-mag btn-primary" (click)="cerrar()">
                <span class="material-icons-round" style="font-size:16px">receipt_long</span>
                Ver facturas
              </button>
            </div>
          </ng-container>

        </div>

      </div>
    </div>

    <style>
      @keyframes spin { to { transform: rotate(360deg); } }

      /* ── Overlay y modal (idéntico a empleados) ── */
      .bm-overlay {
        position:fixed; inset:0; background:rgba(0,0,0,.55);
        z-index:1000; display:flex; align-items:center; justify-content:center;
        padding:20px; backdrop-filter:blur(3px);
      }
      .bm-modal {
        background:var(--surface); border-radius:14px; box-shadow:0 24px 60px rgba(0,0,0,.25);
        width:100%; height:100%;
        display:flex; flex-direction:column; overflow:hidden;
      }

      /* ── Header / steps ── */
      .bm-header {
        display:flex; align-items:center; justify-content:space-between;
        padding:16px 24px; border-bottom:1px solid var(--border-light);
        background:var(--bg-card2); flex-shrink:0;
      }
      .bm-steps { display:flex; align-items:center; gap:0; }
      .bm-step  { display:flex; align-items:center; gap:8px; font-size:13px; color:var(--text-muted); }
      .bm-step-circle {
        width:26px; height:26px; border-radius:50%; background:var(--border-light);
        color:var(--text-muted); display:flex; align-items:center; justify-content:center;
        font-size:12px; font-weight:700;
      }
      .bm-step-active .bm-step-circle { background:var(--accent); color:#fff; }
      .bm-step-active { color:var(--text-primary); font-weight:600; }
      .bm-step-done .bm-step-circle { background:#10b981; color:#fff; }
      .bm-step-done { color:#10b981; }
      .bm-step-line { width:48px; height:2px; background:var(--border-light); margin:0 12px; }
      .bm-close-btn {
        width:32px; height:32px; border-radius:8px; border:none; background:transparent;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        color:var(--text-muted);
      }
      .bm-close-btn:hover { background:var(--border-light); color:var(--text-primary); }

      /* ── Body ── */
      .bm-body { padding:24px; overflow-y:auto; flex:1; }
      .bm-body-preview { padding:20px 0; display:flex; flex-direction:column; gap:0; }

      /* ── Upload cards ── */
      .bm-two-col { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      @media(max-width:700px) { .bm-two-col { grid-template-columns:1fr; } }
      .bm-card {
        background:var(--bg-card2); border:1px solid var(--border-light);
        border-radius:12px; padding:20px; display:flex; flex-direction:column; gap:6px;
      }
      .bm-card-icon {
        width:44px; height:44px; border-radius:10px; display:flex;
        align-items:center; justify-content:center; margin-bottom:4px;
      }
      .bm-card-icon .material-icons-round { font-size:22px; }
      .bm-card-title { font-size:15px; font-weight:700; color:var(--text-primary); }
      .bm-card-desc  { font-size:13px; color:var(--text-secondary); line-height:1.5; }
      .bm-drop-zone {
        border:2px dashed var(--border); border-radius:10px; padding:24px;
        text-align:center; transition:.15s;
      }
      .bm-drop-zone:hover { border-color:var(--accent); background:var(--accent-light); }
      .bm-drag-over  { border-color:var(--accent); background:var(--accent-light); }

      /* ── Columnas referencia ── */
      .bm-columns-ref {
        margin-top:20px; padding:16px; background:var(--bg-card2);
        border-radius:10px; border:1px solid var(--border-light);
      }
      .bm-columns-ref-title { font-size:12px; font-weight:700; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:.04em; }
      .bm-columns-grid { display:flex; flex-wrap:wrap; gap:6px; }
      .bm-col-chip { padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; font-family:monospace; }
      .bm-col-required { background:#fee2e2; color:#dc2626; }
      .bm-col-optional  { background:var(--bg-card2); color:var(--text-muted); border:1px solid var(--border-light); }

      /* ── Preview summary ── */
      .bm-preview-summary {
        display:flex; gap:12px; padding:0 20px 16px; flex-wrap:wrap; flex-shrink:0;
      }
      .bm-ps-item {
        display:flex; align-items:center; gap:10px; padding:12px 16px;
        border-radius:10px; flex:1; min-width:160px;
      }
      .bm-ps-ok  { background:#d1fae5; color:#059669; }
      .bm-ps-err { background:#fee2e2; color:#dc2626; }
      .bm-ps-num { font-size:22px; font-weight:800; font-family:var(--font-display); line-height:1; }
      .bm-ps-lbl { font-size:11px; font-weight:500; margin-top:2px; }

      /* ── Preview table ── */
      .bm-table-wrap { overflow-x:auto; flex:1; }
      .bm-table { width:100%; border-collapse:collapse; font-size:12px; min-width:1000px; }
      .bm-table th {
        padding:8px 12px; text-align:left; font-size:10px; font-weight:700;
        color:var(--text-muted); text-transform:uppercase; letter-spacing:.05em;
        background:var(--bg-card2); border-bottom:1px solid var(--border-light);
        position:sticky; top:0; z-index:1; white-space:nowrap;
      }
      .bm-table td { padding:8px 12px; border-bottom:1px solid var(--border-light); vertical-align:top; }
      .bm-row-ok  { background:rgba(16,185,129,.04); }
      .bm-row-err { background:rgba(239,68,68,.05); }
      .bm-status-ok  { display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#d1fae5;color:#10b981; }
      .bm-status-err { display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#fee2e2;color:#dc2626; }
      .bm-err-chip { background:#fee2e2;color:#dc2626;border-radius:4px;padding:2px 6px;font-size:10px;margin-bottom:2px;line-height:1.5;word-break:break-word; }

      /* ── Done ── */
      .bm-done-header { text-align:center; padding:12px 0 24px; }
      .bm-done-icon   { margin-bottom:8px; }
      .bm-done-title  { font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:8px; }
      .bm-done-sub    { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
      .bm-done-ok-badge  { background:#d1fae5;color:#059669;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600; }
      .bm-done-err-badge { background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600; }
      .bm-results-list { display:flex; flex-direction:column; gap:6px; max-height:380px; overflow-y:auto; }
      .bm-result-row { display:flex; align-items:flex-start; gap:10px; padding:10px 14px; border-radius:8px; border:1px solid var(--border-light); }
      .bm-result-ok  { border-color:#a7f3d0; background:#f0fdf4; }
      .bm-result-ok  .material-icons-round { color:#10b981; }
      .bm-result-err { border-color:#fca5a5; background:#fef2f2; }
      .bm-result-err .material-icons-round { color:#dc2626; }

      /* ── Inline editor ── */
      .ed-table { border-collapse:collapse; font-size:12px; table-layout:fixed; }
      .ed-th {
        padding:6px 8px; border:1px solid var(--border-light);
        background:var(--bg-card2); color:var(--text-muted);
        font-size:10px; font-weight:700; text-transform:uppercase;
        letter-spacing:.04em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        position:sticky; top:0; z-index:2;
      }
      .ed-th-num { width:36px; min-width:36px; text-align:center; left:0; z-index:3; }
      .ed-td { padding:0; border:1px solid var(--border-light); background:var(--surface); transition:background .1s; }
      .ed-td-num { text-align:center; font-size:11px; color:var(--text-muted); background:var(--bg-card2); position:sticky; left:0; z-index:1; min-width:36px; padding:0 4px; }
      .ed-td-filled { background:var(--surface) !important; }
      .ed-td-focus  { box-shadow:inset 0 0 0 2px var(--accent) !important; }
      .ed-td-error  { background:rgba(239,68,68,.06) !important; box-shadow:inset 0 0 0 1.5px #ef4444 !important; }
      .ed-td-error.ed-td-focus { box-shadow:inset 0 0 0 2px #ef4444 !important; }
      .ed-input {
        width:100%; height:28px; padding:0 6px; border:none;
        background:transparent; color:var(--text-primary);
        font-size:12px; font-family:inherit; outline:none; box-sizing:border-box;
      }
      .ed-input-mono { font-family:monospace; }
      .ed-input:focus { background:rgba(59,99,217,.04); }
      .ed-select {
        width:100%; height:28px; padding:0 4px; border:none;
        background:transparent; color:var(--text-primary);
        font-size:11px; font-family:inherit; outline:none; box-sizing:border-box;
        cursor:pointer; -webkit-appearance:none; appearance:none;
      }
      .ed-select:focus { background:rgba(59,99,217,.04); }

      /* ── Filtros / RFC selector ── */
      .lf-ctrl {
        height:38px; padding:0 12px; background:var(--bg-card2);
        border:1.5px solid var(--border); border-radius:6px;
        color:var(--text-primary); font-size:13px; outline:none;
        box-sizing:border-box; -webkit-appearance:none; appearance:none;
        transition:border-color .15s;
      }
      .lf-ctrl:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
      .lf-sel-wrap { position:relative; display:inline-flex; align-items:center; }
      .lf-sel-wrap .lf-ctrl { padding-right:32px; width:100%; }
      .lf-ico { position:absolute; right:8px; top:50%; transform:translateY(-50%); font-size:18px; color:var(--text-muted); pointer-events:none; }

      /* ── Footer ── */
      .bm-footer {
        display:flex; align-items:center; justify-content:space-between;
        padding:14px 24px; border-top:1px solid var(--border-light);
        background:var(--bg-card2); flex-shrink:0;
      }
    </style>
  `
})
export class CfdiMasivoComponent implements OnInit {
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  rfcs: RfcList[] = [];
  rfcIdSeleccionado = 0;

  bulkStep: 'upload' | 'editor' | 'preview' | 'done' = 'upload';
  bulkSource: 'upload' | 'editor' = 'upload';
  bulkRows: BulkRow[] = [];
  dragOver = false;
  importing = false;
  importProgress = 0;
  importResults: ImportResult[] = [];

  editorRows:   string[][] = [];
  editorErrors: string[][] = [];
  editorFocused = { ri: 0, ci: 0 };

  readonly TPL_HEADERS = TPL_HEADERS;

  readonly EDITOR_COL_LABELS = [
    'RFC Receptor *', 'Nombre Receptor *', 'CP Receptor *', 'Régimen Receptor *', 'Uso CFDI *',
    'Tipo *', 'Forma Pago *', 'Método *', 'Moneda *', 'Lugar Exp. *', 'Serie',
    'Clave Prod/Serv *', 'Clave Unidad *', 'Unidad *', 'Descripción *',
    'Cantidad *', 'Precio Unit. *', 'Descuento', 'Tasa IVA *'
  ];

  readonly EDITOR_COL_WIDTHS = [
    145, 195, 95, 130, 105,
    85, 145, 115, 95, 115, 70,
    125, 125, 105, 215,
    85, 125, 85, 105
  ];

  readonly EDITOR_MONO_COLS = new Set([0, 2, 9, 11, 12]);

  readonly EDITOR_SELECT_OPTS: Record<number, { value: string; label: string }[]> = {
    3: [
      {value:'601',label:'601 – General de Ley P. Morales'},
      {value:'603',label:'603 – P.M. con fines no lucrativos'},
      {value:'605',label:'605 – Sueldos y Salarios'},
      {value:'606',label:'606 – Arrendamiento'},
      {value:'607',label:'607 – Reg. de Enajenación o Adq. Bienes'},
      {value:'608',label:'608 – Demás ingresos'},
      {value:'610',label:'610 – Residentes en el Extranjero'},
      {value:'611',label:'611 – Ingresos por Dividendos'},
      {value:'612',label:'612 – P.F. Actividades Empresariales'},
      {value:'614',label:'614 – Ingresos por Intereses'},
      {value:'615',label:'615 – Obtención de premios'},
      {value:'616',label:'616 – Sin Obligaciones Fiscales'},
      {value:'620',label:'620 – Soc. Coop. Producción'},
      {value:'621',label:'621 – Incorporación Fiscal'},
      {value:'622',label:'622 – Act. Agrícolas, Ganaderas, etc.'},
      {value:'623',label:'623 – Opcional Grupos de Sociedades'},
      {value:'624',label:'624 – Coordinados'},
      {value:'625',label:'625 – Reg. de las Actividades Empresariales'},
      {value:'626',label:'626 – Reg. Simplificado de Confianza'},
      {value:'628',label:'628 – Hidrocarburos'},
      {value:'629',label:'629 – Reg. Fiscales Preferentes'},
      {value:'630',label:'630 – Enajenación de acciones en bolsa'},
    ],
    4: [
      {value:'G01',label:'G01 – Adquisición de mercancias'},
      {value:'G02',label:'G02 – Devoluciones, descuentos o bonificaciones'},
      {value:'G03',label:'G03 – Gastos en general'},
      {value:'I01',label:'I01 – Construcciones'},
      {value:'I02',label:'I02 – Mobiliario y equipo de oficina'},
      {value:'I03',label:'I03 – Equipo de transporte'},
      {value:'I04',label:'I04 – Equipo de cómputo y accesorios'},
      {value:'I05',label:'I05 – Dados, troqueles, moldes'},
      {value:'I06',label:'I06 – Comunicaciones telefónicas'},
      {value:'I07',label:'I07 – Comunicaciones satelitales'},
      {value:'I08',label:'I08 – Otra maquinaria y equipo'},
      {value:'D01',label:'D01 – Honorarios médicos'},
      {value:'D02',label:'D02 – Gastos médicos por incapacidad'},
      {value:'D03',label:'D03 – Gastos funerales'},
      {value:'D04',label:'D04 – Donativos'},
      {value:'D05',label:'D05 – Intereses reales hipotecarios'},
      {value:'D06',label:'D06 – Aportaciones voluntarias al SAR'},
      {value:'D07',label:'D07 – Primas seguros gastos médicos'},
      {value:'D08',label:'D08 – Transportación escolar'},
      {value:'D09',label:'D09 – Depósitos para el ahorro'},
      {value:'D10',label:'D10 – Pagos por servicios educativos'},
      {value:'S01',label:'S01 – Sin efectos fiscales'},
      {value:'CP01',label:'CP01 – Pagos'},
      {value:'CN01',label:'CN01 – Nómina'},
    ],
    5: [
      {value:'I',label:'I – Ingreso'},
      {value:'E',label:'E – Egreso'},
      {value:'T',label:'T – Traslado'},
      {value:'N',label:'N – Nómina'},
      {value:'P',label:'P – Pago'},
    ],
    6: [
      {value:'01',label:'01 – Efectivo'},
      {value:'02',label:'02 – Cheque nominativo'},
      {value:'03',label:'03 – Transferencia electrónica'},
      {value:'04',label:'04 – Tarjeta de crédito'},
      {value:'05',label:'05 – Monedero electrónico'},
      {value:'06',label:'06 – Dinero electrónico'},
      {value:'08',label:'08 – Vales de despensa'},
      {value:'12',label:'12 – Dación en pago'},
      {value:'13',label:'13 – Pago por subrogación'},
      {value:'14',label:'14 – Pago por consignación'},
      {value:'15',label:'15 – Condonación'},
      {value:'17',label:'17 – Compensación'},
      {value:'23',label:'23 – Novación'},
      {value:'24',label:'24 – Confusión'},
      {value:'25',label:'25 – Remisión de deuda'},
      {value:'26',label:'26 – Prescripción o caducidad'},
      {value:'27',label:'27 – A satisfacción del acreedor'},
      {value:'28',label:'28 – Tarjeta de débito'},
      {value:'29',label:'29 – Tarjeta de servicios'},
      {value:'30',label:'30 – Aplicación de anticipos'},
      {value:'31',label:'31 – Intermediario pagos'},
      {value:'99',label:'99 – Por definir'},
    ],
    7: [
      {value:'PUE',label:'PUE – Una sola exhibición'},
      {value:'PPD',label:'PPD – Parcialidades o diferido'},
    ],
    8: [
      {value:'MXN',label:'MXN – Peso mexicano'},
      {value:'USD',label:'USD – Dólar americano'},
      {value:'EUR',label:'EUR – Euro'},
      {value:'GBP',label:'GBP – Libra esterlina'},
      {value:'JPY',label:'JPY – Yen japonés'},
      {value:'CAD',label:'CAD – Dólar canadiense'},
      {value:'CHF',label:'CHF – Franco suizo'},
      {value:'AUD',label:'AUD – Dólar australiano'},
    ],
    18: [
      {value:'0',   label:'0% – Exento / Tasa 0'},
      {value:'0.08',label:'8% – Tasa reducida'},
      {value:'0.16',label:'16% – Tasa general'},
    ],
  };

  readonly REQUIRED_COLS = [
    'receptorRfc','receptorNombre','receptorCp','receptorRegimen','usoCfdi',
    'tipoComprobante','formaPago','metodoPago','moneda','lugarExpedicion',
    'claveProdServ','claveUnidad','unidad','descripcion',
    'cantidad','precioUnitario','tasaIva'
  ];
  readonly OPTIONAL_COLS = ['serie','descuento'];

  get bulkValidos()    { return this.bulkRows.filter(r => r.valid); }
  get bulkConErrores() { return this.bulkRows.filter(r => !r.valid); }
  get importOk()  { return this.importResults.filter(r => r.exito).length; }
  get importErr() { return this.importResults.filter(r => !r.exito).length; }
  get editorFilledRows(): number {
    return this.editorRows.filter(r => r.some(c => c.trim())).length;
  }
  get editorHasErrors(): boolean {
    return this.editorRows.some((row, ri) =>
      row.some(c => c.trim()) && (this.editorErrors[ri] ?? []).some(e => e)
    );
  }
  editorTrackRow(index: number): number { return index; }

  constructor(
    private cfdiSvc: CfdiService,
    private rfcSvc: RfcService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => {
      this.rfcs = rs;
      if (rs.length === 1) this.rfcIdSeleccionado = rs[0].id;
    });
  }

  cerrar(): void {
    this.router.navigate(['/cfdis']);
  }

  // ── Editor ────────────────────────────────────────────────────────────────
  private emptyRow(): string[] {
    const r = Array(TPL_HEADERS.length).fill('');
    r[5]  = 'I';    // tipoComprobante
    r[8]  = 'MXN';  // moneda
    r[18] = '0.16'; // tasaIva
    return r;
  }

  openEditor(): void {
    if (!this.rfcIdSeleccionado) return;
    this.editorRows   = Array.from({ length: 5 }, () => this.emptyRow());
    this.editorErrors = Array.from({ length: 5 }, () => Array(TPL_HEADERS.length).fill(''));
    this.editorFocused = { ri: 0, ci: 0 };
    this.bulkStep = 'editor';
  }

  volverDesdePreview(): void {
    if (this.bulkSource === 'editor') {
      this.bulkStep = 'editor';
    } else {
      this.bulkStep = 'upload';
      this.bulkRows = [];
    }
  }

  resetear(): void {
    this.bulkStep = 'upload';
    this.bulkRows = [];
    this.importResults = [];
    this.editorRows = [];
    this.editorErrors = [];
  }

  onEditorFocus(ri: number, ci: number): void {
    this.editorFocused = { ri, ci };
  }

  onEditorInput(ri: number, ci: number, val: string): void {
    this.editorRows[ri][ci] = val;
    this.validateEditorRow(ri);
    this.ensureEditorEmptyBottom();
  }

  onEditorSelect(ri: number, ci: number, val: string): void {
    this.editorRows[ri][ci] = val;
    this.validateEditorRow(ri);
    this.ensureEditorEmptyBottom();
  }

  onEditorPaste(event: ClipboardEvent): void {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
    const firstCols = (lines[0] ?? '').split('\t');
    if (lines.length === 1 && firstCols.length === 1) return;

    event.preventDefault();
    const { ri: r0, ci: c0 } = this.editorFocused;
    const needed = r0 + lines.length + 5;

    while (this.editorRows.length < needed) {
      const extra = Array.from({ length: 10 }, () => this.emptyRow());
      this.editorRows   = [...this.editorRows,   ...extra];
      this.editorErrors = [...this.editorErrors, ...extra.map(() => Array(TPL_HEADERS.length).fill(''))];
    }

    lines.forEach((line, rOff) => {
      const cols = line.split('\t');
      const tr = r0 + rOff;
      cols.forEach((val, cOff) => {
        const tc = c0 + cOff;
        if (tc < TPL_HEADERS.length) this.editorRows[tr][tc] = val.trim();
      });
    });

    for (let rOff = 0; rOff < lines.length; rOff++) {
      this.validateEditorRow(r0 + rOff);
    }
    this.ensureEditorEmptyBottom();
  }

  private ensureEditorEmptyBottom(): void {
    const last = this.editorRows[this.editorRows.length - 1];
    if (last.some(c => c.trim())) {
      this.editorRows   = [...this.editorRows,   this.emptyRow()];
      this.editorErrors = [...this.editorErrors, Array(TPL_HEADERS.length).fill('')];
    }
  }

  private validateEditorRow(ri: number): void {
    const row = this.editorRows[ri];
    if (!row.some(c => c.trim())) {
      this.editorErrors[ri] = Array(TPL_HEADERS.length).fill('');
      return;
    }
    const errs = Array(TPL_HEADERS.length).fill('');
    for (let ci = 0; ci < TPL_HEADERS.length; ci++) {
      errs[ci] = this.validateField(ci, row[ci] ?? '');
    }
    this.editorErrors[ri] = errs;
  }

  private validateField(ci: number, raw: string): string {
    const v = raw.trim();
    switch (ci) {
      case 0: {
        if (!v) return 'Requerido';
        const u = v.toUpperCase();
        if (u.length < 12 || u.length > 13) return `12-13 chars (tiene ${u.length})`;
        if (!/^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/i.test(u)) return 'Formato inválido';
        return '';
      }
      case 1:  return v ? '' : 'Requerido';
      case 2:  return !v ? 'Requerido' : !/^\d{5}$/.test(v) ? '5 dígitos' : '';
      case 3:  return REGIMENES_SAT.includes(v) ? '' : 'Selecciona uno';
      case 4:  return USOS_CFDI_SAT.includes(v) ? '' : 'Selecciona uno';
      case 5:  return TIPOS_COMPROBANTE_SAT.includes(v) ? '' : 'Selecciona uno';
      case 6:  return FORMAS_PAGO_SAT.includes(v) ? '' : 'Selecciona una';
      case 7:  return METODOS_PAGO_SAT.includes(v) ? '' : 'Selecciona uno';
      case 8:  return MONEDAS_SAT.includes(v) ? '' : 'Selecciona una';
      case 9:  return !v ? 'Requerido' : !/^\d{5}$/.test(v) ? '5 dígitos' : '';
      case 10: return '';
      case 11: return v ? '' : 'Requerido';
      case 12: return v ? '' : 'Requerido';
      case 13: return v ? '' : 'Requerido';
      case 14: return v ? '' : 'Requerida';
      case 15: { const n = parseFloat(v); return (!v || isNaN(n) || n <= 0) ? 'Número > 0' : ''; }
      case 16: { const n = parseFloat(v); return (!v || isNaN(n) || n < 0) ? 'Número ≥ 0' : ''; }
      case 17: { if (!v) return ''; const n = parseFloat(v); return (isNaN(n) || n < 0) ? 'Número ≥ 0' : ''; }
      case 18: return TASAS_IVA_SAT.includes(v) ? '' : 'Selecciona una';
      default: return '';
    }
  }

  submitEditor(): void {
    const filled = this.editorRows.filter(r => r.some(c => c.trim()));
    if (!filled.length) { alert('Agrega al menos una factura.'); return; }
    this.bulkSource = 'editor';
    this.bulkRows = filled.map((cols, i) => {
      const raw: Record<string, string> = {};
      TPL_HEADERS.forEach((h, ci) => { raw[h] = cols[ci]?.trim() ?? ''; });
      const { errors, parsed } = this.validateRow(raw);
      return { rowNum: i + 1, raw, parsed, errors, valid: Object.keys(errors).length === 0 && !!parsed };
    });
    this.bulkStep = 'preview';
  }

  corregirEnEditor(): void {
    const failedFilas = new Set(this.importResults.filter(r => !r.exito).map(r => r.fila));
    const failedRows  = this.bulkRows.filter(r => failedFilas.has(r.rowNum));

    this.editorRows = failedRows.map(row => {
      const p = row.parsed;
      if (p) {
        return [
          p.receptorRfc, p.receptorNombre, p.receptorCp, p.receptorRegimen, p.usoCfdi,
          p.tipoComprobante, p.formaPago, p.metodoPago, p.moneda, p.lugarExpedicion, p.serie,
          p.claveProdServ, p.claveUnidad, p.unidad, p.descripcion,
          String(p.cantidad), String(p.precioUnitario), String(p.descuento), String(p.tasaIva)
        ];
      }
      return TPL_HEADERS.map(h => row.raw[h] ?? '');
    });

    this.editorRows.push(this.emptyRow());
    this.editorErrors = Array.from({ length: this.editorRows.length },
                                   () => Array(TPL_HEADERS.length).fill(''));
    this.editorRows.forEach((_, ri) => {
      if (ri < this.editorRows.length - 1) this.validateEditorRow(ri);
    });
    this.importResults = [];
    this.bulkSource = 'editor';
    this.bulkStep   = 'editor';
  }

  // ── Archivos ──────────────────────────────────────────────────────────────
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
    if (!this.rfcIdSeleccionado) return;
    const file = e.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileChange(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
    (e.target as HTMLInputElement).value = '';
  }

  processFile(file: File): void {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = ev => {
        const data = ev.target?.result as ArrayBuffer;
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
        this.bulkSource = 'upload';
        this.loadFromRows(rows);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    if (!['csv','tsv','txt'].includes(ext)) {
      alert('Formato no soportado. Usa .xlsx, .csv o .tsv');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      this.bulkSource = 'upload';
      const firstLine = text.split('\n')[0] ?? '';
      let sep = ext === 'tsv' ? '\t' : ',';
      if (sep === ',' && firstLine.split('\t').length > firstLine.split(',').length) sep = '\t';
      this.loadFromRows(this.parseCSV(text, sep));
    };
    reader.readAsText(file, 'UTF-8');
  }

  private loadFromRows(allRows: string[][]): void {
    const dataRows = allRows
      .map(r => r.map(c => String(c ?? '').trim()))
      .filter(r => r.some(c => c) && !r[0].startsWith('#'));

    if (dataRows.length < 2) {
      alert('El archivo no tiene datos (necesita al menos encabezado + una fila de datos).');
      return;
    }

    const rawHeaders = dataRows[0].map(h => this.normalizeHeader(h));

    this.editorRows = dataRows.slice(1)
      .filter(cols => {
        const rfcVal = cols[rawHeaders.indexOf('receptorRfc')] ?? '';
        if (rfcVal.includes(':') || rfcVal.includes('→') || rfcVal.includes('Ej')) return false;
        return cols.some(c => c);
      })
      .map(cols => {
        const raw: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => { if (h) raw[h] = cols[idx] ?? ''; });
        return TPL_HEADERS.map(h =>
          raw[h] ?? (h === 'tipoComprobante' ? 'I' : h === 'moneda' ? 'MXN' : h === 'tasaIva' ? '0.16' : '')
        );
      });

    if (!this.editorRows.length) {
      alert('No se encontraron filas de datos válidas en el archivo.');
      return;
    }

    this.editorRows.push(this.emptyRow());
    this.editorErrors = Array.from({ length: this.editorRows.length },
                                   () => Array(TPL_HEADERS.length).fill(''));
    this.editorRows.forEach((_, ri) => {
      if (ri < this.editorRows.length - 1) this.validateEditorRow(ri);
    });
    this.importResults = [];
    this.bulkStep = 'editor';
  }

  private normalizeHeader(h: string): string | undefined {
    const norm = h.toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]/g, '');
    const MAP: Record<string, string> = {
      'receptorrfc': 'receptorRfc', 'rfcreceptor': 'receptorRfc', 'rfc': 'receptorRfc',
      'receptornombre': 'receptorNombre', 'nombrereceptor': 'receptorNombre',
      'nombre': 'receptorNombre', 'razonsocial': 'receptorNombre',
      'receptorcp': 'receptorCp', 'cpreceptor': 'receptorCp', 'cp': 'receptorCp',
      'codigopostal': 'receptorCp',
      'receptorregimen': 'receptorRegimen', 'regimen': 'receptorRegimen',
      'regimenfiscal': 'receptorRegimen',
      'usocfdi': 'usoCfdi', 'uso': 'usoCfdi',
      'tipocomprobante': 'tipoComprobante', 'tipo': 'tipoComprobante',
      'formapago': 'formaPago', 'forma': 'formaPago',
      'metodopago': 'metodoPago', 'metodo': 'metodoPago',
      'moneda': 'moneda',
      'lugarexpedicion': 'lugarExpedicion', 'lugar': 'lugarExpedicion',
      'lugarexp': 'lugarExpedicion',
      'serie': 'serie',
      'claveprodserv': 'claveProdServ', 'claveproducto': 'claveProdServ',
      'prodserv': 'claveProdServ',
      'claveunidad': 'claveUnidad', 'unidadclave': 'claveUnidad',
      'unidad': 'unidad', 'unidadmedida': 'unidad',
      'descripcion': 'descripcion', 'concepto': 'descripcion',
      'cantidad': 'cantidad',
      'precio': 'precioUnitario', 'preciounitario': 'precioUnitario',
      'valorunitario': 'precioUnitario',
      'descuento': 'descuento',
      'tasaiva': 'tasaIva', 'iva': 'tasaIva', 'tasa': 'tasaIva',
    };
    return MAP[norm];
  }

  // ── Validación por fila ───────────────────────────────────────────────────
  private validateRow(raw: Record<string, string>): { errors: Record<string, string>; parsed?: CfdiImport } {
    const errors: Record<string, string> = {};
    const v = (k: string) => (raw[k] ?? '').trim();

    const rfc = v('receptorRfc').toUpperCase();
    if (!rfc) errors['receptorRfc'] = 'requerido';
    else if (rfc.length < 12 || rfc.length > 13) errors['receptorRfc'] = `12-13 chars (tiene ${rfc.length})`;
    else if (!/^[A-Z&Ñ]{3,4}\d{6}[A-Z\d]{3}$/.test(rfc)) errors['receptorRfc'] = 'formato inválido';

    if (!v('receptorNombre')) errors['receptorNombre'] = 'requerido';

    const cp = v('receptorCp');
    if (!cp) errors['receptorCp'] = 'requerido';
    else if (!/^\d{5}$/.test(cp)) errors['receptorCp'] = '5 dígitos requeridos';

    const regimen = v('receptorRegimen');
    if (!regimen) errors['receptorRegimen'] = 'requerido';
    else if (!REGIMENES_SAT.includes(regimen)) errors['receptorRegimen'] = `inválido "${regimen}"`;

    const uso = v('usoCfdi');
    if (!uso) errors['usoCfdi'] = 'requerido';
    else if (!USOS_CFDI_SAT.includes(uso)) errors['usoCfdi'] = `inválido "${uso}"`;

    const tipo = v('tipoComprobante');
    if (!tipo) errors['tipoComprobante'] = 'requerido';
    else if (!TIPOS_COMPROBANTE_SAT.includes(tipo)) errors['tipoComprobante'] = `inválido "${tipo}"`;

    const fp = v('formaPago');
    if (!fp) errors['formaPago'] = 'requerida';
    else if (!FORMAS_PAGO_SAT.includes(fp)) errors['formaPago'] = `inválida "${fp}"`;

    const mp = v('metodoPago');
    if (!mp) errors['metodoPago'] = 'requerido';
    else if (!METODOS_PAGO_SAT.includes(mp)) errors['metodoPago'] = `inválido "${mp}"`;

    const mon = v('moneda');
    if (!mon) errors['moneda'] = 'requerida';
    else if (!MONEDAS_SAT.includes(mon)) errors['moneda'] = `inválida "${mon}"`;

    const le = v('lugarExpedicion');
    if (!le) errors['lugarExpedicion'] = 'requerido';
    else if (!/^\d{5}$/.test(le)) errors['lugarExpedicion'] = '5 dígitos';

    if (!v('claveProdServ'))   errors['claveProdServ'] = 'requerida';
    if (!v('claveUnidad'))     errors['claveUnidad']   = 'requerida';
    if (!v('unidad'))          errors['unidad']        = 'requerida';
    if (!v('descripcion'))     errors['descripcion']   = 'requerida';

    const cant = parseFloat(v('cantidad'));
    if (!v('cantidad') || isNaN(cant) || cant <= 0) errors['cantidad'] = 'número > 0 requerido';

    const precio = parseFloat(v('precioUnitario'));
    if (!v('precioUnitario') || isNaN(precio) || precio < 0) errors['precioUnitario'] = 'número ≥ 0 requerido';

    const descStr = v('descuento');
    const desc = descStr ? parseFloat(descStr) : 0;
    if (descStr && isNaN(desc)) errors['descuento'] = 'número inválido';

    const tasaStr = v('tasaIva');
    const tasa = parseFloat(tasaStr);
    if (!tasaStr || isNaN(tasa) || !TASAS_IVA_SAT.includes(tasaStr)) errors['tasaIva'] = 'usa 0, 0.08 o 0.16';

    if (Object.keys(errors).length > 0) return { errors };

    return {
      errors: {},
      parsed: {
        receptorRfc:      rfc,
        receptorNombre:   v('receptorNombre'),
        receptorCp:       cp,
        receptorRegimen:  regimen,
        usoCfdi:          uso,
        tipoComprobante:  tipo,
        formaPago:        fp,
        metodoPago:       mp,
        moneda:           mon,
        lugarExpedicion:  le,
        serie:            v('serie'),
        claveProdServ:    v('claveProdServ'),
        claveUnidad:      v('claveUnidad'),
        unidad:           v('unidad'),
        descripcion:      v('descripcion'),
        cantidad:         cant,
        precioUnitario:   precio,
        descuento:        isNaN(desc) ? 0 : desc,
        tasaIva:          tasa,
      }
    };
  }

  // ── Importar ──────────────────────────────────────────────────────────────
  importarValidos(): void {
    const validos = this.bulkValidos;
    if (!validos.length) return;
    this.importing = true;
    this.importProgress = 0;

    const total = validos.length;
    const requests$ = validos.map(row =>
      this.cfdiSvc.emitir(this.buildRequest(row.parsed!)).pipe(
        map(r => ({
          fila:     row.rowNum,
          receptor: row.parsed!.receptorNombre,
          exito:    true,
          uuid:     r.uuid
        })),
        catchError(err => of({
          fila:     row.rowNum,
          receptor: row.raw['receptorNombre'] ?? `Fila ${row.rowNum}`,
          exito:    false,
          error:    err?.error?.message ?? err?.error?.detail ?? 'Error al timbrar'
        }))
      )
    );

    let completed = 0;
    from(requests$).pipe(
      concatMap(req$ => req$.pipe(
        tap(() => {
          completed++;
          this.importProgress = Math.round((completed / total) * 100);
        })
      )),
      toArray()
    ).subscribe({
      next: results => {
        this.importResults = results;
        this.importing = false;
        this.bulkStep = 'done';
      },
      error: () => { this.importing = false; }
    });
  }

  private buildRequest(p: CfdiImport): EmitirCfdiRequest {
    return {
      rfcId:            +this.rfcIdSeleccionado,
      tipoComprobante:  p.tipoComprobante,
      formaPago:        p.formaPago,
      metodoPago:       p.metodoPago,
      lugarExpedicion:  p.lugarExpedicion,
      moneda:           p.moneda,
      serie:            p.serie,
      usoCfdi:          p.usoCfdi,
      receptorRfc:      p.receptorRfc,
      receptorNombre:   p.receptorNombre,
      receptorUsoCfdi:  p.usoCfdi,
      receptorRegimen:  p.receptorRegimen,
      receptorCp:       p.receptorCp,
      conceptos: [{
        claveProdServ:  p.claveProdServ,
        claveUnidad:    p.claveUnidad,
        unidad:         p.unidad,
        descripcion:    p.descripcion,
        cantidad:       p.cantidad,
        precioUnitario: p.precioUnitario,
        descuento:      p.descuento,
        tasaIva:        p.tasaIva
      }]
    };
  }

  // ── Plantillas Excel / CSV ────────────────────────────────────────────────
  downloadExcelTemplate(): void {
    const wb = XLSX.utils.book_new();
    const COLS = [
      { header: 'receptorRfc *',      hint: 'RFC del receptor (12-13 chars): XAXX010101000',      width: 22 },
      { header: 'receptorNombre *',   hint: 'Nombre o razón social del receptor',                 width: 30 },
      { header: 'receptorCp *',       hint: 'CP del domicilio fiscal del receptor (5 dígitos)',    width: 18 },
      { header: 'receptorRegimen *',  hint: '616=Sin obligaciones   601=General Ley   626=RESICO', width: 16 },
      { header: 'usoCfdi *',          hint: 'G03=Gastos en general  S01=Sin efectos   G01=Merc.',  width: 14 },
      { header: 'tipoComprobante *',  hint: 'I=Ingreso  E=Egreso  T=Traslado',                    width: 16 },
      { header: 'formaPago *',        hint: '01=Efectivo  03=Transferencia  04=T.Crédito  99=XDef', width: 16 },
      { header: 'metodoPago *',       hint: 'PUE=Una exhibición  PPD=Parcialidades',              width: 14 },
      { header: 'moneda *',           hint: 'MXN  USD  EUR  GBP  → ver hoja Catálogos',           width: 10 },
      { header: 'lugarExpedicion *',  hint: 'CP del domicilio fiscal del emisor (5 dígitos)',      width: 18 },
      { header: 'serie',              hint: 'Serie del CFDI (opcional): A  B  FAC  etc.',          width: 10 },
      { header: 'claveProdServ *',    hint: 'Clave SAT: 84111506  80141600  01010101',             width: 18 },
      { header: 'claveUnidad *',      hint: 'E48=Servicio  H87=Pieza  ACT=Actividad',             width: 16 },
      { header: 'unidad *',           hint: 'Nombre de la unidad: Servicio  Pieza  Hora',          width: 16 },
      { header: 'descripcion *',      hint: 'Descripción del concepto / servicio',                 width: 36 },
      { header: 'cantidad *',         hint: 'Número con decimales: 1  2.5  0.5',                   width: 12 },
      { header: 'precioUnitario *',   hint: 'Precio unitario sin IVA: 1000.00  500.50',            width: 16 },
      { header: 'descuento',          hint: 'Descuento en monto (no en %): 0  100.00',             width: 12 },
      { header: 'tasaIva *',          hint: '0.16=16%  0.08=8%  0=Exento — NO escribas "%"',      width: 14 },
    ];

    const ws = XLSX.utils.aoa_to_sheet([
      COLS.map(c => c.header),
      COLS.map(c => c.hint),
      TPL_EXAMPLE,
    ]);
    ws['!cols'] = COLS.map(c => ({ wch: c.width }));
    ws['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' }];
    XLSX.utils.book_append_sheet(wb, ws, 'Facturas');

    const CAT: (string | number)[][] = [
      ['CAMPO', 'CÓDIGO', 'DESCRIPCIÓN'],
      ['receptorRegimen', '601', 'General de Ley Personas Morales'],
      ['', '603', 'Personas Morales con Fines no Lucrativos'],
      ['', '605', 'Sueldos y Salarios e Ingresos Asimilados'],
      ['', '606', 'Arrendamiento'],
      ['', '612', 'Personas Físicas con Activ. Empresariales'],
      ['', '616', 'Sin Obligaciones Fiscales'],
      ['', '621', 'Incorporación Fiscal'],
      ['', '626', 'Reg. Simplificado de Confianza (RESICO)'],
      [],
      ['usoCfdi', 'G01', 'Adquisición de mercancias'],
      ['', 'G02', 'Devoluciones, descuentos o bonificaciones'],
      ['', 'G03', 'Gastos en general'],
      ['', 'S01', 'Sin efectos fiscales'],
      ['', 'CP01', 'Pagos'],
      ['', 'CN01', 'Nómina'],
      [],
      ['tipoComprobante', 'I', 'Ingreso'],
      ['', 'E', 'Egreso (nota de crédito)'],
      ['', 'T', 'Traslado'],
      ['', 'N', 'Nómina'],
      ['', 'P', 'Pago'],
      [],
      ['formaPago', '01', 'Efectivo'],
      ['', '02', 'Cheque nominativo'],
      ['', '03', 'Transferencia electrónica de fondos'],
      ['', '04', 'Tarjeta de crédito'],
      ['', '28', 'Tarjeta de débito'],
      ['', '99', 'Por definir'],
      [],
      ['metodoPago', 'PUE', 'Pago en una sola exhibición'],
      ['', 'PPD', 'Pago en parcialidades o diferido'],
      [],
      ['moneda', 'MXN', 'Peso mexicano'],
      ['', 'USD', 'Dólar americano'],
      ['', 'EUR', 'Euro'],
      [],
      ['tasaIva', '0', 'Exento / Tasa 0'],
      ['', '0.08', '8% – Tasa reducida (frontera)'],
      ['', '0.16', '16% – Tasa general'],
      [],
      ['claveUnidad', 'E48', 'Unidad de servicio'],
      ['', 'H87', 'Pieza'],
      ['', 'ACT', 'Actividad'],
      ['', 'KGM', 'Kilogramo'],
      ['', 'HUR', 'Hora'],
      ['', 'DAY', 'Día'],
      [],
      ['claveProdServ', '84111506', 'Servicios de consultoría de negocios'],
      ['', '80141600', 'Servicios de administración de empresas'],
      ['', '01010101', 'No existe en el catálogo SAT (uso genérico)'],
    ];

    const wsCat = XLSX.utils.aoa_to_sheet(CAT);
    wsCat['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 50 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Catálogos');

    XLSX.writeFile(wb, 'plantilla_facturas_masivo.xlsx');
  }

  downloadCsvTemplate(): void {
    const content = TPL_HEADERS.join(',') + '\n' + TPL_EXAMPLE.join(',') + '\n';
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'plantilla_facturas_masivo.csv';
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // ── Helpers de preview ────────────────────────────────────────────────────
  calcSubtotal(raw: Record<string, string>): number {
    const cant   = parseFloat(raw['cantidad']       ?? '0') || 0;
    const precio = parseFloat(raw['precioUnitario'] ?? '0') || 0;
    const desc   = parseFloat(raw['descuento']      ?? '0') || 0;
    return Math.max(0, cant * precio - desc);
  }
  calcIva(raw: Record<string, string>): number {
    return this.calcSubtotal(raw) * (parseFloat(raw['tasaIva'] ?? '0') || 0);
  }
  calcTotal(raw: Record<string, string>): number {
    return this.calcSubtotal(raw) + this.calcIva(raw);
  }
  formatMoney(val: string | undefined): string {
    const n = parseFloat(val ?? '');
    return isNaN(n) ? '—' : '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2 });
  }
  getErrorEntries(errors: Record<string, string>): { campo: string; msg: string }[] {
    return Object.entries(errors).map(([campo, msg]) => ({ campo, msg }));
  }

  // ── CSV parser ────────────────────────────────────────────────────────────
  private parseCSV(text: string, sep: string): string[][] {
    const rows: string[][] = [];
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      const fields: string[] = [];
      let inQuotes = false, current = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
          else inQuotes = !inQuotes;
        } else if (ch === sep && !inQuotes) {
          fields.push(current.trim()); current = '';
        } else { current += ch; }
      }
      fields.push(current.trim());
      rows.push(fields);
    }
    return rows;
  }
}
