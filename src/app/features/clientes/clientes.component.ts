import * as XLSX from 'xlsx';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ClienteListDto } from '../../core/models/cliente/ClienteListDto';
import { ClienteService, ImportarClienteItem, ImportarClienteMasivoResult } from '../../core/services/cliente/ClienteService';

// ── Catálogos SAT ────────────────────────────────────────────────────────────
const REGIMENES = ['601','603','605','606','607','608','609','610','611','612',
  '614','615','616','620','621','622','623','624','625','626'];
const USOS_CFDI = ['G01','G02','G03','I01','I02','I03','I04','I05','I06','I07','I08',
  'D01','D02','D03','D04','D05','D06','D07','D08','D09','D10','S01','CP01','CN01'];

// ── Cabeceras de la plantilla ─────────────────────────────────────────────────
const TPL_H = [
  'rfc','nombre','regimenFiscal','usoCfdi','codigoPostal',
  'calle','numExterior','numInterior','colonia','ciudad','estado',
  'emails','telefono','personaContacto','notas'
];
const TPL_EXAMPLE = [
  'AAA010101AAA','EMPRESA EJEMPLO SA DE CV','601','G03','06600',
  'Av. Insurgentes','100','Piso 5','Roma Norte','Ciudad de México','CDMX',
  'contacto@ejemplo.com','55 1234 5678','Juan Pérez',''
];
const TPL_HINTS = [
  '12-13 chars: AAA010101AAA (PM) PEGJ850101AAA (PF)',
  'MAYÚSCULAS: RAZÓN SOCIAL COMPLETA',
  '601=PM 612=PF 616=Sin obligaciones 626=RESICO',
  'G03=Gastos en general S01=Sin efectos CP01=Pagos',
  '5 dígitos: 06600',
  'Opcional','Opcional','Opcional','Opcional','Opcional','Opcional',
  'Opcional, separados por coma','Opcional','Opcional','Opcional'
];

interface ImportResult { fila: number; rfc: string; exito: boolean; error?: string; }

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
<div class="animate-in">

  <!-- ── Encabezado ──────────────────────────────────────────────────────── -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:28px;flex-wrap:wrap;gap:12px">
    <div>
      <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Clientes</h1>
      <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Catálogo de receptores para tus CFDIs</p>
    </div>
    <div style="display:flex;gap:10px;flex-wrap:wrap">
      <button class="btn-mag btn-outline" (click)="openBulkModal()">
        <span class="material-icons-round" style="font-size:18px">upload</span>
        Carga masiva
      </button>
      <a routerLink="/clientes/new" class="btn-mag btn-primary">
        <span class="material-icons-round" style="font-size:18px">person_add</span>
        Nuevo Cliente
      </a>
    </div>
  </div>

  <!-- ── Filtros ──────────────────────────────────────────────────────────── -->
  <div class="card-mag animate-in delay-1" style="margin-bottom:16px">
    <div class="card-body-mag" style="padding:14px 20px;display:flex;gap:12px;flex-wrap:wrap;align-items:center">
      <div class="lf-search-wrap" style="flex:1;min-width:220px">
        <span class="material-icons-round lf-search-ico">search</span>
        <input class="lf-ctrl lf-search" [(ngModel)]="busqueda" (input)="filtrar()"
               placeholder="Buscar por RFC, razón social, email...">
      </div>
      <div class="lf-sel-wrap" style="width:190px">
        <select class="lf-ctrl" [(ngModel)]="filtroEstado" (change)="filtrar()">
          <option value="todos">Todos los estatus</option>
          <option value="activos">Activos</option>
          <option value="inactivos">Inactivos</option>
        </select>
        <span class="material-icons-round lf-ico">expand_more</span>
      </div>
    </div>
  </div>

  <!-- ── Tabla ─────────────────────────────────────────────────────────────── -->
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
          <th class="th-col">RFC</th><th class="th-col">Razón Social</th>
          <th class="th-col">Régimen</th><th class="th-col">Contacto</th>
          <th class="th-col">C.P.</th><th class="th-col">Estatus</th>
          <th class="th-col" style="text-align:right">Acciones</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let c of paginados"
            style="border-bottom:1px solid var(--border-light);transition:background .15s"
            [style.opacity]="c.activo ? '1' : '0.5'"
            (mouseenter)="hoverRow($event,true)" (mouseleave)="hoverRow($event,false)">
          <td style="padding:13px 20px">
            <span style="font-family:var(--font-display);font-size:13px;font-weight:800;color:var(--accent)">{{c.rfc}}</span>
            <span *ngIf="c.predeterminado" class="material-icons-round" title="Predeterminado"
                  style="font-size:13px;color:#f59e0b;margin-left:4px;vertical-align:middle">star</span>
          </td>
          <td style="padding:13px 20px">
            <div style="font-weight:600;font-size:13px">{{c.nombre}}</div>
            <div *ngIf="c.personaContacto" style="font-size:11px;color:var(--text-muted)">{{c.personaContacto}}</div>
          </td>
          <td style="padding:13px 20px;font-size:12px;color:var(--text-secondary)">{{labelRegimen(c.regimenFiscal)}}</td>
          <td style="padding:13px 20px">
            <div *ngIf="primerEmail(c.emails)" style="font-size:12px">{{primerEmail(c.emails)}}</div>
            <div *ngIf="c.telefono" style="font-size:11px;color:var(--text-muted)">{{c.telefono}}</div>
            <span *ngIf="!primerEmail(c.emails)&&!c.telefono" style="color:var(--text-muted);font-size:12px">—</span>
          </td>
          <td style="padding:13px 20px;font-weight:700;font-size:13px">{{c.codigoPostal}}</td>
          <td style="padding:13px 20px">
            <span [style]="c.activo ? badgeOn : badgeOff">{{c.activo ? 'Activo' : 'Inactivo'}}</span>
          </td>
          <td style="padding:13px 20px;text-align:right">
            <div style="display:flex;gap:4px;justify-content:flex-end">
              <a [routerLink]="['/clientes',c.id]" class="btn-mag btn-ghost btn-sm" style="padding:6px 8px" title="Ver/Editar">
                <span class="material-icons-round" style="font-size:16px">edit</span>
              </a>
              <button type="button" class="btn-mag btn-ghost btn-sm" (click)="confirmarEliminar(c)" style="padding:6px 8px">
                <span class="material-icons-round" style="font-size:16px;color:var(--danger)">delete_outline</span>
              </button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
    <div *ngIf="clientesFiltrados.length>pageSize"
         style="padding:12px 20px;border-top:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
      <span style="font-size:12px;color:var(--text-muted)">
        Mostrando {{offset+1}}–{{min(offset+pageSize,clientesFiltrados.length)}} de {{clientesFiltrados.length}}
      </span>
      <div style="display:flex;gap:8px">
        <button class="btn-mag btn-ghost btn-sm" [disabled]="page===0" (click)="page=page-1">Anterior</button>
        <button class="btn-mag btn-ghost btn-sm" [disabled]="offset+pageSize>=clientesFiltrados.length" (click)="page=page+1">Siguiente</button>
      </div>
    </div>
  </div>
</div>

<!-- ══ Modal Eliminar ═════════════════════════════════════════════════════════ -->
<div *ngIf="clienteAEliminar"
     style="position:fixed;inset:0;background:rgba(0,0,0,.65);z-index:1000;display:flex;align-items:center;justify-content:center">
  <div class="card-mag" style="width:400px"><div class="card-body-mag" style="padding:28px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
      <span class="material-icons-round" style="color:var(--danger);font-size:28px">delete_forever</span>
      <span style="font-weight:800;font-size:16px">Eliminar cliente</span>
    </div>
    <p style="font-size:13px;color:var(--text-muted);margin-bottom:22px">
      ¿Eliminar a <strong style="color:var(--text-primary)">{{clienteAEliminar.nombre}}</strong>
      (<span style="color:var(--accent)">{{clienteAEliminar.rfc}}</span>)? Esta acción no se puede deshacer.
    </p>
    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn-mag btn-ghost btn-sm" (click)="clienteAEliminar=null">Cancelar</button>
      <button style="background:var(--danger);color:#fff;border:none;padding:8px 20px;border-radius:var(--radius-sm);cursor:pointer;font-weight:700;font-size:13px"
              (click)="eliminar()">Eliminar</button>
    </div>
  </div></div>
</div>

<!-- ══ Modal Carga Masiva ════════════════════════════════════════════════════ -->
<div *ngIf="showBulkModal" class="bm-overlay">
  <div class="bm-modal">

    <!-- Header ──────────────────────────────────────────────────────────── -->
    <div class="bm-header">
      <div class="bm-steps">
        <div class="bm-step" [class.bm-step-active]="bulkStep==='upload'||bulkStep==='editor'"
                             [class.bm-step-done]="bulkStep==='preview'||bulkStep==='done'">
          <div class="bm-step-circle">{{(bulkStep==='preview'||bulkStep==='done')?'✓':'1'}}</div>
          <span>{{bulkStep==='editor'?'Editor en línea':'Subir archivo'}}</span>
        </div>
        <div class="bm-step-line"></div>
        <div class="bm-step" [class.bm-step-active]="bulkStep==='preview'" [class.bm-step-done]="bulkStep==='done'">
          <div class="bm-step-circle">{{bulkStep==='done'?'✓':'2'}}</div>
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

    <!-- ══ STEP 1: UPLOAD ════════════════════════════════════════════════ -->
    <div *ngIf="bulkStep==='upload'" class="bm-body">
      <div class="bm-two-col">

        <!-- Descargar plantilla -->
        <div class="bm-card">
          <div class="bm-card-icon" style="background:#eff6ff;color:#3b82f6">
            <span class="material-icons-round">download</span>
          </div>
          <div class="bm-card-title">1. Descarga la plantilla</div>
          <div class="bm-card-desc">
            Llena los datos de tus clientes en el formato correcto.
            La plantilla incluye ejemplos y catálogos.
          </div>
          <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
            <button class="btn-mag btn-primary btn-sm" (click)="downloadExcelTemplate()">
              <span class="material-icons-round" style="font-size:15px">download</span> Excel (.xlsx)
            </button>
            <button class="btn-mag btn-ghost btn-sm" (click)="downloadCsvTemplate()">
              <span class="material-icons-round" style="font-size:15px">table_chart</span> CSV
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
            Sube directo el Excel sin convertirlo.
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
          <input #fileInputRef type="file" accept=".xlsx,.xls,.csv,.tsv,.txt"
                 style="display:none" (change)="onFileChange($event)">
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
          <span class="material-icons-round" style="font-size:16px">edit_note</span> Abrir editor
        </button>
      </div>

      <!-- Columnas requeridas -->
      <div class="bm-columns-ref">
        <div class="bm-columns-ref-title">Columnas de la plantilla</div>
        <div class="bm-columns-grid">
          <div class="bm-col-chip bm-col-required">rfc</div>
          <div class="bm-col-chip bm-col-required">nombre</div>
          <div class="bm-col-chip bm-col-required">regimenFiscal</div>
          <div class="bm-col-chip bm-col-required">usoCfdi</div>
          <div class="bm-col-chip bm-col-required">codigoPostal</div>
          <div class="bm-col-chip bm-col-optional">calle</div>
          <div class="bm-col-chip bm-col-optional">numExterior</div>
          <div class="bm-col-chip bm-col-optional">numInterior</div>
          <div class="bm-col-chip bm-col-optional">colonia</div>
          <div class="bm-col-chip bm-col-optional">ciudad</div>
          <div class="bm-col-chip bm-col-optional">estado</div>
          <div class="bm-col-chip bm-col-optional">emails</div>
          <div class="bm-col-chip bm-col-optional">telefono</div>
          <div class="bm-col-chip bm-col-optional">personaContacto</div>
          <div class="bm-col-chip bm-col-optional">notas</div>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:6px">
          <span style="background:#fee2e2;color:#dc2626;padding:1px 5px;border-radius:3px;font-size:10px">rojo = obligatorio</span>
          &nbsp;
          <span style="background:var(--bg-card2);color:var(--text-muted);padding:1px 5px;border-radius:3px;font-size:10px">gris = opcional</span>
        </div>
      </div>
    </div>

    <!-- ══ STEP: EDITOR ═══════════════════════════════════════════════════ -->
    <div *ngIf="bulkStep==='editor'" style="display:flex;flex-direction:column;flex:1;overflow:hidden">
      <!-- Toolbar -->
      <div style="padding:10px 20px;border-bottom:1px solid var(--border-light);background:var(--bg-card2);flex-shrink:0;display:flex;align-items:center;gap:16px;flex-wrap:wrap">
        <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-muted)">
          <span class="material-icons-round" style="font-size:15px;color:var(--accent)">info</span>
          Escribe o pega desde Excel (Ctrl+V en cualquier celda).
          Campos <span style="color:#dc2626;font-weight:700;margin:0 2px">*</span> son obligatorios.
        </div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px;font-size:12px">
          <span *ngIf="editorHasErrors" style="color:#f59e0b;display:flex;align-items:center;gap:4px">
            <span class="material-icons-round" style="font-size:14px">warning</span>
            Corrija los campos en rojo
          </span>
          <span style="color:var(--text-muted)">{{editorFilledRows}} cliente(s)</span>
        </div>
      </div>

      <!-- Tabla editor -->
      <div style="flex:1;overflow:auto;padding:0">
        <table class="ed-table">
          <thead>
            <tr>
              <th class="ed-th ed-th-num">#</th>
              <th *ngFor="let h of EDITOR_HEADERS; let ci=index"
                  class="ed-th"
                  [style.min-width.px]="EDITOR_COL_WIDTHS[ci]">
                {{h}}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of editorRows; let ri=index; trackBy:trackRow">
              <td class="ed-td ed-td-num">{{ri+1}}</td>
              <td *ngFor="let h of EDITOR_HEADERS; let ci=index"
                  class="ed-td"
                  [class.ed-td-filled]="row[ci]?.trim()"
                  [class.ed-td-error]="editorErrors[ri]?.[ci]"
                  [title]="editorErrors[ri]?.[ci]||''">

                <!-- Select para catálogos -->
                <select *ngIf="EDITOR_SELECTS[ci]" class="ed-select"
                        (change)="onEditorChange(ri, ci, $any($event.target).value)">
                  <option value="" [selected]="!row[ci]">— Selecciona —</option>
                  <option *ngFor="let opt of EDITOR_SELECTS[ci]"
                          [value]="opt.value"
                          [selected]="opt.value === row[ci]">
                    {{opt.label}}
                  </option>
                </select>

                <!-- Texto libre -->
                <input *ngIf="!EDITOR_SELECTS[ci]" class="ed-input"
                       [value]="row[ci]"
                       (input)="onEditorInput(ri, ci, $any($event.target).value)"
                       (paste)="onPaste($event, ri, ci)"
                       autocomplete="off" spellcheck="false">
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ STEP 2: PREVIEW ════════════════════════════════════════════════ -->
    <div *ngIf="bulkStep==='preview'" class="bm-body bm-body-preview">
      <div class="bm-preview-summary">
        <div class="bm-ps-item bm-ps-ok">
          <span class="material-icons-round" style="font-size:20px">check_circle</span>
          <div>
            <div class="bm-ps-num">{{bulkValidos.length}}</div>
            <div class="bm-ps-lbl">Listos para importar</div>
          </div>
        </div>
        <div class="bm-ps-item bm-ps-err" *ngIf="bulkInvalidos.length>0">
          <span class="material-icons-round" style="font-size:20px">error_outline</span>
          <div>
            <div class="bm-ps-num">{{bulkInvalidos.length}}</div>
            <div class="bm-ps-lbl">Con errores (no se importarán)</div>
          </div>
        </div>
      </div>

      <div class="bm-table-wrap">
        <table class="bm-table">
          <thead>
            <tr>
              <th style="width:36px">#</th>
              <th style="width:36px"></th>
              <th>RFC</th>
              <th>Nombre / Razón Social</th>
              <th>Régimen</th>
              <th>Uso CFDI</th>
              <th>C.P.</th>
              <th>Errores</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let r of previewRows"
                [class.bm-row-ok]="r.valido"
                [class.bm-row-err]="!r.valido">
              <td style="color:var(--text-muted);font-size:11px">{{r.fila}}</td>
              <td>
                <span *ngIf="r.valido" class="bm-status-ok"><span class="material-icons-round" style="font-size:14px">check</span></span>
                <span *ngIf="!r.valido" class="bm-status-err"><span class="material-icons-round" style="font-size:14px">close</span></span>
              </td>
              <td style="font-family:monospace;font-weight:700;font-size:12px;color:var(--accent)">{{r.rfc||'—'}}</td>
              <td style="font-weight:600;font-size:13px;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{r.nombre||'—'}}</td>
              <td style="font-size:12px">{{r.regimenFiscal||'—'}}</td>
              <td style="font-size:12px">{{r.usoCfdi||'—'}}</td>
              <td style="font-size:12px">{{r.codigoPostal||'—'}}</td>
              <td>
                <span *ngIf="r.valido" style="font-size:11px;color:#10b981">Sin errores</span>
                <span *ngFor="let e of r.errores" class="bm-err-chip">{{e}}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ══ STEP 3: DONE ═══════════════════════════════════════════════════ -->
    <div *ngIf="bulkStep==='done'" class="bm-body">
      <div class="bm-done-header">
        <div class="bm-done-icon">
          <span class="material-icons-round" style="font-size:36px;color:#10b981">check_circle</span>
        </div>
        <div class="bm-done-title">Importación completada</div>
        <div class="bm-done-sub">
          <span class="bm-done-ok-badge">✓ {{importOk}} exitosos</span>
          <span *ngIf="importErr>0" class="bm-done-err-badge">✗ {{importErr}} fallidos</span>
        </div>
      </div>
      <div class="bm-results-list">
        <div *ngFor="let r of importResults" class="bm-result-row"
             [class.bm-result-ok]="r.exito" [class.bm-result-err]="!r.exito">
          <span class="material-icons-round" style="font-size:16px;flex-shrink:0">
            {{r.exito?'check_circle':'cancel'}}
          </span>
          <div style="flex:1;min-width:0">
            <div style="font-weight:600;font-size:13px">{{r.rfc}}</div>
            <div *ngIf="!r.exito" style="font-size:11px;color:#dc2626;margin-top:2px">{{r.error}}</div>
          </div>
          <span style="font-size:11px;color:var(--text-muted);flex-shrink:0">Fila {{r.fila}}</span>
        </div>
      </div>
    </div>

    <!-- ── Footer ──────────────────────────────────────────────────────── -->
    <div class="bm-footer">
      <ng-container *ngIf="bulkStep==='upload'">
        <span></span>
      </ng-container>

      <ng-container *ngIf="bulkStep==='editor'">
        <button class="btn-mag btn-ghost" (click)="bulkStep='upload'">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span> Volver
        </button>
        <button class="btn-mag btn-primary"
                [disabled]="editorFilledRows===0||editorHasErrors"
                (click)="submitEditor()">
          <span class="material-icons-round" style="font-size:16px">fact_check</span>
          Vista previa {{editorFilledRows}} cliente(s)
        </button>
      </ng-container>

      <ng-container *ngIf="bulkStep==='preview'">
        <button class="btn-mag btn-ghost" (click)="bulkStep='editor'">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span> Volver al editor
        </button>
        <div style="display:flex;align-items:center;gap:10px">
          <span *ngIf="bulkInvalidos.length>0" style="font-size:12px;color:#f59e0b;display:flex;align-items:center;gap:4px">
            <span class="material-icons-round" style="font-size:14px">warning</span>
            {{bulkInvalidos.length}} fila(s) con errores serán omitidas
          </span>
          <button class="btn-mag btn-primary"
                  [disabled]="importing||bulkValidos.length===0"
                  (click)="importar()">
            <span *ngIf="importing" class="material-icons-round" style="animation:spin 1s linear infinite;font-size:16px">refresh</span>
            <span *ngIf="!importing" class="material-icons-round" style="font-size:16px">cloud_upload</span>
            {{importing ? 'Importando...' : 'Importar '+bulkValidos.length+' cliente(s)'}}
          </button>
        </div>
      </ng-container>

      <ng-container *ngIf="bulkStep==='done'">
        <button class="btn-mag btn-ghost" (click)="bulkStep='upload';importResults=[]">Nueva importación</button>
        <button class="btn-mag btn-primary" (click)="closeBulkModal()">Cerrar</button>
      </ng-container>
    </div>

  </div>
</div>

<style>
  .th-col{padding:12px 20px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);letter-spacing:.8px;text-transform:uppercase}
  @keyframes spin{to{transform:rotate(360deg)}}
  .lf-ctrl{height:38px;padding:0 12px;background:var(--bg-card2);border:1.5px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:13px;outline:none;box-sizing:border-box;-webkit-appearance:none;appearance:none;transition:border-color .15s,box-shadow .15s;width:100%}
  .lf-ctrl:focus{border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,99,217,.1)}
  .lf-sel-wrap{position:relative;display:inline-flex;align-items:center}
  .lf-sel-wrap .lf-ctrl{padding-right:32px}
  .lf-ico{position:absolute;right:8px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted);pointer-events:none}
  .lf-search-wrap{position:relative;display:flex;align-items:center}
  .lf-search-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted);pointer-events:none}
  .lf-search{padding-left:36px!important}

  /* ── Modal ── */
  .bm-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(3px)}
  .bm-modal{background:var(--surface);border-radius:14px;box-shadow:0 24px 60px rgba(0,0,0,.25);width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden}
  .bm-header{padding:16px 24px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:var(--bg-card2)}
  .bm-steps{display:flex;align-items:center;gap:8px}
  .bm-step{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--text-muted)}
  .bm-step-active{color:var(--accent);font-weight:700}
  .bm-step-done{color:#10b981;font-weight:700}
  .bm-step-circle{width:26px;height:26px;border-radius:50%;background:var(--border-light);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0}
  .bm-step-active .bm-step-circle{background:var(--accent);color:#fff}
  .bm-step-done .bm-step-circle{background:#10b981;color:#fff}
  .bm-step-line{width:40px;height:2px;background:var(--border-light);flex-shrink:0}
  .bm-close-btn{background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex;align-items:center;padding:4px;border-radius:6px;transition:background .15s}
  .bm-close-btn:hover{background:var(--border-light)}
  .bm-body{flex:1;overflow-y:auto;padding:24px;display:flex;flex-direction:column;gap:20px}
  .bm-body-preview{padding:20px}
  .bm-footer{padding:14px 24px;border-top:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:var(--bg-card2)}

  /* ── Cards de upload ── */
  .bm-two-col{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  @media(max-width:600px){.bm-two-col{grid-template-columns:1fr}}
  .bm-card{background:var(--bg-card2);border:1.5px solid var(--border-light);border-radius:12px;padding:20px}
  .bm-card-icon{width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:12px}
  .bm-card-title{font-weight:700;font-size:14px;margin-bottom:6px}
  .bm-card-desc{font-size:12px;color:var(--text-muted);line-height:1.5}
  .bm-drop-zone{border:2px dashed var(--border);border-radius:10px;padding:28px 16px;text-align:center;cursor:pointer;transition:border-color .2s,background .2s}
  .bm-drop-zone:hover,.bm-drag-over{border-color:var(--accent);background:rgba(59,99,217,.04)}
  .bm-columns-ref{background:var(--bg-card2);border:1.5px solid var(--border-light);border-radius:10px;padding:16px}
  .bm-columns-ref-title{font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px}
  .bm-columns-grid{display:flex;flex-wrap:wrap;gap:6px}
  .bm-col-chip{font-size:11px;padding:3px 10px;border-radius:20px;font-family:monospace;font-weight:700}
  .bm-col-required{background:#fee2e2;color:#dc2626}
  .bm-col-optional{background:var(--border-light);color:var(--text-muted)}

  /* ── Editor table ── */
  .ed-table{border-collapse:collapse;font-size:12px;width:max-content;min-width:100%}
  .ed-th{padding:8px 4px;background:var(--bg-card2);border-bottom:2px solid var(--border-light);border-right:1px solid var(--border-light);font-size:10px;font-weight:700;color:var(--text-muted);text-transform:uppercase;white-space:nowrap;position:sticky;top:0;z-index:1}
  .ed-th-num{width:36px;text-align:center;padding:8px 4px}
  .ed-td{border-bottom:1px solid var(--border-light);border-right:1px solid var(--border-light);padding:0;vertical-align:middle}
  .ed-td-num{text-align:center;color:var(--text-muted);font-size:11px;background:var(--bg-card2);padding:6px 4px}
  .ed-td-error{background:rgba(220,38,38,.06)!important;outline:1px solid rgba(220,38,38,.3)}
  .ed-td-filled:not(.ed-td-error){background:rgba(59,99,217,.03)}
  .ed-input{width:100%;height:32px;padding:0 8px;border:none;background:transparent;color:var(--text-primary);font-size:12px;outline:none;box-sizing:border-box}
  .ed-input:focus{background:rgba(59,99,217,.06);outline:2px solid var(--accent)}
  .ed-select{width:100%;height:32px;padding:0 4px;border:none;background:transparent;color:var(--text-primary);font-size:12px;outline:none;cursor:pointer;-webkit-appearance:auto;appearance:auto}
  .ed-select:focus{background:rgba(59,99,217,.06)}

  /* ── Preview ── */
  .bm-preview-summary{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px}
  .bm-ps-item{display:flex;align-items:center;gap:12px;padding:14px 20px;border-radius:10px;flex:1;min-width:160px}
  .bm-ps-ok{background:#f0fdf4;color:#10b981}
  .bm-ps-err{background:#fff1f2;color:#dc2626}
  .bm-ps-num{font-size:24px;font-weight:800;font-family:var(--font-display)}
  .bm-ps-lbl{font-size:12px;opacity:.8}
  .bm-table-wrap{overflow:auto;border:1px solid var(--border-light);border-radius:8px;flex:1}
  .bm-table{width:100%;border-collapse:collapse;font-size:12px}
  .bm-table th{padding:10px 12px;background:var(--bg-card2);border-bottom:2px solid var(--border-light);text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;white-space:nowrap}
  .bm-table td{padding:10px 12px;border-bottom:1px solid var(--border-light);vertical-align:top}
  .bm-row-ok td:first-child{border-left:3px solid #10b981}
  .bm-row-err td:first-child{border-left:3px solid #dc2626}
  .bm-status-ok{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#dcfce7;color:#16a34a}
  .bm-status-err{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:50%;background:#fee2e2;color:#dc2626}
  .bm-err-chip{display:inline-block;background:#fee2e2;color:#dc2626;border-radius:4px;padding:2px 6px;font-size:10px;margin:2px 2px 0 0}

  /* ── Done ── */
  .bm-done-header{text-align:center;padding:24px 0 16px}
  .bm-done-icon{margin-bottom:10px}
  .bm-done-title{font-size:20px;font-weight:800;font-family:var(--font-display)}
  .bm-done-sub{display:flex;justify-content:center;gap:12px;margin-top:8px}
  .bm-done-ok-badge{background:#dcfce7;color:#16a34a;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700}
  .bm-done-err-badge{background:#fee2e2;color:#dc2626;padding:4px 14px;border-radius:20px;font-size:13px;font-weight:700}
  .bm-results-list{display:flex;flex-direction:column;gap:6px;max-height:380px;overflow-y:auto}
  .bm-result-row{display:flex;align-items:center;gap:10px;padding:10px 14px;border-radius:8px;border:1px solid var(--border-light)}
  .bm-result-ok{color:#16a34a;border-color:#bbf7d0}
  .bm-result-err{color:#dc2626;border-color:#fecaca}
</style>
  `
})
export class ClientesComponent implements OnInit {
  // ── Lista ──────────────────────────────────────────────────────────────────
  clientes: ClienteListDto[] = [];
  clientesFiltrados: ClienteListDto[] = [];
  loading = false;
  busqueda = ''; filtroEstado = 'todos';
  page = 0; pageSize = 10;
  clienteAEliminar: ClienteListDto | null = null;

  badgeOn  = 'background:rgba(59,99,217,.12);color:var(--accent);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700';
  badgeOff = 'background:rgba(100,100,100,.12);color:var(--text-muted);padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700';

  regimenes = [
    {value:'601',label:'601 – General de Ley PM'},{value:'603',label:'603 – PM sin Fines Lucrativos'},
    {value:'605',label:'605 – Sueldos y Salarios'},{value:'606',label:'606 – Arrendamiento'},
    {value:'612',label:'612 – PF Act. Empresariales'},{value:'616',label:'616 – Sin obligaciones'},
    {value:'621',label:'621 – Incorporación Fiscal'},{value:'626',label:'626 – RESICO'},
  ];

  // ── Bulk modal ─────────────────────────────────────────────────────────────
  showBulkModal = false;
  bulkStep: 'upload'|'editor'|'preview'|'done' = 'upload';
  dragOver = false;
  importing = false;
  importResults: ImportResult[] = [];

  // Editor
  editorRows: string[][] = [];
  editorErrors: string[][] = [];

  // Preview
  previewRows: {fila:number;rfc:string;nombre:string;regimenFiscal:string;usoCfdi:string;codigoPostal:string;valido:boolean;errores:string[];cols:string[]}[] = [];

  readonly EDITOR_HEADERS = [
    'RFC *','Nombre / Razón Social *','Régimen Fiscal *','Uso CFDI *','C.P. *',
    'Calle','N.Ext','N.Int','Colonia','Ciudad','Estado',
    'Email(s)','Teléfono','Persona Contacto','Notas'
  ];
  readonly EDITOR_COL_WIDTHS = [120,220,70,70,70,140,60,70,130,130,100,190,110,150,160];

  readonly EDITOR_SELECTS: Record<number,{value:string;label:string}[]> = {
    2: [ // regimenFiscal
      {value:'601',label:'601 – General de Ley Personas Morales'},
      {value:'603',label:'603 – PM sin Fines Lucrativos'},
      {value:'605',label:'605 – Sueldos y Salarios'},
      {value:'606',label:'606 – Arrendamiento'},
      {value:'607',label:'607 – Enajenación de Bienes'},
      {value:'608',label:'608 – Demás ingresos'},
      {value:'610',label:'610 – Residentes en el Extranjero'},
      {value:'611',label:'611 – Dividendos'},
      {value:'612',label:'612 – PF Act. Empresariales y Profesionales'},
      {value:'614',label:'614 – Ingresos por Intereses'},
      {value:'616',label:'616 – Sin obligaciones fiscales'},
      {value:'620',label:'620 – Coop. de Producción (diferir ingresos)'},
      {value:'621',label:'621 – Incorporación Fiscal'},
      {value:'622',label:'622 – Actividades Agrícolas/Ganaderas'},
      {value:'625',label:'625 – Plataformas Tecnológicas'},
      {value:'626',label:'626 – RESICO'},
    ],
    3: [ // usoCfdi
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
      {value:'D01',label:'D01 – Honorarios médicos, dentales'},
      {value:'D02',label:'D02 – Gastos médicos por incapacidad'},
      {value:'D03',label:'D03 – Gastos funerales'},
      {value:'D04',label:'D04 – Donativos'},
      {value:'D05',label:'D05 – Intereses hipotecarios'},
      {value:'D06',label:'D06 – Aportaciones voluntarias SAR'},
      {value:'D07',label:'D07 – Primas por seguros médicos'},
      {value:'D08',label:'D08 – Transportación escolar'},
      {value:'D09',label:'D09 – Depósitos en cuentas ahorro'},
      {value:'D10',label:'D10 – Colegiaturas'},
      {value:'S01',label:'S01 – Sin efectos fiscales'},
      {value:'CP01',label:'CP01 – Pagos'},
      {value:'CN01',label:'CN01 – Nómina'},
    ],
  };

  get editorFilledRows() { return this.editorRows.filter(r => r.some(c => c.trim())).length; }
  get editorHasErrors()  { return this.editorRows.some((r, ri) => r.some(c => c.trim()) && (this.editorErrors[ri]??[]).some(e => e)); }
  get bulkValidos()   { return this.previewRows.filter(r => r.valido); }
  get bulkInvalidos() { return this.previewRows.filter(r => !r.valido); }
  get importOk()  { return this.importResults.filter(r => r.exito).length; }
  get importErr() { return this.importResults.filter(r => !r.exito).length; }

  trackRow(i: number) { return i; }

  constructor(private clienteSvc: ClienteService) {}
  ngOnInit() { this.cargar(); }

  // ── Lista ──────────────────────────────────────────────────────────────────
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
      const mQ = !q || c.rfc.toLowerCase().includes(q) || c.nombre.toLowerCase().includes(q)
                     || (c.emails?.toLowerCase().includes(q) ?? false);
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

  // ── Bulk modal ─────────────────────────────────────────────────────────────
  openBulkModal() {
    this.showBulkModal = true; this.bulkStep = 'upload';
    this.editorRows = []; this.editorErrors = []; this.previewRows = []; this.importResults = [];
  }
  closeBulkModal() { this.showBulkModal = false; this.cargar(); }

  openEditor() {
    this.editorRows   = Array.from({length:5}, () => this.emptyRow());
    this.editorErrors = Array.from({length:5}, () => Array(TPL_H.length).fill(''));
    this.bulkStep = 'editor';
  }

  private emptyRow(): string[] {
    const r = Array(TPL_H.length).fill('');
    r[3] = 'G03'; // default usoCfdi
    return r;
  }

  // ── Editor events ──────────────────────────────────────────────────────────
  onEditorInput(ri: number, ci: number, val: string) {
    this.editorRows[ri][ci] = val;
    this.validateRow(ri);
    this.ensureEmptyBottom();
  }

  onEditorChange(ri: number, ci: number, val: string) {
    this.editorRows[ri][ci] = val;
    this.validateRow(ri);
    this.ensureEmptyBottom();
  }

  onPaste(event: ClipboardEvent, r0: number, c0: number) {
    const text = event.clipboardData?.getData('text/plain') ?? '';
    const lines = text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').trim().split('\n');
    const first = (lines[0]??'').split('\t');
    if (lines.length === 1 && first.length === 1) return;
    event.preventDefault();

    const needed = r0 + lines.length + 5;
    while (this.editorRows.length < needed) {
      this.editorRows   = [...this.editorRows,   ...Array.from({length:10},()=>this.emptyRow())];
      this.editorErrors = [...this.editorErrors, ...Array.from({length:10},()=>Array(TPL_H.length).fill(''))];
    }
    lines.forEach((line, rOff) => {
      line.split('\t').forEach((val, cOff) => {
        const tc = c0 + cOff;
        if (tc < TPL_H.length) this.editorRows[r0+rOff][tc] = val.trim();
      });
    });
    for (let i = 0; i < lines.length; i++) this.validateRow(r0 + i);
    this.ensureEmptyBottom();
  }

  private ensureEmptyBottom() {
    const last = this.editorRows[this.editorRows.length - 1];
    if (last.some((c, i) => i !== 3 && c.trim())) { // col 3 = usoCfdi default
      this.editorRows   = [...this.editorRows,   this.emptyRow()];
      this.editorErrors = [...this.editorErrors, Array(TPL_H.length).fill('')];
    }
  }

  private validateRow(ri: number) {
    const row = this.editorRows[ri];
    if (!row.some((c, i) => i !== 3 && c.trim())) {
      this.editorErrors[ri] = Array(TPL_H.length).fill(''); return;
    }
    this.editorErrors[ri] = row.map((v, ci) => this.validateField(ci, v));
  }

  private validateField(ci: number, raw: string): string {
    const v = raw.trim();
    switch (ci) {
      case 0: { // RFC
        if (!v) return 'Requerido';
        const u = v.toUpperCase();
        if (u.length < 12 || u.length > 13) return `12-13 chars (tiene ${u.length})`;
        if (!/^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/i.test(u)) return 'Formato inválido';
        return '';
      }
      case 1: return v ? '' : 'Requerido';
      case 2: return REGIMENES.includes(v) ? '' : 'Selecciona uno';
      case 3: return USOS_CFDI.includes(v)  ? '' : 'Selecciona uno';
      case 4: return !v ? 'Requerido' : !/^\d{5}$/.test(v) ? '5 dígitos' : '';
      case 11: { // emails
        if (!v) return '';
        const bad = v.split(',').map(e => e.trim()).filter(e => e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e));
        return bad.length ? `Email inválido: ${bad[0]}` : '';
      }
      default: return '';
    }
  }

  // ── Submit editor → preview ────────────────────────────────────────────────
  submitEditor() {
    const filled = this.editorRows.filter(r => r.some((c, i) => i !== 3 && c.trim()));
    if (!filled.length) { alert('Agrega al menos un cliente.'); return; }

    this.previewRows = filled.map((cols, idx) => {
      const errores = cols.map((v, ci) => this.validateField(ci, v)).filter(e => e);
      return {
        fila:          idx + 1,
        rfc:           cols[0]?.toUpperCase().trim() ?? '',
        nombre:        cols[1]?.toUpperCase().trim() ?? '',
        regimenFiscal: cols[2] ?? '',
        usoCfdi:       cols[3] ?? '',
        codigoPostal:  cols[4] ?? '',
        valido:        errores.length === 0,
        errores,
        cols
      };
    });
    this.bulkStep = 'preview';
  }

  // ── Importar ───────────────────────────────────────────────────────────────
  importar() {
    const validos = this.bulkValidos;
    if (!validos.length) return;
    this.importing = true;

    const payload: ImportarClienteItem[] = validos.map(r => {
      const c = r.cols;
      return {
        rfc:             (c[0]??'').toUpperCase().trim(),
        nombre:          (c[1]??'').toUpperCase().trim(),
        regimenFiscal:   c[2]??'',
        usoCfdi:         c[3]??'G03',
        codigoPostal:    c[4]??'',
        calle:           c[5]||undefined,
        numExterior:     c[6]||undefined,
        numInterior:     c[7]||undefined,
        colonia:         c[8]||undefined,
        ciudad:          c[9]||undefined,
        estado:          c[10]||undefined,
        emails:          c[11]||undefined,
        telefono:        c[12]||undefined,
        personaContacto: c[13]||undefined,
        notas:           c[14]||undefined,
      };
    });

    this.clienteSvc.importarMasivo(payload).subscribe({
      next: results => {
        this.importResults = results;
        this.importing = false;
        this.bulkStep = 'done';
      },
      error: () => {
        alert('Error al importar. Verifica tu conexión e intenta de nuevo.');
        this.importing = false;
      }
    });
  }

  // ── File handling ──────────────────────────────────────────────────────────
  onDrop(e: DragEvent) {
    e.preventDefault(); this.dragOver = false;
    const file = e.dataTransfer?.files[0];
    if (file) this.processFile(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.processFile(file);
    (e.target as HTMLInputElement).value = '';
  }

  processFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = ev => {
        const data = ev.target?.result as ArrayBuffer;
        const wb   = XLSX.read(data, { type: 'array' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header:1, defval:'', raw:false });
        this.loadFromRows(rows);
      };
      reader.readAsArrayBuffer(file);
      return;
    }
    if (!['csv','tsv','txt'].includes(ext)) {
      alert('Formato no soportado. Usa .xlsx, .csv, .tsv o .txt'); return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const firstLine = text.split('\n')[0] ?? '';
      let sep = ext === 'tsv' ? '\t' : ',';
      if (sep === ',' && firstLine.split('\t').length > firstLine.split(',').length) sep = '\t';
      this.loadFromRows(this.parseCSV(text, sep));
    };
    reader.readAsText(file, 'UTF-8');
  }

  private loadFromRows(allRows: string[][]) {
    const dataRows = allRows
      .map(r => r.map(c => String(c??'').trim()))
      .filter(r => r.some(c => c) && !r[0].startsWith('#'));

    if (dataRows.length < 2) {
      alert('El archivo no contiene datos (necesita encabezado y al menos una fila de datos).'); return;
    }

    const rawHeaders = dataRows[0].map(h => this.normalizeHeader(h));
    const rfcIdx = rawHeaders.findIndex(h => h === 'rfc');

    this.editorRows = dataRows.slice(1)
      .filter(cols => {
        if (rfcIdx >= 0) {
          const rfcVal = cols[rfcIdx] ?? '';
          if (rfcVal.includes(':') || rfcVal.includes('chars') || rfcVal.includes('→')) return false;
        }
        return cols.some(c => c);
      })
      .map(cols => {
        const raw: Record<string,string> = {};
        rawHeaders.forEach((h, idx) => { if (h) raw[h] = cols[idx] ?? ''; });
        return [
          raw['rfc']             ?? '',
          raw['nombre']          ?? '',
          raw['regimenFiscal']   ?? '',
          raw['usoCfdi']         ?? 'G03',
          raw['codigoPostal']    ?? '',
          raw['calle']           ?? '',
          raw['numExterior']     ?? '',
          raw['numInterior']     ?? '',
          raw['colonia']         ?? '',
          raw['ciudad']          ?? '',
          raw['estado']          ?? '',
          raw['emails']          ?? '',
          raw['telefono']        ?? '',
          raw['personaContacto'] ?? '',
          raw['notas']           ?? '',
        ];
      });

    if (!this.editorRows.length) {
      alert('No se encontraron filas de datos en el archivo.'); return;
    }

    this.editorRows.push(this.emptyRow());
    this.editorErrors = Array.from({length:this.editorRows.length}, () => Array(TPL_H.length).fill(''));
    this.editorRows.forEach((_, ri) => { if (ri < this.editorRows.length - 1) this.validateRow(ri); });
    this.bulkStep = 'editor';
  }

  private normalizeHeader(h: string): string | undefined {
    const n = h.toLowerCase().trim()
      .normalize('NFD').replace(/[̀-ͯ]/g,'')
      .replace(/[^a-z0-9]/g,'');
    const MAP: Record<string,string> = {
      'rfc':'rfc',
      'nombre':'nombre','razonsocial':'nombre','razon':'nombre',
      'regimenfiscal':'regimenFiscal','regimen':'regimenFiscal',
      'usocfdi':'usoCfdi','uso':'usoCfdi',
      'codigopostal':'codigoPostal','cp':'codigoPostal',
      'calle':'calle',
      'numexterior':'numExterior','exterior':'numExterior','noext':'numExterior',
      'numinterior':'numInterior','interior':'numInterior','noint':'numInterior',
      'colonia':'colonia',
      'ciudad':'ciudad','municipio':'ciudad',
      'estado':'estado',
      'emails':'emails','email':'emails','correo':'emails','correos':'emails',
      'telefono':'telefono','tel':'telefono','phone':'telefono',
      'personacontacto':'personaContacto','contacto':'personaContacto',
      'notas':'notas','observaciones':'notas',
    };
    return MAP[n];
  }

  private parseCSV(text: string, sep: string): string[][] {
    const rows: string[][] = [];
    for (const line of text.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n')) {
      if (!line.trim()) continue;
      const fields: string[] = [];
      let inQ = false, cur = '';
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { if (inQ && line[i+1]==='"') { cur+='"'; i++; } else inQ=!inQ; }
        else if (ch === sep && !inQ) { fields.push(cur.trim()); cur=''; }
        else cur += ch;
      }
      fields.push(cur.trim());
      rows.push(fields);
    }
    return rows;
  }

  // ── Plantillas ─────────────────────────────────────────────────────────────
  downloadCsvTemplate() {
    const sep = ',';
    const cat = `
# ─── CATÁLOGOS ───────────────────────────────────────────────────────────────
# regimenFiscal : 601=General PM  603=PM sin Fines  605=Sueldos  606=Arrendamiento
#                 612=PF Act.Empresariales  616=Sin obligaciones  626=RESICO
# usoCfdi       : G01=Adquisición  G02=Devoluciones  G03=Gastos en general
#                 S01=Sin efectos  CP01=Pagos  CN01=Nómina
# codigoPostal  : 5 dígitos  Ej: 06600
# rfc           : 12 chars (PM) o 13 chars (PF)  Ej: AAA010101AAA / PEGJ850101AAA
`.trim();
    const content = [TPL_H.join(sep), TPL_EXAMPLE.join(sep), '', cat].join('\n');
    const blob = new Blob(['﻿'+content], {type:'text/csv;charset=utf-8'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'plantilla_clientes.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  downloadExcelTemplate() {
    const wb = XLSX.utils.book_new();

    const COLS = [
      {header:'rfc *',             hint:'12-13 chars: AAA010101AAA (PM) | PEGJ850101AAA (PF)', width:22},
      {header:'nombre *',          hint:'MAYÚSCULAS: RAZÓN SOCIAL COMPLETA',                   width:30},
      {header:'regimenFiscal *',   hint:'601=PM  612=PF  616=Sin obligaciones  626=RESICO',    width:20},
      {header:'usoCfdi *',         hint:'G03=Gastos en general  S01=Sin efectos  CP01=Pagos',  width:20},
      {header:'codigoPostal *',    hint:'5 dígitos: 06600',                                    width:14},
      {header:'calle',             hint:'Opcional',    width:20},
      {header:'numExterior',       hint:'Opcional',    width:12},
      {header:'numInterior',       hint:'Opcional',    width:12},
      {header:'colonia',           hint:'Opcional',    width:20},
      {header:'ciudad',            hint:'Opcional',    width:18},
      {header:'estado',            hint:'Opcional',    width:16},
      {header:'emails',            hint:'Opcional, separados por coma: a@b.com,c@d.com', width:28},
      {header:'telefono',          hint:'Opcional: 55 1234 5678',   width:16},
      {header:'personaContacto',   hint:'Opcional',    width:20},
      {header:'notas',             hint:'Opcional',    width:24},
    ];

    const ws = XLSX.utils.aoa_to_sheet([
      COLS.map(c => c.header),
      COLS.map(c => c.hint),
      TPL_EXAMPLE,
    ]);
    ws['!cols'] = COLS.map(c => ({wch:c.width}));
    ws['!views'] = [{state:'frozen',ySplit:1,xSplit:0,topLeftCell:'A2'}];

    const comment = (ref: string, txt: string) => { const cell = ws[ref]; if (!cell) return; cell.c = [{a:'FactuMag',t:txt}]; };
    comment('A1','RFC del cliente receptor.\n12 chars = Persona Moral (ej: AAA010101AAA)\n13 chars = Persona Física (ej: PEGJ850101AAA)');
    comment('C1','Régimen fiscal del receptor:\n601 = General de Ley PM\n603 = PM sin Fines Lucrativos\n605 = Sueldos y Salarios\n606 = Arrendamiento\n612 = PF Act. Empresariales\n616 = Sin obligaciones fiscales\n621 = Incorporación Fiscal\n626 = RESICO');
    comment('D1','Uso del CFDI más comunes:\nG01 = Adquisición de mercancias\nG02 = Devoluciones, descuentos\nG03 = Gastos en general\nS01 = Sin efectos fiscales\nCP01 = Pagos\nCN01 = Nómina');

    XLSX.utils.book_append_sheet(wb, ws, 'Clientes');

    const CAT: (string|number)[][] = [
      ['CAMPO','CÓDIGO','DESCRIPCIÓN'],
      ['regimenFiscal','601','General de Ley Personas Morales'],
      ['','603','Personas Morales con Fines no Lucrativos'],
      ['','605','Sueldos y Salarios e Ingresos Asimilados'],
      ['','606','Arrendamiento'],
      ['','607','Enajenación o Adquisición de Bienes'],
      ['','608','Demás ingresos'],
      ['','610','Residentes en el Extranjero sin EP'],
      ['','611','Dividendos (socios y accionistas)'],
      ['','612','PF con Actividades Empresariales y Profesionales'],
      ['','614','Ingresos por intereses'],
      ['','616','Sin obligaciones fiscales'],
      ['','621','Incorporación Fiscal'],
      ['','622','Actividades Agrícolas, Ganaderas, Silvícolas'],
      ['','625','Plataformas Tecnológicas'],
      ['','626','RESICO'],
      [],
      ['usoCfdi','G01','Adquisición de mercancias'],
      ['','G02','Devoluciones, descuentos o bonificaciones'],
      ['','G03','Gastos en general'],
      ['','I01','Construcciones'],
      ['','I02','Mobiliario y equipo de oficina'],
      ['','I03','Equipo de transporte'],
      ['','I04','Equipo de cómputo y accesorios'],
      ['','I06','Comunicaciones telefónicas'],
      ['','I08','Otra maquinaria y equipo'],
      ['','D01','Honorarios médicos, dentales y hospitalarios'],
      ['','D07','Primas por seguros de gastos médicos'],
      ['','D10','Pagos por servicios educativos (colegiaturas)'],
      ['','S01','Sin efectos fiscales'],
      ['','CP01','Pagos'],
      ['','CN01','Nómina'],
    ];
    const wsCat = XLSX.utils.aoa_to_sheet(CAT);
    wsCat['!cols'] = [{wch:18},{wch:8},{wch:52}];
    XLSX.utils.book_append_sheet(wb, wsCat, 'Catálogos');

    XLSX.writeFile(wb, 'plantilla_clientes.xlsx');
  }
}
