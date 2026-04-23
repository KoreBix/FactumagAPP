import * as XLSX from 'xlsx';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RfcService } from '../../core/services/RFC/RfcService';
import { RfcList } from '../../core/models/RFC/RfcList';
import { Empleado } from '../../core/services/empleado/empleado';
import { EmpleadoService } from '../../core/services/empleado/empleadoService';

// ── Interfaces locales para carga masiva ────────────────────────────────────
interface EmpleadoImport {
  nombre: string; curp: string; nss: string; numEmpleado: string;
  tipoContrato: string; tipoRegimen: string; periodicidadPago: string;
  registroPatronal: string; entidadFederativa: string; claveEntFed: string;
  riesgoTrabajo: string; salarioBase: number; salarioDiarioIntegrado: number;
  fechaInicioRelLaboral: string;
  departamento?: string; puesto?: string; banco?: string;
  cuentaBancaria?: string; curpPatron?: string;
  percepcionesBase: any[];
}
interface BulkRow {
  rowNum: number;
  raw: Record<string, string>;
  parsed?: EmpleadoImport;
  errors: Record<string, string>;
  valid: boolean;
}
interface ImportResult { fila: number; nombre: string; exito: boolean; error?: string; }

// ── Catálogos SAT ────────────────────────────────────────────────────────────
const TIPOS_CONTRATO   = ['01','02','03','04','05','06','07','08','09','10'];
const TIPOS_REGIMEN    = ['01','02','03','04','05','06','07','08','09','10','11','12','13','14'];
const PERIODICIDADES   = ['01','02','03','04','05','06','09','10'];
const RIESGOS          = ['1','2','3','4','5'];
const CLAVES_ENT_FED   = ['AGU','AGS','BCN','BC','BCS','CAM','CHS','CHI','CMX','CDMX','COA','COL','DGO',
                          'GTO','GRO','HGO','JAL','MEX','MIC','MOR','NAY','NL','OAX',
                          'PUE','QRO','QR','SLP','SIN','SON','TAB','TAM','TLX','VER','YUC','ZAC','NE'];

// ── Cabeceras del CSV de plantilla ───────────────────────────────────────────
const TPL_HEADERS = [
  'nombre','curp','nss','numEmpleado','tipoContrato','tipoRegimen','periodicidadPago',
  'registroPatronal','entidadFederativa','claveEntFed','riesgoTrabajo',
  'salarioBase','salarioDiarioIntegrado','fechaInicioRelLaboral','departamento','puesto','banco','cuentaBancaria','curpPatron'
];
const TPL_EXAMPLE = [
  'JUAN PÉREZ GARCÍA','PEGJ850101HDFRRN01','12345678901','EMP001',
  '01','02','04','Y1234567890','Ciudad de México','CMX',
  '1','1000.00','1160.00','2020-01-15','Sistemas','Programador','072','032180000118359719',''
];
const TPL_CATALOGS = `
# ─── CATÁLOGOS DE REFERENCIA ─────────────────────────────────────────────────
# tipoContrato  : 01=Indefinido 02=Obra 03=Tiempo determinado 04=Temporada
#                 05=Revisión colectiva 06=Rev. contrato ley 07=Por hora
#                 08=Ninguno 09=Otro 10=Jubilado/pensionado
# tipoRegimen   : 02=Sueldos y Salarios 07=Asimilados a salarios 13=Indemnización
#                 14=Jubilados/Pensionados (los más comunes)
# periodicidad  : 01=Diario 02=Semanal 03=Catorcenal 04=Quincenal
#                 05=Mensual 06=Bimestral 09=Comisión 10=Decenal
# riesgoTrabajo : 1=Clase I  2=Clase II  3=Clase III  4=Clase IV  5=Clase V
# claveEntFed   : AGS BC BCS CAM CHS CHI CDMX COA COL DGO GTO GRO HGO JAL MEX
#                 MIC MOR NAY NL OAX PUE QRO QR SLP SIN SON TAB TAM TLX VER YUC ZAC NE
# sdi           : Salario Diario Integrado
# fechaInicio   : formato YYYY-MM-DD  (ej: 2020-01-15)
# cuentaBancaria: CLABE interbancaria 18 dígitos
`.trim();

@Component({
  selector: 'app-empleados-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in">

      <!-- ── Encabezado ──────────────────────────────────────────────────── -->
      <div style="margin-bottom:24px;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Empleados</h1>
          <p style="font-size:14px;color:var(--text-muted);margin-top:4px">
            Catálogo de trabajadores para emisión de nómina
          </p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn-mag btn-outline" (click)="openBulkModal()">
            <span class="material-icons-round" style="font-size:18px">upload</span>
            Carga masiva
          </button>
          <a routerLink="/empleados/new" class="btn-mag btn-primary">
            <span class="material-icons-round" style="font-size:18px">person_add</span>
            Nuevo empleado
          </a>
        </div>
      </div>

      <!-- ── Filtros ─────────────────────────────────────────────────────── -->
      <div class="card-mag" style="margin-bottom:16px">
        <div class="card-body-mag" style="padding:12px 20px">
          <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
            <div class="lf-sel-wrap" style="min-width:260px">
              <select class="lf-ctrl" [(ngModel)]="rfcIdSeleccionado" (change)="cargar()">
                <option [value]="0">— Seleccionar RFC —</option>
                <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
              </select>
              <span class="material-icons-round lf-ico">expand_more</span>
            </div>
            <input type="text" class="lf-ctrl" style="width:220px"
                   placeholder="Buscar por nombre o NSS..." [(ngModel)]="busqueda">
            <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer">
              <input type="checkbox" [(ngModel)]="mostrarInactivos" (change)="cargar()">
              Mostrar inactivos
            </label>
            <span style="font-size:13px;color:var(--text-muted);margin-left:auto">
              {{ empleadosFiltrados.length }} empleado(s)
            </span>
          </div>
        </div>
      </div>

      <!-- ── Loading ─────────────────────────────────────────────────────── -->
      <div *ngIf="loading" style="text-align:center;padding:40px;color:var(--text-muted)">
        <span class="material-icons-round" style="font-size:40px;animation:spin 1s linear infinite;display:block">refresh</span>
        <div style="margin-top:8px">Cargando empleados...</div>
      </div>

      <!-- ── Sin RFC ─────────────────────────────────────────────────────── -->
      <div *ngIf="!loading && rfcIdSeleccionado === 0"
           style="text-align:center;padding:48px;color:var(--text-muted)">
        <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:12px">people</span>
        Selecciona un RFC para ver sus empleados
      </div>

      <!-- ── Sin empleados ───────────────────────────────────────────────── -->
      <div *ngIf="!loading && rfcIdSeleccionado > 0 && empleados.length === 0"
           style="text-align:center;padding:48px;color:var(--text-muted)">
        <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:12px">person_off</span>
        Sin empleados registrados.
        <div style="margin-top:12px">
          <a routerLink="/empleados/new" class="btn-mag btn-primary btn-sm">Agregar primero</a>
        </div>
      </div>

      <!-- ── Tabla ───────────────────────────────────────────────────────── -->
      <div class="card-mag" *ngIf="!loading && empleadosFiltrados.length > 0" style="overflow:hidden">
        <div style="overflow-x:auto">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <thead>
              <tr style="border-bottom:2px solid var(--border-light);background:var(--bg-card2)">
                <th style="padding:10px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Empleado</th>
                <th style="padding:10px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">NSS</th>
                <th style="padding:10px 16px;text-align:left;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Puesto</th>
                <th style="padding:10px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Salario base</th>
                <th style="padding:10px 16px;text-align:right;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">SDI</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Período</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Estado</th>
                <th style="padding:10px 16px;text-align:center;font-weight:600;color:var(--text-muted);font-size:11px;text-transform:uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let e of empleadosFiltrados"
                  style="border-bottom:1px solid var(--border-light)"
                  [style.opacity]="e.activo ? 1 : 0.5">
                <td style="padding:12px 16px">
                  <div style="font-weight:700;font-size:13px">{{ e.nombre }}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ e.curp }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">No. {{ e.numEmpleado }}</div>
                </td>
                <td style="padding:12px 16px;font-family:monospace;font-size:12px">{{ e.nss }}</td>
                <td style="padding:12px 16px">
                  <div>{{ e.puesto || '—' }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">{{ e.departamento }}</div>
                </td>
                <td style="padding:12px 16px;text-align:right;font-family:var(--font-display);font-weight:700">
                  {{ e.salarioBase | currency:'MXN':'symbol-narrow':'1.2-2' }}
                </td>
                <td style="padding:12px 16px;text-align:right;font-size:12px;color:var(--text-muted)">
                  {{ e.salarioDiarioIntegrado | currency:'MXN':'symbol-narrow':'1.2-2' }}
                </td>
                <td style="padding:12px 16px;text-align:center">
                  <span style="background:rgba(59,99,217,0.1);color:var(--accent);padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">
                    {{ getPeriodo(e.periodicidadPago) }}
                  </span>
                </td>
                <td style="padding:12px 16px;text-align:center">
                  <span *ngIf="e.activo" style="background:rgba(16,185,129,0.1);color:#10b981;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">Activo</span>
                  <span *ngIf="!e.activo" style="background:rgba(239,68,68,0.1);color:#ef4444;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600">Inactivo</span>
                </td>
                <td style="padding:12px 16px;text-align:center">
                  <div style="display:flex;gap:4px;justify-content:center">
                    <a [routerLink]="['/empleados', e.id, 'editar']"
                       class="btn-mag btn-ghost btn-sm" style="padding:4px 8px">
                      <span class="material-icons-round" style="font-size:16px">edit</span>
                    </a>
                    <button type="button" class="btn-mag btn-danger btn-sm"
                            style="padding:4px 8px" *ngIf="e.activo"
                            (click)="desactivar(e)">
                      <span class="material-icons-round" style="font-size:16px">person_off</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════════════════════
         MODAL CARGA MASIVA
    ══════════════════════════════════════════════════════════════════════════ -->
    <div *ngIf="showBulkModal" class="bm-overlay">
      <div class="bm-modal">

        <!-- Header con steps ─────────────────────────────────────────────── -->
        <div class="bm-header">
          <div class="bm-steps">
            <div class="bm-step" [class.bm-step-active]="bulkStep==='upload'||bulkStep==='editor'" [class.bm-step-done]="bulkStep==='preview'||bulkStep==='done'">
              <div class="bm-step-circle">{{ (bulkStep==='preview'||bulkStep==='done') ? '✓' : '1' }}</div>
              <span>{{ bulkStep==='editor' ? 'Editor en línea' : 'Subir archivo' }}</span>
            </div>
            <div class="bm-step-line"></div>
            <div class="bm-step" [class.bm-step-active]="bulkStep==='preview'" [class.bm-step-done]="bulkStep==='done'">
              <div class="bm-step-circle">{{ bulkStep==='done' ? '✓' : '2' }}</div>
              <span>Vista previa</span>
            </div>
            <div class="bm-step-line"></div>
            <div class="bm-step" [class.bm-step-active]="bulkStep==='done'">
              <div class="bm-step-circle">3</div>
              <span>Resultados</span>
            </div>
          </div>
          <button class="bm-close-btn" (click)="closeBulkModal()">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <!-- ══ STEP 1: UPLOAD ══════════════════════════════════════════════ -->
        <div *ngIf="bulkStep==='upload'" class="bm-body">
          <div class="bm-two-col">

            <!-- Descargar plantilla -->
            <div class="bm-card">
              <div class="bm-card-icon" style="background:#eff6ff;color:#3b82f6">
                <span class="material-icons-round">download</span>
              </div>
              <div class="bm-card-title">1. Descarga la plantilla</div>
              <div class="bm-card-desc">
                Llena los datos de tus empleados en el formato correcto.
                La plantilla incluye ejemplos y catálogos de referencia.
              </div>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                <button class="btn-mag btn-primary btn-sm" (click)="downloadExcelTemplate()">
                  <span class="material-icons-round" style="font-size:15px">download</span>
                  Excel (.xlsx)
                </button>
                <button class="btn-mag btn-ghost btn-sm" (click)="downloadTemplate('csv')">
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
                Formatos aceptados: <strong>.xlsx · .csv · .tsv · .txt</strong><br>
                Sube directo el Excel de la plantilla sin convertirlo.
              </div>
              <div class="bm-drop-zone"
                   [class.bm-drag-over]="dragOver"
                   (dragover)="$event.preventDefault(); dragOver=true"
                   (dragleave)="dragOver=false"
                   (drop)="onDrop($event)"
                   (click)="fileInputRef.click()"
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
            <button class="btn-mag btn-primary" style="white-space:nowrap;flex-shrink:0" (click)="openEditor()">
              <span class="material-icons-round" style="font-size:16px">edit_note</span>
              Abrir editor
            </button>
          </div>

          <!-- Leyenda de columnas -->
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
                      [title]="EDITOR_HEADERS[ci]">
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
                    <!-- Fecha → datepicker -->
                    <input *ngIf="!EDITOR_SELECT_OPTS[ci] && EDITOR_DATE_COLS.has(ci)"
                           type="date" class="ed-input ed-date"
                           [value]="row[ci]"
                           (focus)="onEditorFocus(ri, ci)"
                           (input)="onEditorInput(ri, ci, $any($event.target).value)">
                    <!-- Texto libre -->
                    <input *ngIf="!EDITOR_SELECT_OPTS[ci] && !EDITOR_DATE_COLS.has(ci)"
                           class="ed-input"
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
                <div class="bm-ps-lbl">Listos para importar</div>
              </div>
            </div>
            <div class="bm-ps-item bm-ps-err" *ngIf="bulkConErrores.length > 0">
              <span class="material-icons-round" style="font-size:20px">error_outline</span>
              <div>
                <div class="bm-ps-num">{{ bulkConErrores.length }}</div>
                <div class="bm-ps-lbl">Con errores (no se importarán)</div>
              </div>
            </div>
            <div class="bm-ps-item" style="background:var(--bg-card2)">
              <span class="material-icons-round" style="font-size:20px;color:var(--text-muted)">table_rows</span>
              <div>
                <div class="bm-ps-num" style="color:var(--text-secondary)">{{ bulkRows.length }}</div>
                <div class="bm-ps-lbl">Total de filas procesadas</div>
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
                  <th>Nombre</th>
                  <th>CURP</th>
                  <th>NSS</th>
                  <th>Contrato</th>
                  <th>Período</th>
                  <th style="text-align:right">Salario</th>
                  <th style="text-align:right">SDI</th>
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
                  <td style="font-weight:600;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    {{ row.raw['nombre'] || '—' }}
                  </td>
                  <td style="font-family:monospace;font-size:10px;letter-spacing:-.3px">
                    {{ row.raw['curp'] || '—' }}
                  </td>
                  <td style="font-family:monospace;font-size:11px">{{ row.raw['nss'] || '—' }}</td>
                  <td style="font-size:11px">{{ row.raw['tipoContrato'] || '—' }}</td>
                  <td style="font-size:11px">{{ getPeriodo(row.raw['periodicidadPago']) }}</td>
                  <td style="text-align:right;font-family:var(--font-display);font-weight:600;font-size:12px">
                    {{ row.raw['salarioBase'] || '—' }}
                  </td>
                  <td style="text-align:right;font-size:11px;color:var(--text-muted)">
                    {{ row.raw['salarioDiarioIntegrado'] || '—' }}
                  </td>
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
            <div class="bm-done-title">Importación completada</div>
            <div class="bm-done-sub">
              <span class="bm-done-ok-badge">✓ {{ importOk }} exitosos</span>
              <span *ngIf="importErr > 0" class="bm-done-err-badge">✗ {{ importErr }} fallidos</span>
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
                  {{ r.nombre }}
                </div>
                <div *ngIf="!r.exito" style="font-size:11px;color:#dc2626;margin-top:2px">{{ r.error }}</div>
              </div>
              <span style="font-size:11px;color:var(--text-muted);flex-shrink:0">Fila {{ r.fila }}</span>
            </div>
          </div>
        </div>

        <!-- ── Footer ─────────────────────────────────────────────────────── -->
        <div class="bm-footer">
          <ng-container *ngIf="bulkStep==='editor'">
            <button class="btn-mag btn-ghost" (click)="bulkStep='upload'">
              <span class="material-icons-round" style="font-size:16px">arrow_back</span>
              Volver
            </button>
            <button class="btn-mag btn-primary" [disabled]="editorFilledRows===0 || editorHasErrors" (click)="submitEditor()">
              <span class="material-icons-round" style="font-size:16px">fact_check</span>
              Importar {{ editorFilledRows }} fila(s)
            </button>
          </ng-container>
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
                <span *ngIf="!importing" class="material-icons-round" style="font-size:16px">cloud_upload</span>
                {{ importing ? 'Importando...' : 'Importar ' + bulkValidos.length + ' empleado(s)' }}
              </button>
            </div>
          </ng-container>
          <ng-container *ngIf="bulkStep==='done'">
            <button class="btn-mag btn-ghost" (click)="bulkStep='upload'; bulkRows=[]; importResults=[]">
              Nueva importación
            </button>
            <div style="display:flex;gap:8px">
              <button *ngIf="importErr > 0" class="btn-mag btn-outline" (click)="corregirEnEditor()"
                      style="border-color:#ef4444;color:#ef4444">
                <span class="material-icons-round" style="font-size:16px">edit_note</span>
                Corregir {{ importErr }} error(es) en editor
              </button>
              <button class="btn-mag btn-primary" (click)="closeBulkModal()">Cerrar</button>
            </div>
          </ng-container>
        </div>

      </div>
    </div>

    <style>
      @keyframes spin { to { transform: rotate(360deg); } }

      /* ── List filter controls ── */
      .lf-ctrl {
        height:38px; padding:0 12px; background:var(--bg-card2);
        border:1.5px solid var(--border); border-radius:6px;
        color:var(--text-primary); font-size:13px; outline:none;
        box-sizing:border-box; -webkit-appearance:none; appearance:none;
        transition:border-color .15s, box-shadow .15s;
      }
      .lf-ctrl:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
      .lf-sel-wrap { position:relative; display:inline-flex; align-items:center; }
      .lf-sel-wrap .lf-ctrl { padding-right:32px; width:100%; }
      .lf-ico { position:absolute; right:8px; top:50%; transform:translateY(-50%); font-size:18px; color:var(--text-muted); pointer-events:none; }

      /* ── Modal overlay ── */
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
        &:hover { background:var(--border-light); color:var(--text-primary); }
      }

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
        align-items:center; justify-content:center;
        margin-bottom:4px;
      }
      .bm-card-icon .material-icons-round { font-size:22px; }
      .bm-card-title { font-size:15px; font-weight:700; color:var(--text-primary); }
      .bm-card-desc  { font-size:13px; color:var(--text-secondary); line-height:1.5; }

      /* ── Drop zone ── */
      .bm-drop-zone {
        border:2px dashed var(--border); border-radius:10px; padding:24px;
        text-align:center; cursor:pointer; transition:.15s;
        &:hover { border-color:var(--accent); background:var(--accent-light); }
      }
      .bm-drag-over { border-color:var(--accent); background:var(--accent-light); }

      /* ── Columns reference ── */
      .bm-columns-ref {
        margin-top:20px; padding:16px; background:var(--bg-card2);
        border-radius:10px; border:1px solid var(--border-light);
      }
      .bm-columns-ref-title { font-size:12px; font-weight:700; color:var(--text-secondary); margin-bottom:10px; text-transform:uppercase; letter-spacing:.04em; }
      .bm-columns-grid { display:flex; flex-wrap:wrap; gap:6px; }
      .bm-col-chip {
        padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600;
        font-family:monospace;
      }
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
      .bm-table {
        width:100%; border-collapse:collapse; font-size:12px;
        min-width:900px;
      }
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

      .bm-err-chip {
        background:#fee2e2; color:#dc2626; border-radius:4px;
        padding:2px 6px; font-size:10px; margin-bottom:2px; line-height:1.5;
        word-break:break-word;
      }

      /* ── Done ── */
      .bm-done-header { text-align:center; padding:12px 0 24px; }
      .bm-done-icon   { margin-bottom:8px; }
      .bm-done-title  { font-size:18px; font-weight:800; color:var(--text-primary); margin-bottom:8px; }
      .bm-done-sub    { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
      .bm-done-ok-badge  { background:#d1fae5;color:#059669;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600; }
      .bm-done-err-badge { background:#fee2e2;color:#dc2626;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600; }

      .bm-results-list { display:flex; flex-direction:column; gap:6px; max-height:380px; overflow-y:auto; }
      .bm-result-row {
        display:flex; align-items:flex-start; gap:10px;
        padding:10px 14px; border-radius:8px; border:1px solid var(--border-light);
      }
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
      .ed-td {
        padding:0; border:1px solid var(--border-light);
        background:var(--surface); transition:background .1s;
      }
      .ed-td-num {
        text-align:center; font-size:11px; color:var(--text-muted);
        background:var(--bg-card2); position:sticky; left:0; z-index:1;
        min-width:36px; padding:0 4px;
      }
      .ed-td-filled { background:var(--surface) !important; }
      .ed-td-focus  { box-shadow:inset 0 0 0 2px var(--accent) !important; }
      .ed-td-error  { background:rgba(239,68,68,.06) !important; box-shadow:inset 0 0 0 1.5px #ef4444 !important; }
      .ed-td-error.ed-td-focus { box-shadow:inset 0 0 0 2px #ef4444 !important; }
      .ed-input {
        width:100%; height:28px; padding:0 6px; border:none;
        background:transparent; color:var(--text-primary);
        font-size:12px; font-family:inherit; outline:none; box-sizing:border-box;
      }
      .ed-input:focus { background:rgba(59,99,217,.04); }
      .ed-select {
        width:100%; height:28px; padding:0 4px; border:none;
        background:transparent; color:var(--text-primary);
        font-size:11px; font-family:inherit; outline:none; box-sizing:border-box;
        cursor:pointer; -webkit-appearance:none; appearance:none;
      }
      .ed-select:focus { background:rgba(59,99,217,.04); }
      .ed-date { cursor:pointer; padding-right:2px; }
      .ed-date::-webkit-calendar-picker-indicator { opacity:.5; cursor:pointer; }

      /* ── Footer ── */
      .bm-footer {
        display:flex; align-items:center; justify-content:space-between;
        padding:14px 24px; border-top:1px solid var(--border-light);
        background:var(--bg-card2); flex-shrink:0;
      }
    </style>
  `
})
export class EmpleadosListaComponent implements OnInit {
  @ViewChild('fileInputRef') fileInputRef!: ElementRef<HTMLInputElement>;

  // ── Lista ────────────────────────────────────────────────────────────────
  rfcs:              RfcList[]  = [];
  empleados:         Empleado[] = [];
  rfcIdSeleccionado  = 0;
  busqueda           = '';
  mostrarInactivos   = false;
  loading            = false;

  // ── Bulk modal ───────────────────────────────────────────────────────────
  showBulkModal = false;
  bulkStep:   'upload' | 'preview' | 'done' | 'editor' = 'upload';
  bulkSource: 'upload' | 'editor' = 'upload';
  bulkRows: BulkRow[] = [];
  dragOver  = false;
  importing = false;
  importResults: ImportResult[] = [];

  // ── Editor en línea ──────────────────────────────────────────────────────
  editorRows:   string[][] = [];
  editorErrors: string[][] = [];
  editorFocused = { ri: 0, ci: 0 };

  readonly EDITOR_HEADERS = TPL_HEADERS;
  readonly EDITOR_COL_LABELS = [
    'Nombre *','CURP *','NSS *','No.Emp *','Contrato *','Régimen *','Período *',
    'Reg.Patronal *','Entidad *','Clave Ent *','Riesgo *',
    'Sal.Base *','SDI *','Fecha Inicio *',
    'Depto','Puesto','Banco','CLABE','CURP Patrón'
  ];
  readonly EDITOR_COL_WIDTHS = [
    200, 160, 110, 90, 150, 150, 130, 130, 180, 120, 110, 100, 100, 130, 110, 100, 65, 155, 110
  ];

  readonly EDITOR_DATE_COLS = new Set([13]); // fechaInicioRelLaboral

  readonly ENTIDADES = [
    {c:'AGU',n:'Aguascalientes'},{c:'BCN',n:'Baja California'},{c:'BCS',n:'Baja California Sur'},
    {c:'CAM',n:'Campeche'},{c:'CHS',n:'Chiapas'},{c:'CHI',n:'Chihuahua'},
    {c:'CMX',n:'Ciudad de México'},{c:'COA',n:'Coahuila'},{c:'COL',n:'Colima'},
    {c:'DGO',n:'Durango'},{c:'GTO',n:'Guanajuato'},{c:'GRO',n:'Guerrero'},
    {c:'HGO',n:'Hidalgo'},{c:'JAL',n:'Jalisco'},{c:'MEX',n:'Estado de México'},
    {c:'MIC',n:'Michoacán'},{c:'MOR',n:'Morelos'},{c:'NAY',n:'Nayarit'},
    {c:'NL',n:'Nuevo León'},{c:'OAX',n:'Oaxaca'},{c:'PUE',n:'Puebla'},
    {c:'QRO',n:'Querétaro'},{c:'QR',n:'Quintana Roo'},{c:'SLP',n:'San Luis Potosí'},
    {c:'SIN',n:'Sinaloa'},{c:'SON',n:'Sonora'},{c:'TAB',n:'Tabasco'},
    {c:'TAM',n:'Tamaulipas'},{c:'TLX',n:'Tlaxcala'},{c:'VER',n:'Veracruz'},
    {c:'YUC',n:'Yucatán'},{c:'ZAC',n:'Zacatecas'},{c:'NE',n:'Nacido en el Extranjero'},
  ];

  EDITOR_SELECT_OPTS: Record<number, { value: string; label: string }[]> = {
    4: [ // tipoContrato
      {value:'01',label:'01 – Por tiempo indeterminado'},
      {value:'02',label:'02 – Para obra determinada'},
      {value:'03',label:'03 – Tiempo determinado'},
      {value:'04',label:'04 – Por temporada'},
      {value:'05',label:'05 – Revisión contrato colectivo'},
      {value:'06',label:'06 – Revisión contrato ley'},
      {value:'07',label:'07 – Por hora trabajada'},
      {value:'08',label:'08 – Ninguno'},
      {value:'09',label:'09 – Otro contrato'},
      {value:'10',label:'10 – Jubilado / Pensionado'},
    ],
    5: [ // tipoRegimen
      {value:'02',label:'02 – Sueldos y Salarios'},
      {value:'07',label:'07 – Asimilados a Salarios'},
      {value:'08',label:'08 – Jubilados'},
      {value:'09',label:'09 – Invalidez y Vida'},
      {value:'10',label:'10 – Trabajadores Sindicalizados'},
      {value:'13',label:'13 – Indemnización o Separación'},
      {value:'14',label:'14 – Jubilados o Pensionados'},
    ],
    6: [ // periodicidadPago
      {value:'01',label:'01 – Diario'},
      {value:'02',label:'02 – Semanal'},
      {value:'03',label:'03 – Catorcenal'},
      {value:'04',label:'04 – Quincenal'},
      {value:'05',label:'05 – Mensual'},
      {value:'06',label:'06 – Bimestral'},
      {value:'09',label:'09 – Comisión'},
      {value:'10',label:'10 – Decenal'},
    ],
    8: [], // entidadFederativa — se llena abajo con ENTIDADES
    9: [], // claveEntFed — se llena abajo con ENTIDADES
    10: [ // riesgoTrabajo
      {value:'1',label:'1 – Clase I (0.54355%)'},
      {value:'2',label:'2 – Clase II (1.13065%)'},
      {value:'3',label:'3 – Clase III (2.59840%)'},
      {value:'4',label:'4 – Clase IV (4.65325%)'},
      {value:'5',label:'5 – Clase V (7.58875%)'},
    ],
  };

  get editorFilledRows(): number {
    return this.editorRows.filter(r => r.some(c => c.trim())).length;
  }

  get editorHasErrors(): boolean {
    return this.editorRows.some((row, ri) =>
      row.some(c => c.trim()) && (this.editorErrors[ri] ?? []).some(e => e)
    );
  }

  editorTrackRow(index: number): number { return index; }

  // ── Catálogos (expuestos al template) ───────────────────────────────────
  readonly REQUIRED_COLS = ['nombre','curp','nss','numEmpleado','tipoContrato','tipoRegimen',
    'periodicidadPago','registroPatronal','entidadFederativa','claveEntFed',
    'riesgoTrabajo','salarioBase','sdi','fechaInicio'];
  readonly OPTIONAL_COLS = ['departamento','puesto','banco','cuentaBancaria','curpPatron'];

  // ── Computados ───────────────────────────────────────────────────────────
  get bulkValidos()    { return this.bulkRows.filter(r => r.valid); }
  get bulkConErrores() { return this.bulkRows.filter(r => !r.valid); }
  get importOk()  { return this.importResults.filter(r => r.exito).length; }
  get importErr() { return this.importResults.filter(r => !r.exito).length; }

  constructor(
    private empleadoSvc: EmpleadoService,
    private rfcSvc:      RfcService
  ) {
    this.EDITOR_SELECT_OPTS[8] = this.ENTIDADES.map(e => ({ value: e.n, label: e.n }));
    this.EDITOR_SELECT_OPTS[9] = this.ENTIDADES.map(e => ({ value: e.c, label: `${e.c} – ${e.n}` }));
  }

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => {
      this.rfcs = rs;
      if (rs.length === 1) { this.rfcIdSeleccionado = rs[0].id; this.cargar(); }
    });
  }

  // ── Lista ────────────────────────────────────────────────────────────────
  cargar(): void {
    if (!this.rfcIdSeleccionado) return;
    this.loading = true;
    this.empleadoSvc.listar(this.rfcIdSeleccionado, !this.mostrarInactivos).subscribe({
      next: es => { this.empleados = es; this.loading = false; },
      error: () => this.loading = false
    });
  }

  get empleadosFiltrados(): Empleado[] {
    const b = this.busqueda.toLowerCase();
    return this.empleados.filter(e =>
      !b || e.nombre.toLowerCase().includes(b) || e.nss.includes(b));
  }

  desactivar(e: Empleado): void {
    if (!confirm(`¿Desactivar a ${e.nombre}?`)) return;
    this.empleadoSvc.desactivar(e.id!).subscribe(() => this.cargar());
  }

  getPeriodo(p: string): string {
    const m: Record<string, string> = {
      '01':'Diario','02':'Semanal','03':'Catorcenal',
      '04':'Quincenal','05':'Mensual','06':'Bimestral','10':'Decenal','09':'Comisión'
    };
    return m[p] ?? p ?? '—';
  }

  // ── Modal ────────────────────────────────────────────────────────────────
  openBulkModal(): void {
    if (!this.rfcIdSeleccionado) {
      alert('Selecciona un RFC antes de hacer la carga masiva.');
      return;
    }
    this.showBulkModal = true;
    this.bulkStep = 'upload';
    this.bulkRows = [];
    this.importResults = [];
  }

  closeBulkModal(): void {
    this.showBulkModal = false;
  }

  private todayISO(): string { return new Date().toISOString().slice(0, 10); }

  private emptyEditorRow(): string[] {
    const r = Array(TPL_HEADERS.length).fill('');
    r[13] = this.todayISO(); // fecha inicio predeterminada = hoy
    return r;
  }

  // ── Editor en línea ─────────────────────────────────────────────────────
  openEditor(): void {
    this.editorRows   = Array.from({ length: 5 }, () => this.emptyEditorRow());
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
    // Sincronizar entidadFederativa ↔ claveEntFed
    if (ci === 8) {
      const ent = this.ENTIDADES.find(e => e.n === val);
      if (ent) this.editorRows[ri][9] = ent.c;
    } else if (ci === 9) {
      const ent = this.ENTIDADES.find(e => e.c === val);
      if (ent) this.editorRows[ri][8] = ent.n;
    }
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
      const extra = Array.from({ length: 10 }, () => this.emptyEditorRow());
      this.editorRows   = [...this.editorRows,   ...extra];
      this.editorErrors = [...this.editorErrors, ...extra.map(() => Array(TPL_HEADERS.length).fill(''))];
    }

    lines.forEach((line, rOff) => {
      const cols = line.split('\t');
      const tr = r0 + rOff;
      cols.forEach((val, cOff) => {
        const tc = c0 + cOff;
        if (tc < TPL_HEADERS.length) {
          this.editorRows[tr][tc] = val.trim();
        }
      });
    });

    // Normalizar CDMX→CMX en claveEntFed si viene pegada
    for (let rOff = 0; rOff < lines.length; rOff++) {
      const tr = r0 + rOff;
      if (this.editorRows[tr][9]?.toUpperCase() === 'CDMX') {
        this.editorRows[tr][9] = 'CMX';
      }
      this.validateEditorRow(tr);
    }

    this.ensureEditorEmptyBottom();
  }

  private ensureEditorEmptyBottom(): void {
    const last = this.editorRows[this.editorRows.length - 1];
    // Una fila solo con la fecha predefinida cuenta como "vacía"
    const hasUserData = last.some((c, i) => i !== 13 && c.trim());
    if (hasUserData) {
      this.editorRows   = [...this.editorRows,   this.emptyEditorRow()];
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
      case 0:  return v ? '' : 'Requerido';
      case 1: {
        const u = v.toUpperCase();
        if (!u) return 'Requerida';
        if (u.length !== 18) return `18 chars (tiene ${u.length})`;
        if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/i.test(u)) return 'Formato inválido';
        return '';
      }
      case 2:  return !v ? 'Requerido' : !/^\d{11}$/.test(v) ? `11 dígitos (tiene ${v.length})` : '';
      case 3:  return v ? '' : 'Requerido';
      case 4:  return TIPOS_CONTRATO.includes(v) ? '' : 'Selecciona uno';
      case 5:  return TIPOS_REGIMEN.includes(v)  ? '' : 'Selecciona uno';
      case 6:  return PERIODICIDADES.includes(v) ? '' : 'Selecciona una';
      case 7:  return v ? '' : 'Requerido';
      case 8:  return v ? '' : 'Selecciona entidad';
      case 9:  return CLAVES_ENT_FED.includes(v.toUpperCase()) ? '' : 'Selecciona clave';
      case 10: return RIESGOS.includes(v)        ? '' : 'Selecciona uno';
      case 11: { const n = parseFloat(v.replace(',','.')); return (!v||isNaN(n)||n<=0) ? 'Número > 0' : ''; }
      case 12: { const n = parseFloat(v.replace(',','.')); return (!v||isNaN(n)||n<=0) ? 'Número > 0' : ''; }
      case 13: return !v ? 'Requerida (YYYY-MM-DD)' : isNaN(new Date(v).getTime()) ? 'YYYY-MM-DD' : '';
      case 17: return (v && !/^\d{18}$/.test(v)) ? `CLABE 18 dígitos` : '';
      case 18: return (v && v.length !== 18)      ? `18 chars`          : '';
      default: return '';
    }
  }

  submitEditor(): void {
    const filled = this.editorRows.filter(r => r.some((c, i) => i !== 13 && c.trim()));
    if (!filled.length) { alert('Agrega al menos un empleado.'); return; }
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
          p.nombre, p.curp, p.nss, p.numEmpleado,
          p.tipoContrato, p.tipoRegimen, p.periodicidadPago,
          p.registroPatronal, p.entidadFederativa, p.claveEntFed,
          p.riesgoTrabajo,
          String(p.salarioBase), String(p.salarioDiarioIntegrado),
          p.fechaInicioRelLaboral,
          p.departamento ?? '', p.puesto ?? '',
          p.banco ?? '', p.cuentaBancaria ?? '', p.curpPatron ?? ''
        ];
      }
      return TPL_HEADERS.map(h => row.raw[h] ?? '');
    });

    // Siempre una fila vacía al final
    this.editorRows.push(this.emptyEditorRow());
    this.editorErrors = Array.from({ length: this.editorRows.length },
                                   () => Array(TPL_HEADERS.length).fill(''));

    // Validar filas cargadas para que se vean los errores de inmediato
    this.editorRows.forEach((_, ri) => {
      if (ri < this.editorRows.length - 1) this.validateEditorRow(ri);
    });

    this.importResults = [];
    this.bulkSource = 'editor';
    this.bulkStep   = 'editor';
  }

  // ── Descargar plantilla ─────────────────────────────────────────────────
  downloadTemplate(format: 'csv' | 'tsv'): void {
    const sep = format === 'csv' ? ',' : '\t';
    const headers = TPL_HEADERS.join(sep);
    const example = TPL_EXAMPLE.join(sep);
    const content = [headers, example, '', TPL_CATALOGS].join('\n');
    const blob = new Blob(['﻿' + content], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = `plantilla_empleados.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  downloadExcelTemplate(): void {
    const wb = XLSX.utils.book_new();

    const COLS = [
      { header: 'nombre *',                 hint: 'APELLIDO APELLIDO NOMBRE (mayúsculas)',         width: 32 },
      { header: 'curp *',                   hint: '18 chars: PEGJ850101HDFRRN01',                  width: 22 },
      { header: 'nss *',                    hint: '11 dígitos: 12345678901',                       width: 15 },
      { header: 'numEmpleado *',            hint: 'Ej: EMP001',                                    width: 14 },
      { header: 'tipoContrato *',           hint: '01-10 → ver hoja Catálogos',                    width: 16 },
      { header: 'tipoRegimen *',            hint: '02=Sueldos 07=Asimilados → ver Catálogos',      width: 18 },
      { header: 'periodicidadPago *',       hint: '04=Quincenal 05=Mensual → ver Catálogos',       width: 18 },
      { header: 'registroPatronal *',       hint: 'Ej: Y1234567890',                               width: 18 },
      { header: 'entidadFederativa *',      hint: 'Nombre completo: Ciudad de México',             width: 24 },
      { header: 'claveEntFed *',            hint: 'CMX=CDMX JAL MEX NL → ver Catálogos',          width: 14 },
      { header: 'riesgoTrabajo *',          hint: '1=Clase I … 5=Clase V → ver Catálogos',         width: 15 },
      { header: 'salarioBase *',            hint: 'Número con 2 decimales: 1000.00',               width: 14 },
      { header: 'salarioDiarioIntegrado *', hint: 'SDI = (salario + prestaciones) ÷ 365',          width: 24 },
      { header: 'fechaInicioRelLaboral *',  hint: 'Formato YYYY-MM-DD: 2020-01-15',                width: 20 },
      { header: 'departamento',             hint: 'Opcional: Sistemas',                            width: 16 },
      { header: 'puesto',                   hint: 'Opcional: Programador',                         width: 16 },
      { header: 'banco',                    hint: 'Código SAT: 002=BBVA 072=Banorte → Catálogos',  width: 10 },
      { header: 'cuentaBancaria',           hint: 'CLABE interbancaria 18 dígitos',                width: 22 },
      { header: 'curpPatron',               hint: 'CURP del patrón (18 chars, opcional)',           width: 22 },
    ];

    const EXAMPLE_ROW = [
      'JUAN PÉREZ GARCÍA','PEGJ850101HDFRRN01','12345678901','EMP001',
      '01','02','04','Y1234567890','Ciudad de México','CMX',
      '1', 1000.00, 1160.00, '2020-01-15',
      'Sistemas','Programador','072','032180000118359719',''
    ];

    const ws = XLSX.utils.aoa_to_sheet([
      COLS.map(c => c.header),
      COLS.map(c => c.hint),
      EXAMPLE_ROW,
    ]);
    ws['!cols'] = COLS.map(c => ({ wch: c.width }));
    ws['!views'] = [{ state: 'frozen', ySplit: 1, xSplit: 0, topLeftCell: 'A2' }];

    // Comentarios en encabezados de catálogos — visible al pasar el cursor en Excel
    const comment = (ref: string, txt: string) => {
      const cell = ws[ref]; if (!cell) return;
      cell.c = [{ a: 'FactuMag', t: txt }];
    };
    comment('E1', 'Valores válidos (usa el código, no la descripción):\n01 = Por tiempo indeterminado\n02 = Para obra determinada\n03 = Tiempo determinado\n04 = Por temporada\n05 = Revisión contrato colectivo\n06 = Revisión contrato ley\n07 = Por hora trabajada\n08 = Ninguno\n09 = Otro contrato\n10 = Jubilado / Pensionado');
    comment('F1', 'Valores válidos:\n02 = Sueldos y Salarios e Ingresos Asimilados\n07 = Asimilados a Salarios\n08 = Jubilados\n09 = Invalidez y Vida\n10 = Trabajadores Sindicalizados\n13 = Indemnización o Separación\n14 = Jubilados o Pensionados\n\nLos más comunes: 02 y 07');
    comment('G1', 'Valores válidos:\n01 = Diario\n02 = Semanal\n03 = Catorcenal\n04 = Quincenal\n05 = Mensual\n06 = Bimestral\n09 = Comisión\n10 = Decenal\n\nLos más comunes: 04 (quincenal) y 05 (mensual)');
    comment('I1', 'Escribe el nombre completo de la entidad, ejemplos:\nCiudad de México\nJalisco\nNuevo León\nEstado de México\n\nVer hoja "Catálogos" para lista completa');
    comment('J1', 'Clave de 2-3 letras de la entidad, ejemplos:\nCMX = Ciudad de México\nJAL = Jalisco\nNL  = Nuevo León\nMEX = Estado de México\n\nVer hoja "Catálogos" para lista completa');
    comment('K1', 'Valores válidos (clase de riesgo de trabajo IMSS):\n1 = Clase I  — Prima 0.54355%\n2 = Clase II — Prima 1.13065%\n3 = Clase III — Prima 2.59840%\n4 = Clase IV — Prima 4.65325%\n5 = Clase V  — Prima 7.58875%\n\nLa mayoría de oficinas usan Clase I (1)');
    comment('Q1', 'Código SAT del banco (3 dígitos), ejemplos:\n002 = BBVA Bancomer\n006 = Bancomext\n012 = HSBC\n014 = Santander\n072 = Banorte\n044 = Scotiabank\n058 = Banregio\n\nVer hoja "Catálogos" para lista completa');

    XLSX.utils.book_append_sheet(wb, ws, 'Empleados');

    const CAT: (string | number)[][] = [
      ['CAMPO', 'CÓDIGO', 'DESCRIPCIÓN'],
      ['tipoContrato', '01', 'Por tiempo indeterminado'],
      ['', '02', 'Para obra determinada'],
      ['', '03', 'Tiempo determinado'],
      ['', '04', 'Por temporada'],
      ['', '05', 'Revisión de contrato colectivo'],
      ['', '06', 'Revisión de contrato ley'],
      ['', '07', 'Por hora trabajada'],
      ['', '08', 'Ninguno'],
      ['', '09', 'Otro contrato'],
      ['', '10', 'Jubilado / Pensionado'],
      [],
      ['tipoRegimen', '02', 'Sueldos y Salarios e Ingresos Asimilados'],
      ['', '07', 'Asimilados a Salarios'],
      ['', '08', 'Jubilados'],
      ['', '09', 'Invalidez y Vida'],
      ['', '10', 'Trabajadores Sindicalizados'],
      ['', '13', 'Indemnización o Separación'],
      ['', '14', 'Jubilados o Pensionados'],
      [],
      ['periodicidadPago', '01', 'Diario'],
      ['', '02', 'Semanal'],
      ['', '03', 'Catorcenal'],
      ['', '04', 'Quincenal'],
      ['', '05', 'Mensual'],
      ['', '06', 'Bimestral'],
      ['', '09', 'Comisión'],
      ['', '10', 'Decenal'],
      [],
      ['riesgoTrabajo', '1', 'Clase I — Prima 0.54355%'],
      ['', '2', 'Clase II — Prima 1.13065%'],
      ['', '3', 'Clase III — Prima 2.59840%'],
      ['', '4', 'Clase IV — Prima 4.65325%'],
      ['', '5', 'Clase V — Prima 7.58875%'],
      [],
      ['claveEntFed', 'AGU', 'Aguascalientes'],
      ['', 'BCN', 'Baja California'],
      ['', 'BCS', 'Baja California Sur'],
      ['', 'CAM', 'Campeche'],
      ['', 'CHS', 'Chiapas'],
      ['', 'CHI', 'Chihuahua'],
      ['', 'CMX', 'Ciudad de México (CDMX)'],
      ['', 'COA', 'Coahuila'],
      ['', 'COL', 'Colima'],
      ['', 'DGO', 'Durango'],
      ['', 'GTO', 'Guanajuato'],
      ['', 'GRO', 'Guerrero'],
      ['', 'HGO', 'Hidalgo'],
      ['', 'JAL', 'Jalisco'],
      ['', 'MEX', 'Estado de México'],
      ['', 'MIC', 'Michoacán'],
      ['', 'MOR', 'Morelos'],
      ['', 'NAY', 'Nayarit'],
      ['', 'NL', 'Nuevo León'],
      ['', 'OAX', 'Oaxaca'],
      ['', 'PUE', 'Puebla'],
      ['', 'QRO', 'Querétaro'],
      ['', 'QR', 'Quintana Roo'],
      ['', 'SLP', 'San Luis Potosí'],
      ['', 'SIN', 'Sinaloa'],
      ['', 'SON', 'Sonora'],
      ['', 'TAB', 'Tabasco'],
      ['', 'TAM', 'Tamaulipas'],
      ['', 'TLX', 'Tlaxcala'],
      ['', 'VER', 'Veracruz'],
      ['', 'YUC', 'Yucatán'],
      ['', 'ZAC', 'Zacatecas'],
      ['', 'NE', 'Nacido en el Extranjero'],
      [],
      ['banco', '002', 'BBVA Bancomer'],
      ['', '006', 'Bancomext'],
      ['', '009', 'Banobras'],
      ['', '012', 'HSBC'],
      ['', '014', 'Santander'],
      ['', '021', 'HSBC (antes Bital)'],
      ['', '030', 'Bajío'],
      ['', '032', 'IXE'],
      ['', '036', 'Inbursa'],
      ['', '042', 'Mifel'],
      ['', '044', 'Scotiabank'],
      ['', '058', 'Banregio'],
      ['', '059', 'Invex'],
      ['', '060', 'Bansi'],
      ['', '062', 'Afirme'],
      ['', '072', 'Banorte'],
      ['', '102', 'ABN AMRO'],
      ['', '103', 'American Express'],
      ['', '106', 'BAMSA'],
      ['', '108', 'Tokyo'],
      ['', '110', 'JP Morgan'],
      ['', '112', 'Bansí'],
      ['', '113', 'Vel\'s'],
      ['', '116', 'ING'],
      ['', '124', 'Deutsche'],
      ['', '126', 'Credit Suisse'],
      ['', '127', 'Azteca'],
      ['', '128', 'Autofin'],
      ['', '129', 'Barclays'],
      ['', '130', 'Compartamos'],
      ['', '132', 'Multiva'],
      ['', '133', 'Actinver'],
      ['', '136', 'Walmart'],
      ['', '137', 'Nafin'],
      ['', '138', 'Interbanco'],
      ['', '140', 'Consubanco'],
      ['', '141', 'Volkswagen'],
      ['', '143', 'CIBanco'],
      ['', '145', 'Bbase'],
      ['', '147', 'Bankaool'],
      ['', '148', 'PagaTodo'],
      ['', '149', 'Inmobiliario Mexicano'],
      ['', '155', 'ICBC'],
      ['', '156', 'Sabadell'],
      ['', '166', 'BaBien'],
      ['', '168', 'Hipotecaria Federal'],
      ['', '600', 'Monexcb'],
      ['', '601', 'GBM'],
      ['', '602', 'Masari'],
      ['', '605', 'Valué'],
      ['', '606', 'Fondivisa'],
      ['', '607', 'Base'],
      ['', '608', 'Finpatria'],
      ['', '613', 'Multiva Cbolsa'],
      ['', '616', 'Finamex'],
      ['', '617', 'Valore'],
      ['', '618', 'Única'],
      ['', '619', 'MAPFRE'],
      ['', '620', 'Profuturo'],
      ['', '621', 'CB Actinver'],
      ['', '623', 'Merrill Lynch'],
      ['', '626', 'CBDEUTSCHE'],
      ['', '627', 'Zurich'],
      ['', '628', 'Zurichvi'],
      ['', '629', 'SU CASITA'],
      ['', '630', 'CB Intercam'],
      ['', '631', 'CI Bolsa'],
      ['', '632', 'Bulltick CB'],
      ['', '633', 'Sterling'],
      ['', '634', 'Finpatria'],
      ['', '636', 'HDI Seguros'],
      ['', '637', 'Order'],
      ['', '638', 'Akala'],
      ['', '640', 'CB JP Morgan'],
      ['', '642', 'Reforma'],
      ['', '646', 'STP'],
      ['', '648', 'Evercore'],
      ['', '649', 'SKANDIA'],
      ['', '651', 'Seguro'],
      ['', '652', 'Asea'],
      ['', '653', 'Kuspit'],
      ['', '655', 'Sofiexpress'],
      ['', '656', 'Unagra'],
      ['', '659', 'ASP Integra OPC'],
      ['', '670', 'Libertad'],
      ['', '674', 'AXA'],
      ['', '677', 'Cuxcen'],
      ['', '679', 'FND'],
      ['', '684', 'Transfer'],
      ['', '685', 'Fondo (FIRA)'],
      ['', '686', 'Invercap'],
      ['', '689', 'FDEAM'],
      ['', '699', 'CoDi Valida'],
      ['', '706', 'Arcus'],
      ['', '710', 'Telecomunicaciones'],
      ['', '722', 'Mercado Pago'],
      ['', '723', 'Cuenca'],
      ['', '728', 'Spin by OXXO'],
      ['', '730', 'Nvio'],
      ['', '901', 'CoDi'],
      ['', '902', 'SPEI'],
    ];

    const wsCat = XLSX.utils.aoa_to_sheet(CAT);
    wsCat['!cols'] = [{ wch: 20 }, { wch: 8 }, { wch: 46 }];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Catálogos');

    XLSX.writeFile(wb, 'plantilla_empleados.xlsx');
  }

  // ── File drop / pick ────────────────────────────────────────────────────
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.dragOver = false;
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
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '', raw: false });
        this.bulkSource = 'upload';
        this.loadFromRows(rows);
      };
      reader.readAsArrayBuffer(file);
      return;
    }

    if (!['csv','tsv','txt'].includes(ext)) {
      alert('Formato no soportado. Usa .xlsx, .csv, .tsv o .txt');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      this.bulkSource = 'upload';
      // Auto-detect separador
      const firstLine = text.split('\n')[0] ?? '';
      let sep = ext === 'tsv' ? '\t' : ',';
      if (sep === ',' && firstLine.split('\t').length > firstLine.split(',').length) sep = '\t';
      this.loadFromRows(this.parseCSV(text, sep));
    };
    reader.readAsText(file, 'UTF-8');
  }

  // ── Parseo CSV / TSV ────────────────────────────────────────────────────
  private parseAndShow(text: string, sep: string): void {
    this.bulkSource = 'upload';
    const firstLine = text.split('\n')[0] ?? '';
    if (sep === ',' && firstLine.split('\t').length > firstLine.split(',').length) sep = '\t';
    this.loadFromRows(this.parseCSV(text, sep));
  }

  // Carga filas ya parseadas en el editor inline (Excel o CSV)
  private loadFromRows(allRows: string[][]): void {
    // Quitar vacías y comentarios
    const dataRows = allRows
      .map(r => r.map(c => String(c ?? '').trim()))
      .filter(r => r.some(c => c) && !r[0].startsWith('#'));

    if (dataRows.length < 2) {
      alert('El archivo no contiene datos (necesita al menos una fila de encabezado y una de datos).');
      return;
    }

    const rawHeaders = dataRows[0].map(h => this.normalizeHeader(h));

    // Detectar posición de CURP para identificar fila de "sugerencias" de la plantilla Excel
    const curpIdx = rawHeaders.findIndex(h => h === 'curp');

    this.editorRows = dataRows.slice(1)
      .filter(cols => {
        // Omitir la fila de hints del Excel (el valor de CURP contiene ':' o '→', nunca un CURP real)
        if (curpIdx >= 0) {
          const curpVal = cols[curpIdx] ?? '';
          if (curpVal.includes(':') || curpVal.includes('→') || curpVal.includes('chars')) return false;
        }
        return cols.some(c => c); // omitir filas completamente vacías
      })
      .map(cols => {
        const raw: Record<string, string> = {};
        rawHeaders.forEach((h, idx) => { if (h) raw[h] = cols[idx] ?? ''; });
        return [
          raw['nombre']                 ?? '',
          raw['curp']                   ?? '',
          raw['nss']                    ?? '',
          raw['numEmpleado']            ?? '',
          raw['tipoContrato']           ?? '',
          raw['tipoRegimen']            ?? '',
          raw['periodicidadPago']       ?? '',
          raw['registroPatronal']       ?? '',
          raw['entidadFederativa']      ?? '',
          raw['claveEntFed']            ?? '',
          raw['riesgoTrabajo']          ?? '',
          raw['salarioBase']            ?? '',
          raw['salarioDiarioIntegrado'] ?? '',
          raw['fechaInicioRelLaboral']  ?? '',
          raw['departamento']           ?? '',
          raw['puesto']                 ?? '',
          raw['banco']                  ?? '',
          raw['cuentaBancaria']         ?? '',
          raw['curpPatron']             ?? '',
        ];
      });

    if (!this.editorRows.length) {
      alert('No se encontraron filas de datos válidas en el archivo.');
      return;
    }

    this.editorRows.push(this.emptyEditorRow());
    this.editorErrors = Array.from({ length: this.editorRows.length },
                                   () => Array(TPL_HEADERS.length).fill(''));
    this.editorRows.forEach((_, ri) => {
      if (ri < this.editorRows.length - 1) this.validateEditorRow(ri);
    });
    this.importResults = [];
    this.bulkStep = 'editor';
  }

  // Normaliza encabezado CSV → nombre de campo interno
  private normalizeHeader(h: string): string | undefined {
    const norm = h.toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g, '') // quitar acentos
      .replace(/[^a-z0-9]/g, '');                        // solo alfanumérico

    const MAP: Record<string, string> = {
      'nombre': 'nombre',
      'curp': 'curp',
      'nss': 'nss',
      'numempleado': 'numEmpleado', 'numeroempleado': 'numEmpleado', 'noempleado': 'numEmpleado',
      'tipocontrato': 'tipoContrato',
      'tiporegimen': 'tipoRegimen',
      'periodicidadpago': 'periodicidadPago', 'periodicidad': 'periodicidadPago',
      'registropatronal': 'registroPatronal',
      'entidadfederativa': 'entidadFederativa', 'estado': 'entidadFederativa',
      'claveentfed': 'claveEntFed', 'claveestado': 'claveEntFed', 'entfed': 'claveEntFed',
      'riesgotrabajo': 'riesgoTrabajo', 'riesgo': 'riesgoTrabajo',
      'salariobase': 'salarioBase', 'salario': 'salarioBase',
      'sdi': 'salarioDiarioIntegrado', 'salariodiariointegrado': 'salarioDiarioIntegrado',
      'fechainicio': 'fechaInicioRelLaboral', 'fecha': 'fechaInicioRelLaboral',
        'fechainirel': 'fechaInicioRelLaboral', 'fechainiciorel': 'fechaInicioRelLaboral',
        'fechainicioel': 'fechaInicioRelLaboral', 'fechainiciorellaboral': 'fechaInicioRelLaboral',
      'departamento': 'departamento', 'area': 'departamento',
      'puesto': 'puesto', 'cargo': 'puesto',
      'banco': 'banco',
      'cuentabancaria': 'cuentaBancaria', 'clabe': 'cuentaBancaria',
      'curppatron': 'curpPatron', 'curpdelpaton': 'curpPatron',
    };
    return MAP[norm];
  }

  // ── Validaciones por fila ───────────────────────────────────────────────
  private validateRow(raw: Record<string, string>): { errors: Record<string, string>; parsed?: EmpleadoImport } {
    const errors: Record<string, string> = {};

    const v = (key: string) => (raw[key] ?? '').trim();

    // Nombre
    if (!v('nombre')) errors['nombre'] = 'requerido';

    // CURP
    const curp = v('curp').toUpperCase();
    if (!curp) errors['curp'] = 'requerida';
    else if (curp.length !== 18) errors['curp'] = `18 chars requeridos (tiene ${curp.length})`;
    else if (!/^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z\d]{2}$/.test(curp))
      errors['curp'] = 'formato inválido (ej: PEGJ850101HDFRRN01)';

    // NSS
    const nss = v('nss');
    if (!nss) errors['nss'] = 'requerido';
    else if (!/^\d{11}$/.test(nss)) errors['nss'] = `11 dígitos requeridos (tiene ${nss.length})`;

    // NumEmpleado
    if (!v('numEmpleado')) errors['numEmpleado'] = 'requerido';

    // TipoContrato
    const tc = v('tipoContrato');
    if (!tc) errors['tipoContrato'] = 'requerido';
    else if (!TIPOS_CONTRATO.includes(tc))
      errors['tipoContrato'] = `inválido "${tc}" — usa 01-10`;

    // TipoRegimen
    const tr = v('tipoRegimen');
    if (!tr) errors['tipoRegimen'] = 'requerido';
    else if (!TIPOS_REGIMEN.includes(tr))
      errors['tipoRegimen'] = `inválido "${tr}" — usa 02, 13, 14...`;

    // PeriodicidadPago
    const pp = v('periodicidadPago');
    if (!pp) errors['periodicidadPago'] = 'requerida';
    else if (!PERIODICIDADES.includes(pp))
      errors['periodicidadPago'] = `inválida "${pp}" — usa 01-06, 09, 10`;

    // RegistroPatronal
    if (!v('registroPatronal')) errors['registroPatronal'] = 'requerido';

    // EntidadFederativa
    if (!v('entidadFederativa')) errors['entidadFederativa'] = 'requerida';

    // ClaveEntFed — normaliza CDMX → CMX (código SAT oficial de 3 chars)
    const cefRaw = v('claveEntFed').toUpperCase();
    const cef = cefRaw === 'CDMX' ? 'CMX' : cefRaw;
    if (!cef) errors['claveEntFed'] = 'requerida';
    else if (!CLAVES_ENT_FED.includes(cef))
      errors['claveEntFed'] = `inválida "${cefRaw}" — usa AGS, CMX, JAL...`;

    // RiesgoTrabajo
    const rt = v('riesgoTrabajo');
    if (!rt) errors['riesgoTrabajo'] = 'requerido';
    else if (!RIESGOS.includes(rt))
      errors['riesgoTrabajo'] = `inválido "${rt}" — usa 1 a 5`;

    // SalarioBase
    const sbStr = v('salarioBase').replace(',', '.');
    const sb = parseFloat(sbStr);
    if (!sbStr || isNaN(sb) || sb <= 0)
      errors['salarioBase'] = `número > 0 requerido (recibido: "${v('salarioBase')}")`;

    // SDI
    const sdiStr = v('salarioDiarioIntegrado').replace(',', '.');
    const sdi = parseFloat(sdiStr);
    if (!sdiStr || isNaN(sdi) || sdi <= 0)
      errors['sdi'] = `número > 0 requerido (recibido: "${v('salarioDiarioIntegrado')}")`;

    // FechaInicio
    const fechaStr = v('fechaInicioRelLaboral');
    let fechaOk = false;
    if (!fechaStr) {
      errors['fechaInicio'] = 'requerida (YYYY-MM-DD)';
    } else {
      const d = new Date(fechaStr);
      fechaOk = !isNaN(d.getTime());
      if (!fechaOk) errors['fechaInicio'] = `formato inválido "${fechaStr}" — usa YYYY-MM-DD`;
    }

    // CLABE opcional
    const clabe = v('cuentaBancaria');
    if (clabe && !/^\d{18}$/.test(clabe))
      errors['cuentaBancaria'] = `CLABE: 18 dígitos (tiene ${clabe.length})`;

    // CURP Patrón opcional
    const curpP = v('curpPatron');
    if (curpP && curpP.length !== 18)
      errors['curpPatron'] = `CURP patrón: 18 chars (tiene ${curpP.length})`;

    if (Object.keys(errors).length > 0) return { errors };

    return {
      errors: {},
      parsed: {
        nombre:                  v('nombre'),
        curp:                    curp,
        nss:                     nss,
        numEmpleado:             v('numEmpleado'),
        tipoContrato:            tc,
        tipoRegimen:             tr,
        periodicidadPago:        pp,
        registroPatronal:        v('registroPatronal'),
        entidadFederativa:       v('entidadFederativa'),
        claveEntFed:             cef,
        riesgoTrabajo:           rt,
        salarioBase:             sb,
        salarioDiarioIntegrado:  sdi,
        fechaInicioRelLaboral:   fechaStr,
        departamento:            v('departamento') || undefined,
        puesto:                  v('puesto') || undefined,
        banco:                   v('banco') || undefined,
        cuentaBancaria:          clabe || undefined,
        curpPatron:              curpP || undefined,
        percepcionesBase:        []
      }
    };
  }

  // ── Importar filas válidas ──────────────────────────────────────────────
  importarValidos(): void {
    const validos = this.bulkValidos;
    if (!validos.length) return;
    this.importing = true;

    const payload = validos.map(r => r.parsed!);
    this.empleadoSvc.crearMasivo(+this.rfcIdSeleccionado, payload).subscribe({
      next: results => {
        this.importResults = results;
        this.importing = false;
        this.bulkStep = 'done';
        this.cargar();
      },
      error: err => {
        this.importing = false;
        alert('Error al importar: ' + (err?.error?.message ?? 'Error de servidor'));
      }
    });
  }

  // ── Template helpers ────────────────────────────────────────────────────
  getErrorEntries(errors: Record<string, string>): { campo: string; msg: string }[] {
    return Object.entries(errors).map(([campo, msg]) => ({ campo, msg }));
  }

  // ── CSV parser robusto (soporta campos con comillas y comas dentro) ──────
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
        } else {
          current += ch;
        }
      }
      fields.push(current.trim());
      rows.push(fields);
    }
    return rows;
  }
}
