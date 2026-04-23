import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CxcService, CxcItem } from '../../core/services/CXC/CxcService';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { TrustUrlPipe } from '../../core/pipes/trust-url.pipe';

const FORMAS_PAGO = [
  { value: '01', label: 'Efectivo' },
  { value: '02', label: 'Cheque nominativo' },
  { value: '03', label: 'Transferencia electrónica' },
  { value: '04', label: 'Tarjeta de crédito' },
  { value: '28', label: 'Tarjeta de débito' },
  { value: '29', label: 'Tarjeta de servicios' },
  { value: '99', label: 'Por definir' },
];

@Component({
  selector: 'app-cxc-detalle',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, TrustUrlPipe],
  template: `
  <!-- ── Loading ───────────────────────────────────────────────────── -->
  <div *ngIf="!cuenta && loading" class="loading-screen">
    <span class="material-icons-round spin" style="font-size:40px;color:var(--accent)">refresh</span>
  </div>

  <div *ngIf="cuenta" class="det-page">

    <!-- ── HEADER ───────────────────────────────────────────────────── -->
    <div class="det-header">
      <div class="det-header-left">
        <button class="back-btn" routerLink="/cuentas-cobrar">
          <span class="material-icons-round">arrow_back</span>
        </button>
        <div class="det-avatar">{{ initials(cuenta.receptorNombre) }}</div>
        <div>
          <h1 class="det-name">{{ cuenta.receptorNombre }}</h1>
          <div class="det-meta">
            <span class="det-rfc">{{ cuenta.receptorRfc }}</span>
            <span class="det-dot">·</span>
            <span class="metodo-pill">{{ cuenta.metodoPago }}</span>
            <ng-container *ngIf="cuenta.cfdiUuid">
              <span class="det-dot">·</span>
              <span class="det-uuid">{{ cuenta.cfdiUuid }}</span>
            </ng-container>
          </div>
        </div>
      </div>
      <div class="det-header-right">
        <span [class]="'estado-chip estado-' + cuenta.estado.toLowerCase()">
          {{ estadoLabel(cuenta.estado) }}
        </span>
        <ng-container *ngIf="cuenta.cfdiUuid">
          <button class="hdr-btn" title="Descargar XML" (click)="descargar('xml')">
            <span class="material-icons-round">code</span>
            <span>XML</span>
          </button>
          <button class="hdr-btn" title="Descargar PDF" (click)="descargar('pdf')">
            <span class="material-icons-round">picture_as_pdf</span>
            <span>PDF</span>
          </button>
          <button class="hdr-btn hdr-btn-danger" title="Cancelar factura" (click)="cancelarFactura()"
                  *ngIf="cuenta.estado !== 'Pagado'">
            <span class="material-icons-round">cancel</span>
            <span>Cancelar</span>
          </button>
        </ng-container>
      </div>
    </div>

    <!-- ── KPI + PROGRESO ──────────────────────────────────────────── -->
    <div class="metrics-row">

      <div class="metric-card">
        <div class="metric-icon metric-neutral">
          <span class="material-icons-round">receipt_long</span>
        </div>
        <div>
          <div class="metric-label">Monto total</div>
          <div class="metric-value">{{ cuenta.monto | currency:'MXN':'symbol':'1.2-2' }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon metric-green">
          <span class="material-icons-round">check_circle</span>
        </div>
        <div>
          <div class="metric-label">Cobrado</div>
          <div class="metric-value" style="color:#059669">{{ cuenta.totalPagado | currency:'MXN':'symbol':'1.2-2' }}</div>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-icon" [class]="cuenta.saldoPendiente > 0 ? 'metric-red' : 'metric-green'">
          <span class="material-icons-round">{{ cuenta.saldoPendiente > 0 ? 'hourglass_empty' : 'done_all' }}</span>
        </div>
        <div>
          <div class="metric-label">Saldo pendiente</div>
          <div class="metric-value" [style.color]="cuenta.saldoPendiente > 0 ? '#dc2626' : '#059669'">
            {{ cuenta.saldoPendiente | currency:'MXN':'symbol':'1.2-2' }}
          </div>
        </div>
      </div>

      <!-- Progreso -->
      <div class="progress-card">
        <div class="progress-header">
          <span class="progress-title">Progreso de cobro</span>
          <span class="progress-pct">{{ porcentajeCobrado | number:'1.0-0' }}%</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill"
               [style.width]="porcentajeCobrado + '%'"
               [style.background]="porcentajeCobrado >= 100 ? '#10b981' : 'linear-gradient(90deg,#3b82f6,#6366f1)'">
          </div>
        </div>
        <div class="progress-labels">
          <span>{{ cuenta.totalPagado | currency:'MXN':'symbol':'1.0-0' }} cobrado</span>
          <span *ngIf="cuenta.saldoPendiente > 0">{{ cuenta.saldoPendiente | currency:'MXN':'symbol':'1.0-0' }} restante</span>
        </div>
      </div>

    </div>

    <!-- ── VENCIMIENTO ─────────────────────────────────────────────── -->
    <div class="venc-bar">
      <div class="venc-bar-left">
        <span class="material-icons-round" style="font-size:18px;color:var(--text-muted)">event</span>
        <span class="venc-bar-label">Fecha de vencimiento</span>
        <span *ngIf="cuenta.fechaVencimiento"
              [class]="esVencida ? 'venc-tag venc-red' : 'venc-tag venc-green'">
          <span class="material-icons-round" style="font-size:13px">{{ esVencida ? 'event_busy' : 'event_available' }}</span>
          {{ cuenta.fechaVencimiento | date:'dd MMM yyyy' }}
          <span *ngIf="esVencida"> · Vencida</span>
        </span>
        <span *ngIf="!cuenta.fechaVencimiento" class="venc-none">Sin fecha asignada</span>
      </div>
      <div class="venc-bar-right">
        <div class="date-iw">
          <span class="material-icons-round date-ico">calendar_today</span>
          <input type="date" [(ngModel)]="nuevaFechaVencimiento" class="date-inp">
        </div>
        <button class="btn-mag btn-outline btn-sm" (click)="guardarVencimiento()"
                [disabled]="!nuevaFechaVencimiento || guardandoVenc">
          <span *ngIf="guardandoVenc" class="material-icons-round spin" style="font-size:15px">refresh</span>
          <span *ngIf="!guardandoVenc" class="material-icons-round" style="font-size:15px">save</span>
          {{ guardandoVenc ? 'Guardando...' : 'Guardar fecha' }}
        </button>
      </div>
    </div>

    <!-- ── MAIN GRID ───────────────────────────────────────────────── -->
    <div class="main-grid">

      <!-- HISTORIAL ────────────────────────────── -->
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <span class="material-icons-round panel-title-icon">history</span>
            Historial de pagos
          </div>
          <span class="panel-count">{{ cuenta.pagos.length }} {{ cuenta.pagos.length === 1 ? 'pago' : 'pagos' }}</span>
        </div>

        <!-- Empty -->
        <div *ngIf="cuenta.pagos.length === 0" class="pagos-empty">
          <span class="material-icons-round" style="font-size:36px;opacity:.3">payments</span>
          <span>Sin pagos registrados</span>
        </div>

        <!-- Lista de pagos -->
        <div *ngIf="cuenta.pagos.length > 0" class="pagos-list">
          <div *ngFor="let p of cuenta.pagos; let i = index; let last = last"
               class="pago-row" [class.pago-last]="last">

            <!-- Número + línea de timeline -->
            <div class="pago-timeline">
              <div class="pago-num">{{ i + 1 }}</div>
              <div *ngIf="!last" class="pago-line"></div>
            </div>

            <!-- Contenido -->
            <div class="pago-content">
              <div class="pago-top">
                <div class="pago-left">
                  <span class="pago-monto">{{ p.monto | currency:'MXN':'symbol':'1.2-2' }}</span>
                  <span class="pago-fp">{{ p.formaPagoLabel }}</span>
                </div>
                <div class="pago-right">
                  <span class="pago-fecha">{{ p.fecha | date:'dd MMM yyyy' }}</span>
                  <button class="recibo-btn" (click)="descargarRecibo(p)" title="Descargar recibo de caja"
                          [disabled]="descargandoRecibo === p.id">
                    <span class="material-icons-round"
                          [class.spin]="descargandoRecibo === p.id">
                      {{ descargandoRecibo === p.id ? 'refresh' : 'receipt' }}
                    </span>
                    <span>Recibo</span>
                  </button>
                  <button *ngIf="p.comprobanteUrl" class="comp-voucher-btn"
                          (click)="verComprobante(p)" title="Ver comprobante"
                          [disabled]="descargandoComprobante === p.id">
                    <span class="material-icons-round" [class.spin]="descargandoComprobante===p.id">
                      {{ descargandoComprobante===p.id ? 'refresh' : 'attach_file' }}
                    </span>
                    <span>{{ descargandoComprobante===p.id ? 'Cargando...' : 'Comprobante' }}</span>
                  </button>
                  <button class="del-btn" (click)="eliminarPago(p.id)" title="Eliminar pago">
                    <span class="material-icons-round">delete_outline</span>
                  </button>
                </div>
              </div>

              <div *ngIf="p.referencia" class="pago-ref">
                <span class="material-icons-round" style="font-size:13px">tag</span>
                {{ p.referencia }}
              </div>

              <!-- Miniatura comprobante inline -->
              <div *ngIf="p.comprobanteUrl" class="comp-preview-row">
                <ng-container *ngIf="thumbObjUrl(p.id) as tUrl">
                  <!-- Imagen: miniatura clicable -->
                  <div *ngIf="thumbEsImagen(p.id)" class="comp-thumb-wrap" (click)="verComprobante(p)">
                    <img [src]="tUrl" class="comp-thumb" alt="Comprobante">
                    <div class="comp-thumb-overlay">
                      <span class="material-icons-round" style="font-size:20px;color:#fff">zoom_in</span>
                    </div>
                  </div>
                  <!-- PDF: chip con ícono -->
                  <div *ngIf="!thumbEsImagen(p.id)" class="comp-pdf-chip" (click)="verComprobante(p)">
                    <span class="material-icons-round" style="font-size:20px;color:#dc2626">picture_as_pdf</span>
                    <div>
                      <div style="font-size:12px;font-weight:600;color:var(--text-primary)">Comprobante adjunto</div>
                      <div style="font-size:11px;color:var(--text-muted)">Clic para ver PDF</div>
                    </div>
                    <span class="material-icons-round" style="font-size:16px;color:var(--text-muted);margin-left:auto">open_in_new</span>
                  </div>
                </ng-container>
                <!-- Cargando miniatura -->
                <div *ngIf="!thumbObjUrl(p.id) && descargandoComprobante!==p.id"
                     class="comp-thumb-loading" (click)="cargarMiniatura(p)">
                  <span class="material-icons-round" style="font-size:18px;color:var(--accent)">attach_file</span>
                  <span style="font-size:11px;color:var(--accent);font-weight:600">Ver comprobante</span>
                </div>
                <div *ngIf="descargandoComprobante===p.id" class="comp-thumb-loading">
                  <span class="material-icons-round spin" style="font-size:18px;color:var(--accent)">refresh</span>
                  <span style="font-size:11px;color:var(--text-muted)">Cargando...</span>
                </div>
              </div>

              <!-- Complemento CFDI -->
              <div class="pago-complemento">
                <!-- Timbrado -->
                <ng-container *ngIf="p.complementoEstado === 'Timbrado'">
                  <div class="comp-timbrado">
                    <div class="comp-timbrado-header">
                      <span class="comp-badge-ok">
                        <span class="material-icons-round" style="font-size:12px">verified</span>
                        Complemento timbrado
                      </span>
                      <div class="comp-actions">
                        <button class="comp-btn" title="Descargar XML" (click)="descargarComplemento(p,'xml')">
                          <span class="material-icons-round">code</span> XML
                        </button>
                        <button class="comp-btn" title="Descargar PDF" (click)="descargarComplemento(p,'pdf')">
                          <span class="material-icons-round">picture_as_pdf</span> PDF
                        </button>
                        <button class="comp-btn comp-btn-danger" title="Cancelar complemento"
                                (click)="cancelarComplemento(p)">
                          <span class="material-icons-round">cancel</span>
                        </button>
                      </div>
                    </div>
                    <span class="comp-uuid">{{ p.cfdiComplementoUuid }}</span>
                  </div>
                </ng-container>

                <!-- Pendiente / Error -->
                <button *ngIf="p.complementoEstado === 'Pendiente' || p.complementoEstado === 'Error'"
                        class="comp-retry"
                        [class.comp-retry-error]="p.complementoEstado === 'Error'"
                        [class.comp-retry-pending]="p.complementoEstado === 'Pendiente'"
                        (click)="reintentarComplemento(p.id)"
                        [disabled]="reintentando === p.id">
                  <span class="material-icons-round"
                        [class.spin]="reintentando === p.id">
                    {{ reintentando === p.id ? 'refresh' : (p.complementoEstado === 'Error' ? 'error_outline' : 'upload') }}
                  </span>
                  {{ reintentando === p.id ? 'Timbrando...'
                    : p.complementoEstado === 'Error' ? 'Error al timbrar — Reintentar'
                    : 'Pendiente — Timbrar complemento' }}
                </button>

                <!-- Sin complemento -->
                <span *ngIf="!p.complementoEstado" class="comp-na">Sin complemento de pago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PANEL DERECHO ──────────────────────── -->
      <div class="side-col">

        <!-- Formulario registro de pago -->
        <div class="panel" *ngIf="cuenta.estado !== 'Pagado'">
          <div class="panel-header">
            <div class="panel-title">
              <span class="material-icons-round panel-title-icon">add_circle</span>
              Registrar pago
            </div>
          </div>

          <div class="form-body">

            <div *ngIf="errorPago" class="form-alert-danger">
              <span class="material-icons-round" style="font-size:16px;flex-shrink:0">error_outline</span>
              {{ errorPago }}
            </div>

            <!-- Monto -->
            <div class="field">
              <label class="flabel">Monto <span class="req">*</span></label>
              <div class="currency-iw">
                <span class="currency-prefix">$</span>
                <input type="number" [(ngModel)]="pago.monto" class="currency-input"
                       [placeholder]="'Máx. ' + (cuenta.saldoPendiente | number:'1.2-2')"
                       step="0.01" min="0.01" [max]="cuenta.saldoPendiente">
                <span class="currency-suffix">MXN</span>
              </div>
              <div class="field-hint">Saldo disponible: {{ cuenta.saldoPendiente | currency:'MXN':'symbol':'1.2-2' }}</div>
            </div>

            <!-- Forma de pago -->
            <div class="field">
              <label class="flabel">Forma de pago <span class="req">*</span></label>
              <div class="sel-wrap">
                <span class="material-icons-round sel-icon">payment</span>
                <select [(ngModel)]="pago.formaPago" class="sel-input">
                  <option *ngFor="let f of formasPago" [value]="f.value">{{ f.value }} – {{ f.label }}</option>
                </select>
                <span class="material-icons-round sel-caret">expand_more</span>
              </div>
            </div>

            <!-- Fecha -->
            <div class="field">
              <label class="flabel">Fecha de pago <span class="req">*</span></label>
              <div class="date-iw">
                <span class="material-icons-round date-ico">calendar_today</span>
                <input type="date" [(ngModel)]="pago.fecha" class="date-inp">
              </div>
            </div>

            <!-- Referencia -->
            <div class="field">
              <label class="flabel">Referencia <span class="fopt">opcional</span></label>
              <div class="txt-iw">
                <span class="material-icons-round txt-icon">tag</span>
                <input type="text" [(ngModel)]="pago.referencia" class="txt-input"
                       placeholder="Folio de transferencia, cheque, etc.">
              </div>
            </div>

            <!-- Comprobante de pago -->
            <div class="field">
              <label class="flabel">Comprobante de pago <span class="fopt">opcional</span></label>
              <label class="file-drop" [class.file-drop-ok]="comprobanteFile"
                     (dragover)="$event.preventDefault()" (drop)="onComprobanteDrop($event)">
                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                       style="display:none" #fileInput (change)="onComprobanteChange($event)">
                <ng-container *ngIf="!comprobanteFile">
                  <span class="material-icons-round" style="font-size:28px;color:var(--text-muted);margin-bottom:6px">upload_file</span>
                  <span style="font-size:12px;font-weight:600;color:var(--text-secondary)">Arrastra o selecciona archivo</span>
                  <span style="font-size:11px;color:var(--text-muted);margin-top:2px">PDF, JPG, PNG hasta 10 MB</span>
                  <button type="button" class="btn-mag btn-outline btn-sm" style="margin-top:8px"
                          (click)="fileInput.click()">Seleccionar archivo</button>
                </ng-container>
                <ng-container *ngIf="comprobanteFile">
                  <span class="material-icons-round" style="font-size:24px;color:#059669;margin-bottom:4px">
                    {{ comprobanteFile.type === 'application/pdf' ? 'picture_as_pdf' : 'image' }}
                  </span>
                  <span style="font-size:12px;font-weight:600;color:#059669;max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
                    {{ comprobanteFile.name }}
                  </span>
                  <span style="font-size:11px;color:var(--text-muted);margin-top:2px">
                    {{ (comprobanteFile.size / 1024 / 1024).toFixed(2) }} MB
                  </span>
                  <button type="button" class="btn-mag btn-ghost btn-sm" style="margin-top:6px;color:#dc2626"
                          (click)="$event.stopPropagation(); comprobanteFile=null">
                    <span class="material-icons-round" style="font-size:14px">close</span> Quitar
                  </button>
                </ng-container>
              </label>
            </div>

            <!-- Toggle PPD -->
            <div *ngIf="cuenta.metodoPago === 'PPD'" class="ppd-box">
              <div class="ppd-box-left">
                <div class="ppd-title">Complemento de Pago SAT</div>
                <div class="ppd-desc">Factura PPD — el SAT exige timbrar un CFDI tipo P por cada pago.</div>
              </div>
              <label class="toggle">
                <input type="checkbox" [(ngModel)]="pago.generarComplemento">
                <span class="toggle-track">
                  <span class="toggle-thumb"></span>
                </span>
              </label>
            </div>

            <button class="submit-btn" (click)="registrarPago()"
                    [disabled]="registrando || !pago.monto || !pago.formaPago || !pago.fecha">
              <span *ngIf="registrando" class="material-icons-round spin">refresh</span>
              <span *ngIf="!registrando" class="material-icons-round">check</span>
              {{ registrando
                  ? (pago.generarComplemento ? 'Timbrando complemento...' : 'Registrando...')
                  : 'Registrar pago' }}
            </button>

          </div>
        </div>

        <!-- Cobrado completo -->
        <div class="panel paid-panel" *ngIf="cuenta.estado === 'Pagado'">
          <div class="paid-icon">
            <span class="material-icons-round">verified</span>
          </div>
          <div class="paid-title">Factura liquidada</div>
          <div class="paid-sub">Todos los pagos fueron recibidos correctamente.</div>
        </div>

      </div>
    </div>
  </div>

  <!-- ── MODAL VISOR DE COMPROBANTE ────────────────────────────────────── -->
  <div *ngIf="visorUrl" class="modal-overlay" (click)="cerrarVisor()">
    <div class="visor-box" (click)="$event.stopPropagation()">

      <div class="visor-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="material-icons-round" style="color:var(--accent);font-size:22px">attach_file</span>
          <div>
            <div style="font-size:15px;font-weight:700;color:var(--text-primary)">Comprobante de pago</div>
            <div style="font-size:11px;color:var(--text-muted)">{{ visorPagoRef }}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <button class="comp-btn" (click)="descargarVisorActual()" title="Descargar">
            <span class="material-icons-round">download</span> Descargar
          </button>
          <button class="modal-x" (click)="cerrarVisor()">
            <span class="material-icons-round">close</span>
          </button>
        </div>
      </div>

      <!-- Imagen -->
      <div *ngIf="visorEsImagen" class="visor-img-wrap">
        <img [src]="visorUrl" class="visor-img" alt="Comprobante">
      </div>

      <!-- PDF -->
      <div *ngIf="!visorEsImagen" class="visor-pdf-wrap">
        <iframe [src]="visorUrl | trustUrl" class="visor-iframe" title="Comprobante PDF"></iframe>
      </div>

    </div>
  </div>

  <!-- ── MODAL CANCELAR FACTURA ──────────────────────────────────────── -->
  <ng-template [ngIf]="showCancelModal || showCancelComplementoModal">
    <div class="modal-overlay"
         (click)="showCancelModal ? (showCancelModal=false) : (showCancelComplementoModal=false)">
      <div class="modal-box" (click)="$event.stopPropagation()">

        <div class="modal-header">
          <div class="modal-icon-red">
            <span class="material-icons-round">cancel</span>
          </div>
          <div>
            <div class="modal-title">
              {{ showCancelModal ? 'Cancelar factura' : 'Cancelar complemento de pago' }}
            </div>
            <div class="modal-sub">
              <ng-container *ngIf="showCancelModal">
                {{ cuenta?.receptorNombre }}
              </ng-container>
              <ng-container *ngIf="showCancelComplementoModal">
                <span style="font-family:monospace;font-size:11px">{{ pagoACancelar?.cfdiComplementoUuid }}</span>
              </ng-container>
            </div>
          </div>
          <button class="modal-x"
                  (click)="showCancelModal ? (showCancelModal=false) : (showCancelComplementoModal=false)">
            <span class="material-icons-round">close</span>
          </button>
        </div>

        <div class="modal-body">
          <!-- Motivo -->
          <div class="field">
            <label class="flabel">Motivo de cancelación <span class="req">*</span></label>
            <div class="sel-wrap">
              <span class="material-icons-round sel-icon">help_outline</span>
              <select class="sel-input"
                      [(ngModel)]="showCancelModal ? cancelMotivo : cancelComplementoMotivo">
                <option *ngFor="let m of MOTIVOS_CANCEL" [value]="m.value">{{ m.label }}</option>
              </select>
              <span class="material-icons-round sel-caret">expand_more</span>
            </div>
          </div>

          <!-- UUID sustitución (motivo 01) -->
          <div class="field"
               *ngIf="(showCancelModal && cancelMotivo==='01') || (showCancelComplementoModal && cancelComplementoMotivo==='01')">
            <label class="flabel">UUID de sustitución <span class="req">*</span></label>
            <div class="txt-iw">
              <span class="material-icons-round txt-icon">link</span>
              <input type="text" class="txt-input"
                     [(ngModel)]="showCancelModal ? cancelFolioSust : cancelComplementoFolioSust"
                     placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
            </div>
          </div>

          <div class="alert-danger">
            <span class="material-icons-round" style="font-size:18px;flex-shrink:0">warning</span>
            Esta acción se envía al SAT y <strong>&nbsp;no puede revertirse</strong>. El receptor verá la cancelación en su buzón tributario.
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-mag btn-ghost"
                  [disabled]="cancelando || cancelandoComplemento"
                  (click)="showCancelModal ? (showCancelModal=false) : (showCancelComplementoModal=false)">
            Cerrar
          </button>
          <button class="btn-danger-confirm"
                  (click)="showCancelModal ? confirmarCancelacion() : confirmarCancelacionComplemento()"
                  [disabled]="cancelando || cancelandoComplemento ||
                              (showCancelModal && cancelMotivo==='01' && !cancelFolioSust) ||
                              (showCancelComplementoModal && cancelComplementoMotivo==='01' && !cancelComplementoFolioSust)">
            <span class="material-icons-round spin" *ngIf="cancelando || cancelandoComplemento">refresh</span>
            <span class="material-icons-round" *ngIf="!cancelando && !cancelandoComplemento">check</span>
            {{ (cancelando || cancelandoComplemento) ? 'Enviando al SAT...' : 'Confirmar cancelación' }}
          </button>
        </div>

      </div>
    </div>
  </ng-template>
  `,
  styles: [`
    @keyframes spin { to { transform:rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; display:inline-block; }

    .loading-screen {
      display:flex; align-items:center; justify-content:center; min-height:60vh;
    }

    /* ── Page ── */
    .det-page { display:flex; flex-direction:column; gap:20px; }

    /* ── Header ── */
    .det-header {
      display:flex; align-items:center; justify-content:space-between;
      gap:16px; flex-wrap:wrap;
    }
    .det-header-left  { display:flex; align-items:center; gap:14px; }
    .det-header-right { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }

    .back-btn {
      width:36px; height:36px; border-radius:var(--radius-sm); border:1px solid var(--border-light);
      background:var(--surface); cursor:pointer; display:flex; align-items:center;
      justify-content:center; color:var(--text-secondary); flex-shrink:0; transition:.13s;
      &:hover { background:var(--accent-light); color:var(--accent); border-color:var(--accent); }
    }
    .back-btn .material-icons-round { font-size:20px; }

    .det-avatar {
      width:46px; height:46px; border-radius:12px; background:var(--accent);
      color:#fff; display:flex; align-items:center; justify-content:center;
      font-size:16px; font-weight:800; font-family:var(--font-display); flex-shrink:0;
    }
    .det-name {
      font-size:18px; font-weight:800; color:var(--text-primary);
      font-family:var(--font-display); margin:0;
    }
    .det-meta { display:flex; align-items:center; gap:6px; flex-wrap:wrap; margin-top:3px; }
    .det-rfc  { font-size:12px; color:var(--text-muted); font-family:monospace; }
    .det-dot  { color:var(--border); font-size:12px; }
    .det-uuid { font-size:10px; color:var(--text-muted); font-family:monospace;
                word-break:break-all; max-width:340px; line-height:1.3; }

    .metodo-pill {
      font-size:10px; font-weight:700; padding:2px 7px; border-radius:4px;
      background:var(--accent-light); color:var(--accent);
    }
    .estado-chip {
      display:inline-flex; align-items:center; padding:4px 12px; border-radius:20px;
      font-size:12px; font-weight:600; white-space:nowrap;
    }
    .estado-pendiente          { background:#fef3c7; color:#d97706; }
    .estado-vencido            { background:#fee2e2; color:#dc2626; }
    .estado-parcialmentepagado { background:#dbeafe; color:#2563eb; }
    .estado-pagado             { background:#d1fae5; color:#059669; }

    .hdr-btn {
      display:inline-flex; align-items:center; gap:5px; height:34px; padding:0 12px;
      border-radius:var(--radius-sm); border:1px solid var(--border);
      background:var(--surface); color:var(--text-secondary);
      font-size:12px; font-weight:500; cursor:pointer; transition:.13s;
      &:hover { border-color:var(--accent); color:var(--accent); background:var(--accent-light); }
    }
    .hdr-btn .material-icons-round { font-size:16px; }
    .hdr-btn-danger {
      border-color:#fca5a5; color:#dc2626; background:#fef2f2;
      &:hover { background:#fee2e2; border-color:#dc2626; }
    }

    /* ── Metrics row ── */
    .metrics-row {
      display:grid; grid-template-columns:1fr 1fr 1fr 2fr; gap:14px; align-items:stretch;
    }
    @media(max-width:900px) { .metrics-row { grid-template-columns:1fr 1fr; } }

    .metric-card {
      background:var(--surface); border:1px solid var(--border-light);
      border-radius:var(--radius-lg); padding:18px 20px;
      display:flex; align-items:center; gap:14px; box-shadow:var(--shadow-sm);
    }
    .metric-icon {
      width:42px; height:42px; border-radius:10px; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .metric-icon .material-icons-round { font-size:20px; }
    .metric-neutral { background:var(--accent-light); color:var(--accent); }
    .metric-green   { background:#d1fae5; color:#059669; }
    .metric-red     { background:#fee2e2; color:#dc2626; }
    .metric-label { font-size:11px; font-weight:600; text-transform:uppercase;
                    letter-spacing:.04em; color:var(--text-muted); margin-bottom:4px; }
    .metric-value { font-size:20px; font-weight:800; font-family:var(--font-display);
                    color:var(--text-primary); }

    .progress-card {
      background:var(--surface); border:1px solid var(--border-light);
      border-radius:var(--radius-lg); padding:18px 20px; box-shadow:var(--shadow-sm);
      display:flex; flex-direction:column; justify-content:center; gap:8px;
    }
    .progress-header { display:flex; justify-content:space-between; align-items:center; }
    .progress-title  { font-size:13px; font-weight:600; color:var(--text-secondary); }
    .progress-pct    { font-size:18px; font-weight:800; font-family:var(--font-display);
                       color:var(--text-primary); }
    .progress-track  { height:8px; background:var(--border-light); border-radius:99px; overflow:hidden; }
    .progress-fill   { height:100%; border-radius:99px; transition:width .5s; }
    .progress-labels { display:flex; justify-content:space-between;
                       font-size:11px; color:var(--text-muted); }

    /* ── Vencimiento bar ── */
    .venc-bar {
      background:var(--surface); border:1px solid var(--border-light);
      border-radius:var(--radius-lg); padding:14px 20px;
      display:flex; align-items:center; justify-content:space-between;
      gap:16px; flex-wrap:wrap; box-shadow:var(--shadow-sm);
    }
    .venc-bar-left  { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .venc-bar-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
    .venc-bar-label { font-size:13px; font-weight:600; color:var(--text-secondary); }
    .venc-tag {
      display:inline-flex; align-items:center; gap:4px; padding:3px 10px;
      border-radius:20px; font-size:12px; font-weight:600;
    }
    .venc-green { background:#d1fae5; color:#059669; }
    .venc-red   { background:#fee2e2; color:#dc2626; }
    .venc-none  { font-size:12px; color:var(--text-muted); font-style:italic; }

    /* ── Date input ── */
    .date-iw { position:relative; display:flex; align-items:center; }
    .date-ico {
      position:absolute; left:10px; font-size:16px;
      color:var(--text-muted); pointer-events:none;
    }
    .date-inp {
      height:36px; padding:0 12px 0 34px; border-radius:var(--radius-sm);
      border:1px solid var(--border); background:var(--bg-card2);
      color:var(--text-primary); font-size:13px; font-family:var(--font-body);
      outline:none; transition:.15s; width:160px;
      &:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
    }

    /* ── Main grid ── */
    .main-grid {
      display:grid; grid-template-columns:1fr 360px; gap:20px; align-items:start;
    }
    @media(max-width:900px) { .main-grid { grid-template-columns:1fr; } }

    /* ── Panel ── */
    .panel {
      background:var(--surface); border:1px solid var(--border-light);
      border-radius:var(--radius-lg); overflow:hidden; box-shadow:var(--shadow-sm);
    }
    .panel-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:16px 20px; border-bottom:1px solid var(--border-light);
    }
    .panel-title {
      display:flex; align-items:center; gap:8px;
      font-size:14px; font-weight:700; color:var(--text-primary);
    }
    .panel-title-icon { font-size:18px; color:var(--accent); }
    .panel-count { font-size:12px; color:var(--text-muted); }

    /* ── Pagos list (timeline) ── */
    .pagos-empty {
      padding:40px; text-align:center; color:var(--text-muted);
      display:flex; flex-direction:column; align-items:center; gap:8px;
      font-size:13px;
    }

    .pagos-list { padding:8px 0; }

    .pago-row {
      display:flex; gap:0; padding:0 20px;
    }
    .pago-timeline {
      display:flex; flex-direction:column; align-items:center;
      margin-right:16px; padding-top:18px;
    }
    .pago-num {
      width:26px; height:26px; border-radius:50%;
      background:var(--accent-light); color:var(--accent);
      font-size:11px; font-weight:700; display:flex; align-items:center;
      justify-content:center; flex-shrink:0; z-index:1;
    }
    .pago-line {
      width:2px; flex:1; background:var(--border-light);
      margin-top:6px; margin-bottom:0; min-height:20px;
    }

    .pago-content {
      flex:1; padding:14px 0 20px; border-bottom:1px solid var(--border-light);
    }
    .pago-last .pago-content { border-bottom:none; padding-bottom:14px; }

    .pago-top {
      display:flex; justify-content:space-between; align-items:flex-start; gap:12px;
      margin-bottom:6px;
    }
    .pago-left { display:flex; flex-direction:column; gap:3px; }
    .pago-right { display:flex; align-items:center; gap:8px; flex-shrink:0; }

    .pago-monto { font-size:18px; font-weight:800; font-family:var(--font-display);
                  color:#059669; }
    .pago-fp    { font-size:12px; color:var(--text-muted); }
    .pago-fecha { font-size:12px; color:var(--text-secondary); white-space:nowrap; }

    .recibo-btn {
      display:inline-flex; align-items:center; gap:3px; height:28px; padding:0 8px;
      border-radius:6px; border:1px solid var(--border); background:var(--surface);
      color:var(--text-secondary); font-size:11px; font-weight:500; cursor:pointer; transition:.13s;
      &:hover:not([disabled]) { background:#eff6ff; border-color:#93c5fd; color:#2563eb; }
      &:disabled { opacity:.6; cursor:not-allowed; }
    }
    .recibo-btn .material-icons-round { font-size:14px; }

    .comp-voucher-btn {
      display:inline-flex; align-items:center; gap:3px; height:28px; padding:0 8px;
      border-radius:6px; border:1px solid #bbf7d0; background:#f0fdf4;
      color:#059669; font-size:11px; font-weight:500; cursor:pointer; transition:.13s;
      &:hover:not([disabled]) { background:#d1fae5; border-color:#059669; }
      &:disabled { opacity:.6; cursor:not-allowed; }
    }
    .comp-voucher-btn .material-icons-round { font-size:14px; }

    /* Miniatura comprobante inline */
    .comp-preview-row { margin-top:8px; margin-bottom:4px; }

    .comp-thumb-wrap {
      position:relative; display:inline-block; cursor:pointer; border-radius:6px;
      overflow:hidden; border:1.5px solid var(--border); max-width:160px;
      &:hover .comp-thumb-overlay { opacity:1; }
    }
    .comp-thumb {
      display:block; width:160px; height:100px; object-fit:cover;
    }
    .comp-thumb-overlay {
      position:absolute; inset:0; background:rgba(0,0,0,.45);
      display:flex; align-items:center; justify-content:center;
      opacity:0; transition:.15s;
    }

    .comp-pdf-chip {
      display:inline-flex; align-items:center; gap:10px; padding:8px 14px;
      border:1.5px solid #fca5a5; border-radius:8px; background:#fff5f5;
      cursor:pointer; transition:.13s; max-width:280px;
      &:hover { background:#fee2e2; border-color:#ef4444; }
    }

    .comp-thumb-loading {
      display:inline-flex; align-items:center; gap:6px; padding:6px 12px;
      border:1.5px dashed var(--border); border-radius:6px; cursor:pointer;
      color:var(--accent); transition:.13s;
      &:hover { border-color:var(--accent); background:var(--accent-light); }
    }

    /* Visor modal */
    .visor-box {
      background:var(--surface); border-radius:var(--radius-lg);
      box-shadow:var(--shadow-lg); width:92vw; max-width:960px;
      height:88vh; display:flex; flex-direction:column; overflow:hidden;
    }
    .visor-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:14px 20px; border-bottom:1px solid var(--border-light);
      flex-shrink:0;
    }
    .visor-img-wrap {
      flex:1; overflow:auto; display:flex; align-items:center;
      justify-content:center; background:#1a1a2e; padding:20px;
    }
    .visor-img {
      max-width:100%; max-height:100%; object-fit:contain;
      border-radius:4px; box-shadow:0 4px 24px rgba(0,0,0,.4);
    }
    .visor-pdf-wrap { flex:1; display:flex; flex-direction:column; }
    .visor-iframe   { width:100%; flex:1; border:none; }

    /* File drop zone */
    .file-drop {
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      min-height:110px; border:2px dashed var(--border); border-radius:var(--radius-sm);
      background:var(--bg-card2); padding:16px; cursor:pointer; transition:.15s;
      text-align:center;
      &:hover { border-color:var(--accent); background:var(--accent-light); }
    }
    .file-drop-ok {
      border-color:#10b981; border-style:solid; background:#f0fdf4;
      &:hover { border-color:#059669; background:#d1fae5; }
    }

    .del-btn {
      width:28px; height:28px; border-radius:6px; border:none; background:transparent;
      color:var(--text-muted); cursor:pointer; display:flex; align-items:center;
      justify-content:center; transition:.13s;
      &:hover { background:#fee2e2; color:#dc2626; }
    }
    .del-btn .material-icons-round { font-size:16px; }

    .pago-ref {
      display:inline-flex; align-items:center; gap:4px;
      font-size:11px; color:var(--text-muted); margin-bottom:8px;
      background:var(--bg-card2); padding:2px 8px; border-radius:4px;
    }

    /* ── Complemento section ── */
    .pago-complemento { margin-top:8px; }

    .comp-timbrado {
      background:#f0fdf4; border:1px solid #bbf7d0; border-radius:8px; padding:10px 12px;
    }
    .comp-timbrado-header {
      display:flex; align-items:center; justify-content:space-between;
      gap:8px; flex-wrap:wrap; margin-bottom:6px;
    }
    .comp-badge-ok {
      display:inline-flex; align-items:center; gap:4px;
      font-size:11px; font-weight:700; color:#059669;
    }
    .comp-actions { display:flex; gap:4px; }
    .comp-btn {
      display:inline-flex; align-items:center; gap:3px; height:26px; padding:0 8px;
      border-radius:5px; border:1px solid #bbf7d0; background:#fff;
      color:#059669; font-size:11px; font-weight:500; cursor:pointer; transition:.13s;
      &:hover { background:#d1fae5; }
    }
    .comp-btn .material-icons-round { font-size:13px; }
    .comp-btn-danger {
      border-color:#fca5a5; color:#dc2626;
      &:hover { background:#fee2e2; border-color:#dc2626; }
    }
    .comp-uuid {
      font-family:monospace; font-size:10px; color:#6b7280;
      word-break:break-all; display:block;
    }

    .comp-retry {
      display:inline-flex; align-items:center; gap:6px;
      height:30px; padding:0 12px; border-radius:6px; border:none;
      font-size:12px; font-weight:500; cursor:pointer; transition:.13s;
    }
    .comp-retry .material-icons-round { font-size:14px; }
    .comp-retry-error   { background:#fee2e2; color:#dc2626;
                          &:hover { background:#fca5a5; } }
    .comp-retry-pending { background:#fef3c7; color:#d97706;
                          &:hover { background:#fde68a; } }
    .comp-retry:disabled { opacity:.6; cursor:not-allowed; }

    .comp-na { font-size:11px; color:var(--text-muted); font-style:italic; }

    /* ── Side column ── */
    .side-col { display:flex; flex-direction:column; gap:16px; }

    /* ── Form body ── */
    .form-body { padding:20px; display:flex; flex-direction:column; gap:16px; }

    .form-alert-danger {
      display:flex; align-items:flex-start; gap:8px;
      background:#fef2f2; border:1px solid #fca5a5; border-radius:var(--radius-sm);
      padding:10px 12px; font-size:12px; color:#dc2626;
    }

    .field { display:flex; flex-direction:column; gap:6px; }
    .flabel { font-size:12px; font-weight:600; color:var(--text-secondary); }
    .fopt   { font-size:11px; font-weight:400; color:var(--text-muted); }
    .req    { color:var(--danger); }
    .field-hint { font-size:11px; color:var(--text-muted); }

    /* Currency input */
    .currency-iw {
      display:flex; align-items:center; border:1px solid var(--border);
      border-radius:var(--radius-sm); overflow:hidden; background:var(--bg-card);
      transition:.15s;
      &:focus-within { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
    }
    .currency-prefix, .currency-suffix {
      padding:0 10px; font-size:13px; font-weight:600; color:var(--text-muted);
      background:var(--bg-card2); height:40px; display:flex; align-items:center;
      border-right:1px solid var(--border-light); white-space:nowrap;
    }
    .currency-suffix { border-right:none; border-left:1px solid var(--border-light); }
    .currency-input {
      flex:1; height:40px; padding:0 12px; border:none; background:transparent;
      color:var(--text-primary); font-size:14px; font-weight:600;
      font-family:var(--font-display); outline:none;
      &::placeholder { font-weight:400; font-size:13px; color:var(--text-muted); }
    }

    /* Select input */
    .sel-wrap { position:relative; display:flex; align-items:center; }
    .sel-icon {
      position:absolute; left:10px; font-size:18px;
      color:var(--text-muted); pointer-events:none;
    }
    .sel-caret {
      position:absolute; right:10px; font-size:18px;
      color:var(--text-muted); pointer-events:none;
    }
    .sel-input {
      width:100%; height:40px; padding:0 36px 0 38px;
      border:1px solid var(--border); border-radius:var(--radius-sm);
      background:var(--bg-card); color:var(--text-primary);
      font-size:13px; font-family:var(--font-body);
      appearance:none; cursor:pointer; outline:none; transition:.15s;
      &:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
    }

    /* Text input */
    .txt-iw { position:relative; display:flex; align-items:center; }
    .txt-icon {
      position:absolute; left:10px; font-size:18px;
      color:var(--text-muted); pointer-events:none;
    }
    .txt-input {
      width:100%; height:40px; padding:0 12px 0 36px;
      border:1px solid var(--border); border-radius:var(--radius-sm);
      background:var(--bg-card); color:var(--text-primary);
      font-size:13px; font-family:var(--font-body); outline:none; transition:.15s;
      &:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(59,99,217,.1); }
      &::placeholder { color:var(--text-muted); }
    }

    /* PPD toggle box */
    .ppd-box {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      background:#eff6ff; border:1px solid #bfdbfe; border-radius:var(--radius-sm); padding:12px 14px;
    }
    .ppd-box-left { flex:1; }
    .ppd-title { font-size:13px; font-weight:600; color:#1d4ed8; margin-bottom:2px; }
    .ppd-desc  { font-size:11px; color:#3b82f6; line-height:1.4; }

    /* Toggle switch */
    .toggle { position:relative; display:inline-block; cursor:pointer; flex-shrink:0; }
    .toggle input { opacity:0; width:0; height:0; position:absolute; }
    .toggle-track {
      display:block; width:40px; height:22px; border-radius:11px;
      background:var(--border); transition:.2s;
      position:relative;
    }
    .toggle-thumb {
      position:absolute; top:3px; left:3px;
      width:16px; height:16px; border-radius:50%;
      background:#fff; transition:.2s; box-shadow:0 1px 3px rgba(0,0,0,.2);
    }
    .toggle input:checked ~ .toggle-track { background:var(--accent); }
    .toggle input:checked ~ .toggle-track .toggle-thumb { left:21px; }

    /* Submit button */
    .submit-btn {
      display:flex; align-items:center; justify-content:center; gap:8px;
      width:100%; height:42px; border-radius:var(--radius-sm); border:none;
      background:var(--accent); color:#fff; font-size:14px; font-weight:600;
      font-family:var(--font-body); cursor:pointer; transition:.15s;
      &:hover:not([disabled]) { background:var(--accent-dark); }
      &:disabled { opacity:.5; cursor:not-allowed; }
    }
    .submit-btn .material-icons-round { font-size:18px; }

    /* Paid panel */
    .paid-panel {
      padding:32px 24px; text-align:center;
    }
    .paid-icon {
      width:64px; height:64px; border-radius:50%; background:#d1fae5;
      display:flex; align-items:center; justify-content:center; margin:0 auto 16px;
    }
    .paid-icon .material-icons-round { font-size:32px; color:#059669; }
    .paid-title { font-size:16px; font-weight:700; color:#059669; margin-bottom:6px; }
    .paid-sub   { font-size:13px; color:var(--text-muted); }

    /* ── Modal ── */
    .modal-overlay {
      position:fixed; inset:0; background:rgba(0,0,0,.5); z-index:1000;
      display:flex; align-items:center; justify-content:center; padding:20px;
      backdrop-filter:blur(2px);
    }
    .modal-box {
      background:var(--surface); border-radius:var(--radius-lg);
      box-shadow:var(--shadow-lg); width:100%; max-width:460px; overflow:hidden;
    }
    .modal-header {
      display:flex; align-items:flex-start; gap:14px;
      padding:20px 24px; border-bottom:1px solid var(--border-light);
    }
    .modal-icon-red {
      width:40px; height:40px; border-radius:10px; background:#fee2e2; flex-shrink:0;
      display:flex; align-items:center; justify-content:center;
    }
    .modal-icon-red .material-icons-round { font-size:22px; color:#dc2626; }
    .modal-title { font-size:16px; font-weight:700; color:var(--text-primary); }
    .modal-sub   { font-size:12px; color:var(--text-muted); margin-top:2px; word-break:break-all; }
    .modal-x {
      margin-left:auto; width:32px; height:32px; border-radius:6px; border:none;
      background:transparent; cursor:pointer; color:var(--text-muted);
      display:flex; align-items:center; justify-content:center; flex-shrink:0;
      &:hover { background:var(--border-light); color:var(--text-primary); }
    }
    .modal-body {
      padding:24px; display:flex; flex-direction:column; gap:16px;
    }
    .modal-footer {
      display:flex; gap:10px; justify-content:flex-end;
      padding:16px 24px; border-top:1px solid var(--border-light);
      background:var(--bg-card2);
    }
    .alert-danger {
      display:flex; align-items:flex-start; gap:10px;
      background:#fef2f2; border:1px solid #fca5a5; border-radius:var(--radius-sm);
      padding:12px 14px; font-size:12px; color:#dc2626; line-height:1.5;
    }
    .btn-danger-confirm {
      display:inline-flex; align-items:center; gap:6px; padding:9px 18px;
      border-radius:var(--radius-sm); border:none; font-size:13px; font-weight:600;
      background:#dc2626; color:#fff; cursor:pointer; transition:.15s;
      &:hover:not([disabled]) { background:#b91c1c; }
      &:disabled { opacity:.5; cursor:not-allowed; }
    }
  `]
})
export class CxcDetalleComponent implements OnInit, OnDestroy {
  cuenta:   CxcItem | null = null;
  loading   = false;
  registrando = false;
  guardandoVenc = false;
  reintentando: string | null = null;
  descargandoRecibo: string | null = null;
  descargandoComprobante: string | null = null;
  errorPago = '';
  comprobanteFile: File | null = null;

  // Mapa pagoId → { objectUrl, esImagen } para miniaturas cargadas
  private thumbs = new Map<string, { url: string; esImagen: boolean; blob: Blob }>();

  // Visor modal
  visorUrl:      string | null = null;
  visorEsImagen  = false;
  visorPagoRef   = '';
  private visorBlob: Blob | null = null;

  nuevaFechaVencimiento = '';

  pago = { monto: 0, formaPago: '03', fecha: '', referencia: '', generarComplemento: false };
  formasPago = FORMAS_PAGO;

  // Modal cancelación factura original
  showCancelModal = false;
  cancelMotivo = '02';
  cancelFolioSust = '';
  cancelando = false;

  // Modal cancelación complemento
  showCancelComplementoModal = false;
  pagoACancelar: import('../../core/services/CXC/CxcService').PagoCxc | null = null;
  cancelComplementoMotivo = '02';
  cancelComplementoFolioSust = '';
  cancelandoComplemento = false;

  readonly MOTIVOS_CANCEL = [
    { value: '01', label: '01 – Comprobante emitido con errores con relación' },
    { value: '02', label: '02 – Comprobante emitido con errores sin relación' },
    { value: '03', label: '03 – No se llevó a cabo la operación' },
    { value: '04', label: '04 – Operación nominativa en factura global' },
  ];

  get porcentajeCobrado(): number {
    if (!this.cuenta || this.cuenta.monto === 0) return 0;
    return Math.min(100, (this.cuenta.totalPagado / this.cuenta.monto) * 100);
  }

  get esVencida(): boolean {
    if (!this.cuenta?.fechaVencimiento) return false;
    return new Date(this.cuenta.fechaVencimiento) < new Date() && this.cuenta.estado !== 'Pagado';
  }

  constructor(
    private svc:     CxcService,
    private cfdiSvc: CfdiService,
    private route:   ActivatedRoute,
    private router:  Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.loading = true;
    this.svc.obtener(id).subscribe({
      next:  c => { this.cuenta = c; this.loading = false; this.inicializarFecha(); },
      error: () => { this.loading = false; this.router.navigate(['/cuentas-cobrar']); },
    });
    // Fecha por defecto = hoy
    this.pago.fecha = new Date().toISOString().slice(0, 10);
  }

  inicializarFecha(): void {
    if (this.cuenta?.fechaVencimiento)
      this.nuevaFechaVencimiento = this.cuenta.fechaVencimiento.slice(0, 10);
  }

  guardarVencimiento(): void {
    if (!this.cuenta || !this.nuevaFechaVencimiento) return;
    this.guardandoVenc = true;
    this.svc.actualizarVencimiento(this.cuenta.id, this.nuevaFechaVencimiento).subscribe({
      next:  c => { this.cuenta = c; this.guardandoVenc = false; },
      error: () => this.guardandoVenc = false,
    });
  }

  registrarPago(): void {
    if (!this.cuenta) return;
    this.errorPago   = '';
    this.registrando = true;

    const enviar = (base64?: string, ext?: string) => {
      this.svc.registrarPago(this.cuenta!.id, {
        monto:                  this.pago.monto,
        formaPago:              this.pago.formaPago,
        fecha:                  this.pago.fecha,
        referencia:             this.pago.referencia || undefined,
        generarComplementoPago: this.pago.generarComplemento,
        comprobanteBase64:      base64,
        comprobanteExtension:   ext,
      }).subscribe({
        next: c => {
          this.cuenta          = c;
          this.registrando     = false;
          this.comprobanteFile = null;
          this.pago = { monto: 0, formaPago: '03', fecha: new Date().toISOString().slice(0, 10), referencia: '', generarComplemento: false };
        },
        error: err => {
          this.registrando = false;
          this.errorPago   = err.error?.error ?? 'Error al registrar el pago.';
        },
      });
    };

    if (this.comprobanteFile) {
      const ext = this.comprobanteFile.name.split('.').pop() ?? 'pdf';
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        // Quitar prefijo "data:...;base64,"
        const base64 = dataUrl.split(',')[1];
        enviar(base64, ext);
      };
      reader.readAsDataURL(this.comprobanteFile);
    } else {
      enviar();
    }
  }

  eliminarPago(pagoId: string): void {
    if (!this.cuenta || !confirm('¿Eliminar este pago?')) return;
    this.svc.eliminarPago(this.cuenta.id, pagoId).subscribe({
      next: c => this.cuenta = c,
    });
  }

  reintentarComplemento(pagoId: string): void {
    if (!this.cuenta) return;
    this.reintentando = pagoId;
    this.svc.reintentarComplemento(this.cuenta.id, pagoId).subscribe({
      next: c => { this.cuenta = c; this.reintentando = null; },
      error: () => { this.reintentando = null; }
    });
  }

  descargar(tipo: 'xml' | 'pdf'): void {
    if (!this.cuenta) return;
    const req$ = tipo === 'xml'
      ? this.cfdiSvc.descargarXml(this.cuenta.cfdiId)
      : this.cfdiSvc.descargarPdf(this.cuenta.cfdiId);
    req$.subscribe(blob =>
      this.cfdiSvc.descargarArchivo(blob, `${this.cuenta!.cfdiUuid ?? this.cuenta!.cfdiId}.${tipo}`)
    );
  }

  cancelarFactura(): void {
    this.showCancelModal = true;
  }

  confirmarCancelacion(): void {
    if (!this.cuenta) return;
    this.cancelando = true;
    this.cfdiSvc.cancelar(
      this.cuenta.cfdiId,
      this.cancelMotivo,
      this.cancelMotivo === '01' ? this.cancelFolioSust || undefined : undefined
    ).subscribe({
      next: () => {
        this.showCancelModal = false;
        this.cancelando = false;
        const id = this.cuenta!.id;
        this.svc.obtener(id).subscribe(c => this.cuenta = c);
      },
      error: () => { this.cancelando = false; }
    });
  }

  descargarComplemento(p: import('../../core/services/CXC/CxcService').PagoCxc, tipo: 'xml' | 'pdf'): void {
    if (!p.cfdiComplementoId) return;
    const req$ = tipo === 'xml'
      ? this.cfdiSvc.descargarXml(p.cfdiComplementoId)
      : this.cfdiSvc.descargarPdf(p.cfdiComplementoId);
    req$.subscribe(blob =>
      this.cfdiSvc.descargarArchivo(blob, `${p.cfdiComplementoUuid ?? p.cfdiComplementoId}.${tipo}`)
    );
  }

  descargarRecibo(p: import('../../core/services/CXC/CxcService').PagoCxc): void {
    if (!this.cuenta) return;
    this.descargandoRecibo = p.id;
    this.svc.descargarRecibo(this.cuenta.id, p.id).subscribe({
      next: blob => {
        this.descargandoRecibo = null;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-RC-${p.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.descargandoRecibo = null; },
    });
  }

  onComprobanteChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.comprobanteFile = input.files[0];
  }

  onComprobanteDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file) this.comprobanteFile = file;
  }

  // ── Miniaturas ──────────────────────────────────────────────────────

  thumbObjUrl(pagoId: string): string | null {
    return this.thumbs.get(pagoId)?.url ?? null;
  }

  thumbEsImagen(pagoId: string): boolean {
    return this.thumbs.get(pagoId)?.esImagen ?? false;
  }

  cargarMiniatura(p: import('../../core/services/CXC/CxcService').PagoCxc): void {
    if (!this.cuenta || this.thumbs.has(p.id) || this.descargandoComprobante === p.id) return;
    this.descargandoComprobante = p.id;
    this.svc.descargarComprobante(this.cuenta.id, p.id).subscribe({
      next: blob => {
        this.descargandoComprobante = null;
        const esImagen = blob.type.startsWith('image/');
        const url = URL.createObjectURL(blob);
        this.thumbs.set(p.id, { url, esImagen, blob });
      },
      error: () => { this.descargandoComprobante = null; },
    });
  }

  // ── Visor modal ─────────────────────────────────────────────────────

  verComprobante(p: import('../../core/services/CXC/CxcService').PagoCxc): void {
    if (!this.cuenta) return;

    const cached = this.thumbs.get(p.id);
    if (cached) {
      this.abrirVisor(cached.url, cached.esImagen, cached.blob, p);
      return;
    }

    this.descargandoComprobante = p.id;
    this.svc.descargarComprobante(this.cuenta.id, p.id).subscribe({
      next: blob => {
        this.descargandoComprobante = null;
        const esImagen = blob.type.startsWith('image/');
        const url = URL.createObjectURL(blob);
        this.thumbs.set(p.id, { url, esImagen, blob });
        this.abrirVisor(url, esImagen, blob, p);
      },
      error: () => { this.descargandoComprobante = null; },
    });
  }

  private abrirVisor(
    url: string,
    esImagen: boolean,
    blob: Blob,
    p: import('../../core/services/CXC/CxcService').PagoCxc
  ): void {
    this.visorUrl     = url;
    this.visorEsImagen = esImagen;
    this.visorBlob    = blob;
    this.visorPagoRef = `${p.fecha ? new Date(p.fecha).toLocaleDateString('es-MX') : ''} · ${p.monto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`;
    document.body.style.overflow = 'hidden';
  }

  cerrarVisor(): void {
    this.visorUrl  = null;
    this.visorBlob = null;
    document.body.style.overflow = '';
  }

  descargarVisorActual(): void {
    if (!this.visorUrl || !this.visorBlob) return;
    const ext = this.visorEsImagen
      ? (this.visorBlob.type === 'image/png' ? '.png' : '.jpg')
      : '.pdf';
    const a = document.createElement('a');
    a.href = this.visorUrl;
    a.download = `comprobante${ext}`;
    a.click();
  }

  ngOnDestroy(): void {
    // Revocar todos los object URLs para evitar memory leaks
    this.thumbs.forEach(t => URL.revokeObjectURL(t.url));
    this.thumbs.clear();
    document.body.style.overflow = '';
  }

  cancelarComplemento(p: import('../../core/services/CXC/CxcService').PagoCxc): void {
    this.pagoACancelar = p;
    this.cancelComplementoMotivo = '02';
    this.cancelComplementoFolioSust = '';
    this.showCancelComplementoModal = true;
  }

  confirmarCancelacionComplemento(): void {
    if (!this.pagoACancelar?.cfdiComplementoId) return;
    this.cancelandoComplemento = true;
    this.cfdiSvc.cancelar(
      this.pagoACancelar.cfdiComplementoId,
      this.cancelComplementoMotivo,
      this.cancelComplementoMotivo === '01' ? this.cancelComplementoFolioSust || undefined : undefined
    ).subscribe({
      next: () => {
        this.showCancelComplementoModal = false;
        this.cancelandoComplemento = false;
        this.pagoACancelar = null;
        const id = this.cuenta!.id;
        this.svc.obtener(id).subscribe(c => this.cuenta = c);
      },
      error: () => { this.cancelandoComplemento = false; }
    });
  }

  estadoLabel(e: string): string {
    const m: Record<string, string> = {
      Pendiente: 'Pendiente', Vencido: 'Vencida',
      ParcialmentePagado: 'Parcial', Pagado: 'Cobrada',
    };
    return m[e] ?? e;
  }

  initials(name: string): string {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map(w => w[0].toUpperCase()).join('');
  }
}
