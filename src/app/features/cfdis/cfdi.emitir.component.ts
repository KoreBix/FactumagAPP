import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { RfcList } from '../../core/models/RFC/RfcList';
import { Cliente } from '../../core/models/cliente/Cliente';
import { SerieConfig } from '../../core/models/serie/SerieConfig';
import { ConceptoCatalogo } from '../../core/models/concepto/ConceptoCatalogo';
import { TIPOS_COMPROBANTE } from '../../core/models/CFDI/Catálogos/TIPOS_COMPROBANTE';
import { FORMAS_PAGO } from '../../core/models/CFDI/Catálogos/FORMAS_PAGO';
import { METODOS_PAGO } from '../../core/models/CFDI/Catálogos/METODOS_PAGO';
import { USOS_CFDI } from '../../core/models/CFDI/Catálogos/USOS_CFDI';
import { REGIMENES_FISCALES } from '../../core/models/CFDI/Catálogos/REGIMENES_FISCALES';
import { UNIDADES_SAT } from '../../core/models/CFDI/Catálogos/UNIDADES_SAT';
import { TIPOS_RELACION_CFDI } from '../../core/models/CFDI/Catálogos/TIPOS_RELACION_CFDI';
import { CfdiService } from '../../core/services/CFDI/CfdiService';
import { CfdiDetalle } from '../../core/models/CFDI/CfdiDetalle';
import { RfcService } from '../../core/services/RFC/RfcService';
import { ClienteService } from '../../core/services/cliente/ClienteService';
import { SerieService } from '../../core/services/serie/SerieService';
import { ConceptoCatalogoService } from '../../core/services/conceptoc.atalogo/ConceptoCatalogoService';
import { PlantillaCfdiService } from '../../core/services/plantilla/PlantillaCfdiService';
import { PlantillaCfdi } from '../../core/models/plantilla/PlantillaCfdi';
import { CotizacionService } from '../../core/services/cotizacion/CotizacionService';
import { Cotizacion } from '../../core/models/cotizacion/Cotizacion';
import { NotaDefaultService } from '../../core/services/nota-default.service';

// ── Catálogos SAT para nómina ─────────────────────────────────────────────────
const ENTIDADES_FEDERATIVAS = [
  { value: 'AGU', label: 'AGU — Aguascalientes' },
  { value: 'BCN', label: 'BCN — Baja California' },
  { value: 'BCS', label: 'BCS — Baja California Sur' },
  { value: 'CAM', label: 'CAM — Campeche' },
  { value: 'COA', label: 'COA — Coahuila' },
  { value: 'COL', label: 'COL — Colima' },
  { value: 'CHP', label: 'CHP — Chiapas' },
  { value: 'CHH', label: 'CHH — Chihuahua' },
  { value: 'CMX', label: 'CMX — Ciudad de México' },
  { value: 'DUR', label: 'DUR — Durango' },
  { value: 'GUA', label: 'GUA — Guanajuato' },
  { value: 'GRO', label: 'GRO — Guerrero' },
  { value: 'HID', label: 'HID — Hidalgo' },
  { value: 'JAL', label: 'JAL — Jalisco' },
  { value: 'MEX', label: 'MEX — Estado de México' },
  { value: 'MIC', label: 'MIC — Michoacán' },
  { value: 'MOR', label: 'MOR — Morelos' },
  { value: 'NAY', label: 'NAY — Nayarit' },
  { value: 'NLE', label: 'NLE — Nuevo León' },
  { value: 'OAX', label: 'OAX — Oaxaca' },
  { value: 'PUE', label: 'PUE — Puebla' },
  { value: 'QUE', label: 'QUE — Querétaro' },
  { value: 'ROO', label: 'ROO — Quintana Roo' },
  { value: 'SLP', label: 'SLP — San Luis Potosí' },
  { value: 'SIN', label: 'SIN — Sinaloa' },
  { value: 'SON', label: 'SON — Sonora' },
  { value: 'TAB', label: 'TAB — Tabasco' },
  { value: 'TAM', label: 'TAM — Tamaulipas' },
  { value: 'TLA', label: 'TLA — Tlaxcala' },
  { value: 'VER', label: 'VER — Veracruz' },
  { value: 'YUC', label: 'YUC — Yucatán' },
  { value: 'ZAC', label: 'ZAC — Zacatecas' },
  { value: 'NE',  label: 'NE  — No establecido' }
];

const TIPOS_PERCEPCION = [
  { value: '001', label: '001 — Sueldos, Salarios Rayas y Jornales' },
  { value: '002', label: '002 — Gratificación Anual (Aguinaldo)' },
  { value: '003', label: '003 — Participación de los Trabajadores en las Utilidades PTU' },
  { value: '004', label: '004 — Reembolso de Gastos Médicos Dentales y Hospitalarios' },
  { value: '005', label: '005 — Fondo de Ahorro' },
  { value: '006', label: '006 — Caja de ahorro' },
  { value: '009', label: '009 — Contribuciones a Cargo del Trabajador Pagadas por el Patrón' },
  { value: '010', label: '010 — Premios por Puntualidad' },
  { value: '011', label: '011 — Prima de Seguro de vida' },
  { value: '012', label: '012 — Seguro de Gastos Médicos Mayores' },
  { value: '013', label: '013 — Cuotas Sindicales Pagadas por el Patrón' },
  { value: '014', label: '014 — Subsidios por incapacidad' },
  { value: '015', label: '015 — Becas para trabajadores y/o hijos' },
  { value: '019', label: '019 — Horas extra' },
  { value: '020', label: '020 — Prima dominical' },
  { value: '021', label: '021 — Prima vacacional' },
  { value: '022', label: '022 — Prima por antigüedad' },
  { value: '023', label: '023 — Pagos por separación' },
  { value: '024', label: '024 — Seguro de retiro' },
  { value: '025', label: '025 — Indemnizaciones' },
  { value: '026', label: '026 — Reembolso por funeral' },
  { value: '027', label: '027 — Cuotas de seguridad social pagadas por el patrón' },
  { value: '028', label: '028 — Comisiones' },
  { value: '029', label: '029 — Vales de despensa' },
  { value: '030', label: '030 — Vales de restaurante' },
  { value: '031', label: '031 — Vales de gasolina' },
  { value: '032', label: '032 — Vales de ropa' },
  { value: '033', label: '033 — Ayuda para renta' },
  { value: '034', label: '034 — Ayuda para artículos escolares' },
  { value: '035', label: '035 — Ayuda para anteojos' },
  { value: '036', label: '036 — Ayuda para transporte' },
  { value: '037', label: '037 — Ayuda para gastos de funeral' },
  { value: '038', label: '038 — Otros ingresos por salarios' },
  { value: '039', label: '039 — Jubilaciones, pensiones o haberes de retiro' },
  { value: '044', label: '044 — Jubilaciones, pensiones o haberes de retiro en parcialidades' },
  { value: '045', label: '045 — Ingresos en acciones o títulos' },
  { value: '046', label: '046 — Ingresos asimilados a salarios' },
  { value: '047', label: '047 — Alimentación' },
  { value: '048', label: '048 — Habitación' },
  { value: '049', label: '049 — Premios por asistencia' },
  { value: '050', label: '050 — Viáticos' },
  { value: '051', label: '051 — Pagos por gratificaciones, primas, compensaciones' }
];

const TIPOS_DEDUCCION = [
  { value: '001', label: '001 — Seguridad social' },
  { value: '002', label: '002 — ISR' },
  { value: '003', label: '003 — Aportaciones a retiro, cesantía en edad avanzada y vejez' },
  { value: '004', label: '004 — Otros' },
  { value: '005', label: '005 — Aportaciones a Fondo de vivienda' },
  { value: '006', label: '006 — Descuento por incapacidad' },
  { value: '007', label: '007 — Pensión alimenticia' },
  { value: '008', label: '008 — Renta' },
  { value: '009', label: '009 — Préstamos provenientes del Fondo Nacional de la Vivienda' },
  { value: '010', label: '010 — Pago por crédito de vivienda' },
  { value: '011', label: '011 — Pago de abonos INFONACOT' },
  { value: '012', label: '012 — Anticipo de salarios' },
  { value: '013', label: '013 — Pagos hechos con exceso al trabajador' },
  { value: '014', label: '014 — Errores' },
  { value: '015', label: '015 — Pérdidas' },
  { value: '016', label: '016 — Averías' },
  { value: '017', label: '017 — Adquisición de artículos producidos por la empresa' },
  { value: '018', label: '018 — Cuotas sindicales' },
  { value: '019', label: '019 — Ausencia (Ausentismo)' },
  { value: '020', label: '020 — Multas' },
  { value: '021', label: '021 — Descuentos' },
  { value: '022', label: '022 — Préstamo de casa habitación' },
  { value: '023', label: '023 — Cargo por concepto de préstamo' },
  { value: '024', label: '024 — Descuentos de Caja de Ahorro' },
  { value: '025', label: '025 — Deducción por ejercicio anterior' },
  { value: '026', label: '026 — Ajuste al Subsidio Causado Determinado' },
  { value: '027', label: '027 — Ajuste al Subsidio Causado Entregado' }
];

const TIPOS_OTRO_PAGO = [
  { value: '001', label: '001 — Reintegro de ISR pagado en exceso (Anual)' },
  { value: '002', label: '002 — Subsidio para el empleo (efectivamente entregado)' },
  { value: '003', label: '003 — Viáticos (entregados al trabajador)' },
  { value: '004', label: '004 — Aplicación de saldo a favor por compensación anual' },
  { value: '005', label: '005 — Reintegro de ISR retenido en exceso de ejercicio anterior' },
  { value: '006', label: '006 — Alimentos en bienes (Servicios de comedor y comida)' },
  { value: '007', label: '007 — ISR ajustado por subsidio' },
  { value: '008', label: '008 — Subsidio efectivamente entregado que no correspondía' },
  { value: '009', label: '009 — Reembolso de cuotas obrero patronales' }
];

const TIPOS_CONTRATO = [
  { value: '01', label: '01 — Por tiempo indeterminado' },
  { value: '02', label: '02 — Para obra determinada' },
  { value: '03', label: '03 — Por tiempo determinado' },
  { value: '04', label: '04 — Por temporada' },
  { value: '05', label: '05 — Sujeto a prueba' },
  { value: '06', label: '06 — Con capacitación inicial' },
  { value: '07', label: '07 — Por hora laborada' },
  { value: '08', label: '08 — Por comisión laboral' },
  { value: '09', label: '09 — Sin relación de trabajo' },
  { value: '10', label: '10 — Jubilación, pensión, retiro' },
  { value: '99', label: '99 — Otro' }
];

const TIPOS_REGIMEN_LABORAL = [
  { value: '02', label: '02 — Sueldos' },
  { value: '03', label: '03 — Jubilados' },
  { value: '04', label: '04 — Pensionados' },
  { value: '05', label: '05 — Asimilados — Cooperativas' },
  { value: '06', label: '06 — Asimilados — Integrantes Sociedades' },
  { value: '07', label: '07 — Asimilados — Consejos' },
  { value: '08', label: '08 — Asimilados — Comisionistas' },
  { value: '09', label: '09 — Asimilados — Honorarios' },
  { value: '10', label: '10 — Asimilados — Acciones' },
  { value: '11', label: '11 — Asimilados — Otros' },
  { value: '12', label: '12 — Jubilados o Pensionados' },
  { value: '13', label: '13 — Indemnización o Separación' },
  { value: '99', label: '99 — Otro' }
];

const PERIODICIDADES_PAGO = [
  { value: '01', label: '01 — Diario' },      { value: '02', label: '02 — Semanal' },
  { value: '03', label: '03 — Catorcenal' },  { value: '04', label: '04 — Quincenal' },
  { value: '05', label: '05 — Mensual' },     { value: '06', label: '06 — Bimestral' },
  { value: '07', label: '07 — Unidad obra' }, { value: '08', label: '08 — Comisión' },
  { value: '09', label: '09 — Precio alzado'},{ value: '10', label: '10 — Decenal' },
  { value: '99', label: '99 — Otra' }
];

@Component({
  selector: 'app-cfdi-emitir',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  template: `
    <div class="emit-wrap animate-in">

      <!-- ── Page header ─────────────────────────────────────────── -->
      <div class="emit-ph">
        <a routerLink="/cfdis" class="btn-mag btn-ghost btn-sm">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span>
          Mis CFDIs
        </a>
        <div class="emit-ph-title">
          <h1>Emitir CFDI</h1>
          <p>Comprobante Fiscal Digital de Internet · Versión 4.0</p>
        </div>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">

        <!-- ── Cargando datos base ── -->
        <div *ngIf="cargandoBase" class="base-loading">
          <span class="material-icons-round spin-anim" style="font-size:20px">refresh</span>
          Cargando datos del CFDI original...
        </div>

        <!-- ── Banner modo clon ── -->
        <div *ngIf="modoClonando && !cargandoBase" class="modo-banner modo-clone">
          <span class="material-icons-round" style="font-size:18px">content_copy</span>
          <div>
            <div style="font-weight:700;font-size:13px">Duplicando CFDI</div>
            <div style="font-size:12px;opacity:.8">Formulario pre-llenado con los datos del comprobante original. Revisa y ajusta antes de timbrar.</div>
          </div>
        </div>

        <!-- ── Banner modo edición ── -->
        <div *ngIf="modoEditando && !cargandoBase" class="modo-banner modo-edit">
          <span class="material-icons-round" style="font-size:18px">edit</span>
          <div>
            <div style="font-weight:700;font-size:13px">Editando borrador</div>
            <div style="font-size:12px;opacity:.8">Se generará un nuevo CFDI con los datos corregidos. El borrador original no se modifica.</div>
          </div>
        </div>

        <!-- ── Banner cotización convertida ── -->
        <div *ngIf="cotizacionCargada" class="modo-banner" style="background:rgba(59,130,246,.07);border-color:rgba(59,130,246,.25);color:#3b82f6">
          <span class="material-icons-round" style="font-size:18px">request_quote</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Convirtiendo cotización {{ cotizacionCargada.folio }}</div>
            <div style="font-size:12px;opacity:.8">Receptor y conceptos pre-llenados. Completa RFC emisor, forma de pago y timbra.</div>
          </div>
          <a [routerLink]="['/cotizaciones', cotizacionCargada.id]" class="btn-mag btn-ghost btn-sm">Ver cotización</a>
        </div>

        <!-- ── Banner plantilla cargada ── -->
        <div *ngIf="plantillaCargada" class="modo-banner" style="background:rgba(0,212,170,.07);border-color:rgba(0,212,170,.25);color:var(--accent)">
          <span class="material-icons-round" style="font-size:18px">bookmark</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:13px">Plantilla: {{ plantillaCargada.nombre }}</div>
            <div style="font-size:12px;opacity:.8">Formulario pre-llenado desde tu plantilla frecuente. Revisa y timbra.</div>
          </div>
          <a routerLink="/plantillas-cfdi" class="btn-mag btn-ghost btn-sm">Ver plantillas</a>
        </div>

        <div class="emit-layout">
        <div class="emit-main">
        <div class="emit-sections">

          <!-- ══ 1: Configuración general ══════════════════════════════ -->
          <div class="emit-card animate-in delay-1">
            <div class="emit-card-hdr">
              <div class="emit-sec-num">1</div>
              <div>
                <div class="emit-sec-title">Configuración general</div>
                <div class="emit-sec-sub">RFC emisor, tipo de comprobante y condiciones de pago</div>
              </div>
              <div *ngIf="rfcSeleccionado" class="emit-badge-timbres">
                <span class="material-icons-round" style="font-size:15px">confirmation_number</span>
                <div>
                  <div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:.05em">Timbres</div>
                  <div style="font-size:20px;font-weight:900;font-family:var(--font-display);line-height:1">{{ rfcSeleccionado.saldoTimbres }}</div>
                </div>
              </div>
            </div>

            <div class="emit-card-body">

              <!-- RFC Emisor -->
              <div class="fg" style="grid-column:1/-1;margin-bottom:20px">
                <label class="fl fl-req" style="display:block;margin-bottom:6px">RFC Emisor</label>

                <!-- RFC seleccionado → chip -->
                <div *ngIf="rfcSeleccionado && !buscandoRfc" class="cliente-chip"
                     style="border-color:rgba(124,58,237,.2);background:rgba(124,58,237,.05);margin-bottom:0">
                  <div class="cliente-chip-avatar" style="background:#7c3aed">{{ rfcSeleccionado.razonSocial.charAt(0) }}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:14px">{{ rfcSeleccionado.razonSocial }}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ rfcSeleccionado.rfc }}</div>
                  </div>
                  <button type="button" class="btn-mag btn-ghost btn-sm" (click)="abrirBusquedaRfc()"
                          style="flex-shrink:0;gap:4px">
                    <span class="material-icons-round" style="font-size:15px">edit</span>
                    Cambiar
                  </button>
                </div>

                <!-- Sin RFC o buscando → combobox -->
                <div *ngIf="!rfcSeleccionado || buscandoRfc" class="cot-combo-wrap">
                  <span class="material-icons-round cot-combo-icon">search</span>
                  <input class="form-control-mag cot-combo-input"
                         [(ngModel)]="busquedaRfc"
                         [ngModelOptions]="{standalone:true}"
                         [class.error-field]="hasError('rfcId')"
                         placeholder="Escribe nombre o RFC para buscar..."
                         autocomplete="off"
                         (focus)="onRfcFocused()"
                         (blur)="onRfcBlurred()"
                         (ngModelChange)="filtrarRfcs()">
                  <span class="material-icons-round cot-combo-arrow">expand_more</span>
                  <div *ngIf="rfcsFiltrados.length > 0" class="clientes-dropdown">
                    <div *ngFor="let r of rfcsFiltrados" class="clientes-dropdown-item"
                         (mousedown)="seleccionarRfcCombo(r)">
                      <span class="fld-mono" style="font-weight:700;font-size:12px;flex-shrink:0">{{ r.rfc }}</span>
                      <span style="margin-left:8px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ r.razonSocial }}</span>
                    </div>
                  </div>
                </div>

                <div class="field-error" *ngIf="hasError('rfcId')">Selecciona un RFC</div>
                <div *ngIf="rfcSeleccionado && !rfcSeleccionado.csdActivo" class="field-warn">
                  <span class="material-icons-round" style="font-size:14px">warning_amber</span>
                  Este RFC no tiene CSD activo — no podrá timbrar.
                </div>
              </div>

              <!-- Tipo de comprobante: tiles -->
              <div class="fg" style="margin-bottom:20px">
                <label class="fl">Tipo de comprobante</label>
                <div class="tipo-tiles">
                  <div *ngFor="let t of tipos" class="tipo-tile"
                       [class.active]="tipoActual === t.value"
                       [attr.data-tipo]="t.value"
                       (click)="form.get('tipoComprobante')!.setValue(t.value)">
                    <span class="tipo-tile-code">{{ t.value }}</span>
                    <span class="tipo-tile-name">{{ t.label.includes('—') ? t.label.split('—')[1].trim() : t.label }}</span>
                  </div>
                </div>
                <div *ngIf="tipoActual === 'T'" class="tipo-hint hint-blue">
                  <span class="material-icons-round" style="font-size:14px">info</span>
                  Traslado: forma y método de pago no aplican
                </div>
                <div *ngIf="tipoActual === 'P'" class="tipo-hint hint-purple">
                  <span class="material-icons-round" style="font-size:14px">info</span>
                  Complemento de pago: completa la sección 3 con los datos del pago recibido
                </div>
                <div *ngIf="tipoActual === 'N'" class="tipo-hint hint-green">
                  <span class="material-icons-round" style="font-size:14px">info</span>
                  Nómina: completa las secciones 3–7 con los datos del empleado y período
                </div>
              </div>

              <!-- Fila: Serie · Forma pago · Método pago · Moneda · CP -->
              <div class="emit-grid-5">

                <div class="fg">
                  <label class="fl">
                    Serie
                    <span *ngIf="!rfcSeleccionado" class="fl-hint"> (selecciona RFC primero)</span>
                  </label>
                  <div style="display:flex;gap:6px">
                    <input type="text" formControlName="serie" class="form-control-mag"
                           placeholder="Ej. A" maxlength="10"
                           style="text-transform:uppercase;flex:1;min-width:0"
                           list="series-list">
                    <datalist id="series-list">
                      <option value="">Sin serie</option>
                      <option *ngFor="let s of series" [value]="s.codigo">
                        {{ s.codigo }}{{ s.descripcion ? ' — ' + s.descripcion : '' }}
                      </option>
                    </datalist>
                    <button type="button" class="btn-mag btn-outline btn-sm"
                            style="padding:0 10px;flex-shrink:0"
                            (click)="guardarSerieLibre()"
                            *ngIf="rfcSeleccionado && serieEsNueva()"
                            title="Guardar como nueva serie">
                      <span class="material-icons-round" style="font-size:15px">save</span>
                    </button>
                  </div>
                </div>

                <div class="fg" *ngIf="tipoActual !== 'T' && tipoActual !== 'N'">
                  <label class="fl fl-req">
                    {{ tipoActual === 'P' ? 'Forma de pago (complemento)' : 'Forma de pago' }}
                  </label>
                  <div class="sel-wrap">
                    <select formControlName="formaPago" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let f of formasPago" [value]="f.value">{{ f.label }}</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>

                <div class="fg" *ngIf="tipoActual === 'I' || tipoActual === 'E' || tipoActual === 'N'">
                  <label class="fl fl-req">Método de pago</label>
                  <div class="sel-wrap">
                    <select formControlName="metodoPago" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let m of metodosPago" [value]="m.value">{{ m.label }}</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>

                <div class="fg">
                  <label class="fl">Moneda</label>
                  <div class="sel-wrap">
                    <select formControlName="moneda" class="form-control-mag">
                      <option value="MXN">MXN — Peso Mexicano</option>
                      <option value="USD">USD — Dólar</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>

                <div class="fg">
                  <label class="fl fl-req">CP Expedición</label>
                  <div class="input-wrap">
                    <span class="material-icons-round input-ico-l">location_on</span>
                    <input type="text" formControlName="lugarExpedicion" class="form-control-mag fld-icon-l"
                           placeholder="06600" maxlength="5"
                           [readonly]="!!rfcSeleccionado"
                           [class.fld-readonly]="!!rfcSeleccionado">
                  </div>
                  <div class="fl-hint" *ngIf="rfcSeleccionado">Tomado del RFC emisor</div>
                </div>

              </div>
            </div>
          </div>

          <!-- ══ 2: Receptor ══════════════════════════════════════════ -->
          <div class="emit-card animate-in delay-2">
            <div class="emit-card-hdr">
              <div class="emit-sec-num">2</div>
              <div>
                <div class="emit-sec-title">Receptor</div>
                <div class="emit-sec-sub">Datos fiscales del cliente o trabajador</div>
              </div>
            </div>
            <div class="emit-card-body">

              <!-- Client picker -->
              <div class="receptor-picker-row">
                <div style="flex:1;min-width:0">
                  <label class="fl" style="display:block;margin-bottom:6px">Buscar en mis clientes</label>
                  <div class="sel-wrap">
                    <select class="form-control-mag" (change)="onClienteSelect($event)">
                      <option value="">— Seleccionar cliente guardado —</option>
                      <option *ngFor="let c of clientes" [value]="c.id">{{ c.rfc }} — {{ c.nombre }}</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>
                <button type="button" class="btn-mag btn-outline"
                        style="white-space:nowrap;flex-shrink:0;align-self:flex-end"
                        (click)="mostrarAgregarCliente = !mostrarAgregarCliente">
                  <span class="material-icons-round" style="font-size:16px">person_add</span>
                  Nuevo cliente
                </button>
              </div>

              <!-- Selected client chip -->
              <div *ngIf="clienteSeleccionado" class="cliente-chip">
                <div class="cliente-chip-avatar">{{ clienteSeleccionado.nombre.charAt(0) }}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:14px">{{ clienteSeleccionado.nombre }}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ clienteSeleccionado.rfc }}</div>
                </div>
                <span class="material-icons-round" style="font-size:18px;color:var(--accent);flex-shrink:0">verified</span>
                <button type="button" class="btn-mag btn-ghost btn-sm" (click)="limpiarReceptor()"
                        style="padding:4px;flex-shrink:0" title="Cambiar receptor">
                  <span class="material-icons-round" style="font-size:16px">close</span>
                </button>
              </div>

              <!-- New client panel -->
              <div *ngIf="mostrarAgregarCliente" class="nuevo-cliente-panel">
                <div class="subsec-label">
                  <span class="material-icons-round" style="font-size:15px">person_add</span>
                  Nuevo cliente
                </div>
                <div class="emit-grid-3">
                  <div class="fg">
                    <label class="fl fl-req">RFC</label>
                    <input [(ngModel)]="nuevoCliente.rfc" [ngModelOptions]="{standalone:true}"
                           class="form-control-mag fld-mono"
                           placeholder="XAXX010101000" maxlength="13">
                  </div>
                  <div class="fg" style="grid-column:span 2">
                    <label class="fl fl-req">Nombre / Razón Social</label>
                    <input [(ngModel)]="nuevoCliente.nombre" [ngModelOptions]="{standalone:true}"
                           class="form-control-mag" placeholder="NOMBRE DEL CLIENTE">
                  </div>
                  <div class="fg">
                    <label class="fl">Uso CFDI</label>
                    <div class="sel-wrap">
                      <select [(ngModel)]="nuevoCliente.usoCfdi" [ngModelOptions]="{standalone:true}" class="form-control-mag">
                        <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">Régimen Fiscal</label>
                    <div class="sel-wrap">
                      <select [(ngModel)]="nuevoCliente.regimenFiscal" [ngModelOptions]="{standalone:true}" class="form-control-mag">
                        <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">Código Postal</label>
                    <input [(ngModel)]="nuevoCliente.codigoPostal" [ngModelOptions]="{standalone:true}"
                           class="form-control-mag" placeholder="06600" maxlength="5">
                  </div>
                </div>
                <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:8px">
                  <button type="button" class="btn-mag btn-ghost btn-sm" (click)="mostrarAgregarCliente=false">Cancelar</button>
                  <button type="button" class="btn-mag btn-primary btn-sm" (click)="guardarCliente()">
                    <span class="material-icons-round" style="font-size:15px">save</span> Guardar cliente
                  </button>
                </div>
              </div>

              <!-- Divider -->
              <div class="receptor-divider"><span>Datos fiscales del receptor</span></div>

              <!-- Receptor fields -->
              <div class="emit-grid-3">
                <div class="fg">
                  <label class="fl fl-req">RFC Receptor</label>
                  <input type="text" formControlName="receptorRfc" class="form-control-mag fld-mono"
                         [class.error-field]="hasError('receptorRfc')"
                         placeholder="XAXX010101000" maxlength="13">
                  <div class="field-error" *ngIf="hasError('receptorRfc')">Campo requerido</div>
                </div>
                <div class="fg" style="grid-column:span 2">
                  <label class="fl fl-req">Nombre / Razón Social</label>
                  <input type="text" formControlName="receptorNombre" class="form-control-mag"
                         [class.error-field]="hasError('receptorNombre')" placeholder="PUBLICO EN GENERAL">
                  <div class="field-error" *ngIf="hasError('receptorNombre')">Campo requerido</div>
                </div>
                <div class="fg">
                  <label class="fl fl-req">Uso CFDI</label>
                  <div class="sel-wrap">
                    <select formControlName="usoCfdi" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                  <div *ngIf="tipoActual === 'T' || tipoActual === 'P' || tipoActual === 'N'"
                       class="fl-hint fl-hint-lock">
                    <span class="material-icons-round" style="font-size:11px">lock</span>
                    Fijado por tipo de comprobante
                  </div>
                </div>
                <div class="fg">
                  <label class="fl">Uso CFDI Receptor</label>
                  <div class="sel-wrap">
                    <select formControlName="receptorUsoCfdi" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>
                <div class="fg">
                  <label class="fl fl-req">Régimen Fiscal Receptor</label>
                  <div class="sel-wrap">
                    <select formControlName="receptorRegimen" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>
                <div class="fg">
                  <label class="fl fl-req">CP Receptor</label>
                  <input type="text" formControlName="receptorCp" class="form-control-mag"
                         placeholder="06600" maxlength="5">
                </div>
              </div>
            </div>
          </div>

          <!-- ══ 3: Conceptos (I/E/T) ═════════════════════════════════ -->
          <div class="emit-card animate-in delay-3" *ngIf="tipoActual !== 'N' && tipoActual !== 'P'">
            <div class="emit-card-hdr">
              <div class="emit-sec-num">3</div>
              <div>
                <div class="emit-sec-title">Conceptos</div>
                <div class="emit-sec-sub">Productos o servicios a facturar</div>
              </div>
              <div class="emit-card-hdr-actions">
                <button type="button" class="btn-mag btn-ghost btn-sm"
                        (click)="mostrarCatalogoConceptos = !mostrarCatalogoConceptos">
                  <span class="material-icons-round" style="font-size:16px">inventory_2</span> Catálogo
                </button>
                <button type="button" class="btn-mag btn-primary btn-sm" (click)="addConcepto()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
            </div>

            <div *ngIf="mostrarCatalogoConceptos" class="catalogo-conceptos">
              <div style="display:flex;flex-wrap:wrap;gap:8px" *ngIf="conceptosCatalogo.length > 0">
                <button *ngFor="let cc of conceptosCatalogo" type="button"
                        class="btn-mag btn-ghost btn-sm catalogo-chip"
                        (click)="addConceptoDesde(cc)">
                  <span class="material-icons-round" style="font-size:13px">add_circle_outline</span>
                  {{ cc.descripcion }}
                  <span class="catalogo-chip-price">{{ cc.precioUnitario | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
                </button>
              </div>
              <div *ngIf="conceptosCatalogo.length === 0" class="empty-state-sm" style="padding:12px 0">
                Sin conceptos guardados en el catálogo
              </div>
            </div>

            <div formArrayName="conceptos">
              <div *ngFor="let c of conceptos.controls; let i=index"
                   [formGroupName]="i" class="concepto-row">
                <div class="concepto-row-hdr">
                  <div class="concepto-num">
                    <span class="material-icons-round" style="font-size:14px">receipt_long</span>
                    Concepto {{ i + 1 }}
                  </div>
                  <div style="display:flex;gap:6px;align-items:center">
                    <div class="concepto-importe-badge">
                      {{ importeConcepto(c) | currency:'MXN':'symbol-narrow':'1.2-2' }}
                    </div>
                    <button type="button" class="btn-mag btn-ghost btn-sm"
                            style="padding:4px 8px" (click)="guardarEnCatalogo(c)" title="Guardar en catálogo">
                      <span class="material-icons-round" style="font-size:14px">bookmark_add</span>
                    </button>
                    <button type="button" class="btn-mag btn-danger btn-sm"
                            style="padding:4px 8px"
                            (click)="removeConcepto(i)" *ngIf="conceptos.length > 1">
                      <span class="material-icons-round" style="font-size:14px">delete</span>
                    </button>
                  </div>
                </div>

                <div class="concepto-fields">
                  <div class="fg" style="grid-column:1/-1">
                    <label class="fl fl-req">Descripción del producto / servicio</label>
                    <input type="text" formControlName="descripcion" class="form-control-mag"
                           placeholder="Ej. Servicio de consultoría tecnológica"
                           [attr.list]="'conceptos-list-' + i"
                           (change)="onDescripcionSelect(c, $event)">
                    <datalist [id]="'conceptos-list-' + i">
                      <option *ngFor="let cc of conceptosCatalogo" [value]="cc.descripcion"></option>
                    </datalist>
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Clave SAT</label>
                    <input type="text" formControlName="claveProdServ" class="form-control-mag fld-mono"
                           placeholder="01010101" [attr.list]="'claves-list-' + i">
                    <datalist [id]="'claves-list-' + i">
                      <option *ngFor="let cc of conceptosCatalogo" [value]="cc.claveProdServ">{{ cc.descripcion }}</option>
                    </datalist>
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Unidad</label>
                    <div class="sel-wrap">
                      <select formControlName="claveUnidad" class="form-control-mag"
                              (change)="onUnidadChange(c, $event)">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let u of unidades" [value]="u.value">{{ u.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">IVA %</label>
                    <div class="sel-wrap">
                      <select formControlName="tasaIva" class="form-control-mag" (change)="calcTotal()">
                        <option [value]="0.16">16%</option>
                        <option [value]="0.08">8%</option>
                        <option [value]="0">0% — Exento</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Cantidad</label>
                    <input type="number" formControlName="cantidad" class="form-control-mag"
                           min="0.001" step="0.001" (input)="calcTotal()">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Precio unitario</label>
                    <div class="input-wrap">
                      <span class="input-prefix">$</span>
                      <input type="number" formControlName="precioUnitario" class="form-control-mag fld-prefix"
                             min="0.01" step="0.01" (input)="calcTotal()">
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">Descuento</label>
                    <div class="input-wrap">
                      <span class="input-prefix">$</span>
                      <input type="number" formControlName="descuento" class="form-control-mag fld-prefix"
                             min="0" step="0.01" (input)="calcTotal()">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div class="concepto-totals">
              <div class="concepto-totals-row">
                <span class="concepto-totals-lbl">Subtotal</span>
                <span class="concepto-totals-val">{{ subtotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="concepto-totals-row">
                <span class="concepto-totals-lbl">IVA</span>
                <span class="concepto-totals-val">{{ iva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="concepto-totals-row concepto-totals-grand">
                <span>Total</span>
                <span style="color:var(--accent)">{{ total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- ══ 3P: Complemento de Pago ══════════════════════════════ -->
          <ng-container *ngIf="tipoActual === 'P'" [formGroup]="pago">
            <div class="emit-card animate-in delay-3">
              <div class="emit-card-hdr">
                <div class="emit-sec-num emit-sec-num-purple">3</div>
                <div>
                  <div class="emit-sec-title">Complemento de Pago</div>
                  <div class="emit-sec-sub">Datos del pago recibido y CFDIs que se están liquidando</div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm" style="margin-left:auto"
                        (click)="docsPago.push(newDocumentoRelacionado())">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar documento
                </button>
              </div>
              <div class="emit-card-body">

                <div class="subsec-label" style="margin-bottom:16px">
                  <span class="material-icons-round" style="font-size:15px">payments</span>
                  Datos del pago
                </div>
                <div class="emit-grid-4">
                  <div class="fg">
                    <label class="fl fl-req">Fecha de pago</label>
                    <input type="date" formControlName="fechaPago" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Monto pagado</label>
                    <div class="input-wrap">
                      <span class="input-prefix">$</span>
                      <input type="number" formControlName="monto" class="form-control-mag fld-prefix"
                             min="0.01" step="0.01">
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">Moneda del pago</label>
                    <div class="sel-wrap">
                      <select formControlName="moneda" class="form-control-mag">
                        <option value="MXN">MXN — Peso Mexicano</option>
                        <option value="USD">USD — Dólar</option>
                        <option value="EUR">EUR — Euro</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">No. Operación</label>
                    <input type="text" formControlName="numOperacion" class="form-control-mag"
                           placeholder="Ref. bancaria / folio transferencia">
                  </div>
                </div>

                <div class="subsec-label" style="margin-top:24px;margin-bottom:16px">
                  <span class="material-icons-round" style="font-size:15px">receipt_long</span>
                  CFDIs que se están pagando
                </div>

                <div formArrayName="documentosRelacionados">
                  <div *ngFor="let d of docsPago.controls; let i=index"
                       [formGroupName]="i" class="doc-pago-card">
                    <div class="doc-pago-hdr">
                      <span class="doc-pago-num">Documento {{ i+1 }}</span>
                      <button type="button" class="btn-mag btn-danger btn-sm"
                              (click)="docsPago.removeAt(i)" *ngIf="docsPago.length > 1">
                        <span class="material-icons-round" style="font-size:14px">delete</span>
                      </button>
                    </div>
                    <div class="fg" style="margin-bottom:16px">
                      <label class="fl fl-req">UUID del CFDI original</label>
                      <input type="text" formControlName="idDocumento" class="form-control-mag fld-mono"
                             placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
                    </div>
                    <div class="emit-grid-4">
                      <div class="fg">
                        <label class="fl">Serie del CFDI</label>
                        <input type="text" formControlName="serie" class="form-control-mag" maxlength="10">
                      </div>
                      <div class="fg">
                        <label class="fl">Folio del CFDI</label>
                        <input type="text" formControlName="folio" class="form-control-mag">
                      </div>
                      <div class="fg">
                        <label class="fl">Moneda CFDI</label>
                        <div class="sel-wrap">
                          <select formControlName="moneda" class="form-control-mag">
                            <option value="MXN">MXN</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                          </select>
                          <span class="material-icons-round sel-ico">expand_more</span>
                        </div>
                      </div>
                      <div class="fg">
                        <label class="fl">Método de pago orig.</label>
                        <div class="sel-wrap">
                          <select formControlName="metodoPago" class="form-control-mag">
                            <option value="PPD">PPD — Parcialidades</option>
                            <option value="PUE">PUE — Una exhibición</option>
                          </select>
                          <span class="material-icons-round sel-ico">expand_more</span>
                        </div>
                      </div>
                      <div class="fg">
                        <label class="fl fl-req">No. Parcialidad</label>
                        <input type="number" formControlName="numeroParcialidad" class="form-control-mag" min="1">
                      </div>
                      <div class="fg">
                        <label class="fl fl-req">Saldo anterior</label>
                        <div class="input-wrap">
                          <span class="input-prefix">$</span>
                          <input type="number" formControlName="saldoAnterior" class="form-control-mag fld-prefix"
                                 min="0" step="0.01" (input)="calcSaldoInsoluto(d)">
                        </div>
                      </div>
                      <div class="fg">
                        <label class="fl fl-req">Importe pagado</label>
                        <div class="input-wrap">
                          <span class="input-prefix">$</span>
                          <input type="number" formControlName="importePagado" class="form-control-mag fld-prefix"
                                 min="0" step="0.01" (input)="calcSaldoInsoluto(d)">
                        </div>
                      </div>
                      <div class="fg">
                        <label class="fl">Saldo insoluto</label>
                        <div class="fld-display"
                             [class.fld-display-warn]="(d.get('saldoInsoluto')?.value || 0) > 0"
                             [class.fld-display-ok]="(d.get('saldoInsoluto')?.value || 0) === 0">
                          {{ (d.get('saldoInsoluto')?.value || 0) | currency:'MXN':'symbol-narrow':'1.2-2' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>

          <!-- ══ 3N: Complemento de Nómina ═════════════════════════════ -->
          <ng-container *ngIf="tipoActual === 'N'" formGroupName="complementoNomina">

            <!-- Período y empleador -->
            <div class="emit-card animate-in delay-3">
              <div class="emit-card-hdr">
                <div class="emit-sec-num emit-sec-num-green">3</div>
                <div>
                  <div class="emit-sec-title">Nómina — Período</div>
                  <div class="emit-sec-sub">Tipo de nómina, fechas y datos del empleador</div>
                </div>
              </div>
              <div class="emit-card-body">
                <div class="emit-grid-3">
                  <div class="fg">
                    <label class="fl fl-req">Tipo de nómina</label>
                    <div class="sel-wrap">
                      <select formControlName="tipoNomina" class="form-control-mag">
                        <option value="O">O — Ordinaria</option>
                        <option value="E">E — Extraordinaria</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Fecha de pago</label>
                    <input type="date" formControlName="fechaPago" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Días pagados</label>
                    <input type="number" formControlName="diasPagados" class="form-control-mag" min="0" step="0.001">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Fecha inicio período</label>
                    <input type="date" formControlName="fechaInicialPago" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Fecha fin período</label>
                    <input type="date" formControlName="fechaFinalPago" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Periodicidad de pago</label>
                    <div class="sel-wrap">
                      <select formControlName="periodicidadPago" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let p of periodicidades" [value]="p.value">{{ p.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                </div>

                <div class="subsec-label" style="margin-top:20px;margin-bottom:16px">
                  <span class="material-icons-round" style="font-size:15px">business</span>
                  Datos del empleador
                </div>
                <div class="emit-grid-3">
                  <div class="fg">
                    <label class="fl fl-req">Registro patronal</label>
                    <input type="text" formControlName="registroPatronal" class="form-control-mag" placeholder="A1234567891">
                  </div>
                  <div class="fg">
                    <label class="fl">CURP patrón</label>
                    <input type="text" formControlName="curpPatron" class="form-control-mag fld-mono" maxlength="18">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Entidad federativa empleador</label>
                    <div class="sel-wrap">
                      <select formControlName="entidadFederativa" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let e of entidades" [value]="e.value">{{ e.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Datos del trabajador -->
            <div class="emit-card">
              <div class="emit-card-hdr">
                <div class="emit-sec-num emit-sec-num-green">4</div>
                <div>
                  <div class="emit-sec-title">Datos del trabajador</div>
                  <div class="emit-sec-sub">Información laboral y salarial del empleado</div>
                </div>
              </div>
              <div class="emit-card-body">
                <div class="emit-grid-3">
                  <div class="fg">
                    <label class="fl fl-req">CURP</label>
                    <input type="text" formControlName="curpEmpleado" class="form-control-mag fld-mono" maxlength="18">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">NSS</label>
                    <input type="text" formControlName="nss" class="form-control-mag fld-mono" maxlength="11">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Fecha inicio relación laboral</label>
                    <input type="date" formControlName="fechaInicioRelLaboral" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Tipo de contrato</label>
                    <div class="sel-wrap">
                      <select formControlName="tipoContrato" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let t of tiposContrato" [value]="t.value">{{ t.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Tipo de régimen</label>
                    <div class="sel-wrap">
                      <select formControlName="tipoRegimen" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let t of tiposRegimenLaboral" [value]="t.value">{{ t.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">No. empleado</label>
                    <input type="text" formControlName="numEmpleado" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl">Departamento</label>
                    <input type="text" formControlName="departamento" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl">Puesto</label>
                    <input type="text" formControlName="puesto" class="form-control-mag">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Riesgo de trabajo</label>
                    <div class="sel-wrap">
                      <select formControlName="riesgoTrabajo" class="form-control-mag">
                        <option value="1">1 — Clase I (mínimo)</option>
                        <option value="2">2 — Clase II</option>
                        <option value="3">3 — Clase III</option>
                        <option value="4">4 — Clase IV</option>
                        <option value="5">5 — Clase V (máximo)</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">Banco</label>
                    <div class="sel-wrap">
                      <select formControlName="banco" class="form-control-mag">
                        <option value="">Sin banco</option>
                        <option value="002">002 — BBVA Bancomer</option>
                        <option value="006">006 — Bancomext</option>
                        <option value="009">009 — Banobras</option>
                        <option value="012">012 — HSBC</option>
                        <option value="014">014 — Santander</option>
                        <option value="021">021 — HSBC</option>
                        <option value="030">030 — Bajío</option>
                        <option value="036">036 — Inbursa</option>
                        <option value="044">044 — Scotiabank</option>
                        <option value="058">058 — Banregio</option>
                        <option value="072">072 — Banorte</option>
                        <option value="127">127 — Azteca</option>
                        <option value="646">646 — STP</option>
                        <option value="706">706 — Arcus</option>
                        <option value="728">728 — Spin by OXXO</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl">Cuenta bancaria (CLABE)</label>
                    <input type="text" formControlName="cuentaBancaria" class="form-control-mag fld-mono" maxlength="18">
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Clave entidad federativa</label>
                    <div class="sel-wrap">
                      <select formControlName="claveEntFed" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let e of entidades" [value]="e.value">{{ e.label }}</option>
                      </select>
                      <span class="material-icons-round sel-ico">expand_more</span>
                    </div>
                  </div>
                </div>

                <div class="subsec-label" style="margin-top:20px;margin-bottom:16px">
                  <span class="material-icons-round" style="font-size:15px">monetization_on</span>
                  Información salarial
                </div>
                <div class="emit-grid-2">
                  <div class="fg">
                    <label class="fl fl-req">Salario base de cotización</label>
                    <div class="input-wrap">
                      <span class="input-prefix">$</span>
                      <input type="number" formControlName="salarioBase" class="form-control-mag fld-prefix" min="0" step="0.01">
                    </div>
                  </div>
                  <div class="fg">
                    <label class="fl fl-req">Salario diario integrado (SDI)</label>
                    <div class="input-wrap">
                      <span class="input-prefix">$</span>
                      <input type="number" formControlName="salarioDiarioIntegrado" class="form-control-mag fld-prefix" min="0" step="0.01">
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Percepciones -->
            <div class="emit-card">
              <div class="emit-card-hdr">
                <div class="emit-sec-num emit-sec-num-green">5</div>
                <div>
                  <div class="emit-sec-title">Percepciones</div>
                  <div class="emit-sec-sub">Ingresos del trabajador en este período</div>
                </div>
                <button type="button" class="btn-mag btn-primary btn-sm" style="margin-left:auto"
                        (click)="addPercepcion()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
              <div formArrayName="percepciones">
                <div *ngFor="let p of percepciones.controls; let i=index"
                     [formGroupName]="i" class="nomina-row">
                  <div class="nomina-row-grid nomina-row-percepcion">
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Tipo *</label>
                      <div class="sel-wrap">
                        <select formControlName="tipoPercepcion" class="form-control-mag">
                          <option value="">Seleccionar...</option>
                          <option *ngFor="let t of tiposPercepcion" [value]="t.value">{{ t.label }}</option>
                        </select>
                        <span class="material-icons-round sel-ico">expand_more</span>
                      </div>
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Clave *</label>
                      <input type="text" formControlName="clave" class="form-control-mag" placeholder="001">
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Concepto *</label>
                      <input type="text" formControlName="concepto" class="form-control-mag" placeholder="Sueldo">
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Imp. Gravado *</label>
                      <div class="input-wrap">
                        <span class="input-prefix">$</span>
                        <input type="number" formControlName="importeGravado" class="form-control-mag fld-prefix"
                               min="0" step="0.01" (input)="calcTotalesNomina()">
                      </div>
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Imp. Exento</label>
                      <div class="input-wrap">
                        <span class="input-prefix">$</span>
                        <input type="number" formControlName="importeExento" class="form-control-mag fld-prefix"
                               min="0" step="0.01" (input)="calcTotalesNomina()">
                      </div>
                    </div>
                    <div style="display:flex;align-items:flex-end;padding-bottom:2px">
                      <button type="button" class="btn-mag btn-danger btn-sm" (click)="removePercepcion(i)">
                        <span class="material-icons-round" style="font-size:14px">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div *ngIf="percepciones.length === 0" class="empty-state-sm">
                  Agrega al menos una percepción
                </div>
                <div *ngIf="percepciones.length > 0" class="nomina-totals">
                  <span>Sueldos: <strong>{{ nomTotalSueldos | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                  <span>Gravado: <strong>{{ nomTotalGravado | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                  <span>Exento: <strong>{{ nomTotalExento | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Deducciones -->
            <div class="emit-card">
              <div class="emit-card-hdr">
                <div class="emit-sec-num emit-sec-num-green">6</div>
                <div>
                  <div class="emit-sec-title">Deducciones <span class="optional-badge">opcional</span></div>
                  <div class="emit-sec-sub">Descuentos aplicados al trabajador</div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm" style="margin-left:auto"
                        (click)="addDeduccion()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
              <div formArrayName="deducciones">
                <div *ngFor="let d of deducciones.controls; let i=index"
                     [formGroupName]="i" class="nomina-row">
                  <div class="nomina-row-grid nomina-row-deduccion">
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Tipo *</label>
                      <div class="sel-wrap">
                        <select formControlName="tipoDeduccion" class="form-control-mag">
                          <option value="">Seleccionar...</option>
                          <option *ngFor="let t of tiposDeduccion" [value]="t.value">{{ t.label }}</option>
                        </select>
                        <span class="material-icons-round sel-ico">expand_more</span>
                      </div>
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Clave *</label>
                      <input type="text" formControlName="clave" class="form-control-mag" placeholder="001">
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Concepto *</label>
                      <input type="text" formControlName="concepto" class="form-control-mag">
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Importe *</label>
                      <div class="input-wrap">
                        <span class="input-prefix">$</span>
                        <input type="number" formControlName="importe" class="form-control-mag fld-prefix"
                               min="0" step="0.01" (input)="calcTotalesNomina()">
                      </div>
                    </div>
                    <div style="display:flex;align-items:flex-end;padding-bottom:2px">
                      <button type="button" class="btn-mag btn-danger btn-sm" (click)="removeDeduccion(i)">
                        <span class="material-icons-round" style="font-size:14px">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div *ngIf="deducciones.length === 0" class="empty-state-sm">Sin deducciones</div>
                <div *ngIf="deducciones.length > 0" class="nomina-totals">
                  <span>Otras ded.: <strong>{{ nomTotalOtrasDed | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                  <span>Imp. retenido: <strong>{{ nomTotalImpRet | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                </div>
              </div>
            </div>

            <!-- Otros pagos -->
            <div class="emit-card">
              <div class="emit-card-hdr">
                <div class="emit-sec-num emit-sec-num-green">7</div>
                <div>
                  <div class="emit-sec-title">Otros pagos <span class="optional-badge">opcional</span></div>
                  <div class="emit-sec-sub">Subsidio al empleo y otros conceptos especiales</div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm" style="margin-left:auto"
                        (click)="addOtroPago()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
              <div formArrayName="otrosPagos">
                <div *ngFor="let o of otrosPagos.controls; let i=index"
                     [formGroupName]="i" class="nomina-row">
                  <div class="nomina-row-grid nomina-row-deduccion">
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Tipo *</label>
                      <div class="sel-wrap">
                        <select formControlName="tipoPago" class="form-control-mag">
                          <option value="">Seleccionar...</option>
                          <option *ngFor="let t of tiposOtroPago" [value]="t.value">{{ t.label }}</option>
                        </select>
                        <span class="material-icons-round sel-ico">expand_more</span>
                      </div>
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Clave *</label>
                      <input type="text" formControlName="clave" class="form-control-mag">
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Concepto *</label>
                      <input type="text" formControlName="concepto" class="form-control-mag">
                    </div>
                    <div class="fg" style="margin-bottom:0">
                      <label class="fl">Importe *</label>
                      <div class="input-wrap">
                        <span class="input-prefix">$</span>
                        <input type="number" formControlName="importe" class="form-control-mag fld-prefix"
                               min="0" step="0.01">
                      </div>
                    </div>
                    <div style="display:flex;align-items:flex-end;padding-bottom:2px">
                      <button type="button" class="btn-mag btn-danger btn-sm" (click)="removeOtroPago(i)">
                        <span class="material-icons-round" style="font-size:14px">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
                <div *ngIf="otrosPagos.length === 0" class="empty-state-sm">Sin otros pagos</div>
              </div>
            </div>

          </ng-container>

          <!-- ══ CFDI Relacionados ══════════════════════════════════ -->
          <div class="emit-card animate-in delay-4">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-muted">
                <span class="material-icons-round" style="font-size:16px">link</span>
              </div>
              <div>
                <div class="emit-sec-title">
                  CFDI Relacionados <span class="optional-badge">opcional</span>
                </div>
                <div class="emit-sec-sub">Facturas anteriores que este CFDI cancela, corrige o sustituye</div>
              </div>
              <button type="button" class="btn-mag btn-outline btn-sm" style="margin-left:auto"
                      (click)="addRelacionado()">
                <span class="material-icons-round" style="font-size:16px">add</span> Agregar
              </button>
            </div>
            <div *ngIf="relacionados.length === 0" class="empty-state-sm">
              Sin CFDIs relacionados — déjalo vacío si no aplica.
            </div>
            <div *ngIf="relacionados.length > 0" formArrayName="cfdiRelacionados">
              <div *ngFor="let r of relacionados.controls; let i=index"
                   [formGroupName]="i" class="relacionado-row">
                <div class="fg" style="margin-bottom:0;min-width:220px;flex-shrink:0">
                  <label class="fl fl-req">Tipo de relación</label>
                  <div class="sel-wrap">
                    <select formControlName="tipoRelacion" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let t of tiposRelacion" [value]="t.value">{{ t.label }}</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>
                <div class="fg" style="margin-bottom:0;flex:1;min-width:0">
                  <label class="fl fl-req">UUID</label>
                  <input type="text" formControlName="uuid" class="form-control-mag fld-mono"
                         placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
                </div>
                <div style="display:flex;align-items:flex-end;padding-bottom:2px;flex-shrink:0">
                  <button type="button" class="btn-mag btn-danger btn-sm" (click)="removeRelacionado(i)">
                    <span class="material-icons-round" style="font-size:14px">delete</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ══ Error de validación ══ -->
          <div *ngIf="camposConError.length > 0" class="error-panel">
            <div class="error-panel-hdr">
              <span class="material-icons-round" style="font-size:20px">error_outline</span>
              Completa los campos obligatorios antes de continuar
            </div>
            <div class="error-panel-list">
              <div *ngFor="let campo of camposConError" class="error-panel-item">
                <span class="material-icons-round" style="font-size:13px">chevron_right</span>
                {{ campo }}
              </div>
            </div>
          </div>

          <!-- § Notas y observaciones -->
          <div class="emit-card animate-in">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-muted">
                <span class="material-icons-round" style="font-size:16px">notes</span>
              </div>
              <div>
                <div class="emit-sec-title">Notas y observaciones</div>
                <div class="emit-sec-sub">Referencia interna — no se incluye en el XML fiscal <span class="optional-badge" style="margin-left:4px">opcional</span></div>
              </div>
              <button type="button" class="btn-mag btn-ghost btn-sm" style="margin-left:auto;gap:5px"
                      (click)="editandoNotaDefault = !editandoNotaDefault"
                      [title]="editandoNotaDefault ? 'Cerrar' : 'Configurar texto predeterminado'">
                <span class="material-icons-round" style="font-size:16px">{{ editandoNotaDefault ? 'close' : 'settings' }}</span>
                <span style="font-size:12px">{{ editandoNotaDefault ? 'Cerrar' : 'Predeterminado' }}</span>
              </button>
            </div>

            <!-- Panel editar default -->
            <div *ngIf="editandoNotaDefault" class="nota-default-panel">
              <div class="nota-default-label">
                <span class="material-icons-round" style="font-size:15px;color:var(--accent)">auto_awesome</span>
                Texto predeterminado — se pre-llenará en todos los documentos nuevos
              </div>
              <textarea class="form-control-mag nota-default-textarea"
                        [(ngModel)]="textoNotaDefault" name="textoNotaDefault" rows="3"
                        placeholder="Ej: Precios + IVA. Vigencia 15 días. Pago a 30 días neto..."></textarea>
              <div style="display:flex;gap:8px;margin-top:8px">
                <button type="button" class="btn-mag btn-primary btn-sm" (click)="guardarNotaDefault()">
                  <span class="material-icons-round" style="font-size:15px">save</span>
                  Guardar como predeterminado
                </button>
                <button type="button" class="btn-mag btn-ghost btn-sm" (click)="aplicarNotaDefault()"
                        *ngIf="textoNotaDefault">
                  <span class="material-icons-round" style="font-size:15px">content_paste</span>
                  Aplicar a este documento
                </button>
              </div>
            </div>

            <div class="emit-card-body">
              <textarea class="form-control-mag" [(ngModel)]="observaciones" name="observaciones" rows="4"
                        placeholder="Ej: Precio válido por 15 días. Condiciones de pago a 30 días..."></textarea>
            </div>
          </div>

        </div><!-- /emit-sections -->
        </div><!-- /emit-main -->

        <!-- ── Aside sticky: resumen + acciones ── -->
        <aside class="emit-aside">

          <!-- Resumen RFC + tipo -->
          <div class="emit-aside-card">
            <div class="aside-tipo-row">
              <div class="aside-tipo-tile" [attr.data-tipo]="tipoActual">{{ tipoActual }}</div>
              <div class="aside-tipo-info">
                <div class="aside-tipo-label">{{ tipoLabel() }}</div>
                <div class="aside-tipo-sub">CFDI 4.0</div>
              </div>
            </div>

            <div *ngIf="rfcSeleccionado" class="aside-rfc-block">
              <div class="aside-rfc-nombre">{{ rfcSeleccionado.razonSocial }}</div>
              <div class="aside-rfc-clave">{{ rfcSeleccionado.rfc }}</div>
              <div class="aside-timbres">
                <span class="material-icons-round" style="font-size:13px">confirmation_number</span>
                <span>{{ rfcSeleccionado.saldoTimbres | number }} timbres disponibles</span>
              </div>
              <div *ngIf="!rfcSeleccionado.csdActivo" class="aside-csd-warn">
                <span class="material-icons-round" style="font-size:13px">warning_amber</span>
                Sin CSD activo
              </div>
            </div>
            <div *ngIf="!rfcSeleccionado" class="aside-empty-rfc">
              <span class="material-icons-round" style="font-size:20px;color:var(--text-muted)">business</span>
              <span>Selecciona un RFC emisor</span>
            </div>

            <!-- Total (solo para I/E/T) -->
            <div *ngIf="tipoActual !== 'N' && tipoActual !== 'P' && total > 0" class="aside-total-block">
              <div class="aside-total-row">
                <span>Subtotal</span>
                <span>{{ subtotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="aside-total-row" *ngIf="iva > 0">
                <span>IVA</span>
                <span>{{ iva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
              <div class="aside-total-grand">
                <span>Total</span>
                <span style="color:var(--accent)">{{ total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Error API -->
          <div *ngIf="errorMsg" class="error-panel">
            <div class="error-panel-hdr" [style.margin-bottom]="esSaldoError ? '12px' : '0'">
              <span class="material-icons-round" style="font-size:18px">error_outline</span>
              {{ errorMsg }}
            </div>
            <div *ngIf="esSaldoError" style="display:flex;justify-content:flex-end;margin-top:10px">
              <a [href]="walletUrl" target="_blank"
                 style="display:inline-flex;align-items:center;gap:6px;padding:8px 14px;
                        background:#3b63d9;color:#fff;border-radius:8px;font-size:13px;
                        font-weight:600;text-decoration:none">
                <span class="material-icons-round" style="font-size:15px">account_balance_wallet</span>
                Comprar timbres →
              </a>
            </div>
          </div>

          <!-- Acciones -->
          <div class="emit-aside-actions">
            <button type="submit" class="btn-mag btn-primary btn-lg" style="width:100%;justify-content:center" [disabled]="loading">
              <span *ngIf="loading" class="material-icons-round spin-anim" style="font-size:20px">refresh</span>
              <span *ngIf="!loading" class="material-icons-round" style="font-size:20px">receipt</span>
              {{ loading ? 'Timbrando...' : 'Timbrar CFDI' }}
            </button>
            <button type="button" class="btn-mag btn-outline btn-lg" style="width:100%;justify-content:center"
                    (click)="verPreview()" [disabled]="loading || loadingPreview">
              <span *ngIf="loadingPreview" class="material-icons-round spin-anim" style="font-size:20px">refresh</span>
              <span *ngIf="!loadingPreview" class="material-icons-round" style="font-size:20px">picture_as_pdf</span>
              {{ loadingPreview ? 'Generando...' : 'Vista previa' }}
            </button>
            <button type="button" class="btn-mag btn-ghost btn-lg" style="width:100%;justify-content:center"
                    (click)="abrirGuardarPlantilla()" [disabled]="loading">
              <span class="material-icons-round" style="font-size:18px">bookmark_add</span>
              Guardar plantilla
            </button>
            <a routerLink="/cfdis" class="btn-mag btn-ghost btn-lg" style="width:100%;justify-content:center">
              <span class="material-icons-round" style="font-size:18px">arrow_back</span>
              Cancelar
            </a>
          </div>

        </aside>
        </div><!-- /emit-layout -->
      </form>
    </div>

    <!-- ══ Modal Guardar Plantilla ═══════════════════════════════ -->
    <div *ngIf="modalGuardarPlantilla" class="modal-overlay" (click)="cerrarGuardarPlantilla()">
      <div class="modal-card-plantilla" (click)="$event.stopPropagation()">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px 16px;border-bottom:1px solid var(--border-light)">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-icons-round" style="color:var(--accent)">bookmark_add</span>
            <span style="font-weight:700;font-size:16px">Guardar como plantilla frecuente</span>
          </div>
          <button type="button" class="btn-mag btn-ghost btn-sm" (click)="cerrarGuardarPlantilla()">
            <span class="material-icons-round">close</span>
          </button>
        </div>
        <div style="padding:20px 24px">
          <p style="font-size:13px;opacity:.7;margin:0 0 16px">La configuración actual del formulario se guardará como plantilla. Podrás reutilizarla desde <strong>Facturas Frecuentes</strong>.</p>
          <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
            <label style="font-size:13px;font-weight:600">Nombre de la plantilla <span style="color:#f87171">*</span></label>
            <input class="form-control-mag" [(ngModel)]="plantillaNombre" maxlength="100"
                   placeholder="Ej: Factura mensual servicios TI" style="width:100%;box-sizing:border-box">
          </div>
          <div style="display:flex;flex-direction:column;gap:6px">
            <label style="font-size:13px;font-weight:600">Descripción (opcional)</label>
            <input class="form-control-mag" [(ngModel)]="plantillaDescripcion" maxlength="300"
                   placeholder="Descripción breve" style="width:100%;box-sizing:border-box">
          </div>
          <div *ngIf="plantillaGuardadaOk" style="display:flex;align-items:center;gap:8px;margin-top:16px;padding:12px 14px;background:rgba(0,212,170,.08);border:1px solid rgba(0,212,170,.2);border-radius:8px;color:var(--accent);font-size:13px;font-weight:600">
            <span class="material-icons-round" style="font-size:18px">check_circle</span>
            Plantilla guardada correctamente
          </div>
          <div *ngIf="plantillaError" style="margin-top:12px;color:#ef4444;font-size:13px">{{ plantillaError }}</div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:10px;padding:16px 24px 20px;border-top:1px solid var(--border-light)">
          <button type="button" class="btn-mag btn-ghost" (click)="cerrarGuardarPlantilla()">Cerrar</button>
          <button type="button" class="btn-mag btn-primary" (click)="guardarPlantilla()"
                  [disabled]="!plantillaNombre.trim() || guardandoPlantilla">
            <span *ngIf="guardandoPlantilla" class="material-icons-round spin-anim" style="font-size:16px">refresh</span>
            <span *ngIf="!guardandoPlantilla" class="material-icons-round" style="font-size:16px">save</span>
            {{ guardandoPlantilla ? 'Guardando...' : 'Guardar plantilla' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ══ Modal PDF Preview ══════════════════════════════════════ -->
    <div *ngIf="mostrarPreview" class="modal-overlay" (click)="cerrarPreview()">
      <div class="modal-pdf" (click)="$event.stopPropagation()">
        <div class="modal-pdf-hdr">
          <div style="display:flex;align-items:center;gap:12px">
            <div class="pdf-icon-badge">
              <span class="material-icons-round" style="font-size:22px">picture_as_pdf</span>
            </div>
            <div>
              <div style="font-weight:700;font-size:15px">Vista previa del CFDI</div>
              <div style="font-size:11px;color:var(--text-muted)">Sin timbrar — solo para revisión</div>
            </div>
          </div>
          <div style="display:flex;gap:8px">
            <a *ngIf="previewUrl" [href]="previewUrl" download="preview-cfdi.pdf" class="btn-mag btn-outline btn-sm">
              <span class="material-icons-round" style="font-size:15px">download</span> Descargar
            </a>
            <button type="button" class="btn-mag btn-ghost btn-sm" (click)="cerrarPreview()">
              <span class="material-icons-round" style="font-size:18px">close</span>
            </button>
          </div>
        </div>
        <div class="modal-pdf-body">
          <div *ngIf="loadingPreview" style="text-align:center">
            <span class="material-icons-round spin-anim" style="font-size:52px;display:block;color:rgba(255,255,255,.7)">refresh</span>
            <div style="margin-top:16px;font-size:15px;font-weight:500;color:rgba(255,255,255,.8)">Generando vista previa...</div>
          </div>
          <iframe *ngIf="previewUrl && !loadingPreview"
                  [src]="previewSafeUrl!" style="width:100%;height:100%;border:none" type="application/pdf">
          </iframe>
        </div>
        <div class="modal-pdf-footer">
          <div style="font-size:12px;color:var(--text-muted);display:flex;align-items:center;gap:6px">
            <span class="material-icons-round" style="font-size:14px">info</span>
            El folio y UUID se asignan al timbrar
          </div>
          <div style="display:flex;gap:10px">
            <button type="button" class="btn-mag btn-ghost btn-lg" (click)="cerrarPreview()">Cerrar</button>
            <button type="button" class="btn-mag btn-primary btn-lg"
                    (click)="cerrarPreview(); submit()" [disabled]="loading">
              <span class="material-icons-round" style="font-size:20px">receipt</span>
              Timbrar este CFDI
            </button>
          </div>
        </div>
      </div>
    </div>

    <style>
      @keyframes spin  { to { transform: rotate(360deg); } }
      .spin-anim { animation: spin 1s linear infinite; }

      /* ── Validation ── */
      .emit-wrap .ng-invalid.ng-touched.form-control-mag {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239,68,68,.08) !important;
      }

      /* ── Layout ── */
      .emit-wrap  { max-width:none; padding-right:0; }

      /* Two-column layout: main form + sticky aside */
      .emit-layout {
        display: grid;
        grid-template-columns: 1fr 300px;
        gap: 24px;
        align-items: start;
      }
      .emit-main { min-width: 0; }

      /* Sticky aside */
      .emit-aside {
        position: sticky;
        top: 80px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      /* Aside summary card */
      .emit-aside-card {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 1px 4px rgba(0,0,0,.05);
      }

      /* Tipo row inside card */
      .aside-tipo-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-bottom: 1px solid var(--border-light);
        background: var(--bg-card2);
      }
      .aside-tipo-tile {
        width: 44px; height: 44px; flex-shrink: 0;
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        font-family: var(--font-display); font-size: 18px; font-weight: 900;
        color: #fff; background: var(--accent);
      }
      .aside-tipo-tile[data-tipo="E"] { background: #f59e0b; }
      .aside-tipo-tile[data-tipo="T"] { background: #6366f1; }
      .aside-tipo-tile[data-tipo="P"] { background: #7c3aed; }
      .aside-tipo-tile[data-tipo="N"] { background: #059669; }
      .aside-tipo-label { font-size: 13px; font-weight: 700; color: var(--text-primary); }
      .aside-tipo-sub   { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

      /* RFC block */
      .aside-rfc-block {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-light);
      }
      .aside-rfc-nombre { font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px; }
      .aside-rfc-clave  { font-size: 11px; font-family: monospace; color: var(--text-muted); margin-bottom: 8px; }
      .aside-timbres    { display: flex; align-items: center; gap: 5px; font-size: 12px; color: var(--accent); }
      .aside-csd-warn   { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #f59e0b; margin-top: 6px; }
      .aside-empty-rfc  { padding: 16px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-muted); border-bottom: 1px solid var(--border-light); }

      /* Total block */
      .aside-total-block {
        padding: 14px 16px;
      }
      .aside-total-row {
        display: flex; justify-content: space-between;
        font-size: 13px; color: var(--text-secondary); padding: 3px 0;
      }
      .aside-total-grand {
        display: flex; justify-content: space-between;
        font-family: var(--font-display); font-size: 18px; font-weight: 900;
        color: var(--text-primary);
        border-top: 2px solid var(--border-light);
        margin-top: 6px; padding-top: 10px;
      }

      /* Aside action buttons */
      .emit-aside-actions {
        display: flex; flex-direction: column; gap: 8px;
      }

      /* Responsive: stack on narrower viewports */
      @media(max-width:1100px) {
        .emit-layout { grid-template-columns: 1fr 260px; }
      }
      @media(max-width:860px) {
        .emit-layout { grid-template-columns: 1fr; }
        .emit-aside  { position: static; }
      }

      /* ── Banners modo clon/edición ── */
      .base-loading { display:flex;align-items:center;gap:10px;padding:14px 18px;margin-bottom:16px;background:var(--bg-card2);border:1px solid var(--border-light);border-radius:10px;font-size:13px;color:var(--text-muted); }
      .modo-banner  { display:flex;align-items:flex-start;gap:12px;padding:14px 18px;margin-bottom:16px;border-radius:10px;border:1px solid; }
      .modo-clone   { background:rgba(5,150,105,.07);border-color:rgba(5,150,105,.25);color:#047857; }
      .modo-edit    { background:rgba(217,119,6,.07);border-color:rgba(217,119,6,.25);color:#b45309; }
      .emit-ph    { margin-bottom:24px; }
      .emit-ph-title h1 { font-family:var(--font-display);font-size:24px;font-weight:900;margin:8px 0 4px; }
      .emit-ph-title p  { font-size:13px;color:var(--text-muted);margin:0; }
      .emit-sections    { display:flex;flex-direction:column;gap:20px; }

      /* ── Card ── */
      .emit-card { background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05); }
      .emit-card-hdr  { display:flex;align-items:center;gap:14px;padding:18px 24px;border-bottom:1px solid var(--border-light);background:var(--bg-card2); }
      .emit-card-hdr-actions { display:flex;gap:8px;margin-left:auto; }
      .emit-card-body { padding:24px; }

      /* ── Section numbers ── */
      .emit-sec-num        { width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0; }
      .emit-sec-num-purple { background:#7c3aed; }
      .emit-sec-num-green  { background:#059669; }
      .emit-sec-num-muted  { background:var(--border-light);color:var(--text-muted); }
      .emit-sec-title { font-size:15px;font-weight:700;color:var(--text-primary); }
      .emit-sec-sub   { font-size:12px;color:var(--text-muted);margin-top:1px; }

      /* ── Timbres badge ── */
      .emit-badge-timbres { margin-left:auto;display:flex;align-items:center;gap:8px;background:var(--accent-light);border:1px solid rgba(59,99,217,.2);border-radius:10px;padding:8px 14px;color:var(--accent); }

      /* ── Field groups ── */
      .fg     { display:flex;flex-direction:column;gap:5px; }
      .fl     { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted); }
      .fl-req::after { content:' *';color:#ef4444; }
      .fl-hint       { font-size:11px;color:var(--text-muted);margin-top:2px; }
      .fl-hint-lock  { display:flex;align-items:center;gap:3px;color:#2563eb; }
      .optional-badge { font-size:11px;font-weight:500;color:var(--text-muted);background:var(--bg-card2);padding:1px 8px;border-radius:20px;border:1px solid var(--border-light);margin-left:6px;text-transform:none;letter-spacing:0; }

      /* ── Input helpers ── */
      .input-wrap   { position:relative; }
      .input-prefix { position:absolute;left:12px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--text-muted);font-weight:600;pointer-events:none;z-index:1; }
      .input-ico-l  { position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted);pointer-events:none;z-index:1; }
      .fld-prefix   { padding-left:26px !important; }
      .fld-icon-l   { padding-left:34px !important; }
      .fld-mono     { font-family:monospace !important;letter-spacing:.4px; }
      .fld-readonly { background:var(--bg-card2) !important;color:var(--text-muted) !important;cursor:not-allowed; }

      /* ── Select custom arrow ── */
      .sel-wrap  { position:relative; }
      .sel-ico   { position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted);pointer-events:none;z-index:1; }
      .sel-wrap select { -webkit-appearance:none;appearance:none;padding-right:34px; }

      /* ── form-control-mag standalone (global rule scoped to .form-mag .form-group, doesn't reach here) ── */
      .emit-wrap .form-control-mag {
        display:block;
        width:100%;
        height:40px;
        padding:0 12px;
        border:1.5px solid var(--border);
        border-radius:var(--radius-sm,6px);
        font-family:var(--font-body);
        font-size:14px;
        color:var(--text-primary);
        background:var(--bg-card);
        outline:none;
        transition:border-color .15s,box-shadow .15s;
        box-sizing:border-box;
      }
      .emit-wrap .form-control-mag:focus {
        border-color:var(--accent);
        box-shadow:0 0 0 3px rgba(59,99,217,.12);
      }
      .emit-wrap select.form-control-mag {
        -webkit-appearance:none !important;
        appearance:none !important;
        cursor:pointer;
      }
      .emit-wrap .form-control-mag::placeholder { color:var(--text-muted);opacity:1; }
      .emit-wrap .form-control-mag.error-field  { border-color:#ef4444 !important;box-shadow:0 0 0 3px rgba(239,68,68,.08) !important; }
      .emit-wrap .form-control-mag:disabled,
      .emit-wrap .form-control-mag[readonly]    { background:var(--bg-card2) !important;color:var(--text-muted) !important;cursor:not-allowed; }

      /* ── Read-only display field ── */
      .fld-display          { padding:10px 14px;background:var(--bg-card2);border:1.5px solid var(--border-light);border-radius:var(--radius-sm);font-family:var(--font-display);font-weight:700;font-size:14px;color:var(--text-primary); }
      .fld-display-warn     { border-color:rgba(245,158,11,.4);color:#d97706;background:rgba(245,158,11,.06); }
      .fld-display-ok       { border-color:rgba(16,185,129,.3);color:#059669;background:rgba(16,185,129,.06); }

      /* ── Tipo tiles ── */
      .tipo-tiles { display:flex;gap:10px;flex-wrap:wrap; }
      .tipo-tile  { flex:1;min-width:80px;max-width:160px;border:2px solid var(--border-light);border-radius:12px;padding:14px 8px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;transition:.15s;background:var(--bg-card);user-select:none; }
      .tipo-tile:hover { border-color:var(--accent);background:var(--accent-light);transform:translateY(-1px); }
      .tipo-tile.active { border-color:var(--accent);background:var(--accent-light);box-shadow:0 0 0 3px rgba(59,99,217,.15); }
      .tipo-tile[data-tipo="E"].active { border-color:#f59e0b;background:rgba(245,158,11,.08);box-shadow:0 0 0 3px rgba(245,158,11,.15); }
      .tipo-tile[data-tipo="T"].active { border-color:#6366f1;background:rgba(99,102,241,.08);box-shadow:0 0 0 3px rgba(99,102,241,.15); }
      .tipo-tile[data-tipo="P"].active { border-color:#7c3aed;background:rgba(124,58,237,.08);box-shadow:0 0 0 3px rgba(124,58,237,.15); }
      .tipo-tile[data-tipo="N"].active { border-color:#059669;background:rgba(5,150,105,.08);box-shadow:0 0 0 3px rgba(5,150,105,.15); }
      .tipo-tile-code { font-size:22px;font-weight:900;font-family:var(--font-display);color:var(--text-primary); }
      .tipo-tile-name { font-size:11px;color:var(--text-muted);text-align:center;line-height:1.3; }
      .tipo-hint   { display:flex;align-items:center;gap:6px;font-size:12px;margin-top:8px;padding:7px 12px;border-radius:8px; }
      .hint-blue   { background:rgba(37,99,235,.08);color:#2563eb;border:1px solid rgba(37,99,235,.15); }
      .hint-purple { background:rgba(124,58,237,.08);color:#7c3aed;border:1px solid rgba(124,58,237,.15); }
      .hint-green  { background:rgba(5,150,105,.08);color:#059669;border:1px solid rgba(5,150,105,.15); }

      /* ── Grids ── */
      .emit-grid-2 { display:grid;grid-template-columns:1fr 1fr;    gap:20px; }
      .emit-grid-3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px; }
      .emit-grid-4 { display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:20px; }
      .emit-grid-5 { display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:20px; }
      @media(max-width:720px) { .emit-grid-4 { grid-template-columns:1fr 1fr; } }
      @media(max-width:640px) { .emit-grid-2,.emit-grid-3,.emit-grid-4,.emit-grid-5 { grid-template-columns:1fr; } }

      /* ── Receptor ── */
      .receptor-picker-row { display:flex;gap:12px;align-items:flex-end;margin-bottom:16px;flex-wrap:wrap; }
      .receptor-picker-row > div { flex:1;min-width:220px; }
      .cliente-chip { display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:16px;background:var(--accent-light);border:1.5px solid rgba(59,99,217,.2);border-radius:10px; }
      .cliente-chip-avatar { width:36px;height:36px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;font-family:var(--font-display);flex-shrink:0; }
      .receptor-divider { display:flex;align-items:center;gap:12px;margin:8px 0 20px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em; }
      .receptor-divider::before,.receptor-divider::after { content:'';flex:1;height:1px;background:var(--border-light); }
      .nuevo-cliente-panel { margin-bottom:16px;padding:16px 20px;background:var(--bg-card2);border:1px solid var(--border-light);border-radius:10px; }

      /* ── Sub-section label ── */
      .subsec-label { display:flex;align-items:center;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted); }

      /* ── Conceptos ── */
      .concepto-row { border-bottom:1px solid var(--border-light);padding:20px 24px; }
      .concepto-row-hdr { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
      .concepto-num { display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em; }
      .concepto-importe-badge { font-family:var(--font-display);font-weight:900;font-size:16px;color:var(--accent);background:var(--accent-light);border:1px solid rgba(59,99,217,.2);padding:4px 12px;border-radius:20px; }
      .concepto-fields { display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px 16px; }
      @media(max-width:760px) { .concepto-fields { grid-template-columns:1fr 1fr; } }
      @media(max-width:480px) { .concepto-fields { grid-template-columns:1fr; } }
      .concepto-totals { padding:16px 24px;background:var(--bg-card2);border-top:2px solid var(--border-light);display:flex;flex-direction:column;align-items:flex-end; }
      .concepto-totals-row  { display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px;color:var(--text-secondary);width:260px; }
      .concepto-totals-lbl  { color:var(--text-muted); }
      .concepto-totals-val  { font-weight:600; }
      .concepto-totals-grand { font-family:var(--font-display);font-size:20px;font-weight:900;color:var(--text-primary);border-top:2px solid var(--border-light);margin-top:6px;padding-top:10px; }

      /* ── Catálogo ── */
      .catalogo-conceptos   { padding:14px 20px;background:var(--bg-card2);border-bottom:1px solid var(--border-light); }
      .catalogo-chip        { font-size:12px !important; }
      .catalogo-chip-price  { color:var(--text-muted);margin-left:6px; }

      /* ── Pago documentos ── */
      .doc-pago-card { padding:16px 20px;margin-bottom:12px;background:var(--bg-card2);border:1px solid var(--border-light);border-radius:10px; }
      .doc-pago-hdr  { display:flex;justify-content:space-between;align-items:center;margin-bottom:16px; }
      .doc-pago-num  { font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em; }

      /* ── Nómina rows ── */
      .nomina-row { padding:14px 24px;border-bottom:1px solid var(--border-light); }
      .nomina-row-grid { display:grid;gap:12px;align-items:end; }
      .nomina-row-percepcion { grid-template-columns:2.2fr 0.7fr 1fr 1fr 1fr auto; }
      .nomina-row-deduccion  { grid-template-columns:2.2fr 0.7fr 1fr 1fr auto; }
      @media(max-width:860px) { .nomina-row-percepcion,.nomina-row-deduccion { grid-template-columns:1fr 1fr; } }
      .nomina-totals { padding:10px 24px;background:var(--bg-card2);border-top:1px solid var(--border-light);display:flex;gap:24px;justify-content:flex-end;font-size:13px;color:var(--text-secondary); }

      /* ── CFDI relacionados ── */
      .relacionado-row { display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;padding:16px 24px;border-bottom:1px solid var(--border-light); }
      .empty-state-sm  { padding:20px 24px;text-align:center;font-size:13px;color:var(--text-muted); }

      /* ── Error panel ── */
      .error-panel      { background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:16px 20px; }
      .error-panel-hdr  { display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;color:#dc2626;margin-bottom:10px; }
      .error-panel-list { display:flex;flex-direction:column;gap:4px;padding-left:30px; }
      .error-panel-item { display:flex;align-items:center;gap:4px;font-size:13px;color:#dc2626; }

      /* ── Actions ── */
      .emit-actions { display:flex;justify-content:space-between;align-items:center;gap:12px;padding-bottom:40px;flex-wrap:wrap; }

      /* ── Field warn ── */
      .field-warn { display:flex;align-items:center;gap:6px;padding:7px 11px;font-size:12px;color:var(--warning);background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);border-radius:6px;margin-top:4px; }

      /* ── Modal PDF ── */
      .modal-overlay { position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;padding:20px; }
      .modal-pdf     { background:var(--bg-card);border-radius:16px;width:100%;max-width:900px;height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 32px 80px rgba(0,0,0,.4); }
      .modal-pdf-hdr { display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid var(--border-light);flex-shrink:0; }
      .modal-pdf-body { flex:1;overflow:hidden;background:#525659;display:flex;align-items:center;justify-content:center; }
      .modal-pdf-footer { display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-top:1px solid var(--border-light);flex-shrink:0; }
      .pdf-icon-badge { width:40px;height:40px;border-radius:10px;background:rgba(239,68,68,.1);color:#ef4444;display:flex;align-items:center;justify-content:center; }

      /* ── Modal Plantilla ── */
      .modal-card-plantilla { background:var(--bg-card);border-radius:16px;width:100%;max-width:480px;box-shadow:0 32px 80px rgba(0,0,0,.4); }

      /* ── Panel nota predeterminada ── */
      .nota-default-panel {
        padding:16px 20px;
        background:color-mix(in srgb, var(--accent) 5%, var(--bg-card2));
        border-bottom:1px solid var(--border-light);
        border-top:1px solid var(--border-light);
      }
      .nota-default-label {
        display:flex;align-items:center;gap:6px;
        font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
        color:var(--accent);margin-bottom:10px;
      }
      .nota-default-textarea { height:auto !important;padding:10px 12px !important;resize:vertical; }

      /* ── RFC / cliente combobox ── */
      .cot-combo-wrap  { position:relative; }
      .cot-combo-icon  { position:absolute;left:11px;top:50%;transform:translateY(-50%);font-size:18px !important;color:var(--text-muted);pointer-events:none;z-index:1; }
      .cot-combo-arrow { position:absolute;right:11px;top:50%;transform:translateY(-50%);font-size:18px !important;color:var(--text-muted);pointer-events:none;z-index:1; }
      .cot-combo-input { padding-left:36px !important;padding-right:36px !important; }
      .clientes-dropdown {
        position:absolute;top:calc(100% + 4px);left:0;right:0;
        background:var(--bg-card);border:1px solid var(--border-light);
        border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.12);
        z-index:200;max-height:240px;overflow-y:auto;
      }
      .clientes-dropdown-item {
        display:flex;align-items:center;
        padding:10px 14px;font-size:13px;cursor:pointer;
        border-bottom:1px solid var(--border-light);transition:background .1s;
        overflow:hidden;
      }
      .clientes-dropdown-item:last-child { border-bottom:none; }
      .clientes-dropdown-item:hover      { background:var(--hover-bg); }
    </style>
  `
})
export class CfdiEmitirComponent implements OnInit {
  form:              FormGroup;
  rfcs:              RfcList[]          = [];
  clientes:          Cliente[]          = [];
  series:            SerieConfig[]      = [];
  conceptosCatalogo: ConceptoCatalogo[] = [];

  loading  = false;
  errorMsg = '';
  subtotal = 0; iva = 0; total = 0;

  readonly walletUrl = `${environment.principalLoginUrl}/wallet`;
  get esSaldoError(): boolean {
    const m = this.errorMsg.toLowerCase();
    return m.includes('timbre') || m.includes('saldo') || m.includes('bolsa');
  }

  camposConError: string[] = [];

  modoClonando = false;
  modoEditando = false;
  cargandoBase = false;

  observaciones        = '';
  editandoNotaDefault  = false;
  textoNotaDefault     = '';

  mostrarPreview  = false;
  loadingPreview  = false;
  previewUrl:     string | null          = null;
  previewSafeUrl: SafeResourceUrl | null = null;

  nomTotalSueldos  = 0;
  nomTotalGravado  = 0;
  nomTotalExento   = 0;
  nomTotalOtrasDed = 0;
  nomTotalImpRet   = 0;

  rfcSeleccionado:     RfcList | null = null;
  clienteSeleccionado: Cliente | null = null;
  busquedaRfc      = '';
  buscandoRfc      = false;
  rfcsFiltrados:   RfcList[] = [];

  mostrarAgregarCliente    = false;
  mostrarAgregarSerie      = false;
  mostrarCatalogoConceptos = false;

  // Plantillas frecuentes
  modalGuardarPlantilla = false;
  plantillaNombre       = '';
  plantillaDescripcion  = '';
  guardandoPlantilla    = false;
  plantillaGuardadaOk   = false;
  plantillaError        = '';
  plantillaCargada:     PlantillaCfdi | null = null;

  // Cotización convertida
  cotizacionCargada:    Cotizacion | null = null;

  nuevaSerie   = { serie: '', descripcion: '' };
  nuevoCliente = { rfc: '', nombre: '', usoCfdi: 'S01', regimenFiscal: '616', codigoPostal: '' };

  tipos               = TIPOS_COMPROBANTE;
  formasPago          = FORMAS_PAGO;
  metodosPago         = METODOS_PAGO;
  usosCfdi            = USOS_CFDI;
  regimenes           = REGIMENES_FISCALES;
  unidades            = UNIDADES_SAT;
  tiposRelacion       = TIPOS_RELACION_CFDI;
  entidades           = ENTIDADES_FEDERATIVAS;
  tiposPercepcion     = TIPOS_PERCEPCION;
  tiposDeduccion      = TIPOS_DEDUCCION;
  tiposOtroPago       = TIPOS_OTRO_PAGO;
  tiposContrato       = TIPOS_CONTRATO;
  tiposRegimenLaboral = TIPOS_REGIMEN_LABORAL;
  periodicidades      = PERIODICIDADES_PAGO;

  readonly camposLegibles: Record<string, string> = {
    rfcId:                  'RFC Emisor',
    tipoComprobante:        'Tipo de comprobante',
    formaPago:              'Forma de pago',
    metodoPago:             'Método de pago',
    lugarExpedicion:        'Lugar de expedición (CP)',
    receptorRfc:            'RFC Receptor',
    receptorNombre:         'Nombre / Razón Social Receptor',
    receptorRegimen:        'Régimen Fiscal Receptor',
    receptorCp:             'CP Receptor',
    'complementoPago.fechaPago': 'Fecha de pago (complemento)',
    'complementoPago.monto':     'Monto pagado (complemento)',
    'complementoNomina.tipoNomina':             'Tipo de nómina',
    'complementoNomina.fechaPago':              'Fecha de pago',
    'complementoNomina.fechaInicialPago':       'Fecha inicial período',
    'complementoNomina.fechaFinalPago':         'Fecha final período',
    'complementoNomina.diasPagados':            'Días pagados',
    'complementoNomina.periodicidadPago':       'Periodicidad de pago',
    'complementoNomina.registroPatronal':       'Registro patronal',
    'complementoNomina.entidadFederativa':      'Entidad federativa empleador',
    'complementoNomina.curpEmpleado':           'CURP empleado',
    'complementoNomina.nss':                    'NSS',
    'complementoNomina.fechaInicioRelLaboral':  'Fecha inicio relación laboral',
    'complementoNomina.tipoContrato':           'Tipo de contrato',
    'complementoNomina.tipoRegimen':            'Tipo de régimen',
    'complementoNomina.numEmpleado':            'No. empleado',
    'complementoNomina.riesgoTrabajo':          'Riesgo de trabajo',
    'complementoNomina.claveEntFed':            'Clave entidad federativa trabajador',
    'complementoNomina.salarioBase':            'Salario base cotización',
    'complementoNomina.salarioDiarioIntegrado': 'Salario diario integrado',
  };

  constructor(
    private fb:             FormBuilder,
    private cfdiSvc:        CfdiService,
    private rfcSvc:         RfcService,
    private clienteSvc:     ClienteService,
    private serieSvc:       SerieService,
    private conceptoCatSvc: ConceptoCatalogoService,
    private plantillaSvc:    PlantillaCfdiService,
    private cotizacionSvc:   CotizacionService,
    private sanitizer:       DomSanitizer,
    private router:         Router,
    private route:          ActivatedRoute,
    private notaSvc:        NotaDefaultService
  ) {
    this.form = this.fb.group({
      rfcId:            ['', Validators.required],
      tipoComprobante:  ['I', Validators.required],
      serie:            [''],
      formaPago:        ['03', Validators.required],
      metodoPago:       ['PUE', Validators.required],
      moneda:           ['MXN'],
      lugarExpedicion:  ['', [Validators.required, Validators.minLength(5)]],
      usoCfdi:          ['G03'],
      receptorRfc:      ['', Validators.required],
      receptorNombre:   ['', Validators.required],
      receptorUsoCfdi:  ['S01'],
      receptorRegimen:  ['616'],
      receptorCp:       ['', [Validators.required, Validators.minLength(5)]],
      conceptos:        this.fb.array([this.newConcepto()]),
      cfdiRelacionados: this.fb.array([]),

      // ── Complemento de Pago ──────────────────────────────────
      complementoPago: this.fb.group({
        fechaPago:    ['', Validators.required],
        monto:        [0,  [Validators.required, Validators.min(0.01)]],
        moneda:       ['MXN'],
        numOperacion: [''],
        documentosRelacionados: this.fb.array([this.newDocumentoRelacionado()])
      }),

      // ── Complemento de Nómina ────────────────────────────────
      complementoNomina: this.fb.group({
        tipoNomina:             ['O'],
        fechaPago:              [''],
        fechaInicialPago:       ['', Validators.required],
        fechaFinalPago:         ['', Validators.required],
        diasPagados:            [0],
        registroPatronal:       [''],
        curpPatron:             [''],
        entidadFederativa:      [''],
        curpEmpleado:           [''],
        nss:                    [''],
        fechaInicioRelLaboral:  [''],
        tipoContrato:           [''],
        tipoRegimen:            [''],
        numEmpleado:            [''],
        departamento:           [''],
        puesto:                 [''],
        riesgoTrabajo:          ['1'],
        periodicidadPago:       [''],
        banco:                  [''],
        cuentaBancaria:         [''],
        salarioBase:            [0],
        salarioDiarioIntegrado: [0],
        claveEntFed:            [''],
        percepciones:           this.fb.array([]),
        deducciones:            this.fb.array([]),
        otrosPagos:             this.fb.array([])
      })
    });

    this.form.get('tipoComprobante')!.valueChanges.subscribe(tipo => this.onTipoChange(tipo));

    // ✅ Ambos complementos deshabilitados al inicio (tipo I por defecto)
    this.nomina.disable();
    this.pago.disable();
  }

  ngOnInit(): void {
    // Pre-llenar notas — localStorage inmediato, luego API
    this.textoNotaDefault = this.notaSvc.getCached();
    this.observaciones    = this.notaSvc.getCached();
    this.notaSvc.loadFromApi().subscribe(v => {
      this.textoNotaDefault = v;
      if (!this.observaciones) this.observaciones = v;
    });

    // Reacciona a cambios de ?tipo= y ?metodoPago= en cada navegación
    // (queryParamMap es observable — se actualiza aunque Angular reutilice la instancia)
    this.route.queryParamMap.subscribe(params => {
      const tipoParam = params.get('tipo');
      if (tipoParam && ['I','E','T','N','P'].includes(tipoParam)) {
        this.form.get('tipoComprobante')!.setValue(tipoParam, { emitEvent: true });
      }
      const metodoPagoParam = params.get('metodoPago');
      if (metodoPagoParam && ['PPD','PUE'].includes(metodoPagoParam)) {
        const ctrl = this.form.get('metodoPago');
        if (ctrl?.enabled) ctrl.setValue(metodoPagoParam);
      }
    });

    // PPD → forma de pago siempre 99 (regla SAT)
    this.form.get('metodoPago')!.valueChanges.subscribe(metodo => {
      const formaPago = this.form.get('formaPago')!;
      if (metodo === 'PPD') {
        formaPago.setValue('99');
      } else if (formaPago.value === '99') {
        formaPago.setValue('03');
      }
    });

    this.rfcSvc.listar().subscribe(rs => {
      this.rfcs = rs;

      // Auto-seleccionar RFC predeterminado o único si el campo está vacío
      if (!this.form.get('rfcId')?.value) {
        const def = rs.find(r => r.isDefault) ?? (rs.length === 1 ? rs[0] : null);
        if (def) {
          this.form.get('rfcId')!.setValue(String(def.id));
          this.onRfcChange();
        }
      }

      // Clonar / editar — espera a que los RFC estén cargados para poder hacer onRfcChange
      const clonarId    = this.route.snapshot.queryParamMap.get('clonarId');
      const editarId    = this.route.snapshot.queryParamMap.get('editarId');
      const plantillaId = this.route.snapshot.queryParamMap.get('plantillaId');
      const sourceId    = clonarId ?? editarId;
      if (sourceId) {
        this.modoClonando = !!clonarId;
        this.modoEditando = !!editarId;
        this.cargandoBase = true;
        this.cfdiSvc.obtener(+sourceId).subscribe({
          next:  d => { this.prefillDesde(d); this.cargandoBase = false; },
          error: () => { this.cargandoBase = false; }
        });
      } else if (plantillaId) {
        this.cargandoBase = true;
        this.plantillaSvc.obtener(+plantillaId).subscribe({
          next: p => {
            this.plantillaCargada = p;
            try {
              const datos = JSON.parse(p.datosJson);
              this.prefillDesdePlantilla(datos);
            } catch { /* JSON inválido, ignorar */ }
            this.cargandoBase = false;
          },
          error: () => { this.cargandoBase = false; }
        });
      } else if (this.route.snapshot.queryParamMap.get('cotizacionId')) {
        const cotId = +this.route.snapshot.queryParamMap.get('cotizacionId')!;
        this.cargandoBase = true;
        this.cotizacionSvc.obtener(cotId).subscribe({
          next: c => {
            this.cotizacionCargada = c;
            this.prefillDesdeCotizacion(c);
            this.cargandoBase = false;
          },
          error: () => { this.cargandoBase = false; }
        });
      }
    });

    this.clienteSvc.listar().subscribe(cs => this.clientes = cs);
    this.conceptoCatSvc.listar().subscribe(cc => this.conceptosCatalogo = cc);

    this.nomina.get('tipoRegimen')!.valueChanges.subscribe(val => {
      if (val !== '02') return;
      const yaExiste       = this.otrosPagos.controls.some(c => c.get('tipoPago')?.value === '002');
      const tieneExcepcion = this.otrosPagos.controls.some(c => ['007', '008'].includes(c.get('tipoPago')?.value));
      if (!yaExiste && !tieneExcepcion) {
        this.otrosPagos.push(this.fb.group({
          tipoPago: ['002'], clave: ['002'],
          concepto: ['Subsidio para el empleo'], importe: [0]
        }));
      }
    });
  }

  prefillDesde(d: CfdiDetalle): void {
    // 1. Activar el tipo correcto (dispara onTipoChange para habilitar/deshabilitar secciones)
    this.form.get('tipoComprobante')!.setValue(d.tipoComprobante, { emitEvent: true });

    setTimeout(() => {
      // 2. Patch campos básicos
      this.form.patchValue({
        rfcId:          d.rfcId     ?? '',
        serie:          d.serie     ?? '',
        formaPago:      d.formaPago ?? '03',
        metodoPago:     d.metodoPago ?? 'PUE',
        moneda:         d.moneda    ?? 'MXN',
        receptorRfc:    d.receptorRfc,
        receptorNombre: d.receptorNombre,
      });

      // 3. Disparar cambio de RFC para cargar series y CP del emisor
      this.onRfcChange();

      // 4. Pre-llenar conceptos (sólo para I y E)
      if (d.lineas?.length && d.tipoComprobante !== 'N' && d.tipoComprobante !== 'P') {
        while (this.conceptos.length) this.conceptos.removeAt(0);
        d.lineas.forEach(l => {
          const tasaIva = l.importe > 0
            ? Math.round((l.importeIva / l.importe) * 100) / 100
            : 0.16;
          const g = this.fb.group({
            claveProdServ:  [l.claveProdServ,  Validators.required],
            claveUnidad:    ['ACT',             Validators.required],
            unidad:         ['Actividad'],
            descripcion:    [l.descripcion,     Validators.required],
            cantidad:       [l.cantidad,        [Validators.required, Validators.min(0.001)]],
            precioUnitario: [l.precioUnitario,  [Validators.required, Validators.min(0.01)]],
            descuento:      [l.descuento ?? 0],
            tasaIva:        [tasaIva]
          });
          this.conceptos.push(g);
        });
        this.calcTotal();
      }
    }, 100);
  }

  // ── Getters ───────────────────────────────────────────────────
  get tipoActual(): string     { return this.form.get('tipoComprobante')?.value ?? 'I'; }
  tipoLabel(): string {
    const map: Record<string, string> = { I:'Factura de Ingreso', E:'Nota de Crédito', T:'Traslado', P:'Complemento de Pago', N:'Nómina' };
    return map[this.tipoActual] ?? 'Comprobante';
  }

  guardarNotaDefault(): void {
    this.notaSvc.save(this.textoNotaDefault).subscribe();
    this.editandoNotaDefault = false;
  }
  aplicarNotaDefault(): void {
    this.observaciones = this.textoNotaDefault;
  }
  get conceptos():    FormArray { return this.form.get('conceptos')          as FormArray; }
  get relacionados(): FormArray { return this.form.get('cfdiRelacionados')   as FormArray; }
  get nomina():       FormGroup { return this.form.get('complementoNomina')  as FormGroup; }
  get pago():         FormGroup { return this.form.get('complementoPago')    as FormGroup; }
  get percepciones(): FormArray { return this.nomina.get('percepciones')     as FormArray; }
  get deducciones():  FormArray { return this.nomina.get('deducciones')      as FormArray; }
  get otrosPagos():   FormArray { return this.nomina.get('otrosPagos')       as FormArray; }
  get docsPago():     FormArray { return this.pago.get('documentosRelacionados') as FormArray; }

  // ── newDocumentoRelacionado ───────────────────────────────────
  newDocumentoRelacionado(): FormGroup {
    return this.fb.group({
      idDocumento:       ['', Validators.required],
      serie:             [''],
      folio:             [''],
      moneda:            ['MXN'],
      metodoPago:        ['PPD'],
      numeroParcialidad: [1,  Validators.required],
      saldoAnterior:     [0,  Validators.required],
      importePagado:     [0,  Validators.required],
      saldoInsoluto:     [0]
    });
  }

  calcSaldoInsoluto(d: AbstractControl): void {
    const anterior = +d.get('saldoAnterior')!.value  || 0;
    const pagado   = +d.get('importePagado')!.value   || 0;
    d.get('saldoInsoluto')!.setValue(
      Math.max(0, Math.round((anterior - pagado) * 100) / 100)
    );
  }

  // ── Validación ────────────────────────────────────────────────
  getCamposInvalidos(): string[] {
    const invalidos: string[] = [];
    const recorrer = (group: FormGroup | FormArray, prefijo: string) => {
      Object.keys((group as any).controls).forEach(key => {
        const ctrl = (group as any).controls[key];
        const ruta = prefijo ? `${prefijo}.${key}` : key;
        if (ctrl instanceof FormGroup || ctrl instanceof FormArray) {
          recorrer(ctrl, ruta);
        } else if (ctrl.invalid && ctrl.enabled) {
          invalidos.push(this.camposLegibles[ruta] ?? ruta);
        }
      });
    };
    recorrer(this.form, '');
    return invalidos;
  }

  scrollAlPrimerError(): void {
    const el = document.querySelector(
      '.ng-invalid.ng-touched:not(form):not(ng-container):not(div)'
    ) as HTMLElement | null;
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus?.(); }
  }

  // ── PDF Preview ───────────────────────────────────────────────
  verPreview(): void {
    this.form.markAllAsTouched();
    this.camposConError = [];
    if (this.form.invalid) {
      this.camposConError = this.getCamposInvalidos();
      setTimeout(() => this.scrollAlPrimerError(), 100);
      return;
    }
    this.loadingPreview = true;
    this.mostrarPreview = true;
    this.errorMsg       = '';
    this.cfdiSvc.preview(this.buildPayload()).subscribe({
      next: (blob: Blob) => {
        this.loadingPreview = false;
        if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
        this.previewUrl     = URL.createObjectURL(blob);
        this.previewSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.previewUrl);
      },
      error: (err: any) => {
        this.loadingPreview = false;
        this.mostrarPreview = false;
        this.errorMsg = err.error?.error ?? 'Error al generar vista previa.';
      }
    });
  }

  cerrarPreview(): void {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl     = null;
    this.previewSafeUrl = null;
    this.mostrarPreview = false;
  }

  // ── onTipoChange ─────────────────────────────────────────────
  onTipoChange(tipo: string): void {
    const formaPago  = this.form.get('formaPago')!;
    const metodoPago = this.form.get('metodoPago')!;
    const usoCfdi    = this.form.get('usoCfdi')!;
    const recUsoCfdi = this.form.get('receptorUsoCfdi')!;

    // Deshabilitar todos los complementos primero
    this.pago.disable();
    this.nomina.disable();

    if (tipo === 'T') {
      formaPago.setValue('');   formaPago.clearValidators();   formaPago.disable();
      metodoPago.setValue(''); metodoPago.clearValidators(); metodoPago.disable();
      usoCfdi.setValue('S01');    usoCfdi.disable();
      recUsoCfdi.setValue('S01'); recUsoCfdi.disable();
      this.conceptos.controls.forEach(c => { c.enable(); });
      this.calcTotal();

    } else if (tipo === 'P') {
      formaPago.enable(); formaPago.setValidators(Validators.required);
      metodoPago.setValue(''); metodoPago.clearValidators(); metodoPago.disable();
      usoCfdi.setValue('CP01');    usoCfdi.disable();
      recUsoCfdi.setValue('CP01'); recUsoCfdi.disable();
      this.pago.enable();   // ✅ habilitar complemento de pago
      this.conceptos.controls.forEach(c => c.disable());

    } else if (tipo === 'N') {
      formaPago.setValue('99'); formaPago.clearValidators(); formaPago.disable();
      metodoPago.enable(); metodoPago.setValue('PUE'); metodoPago.setValidators(Validators.required);
      usoCfdi.setValue('CN01');    usoCfdi.disable();
      recUsoCfdi.setValue('CN01'); recUsoCfdi.disable();
      this.form.get('receptorRegimen')!.setValue('605');
      this.form.get('receptorRegimen')!.disable();
      this.nomina.enable();   // ✅ habilitar complemento de nómina
      this.conceptos.controls.forEach(c => c.disable());

    } else {
      // I o E
      formaPago.enable(); formaPago.setValidators(Validators.required);
      metodoPago.enable(); metodoPago.setValidators(Validators.required);
      usoCfdi.enable(); usoCfdi.setValue('G03');
      recUsoCfdi.enable(); recUsoCfdi.setValue('S01');
      this.form.get('receptorRegimen')!.enable();
      this.conceptos.controls.forEach(c => { c.enable(); });
      this.calcTotal();
    }

    formaPago.updateValueAndValidity();
    metodoPago.updateValueAndValidity();
    usoCfdi.updateValueAndValidity();
    recUsoCfdi.updateValueAndValidity();
  }

  // ── Percepciones / Deducciones / Otros pagos ─────────────────
  newPercepcion(): FormGroup {
    return this.fb.group({
      tipoPercepcion: [''], clave: [''], concepto: [''],
      importeGravado: [0], importeExento: [0]
    });
  }
  newDeduccion(): FormGroup {
    return this.fb.group({ tipoDeduccion: [''], clave: [''], concepto: [''], importe: [0] });
  }
  newOtroPago(): FormGroup {
    return this.fb.group({ tipoPago: [''], clave: [''], concepto: [''], importe: [0] });
  }

  addPercepcion():             void { this.percepciones.push(this.newPercepcion()); }
  removePercepcion(i: number): void { this.percepciones.removeAt(i); this.calcTotalesNomina(); }
  addDeduccion():              void { this.deducciones.push(this.newDeduccion()); }
  removeDeduccion(i: number):  void { this.deducciones.removeAt(i); this.calcTotalesNomina(); }
  addOtroPago():               void { this.otrosPagos.push(this.newOtroPago()); }
  removeOtroPago(i: number):   void { this.otrosPagos.removeAt(i); }

  calcTotalesNomina(): void {
    this.nomTotalGravado = this.percepciones.controls.reduce((s, c) => s + (+c.get('importeGravado')!.value || 0), 0);
    this.nomTotalExento  = this.percepciones.controls.reduce((s, c) => s + (+c.get('importeExento')!.value  || 0), 0);
    this.nomTotalSueldos = Math.round((this.nomTotalGravado + this.nomTotalExento) * 100) / 100;
    this.nomTotalGravado = Math.round(this.nomTotalGravado * 100) / 100;
    this.nomTotalExento  = Math.round(this.nomTotalExento  * 100) / 100;
    this.nomTotalImpRet   = this.deducciones.controls.filter(c => c.get('tipoDeduccion')!.value === '002').reduce((s, c) => s + (+c.get('importe')!.value || 0), 0);
    this.nomTotalOtrasDed = this.deducciones.controls.filter(c => c.get('tipoDeduccion')!.value !== '002').reduce((s, c) => s + (+c.get('importe')!.value || 0), 0);
    this.nomTotalImpRet   = Math.round(this.nomTotalImpRet   * 100) / 100;
    this.nomTotalOtrasDed = Math.round(this.nomTotalOtrasDed * 100) / 100;
  }

  // ── Conceptos ────────────────────────────────────────────────
  newConcepto(): FormGroup {
    const tipo    = this.form?.get('tipoComprobante')?.value ?? 'I';
    const tasaIva = tipo === 'P' ? 0 : 0.16;
    return this.fb.group({
      claveProdServ:  ['01010101', Validators.required],
      claveUnidad:    ['ACT',      Validators.required],
      unidad:         ['Actividad'],
      descripcion:    ['',         Validators.required],
      cantidad:       [1,          [Validators.required, Validators.min(0.001)]],
      precioUnitario: [0,          [Validators.required, Validators.min(0.01)]],
      descuento:      [0],
      tasaIva:        [tasaIva]
    });
  }

  newRelacionado(): FormGroup {
    return this.fb.group({ tipoRelacion: ['', Validators.required], uuid: ['', Validators.required] });
  }

  addConcepto(): void {
    const g = this.newConcepto();
    if (this.tipoActual === 'N' || this.tipoActual === 'P') g.disable();
    this.conceptos.push(g);
  }
  removeConcepto(i: number):    void { this.conceptos.removeAt(i); this.calcTotal(); }
  addRelacionado():             void { this.relacionados.push(this.newRelacionado()); }
  removeRelacionado(i: number): void { this.relacionados.removeAt(i); }

  // ── RFC combobox ──────────────────────────────────────────────
  abrirBusquedaRfc(): void {
    this.buscandoRfc   = true;
    this.busquedaRfc   = '';
    this.rfcsFiltrados = this.rfcs.slice(0, 10);
  }

  onRfcFocused(): void {
    const txt = this.busquedaRfc.toLowerCase().trim();
    this.rfcsFiltrados = txt ? this.rfcs.filter(r =>
      r.rfc.toLowerCase().includes(txt) || r.razonSocial.toLowerCase().includes(txt)
    ).slice(0, 10) : this.rfcs.slice(0, 10);
  }

  onRfcBlurred(): void {
    setTimeout(() => {
      this.rfcsFiltrados = [];
      if (this.rfcSeleccionado) {
        this.buscandoRfc = false;
        this.busquedaRfc = '';
      }
    }, 200);
  }

  filtrarRfcs(): void {
    const txt = this.busquedaRfc.toLowerCase().trim();
    if (!txt) { this.rfcsFiltrados = this.rfcs.slice(0, 10); return; }
    this.rfcsFiltrados = this.rfcs
      .filter(r => r.rfc.toLowerCase().includes(txt) || r.razonSocial.toLowerCase().includes(txt))
      .slice(0, 10);
  }

  seleccionarRfcCombo(r: RfcList): void {
    this.form.get('rfcId')!.setValue(String(r.id));
    this.busquedaRfc   = '';
    this.rfcsFiltrados = [];
    this.buscandoRfc   = false;
    this.onRfcChange();
  }

  onRfcChange(): void {
    const id = +this.form.get('rfcId')!.value;
    this.rfcSeleccionado = this.rfcs.find(r => r.id === id) ?? null;
    this.series = [];
    this.form.get('serie')!.setValue('');
    if (this.rfcSeleccionado?.codigoPostal)
      this.form.get('lugarExpedicion')!.setValue(this.rfcSeleccionado.codigoPostal);
    if (id) {
      this.serieSvc.listarPorRfc(id).subscribe({
        next: ss => {
          this.series = ss.filter((s: any) => s.activa !== false);
          const def = this.series.find((s: any) => s.porDefecto);
          if (def) this.form.get('serie')!.setValue(def.codigo);
          else if (this.series.length > 0) this.form.get('serie')!.setValue(this.series[0].codigo);
        },
        error: () => {}
      });
    }
  }

  serieEsNueva(): boolean {
    const val = (this.form.get('serie')!.value || '').toUpperCase().trim();
    if (!val) return false;
    return !this.series.some(s => s.codigo.toUpperCase() === val);
  }

  guardarSerieLibre(): void {
    if (!this.rfcSeleccionado) return;
    const codigo = (this.form.get('serie')!.value || '').toUpperCase().trim();
    if (!codigo) return;
    this.serieSvc.crear({
      rfcId: this.rfcSeleccionado.id, codigo, nombre: codigo,
      descripcion: undefined, tipoComprobante: this.tipoActual || 'I',
      folioInicial: 1, digitos: 6, porDefecto: false
    }).subscribe(s => this.series.push(s));
  }

  onDescripcionSelect(ctrl: AbstractControl, event: Event): void {
    const val = (event.target as HTMLInputElement).value;
    const cc  = this.conceptosCatalogo.find(c => c.descripcion === val);
    if (!cc) return;
    const tasaIva = this.tipoActual === 'P' ? 0 : cc.tasaIva;
    ctrl.patchValue({
      descripcion: cc.descripcion, claveProdServ: cc.claveProdServ,
      claveUnidad: cc.claveUnidad, unidad: cc.unidad,
      precioUnitario: cc.precioUnitario, cantidad: cc.cantidad,
      descuento: cc.descuento, tasaIva
    });
    this.calcTotal();
  }

  onClienteSelect(event: Event): void {
    const id = +(event.target as HTMLSelectElement).value;
    const c  = this.clientes.find(x => x.id === id);
    if (!c) return;
    this.clienteSeleccionado = c;
    const tipo      = this.tipoActual;
    const bloqueado = tipo === 'T' || tipo === 'P' || tipo === 'N';
    const usoCfdi    = bloqueado ? (tipo === 'N' ? 'CN01' : 'CP01') : (c.usoCfdi || 'G03');
    const recUsoCfdi = bloqueado ? (tipo === 'N' ? 'CN01' : 'CP01') : (c.usoCfdi || 'S01');
    const regimen    = tipo === 'N' ? '605' : (c.regimenFiscal || '616');
    this.form.patchValue({
      receptorRfc: c.rfc, receptorNombre: c.nombre,
      receptorRegimen: regimen, receptorCp: c.codigoPostal,
      usoCfdi, receptorUsoCfdi: recUsoCfdi
    });
  }

  limpiarReceptor(): void {
    this.clienteSeleccionado = null;
    this.form.patchValue({
      receptorRfc: '', receptorNombre: '',
      receptorUsoCfdi: 'S01', receptorRegimen: '616', receptorCp: ''
    });
  }

  guardarCliente(): void {
    if (!this.nuevoCliente.rfc || !this.nuevoCliente.nombre) return;
    this.clienteSvc.crear(this.nuevoCliente).subscribe(c => {
      this.clientes.push(c);
      this.clienteSeleccionado = c;
      this.form.patchValue({
        receptorRfc: c.rfc, receptorNombre: c.nombre,
        receptorUsoCfdi: c.usoCfdi, receptorRegimen: c.regimenFiscal,
        receptorCp: c.codigoPostal, usoCfdi: c.usoCfdi
      });
      this.nuevoCliente = { rfc: '', nombre: '', usoCfdi: 'S01', regimenFiscal: '616', codigoPostal: '' };
      this.mostrarAgregarCliente = false;
    });
  }

  onUnidadChange(c: AbstractControl, event: Event): void {
    const val    = (event.target as HTMLSelectElement).value;
    const unidad = this.unidades.find(u => u.value === val);
    if (unidad) c.get('unidad')!.setValue(unidad.label.split(' - ')[1] ?? val);
  }

  addConceptoDesde(cc: ConceptoCatalogo): void {
    const tasaIva = this.tipoActual === 'P' ? 0 : cc.tasaIva;
    const g = this.fb.group({
      claveProdServ:  [cc.claveProdServ, Validators.required],
      claveUnidad:    [cc.claveUnidad,   Validators.required],
      unidad:         [cc.unidad],
      descripcion:    [cc.descripcion,   Validators.required],
      cantidad:       [1,                [Validators.required, Validators.min(0.001)]],
      precioUnitario: [cc.precioUnitario,[Validators.required, Validators.min(0.01)]],
      descuento:      [0],
      tasaIva:        [tasaIva]
    });
    if (this.tipoActual === 'N' || this.tipoActual === 'P') g.disable();

    // Si hay exactamente un concepto vacío (placeholder inicial), reemplazarlo
    const esPlaceholder =
      this.conceptos.length === 1 &&
      !this.conceptos.at(0).get('descripcion')?.value &&
      !(this.conceptos.at(0).get('precioUnitario')?.value > 0);

    if (esPlaceholder) {
      this.conceptos.setControl(0, g);
    } else {
      this.conceptos.push(g);
    }

    this.calcTotal();
    this.mostrarCatalogoConceptos = false;
  }

  guardarEnCatalogo(c: AbstractControl): void {
    const v = c.value;
    if (!v.descripcion || !v.precioUnitario) return;
    this.conceptoCatSvc.crear({
      rfcId: this.rfcSeleccionado?.id ?? null, clienteId: null,
      claveProdServ: v.claveProdServ, claveUnidad: v.claveUnidad, unidad: v.unidad,
      descripcion: v.descripcion, objetoImpuesto: '02', precioUnitario: +v.precioUnitario,
      cantidad: +v.cantidad || 1, descuento: +v.descuento || 0, tasaIva: +v.tasaIva,
      aplicaIva: true, tasaIsr: null, tasaIvaRet: null
    }).subscribe(cc => this.conceptosCatalogo.push(cc));
  }

  hasError(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && c.touched;
  }

  importeConcepto(c: AbstractControl): number {
    const v   = c.value;
    const imp = (v.cantidad * v.precioUnitario) - (v.descuento || 0);
    const iva = imp * (v.tasaIva || 0);
    return Math.round((imp + iva) * 100) / 100;
  }

  calcTotal(): void {
    let sub = 0, iv = 0;
    this.conceptos.controls.forEach(c => {
      const v   = c.value;
      const imp = (v.cantidad * v.precioUnitario) - (v.descuento || 0);
      sub += imp;
      iv  += imp * (v.tasaIva || 0);
    });
    this.subtotal = Math.round(sub * 100) / 100;
    this.iva      = Math.round(iv  * 100) / 100;
    this.total    = Math.round((sub + iv) * 100) / 100;
  }

  // ── buildPayload ──────────────────────────────────────────────
  buildPayload(): any {
    const v   = this.form.getRawValue();
    const rel = (v.cfdiRelacionados ?? []).filter((r: any) => r.tipoRelacion && r.uuid);

    // ── Complemento de Pago ──────────────────────────────────
    let complementoPago = null;
    if (v.tipoComprobante === 'P') {
      const p = v.complementoPago;
      complementoPago = {
        fechaPago:    p.fechaPago,
        moneda:       p.moneda       || 'MXN',
        monto:        +p.monto,
        numOperacion: p.numOperacion || null,
        documentosRelacionados: (p.documentosRelacionados ?? []).map((d: any) => ({
          idDocumento:       d.idDocumento,
          serie:             d.serie             || null,
          folio:             d.folio             || null,
          moneda:            d.moneda            || 'MXN',
          metodoPago:        d.metodoPago        || 'PPD',
          numeroParcialidad: +d.numeroParcialidad,
          saldoAnterior:     +d.saldoAnterior,
          importePagado:     +d.importePagado,
          saldoInsoluto:     +d.saldoInsoluto
        }))
      };
    }

    // ── Complemento de Nómina ────────────────────────────────
    let complementoNomina = null;
    if (v.tipoComprobante === 'N') {
      const n = v.complementoNomina;
      complementoNomina = {
        tipoNomina:              n.tipoNomina,
        fechaPago:               n.fechaPago,
        fechaInicialPago:        n.fechaInicialPago,
        fechaFinalPago:          n.fechaFinalPago,
        diasPagados:             +n.diasPagados,
        registroPatronal:        n.registroPatronal,
        curpPatron:              n.curpPatron              || null,
        entidadFederativa:       n.entidadFederativa,
        curpEmpleado:            n.curpEmpleado,
        nss:                     n.nss,
        fechaInicioRelLaboral:   n.fechaInicioRelLaboral,
        tipoContrato:            n.tipoContrato,
        tipoRegimen:             n.tipoRegimen,
        numEmpleado:             n.numEmpleado,
        departamento:            n.departamento            || null,
        puesto:                  n.puesto                  || null,
        riesgoTrabajo:           n.riesgoTrabajo,
        periodicidadPago:        n.periodicidadPago,
        banco:                   n.banco                   || null,
        cuentaBancaria:          n.cuentaBancaria          || null,
        salarioBase:             +n.salarioBase,
        salarioDiarioIntegrado:  +n.salarioDiarioIntegrado,
        claveEntFed:             n.claveEntFed,
        totalSueldos:            this.nomTotalSueldos,
        totalExento:             this.nomTotalExento,
        totalGravado:            this.nomTotalGravado,
        totalOtrasDeducciones:   this.nomTotalOtrasDed,
        totalImpuestosRetenidos: this.nomTotalImpRet,
        percepciones:            n.percepciones,
        deducciones:             n.deducciones?.length > 0  ? n.deducciones  : null,
        otrosPagos:              n.otrosPagos?.length  > 0  ? n.otrosPagos   : null
      };
    }

    return {
      rfcId:            +v.rfcId,
      tipoComprobante:  v.tipoComprobante,
      formaPago:        v.formaPago   || '',
      metodoPago:       v.metodoPago  || '',
      lugarExpedicion:  v.lugarExpedicion,
      moneda:           v.moneda,
      serie:            v.serie       || '',
      usoCfdi:          v.usoCfdi,
      receptorRfc:      v.receptorRfc,
      receptorNombre:   v.receptorNombre,
      receptorUsoCfdi:  v.receptorUsoCfdi,
      receptorRegimen:  v.receptorRegimen,
      receptorCp:       v.receptorCp,
      conceptos:        (v.tipoComprobante === 'N' || v.tipoComprobante === 'P') ? [] : v.conceptos,
      cfdiRelacionados: rel.length > 0 ? rel : undefined,
      complementoPago,
      complementoNomina
    };
  }

  // ── Plantillas frecuentes ─────────────────────────────────────
  abrirGuardarPlantilla(): void {
    this.plantillaNombre      = '';
    this.plantillaDescripcion = '';
    this.plantillaGuardadaOk  = false;
    this.plantillaError       = '';
    this.modalGuardarPlantilla = true;
  }

  cerrarGuardarPlantilla(): void { this.modalGuardarPlantilla = false; }

  guardarPlantilla(): void {
    if (!this.plantillaNombre.trim()) return;
    this.guardandoPlantilla   = true;
    this.plantillaGuardadaOk  = false;
    this.plantillaError       = '';
    const datosJson = JSON.stringify(this.buildPayload());
    this.plantillaSvc.crear({
      nombre:      this.plantillaNombre.trim(),
      descripcion: this.plantillaDescripcion.trim() || undefined,
      datosJson
    }).subscribe({
      next: p => {
        this.guardandoPlantilla  = false;
        this.plantillaGuardadaOk = true;
        this.plantillaCargada    = p;
        setTimeout(() => this.cerrarGuardarPlantilla(), 1500);
      },
      error: (err: any) => {
        this.guardandoPlantilla = false;
        this.plantillaError = err.error?.error ?? 'Error al guardar la plantilla.';
      }
    });
  }

  prefillDesdePlantilla(datos: any): void {
    if (datos.tipoComprobante) {
      this.form.get('tipoComprobante')!.setValue(datos.tipoComprobante, { emitEvent: true });
    }
    setTimeout(() => {
      this.form.patchValue({
        rfcId:            datos.rfcId     ? String(datos.rfcId) : '',
        serie:            datos.serie     ?? '',
        formaPago:        datos.formaPago ?? '03',
        metodoPago:       datos.metodoPago ?? 'PUE',
        moneda:           datos.moneda    ?? 'MXN',
        receptorRfc:      datos.receptorRfc    ?? '',
        receptorNombre:   datos.receptorNombre ?? '',
        receptorUsoCfdi:  datos.receptorUsoCfdi ?? 'S01',
        receptorRegimen:  datos.receptorRegimen ?? '616',
        receptorCp:       datos.receptorCp     ?? '',
      });
      this.onRfcChange();

      if (datos.conceptos?.length && datos.tipoComprobante !== 'N' && datos.tipoComprobante !== 'P') {
        while (this.conceptos.length) this.conceptos.removeAt(0);
        datos.conceptos.forEach((c: any) => {
          const g = this.fb.group({
            claveProdServ:  [c.claveProdServ,  Validators.required],
            claveUnidad:    [c.claveUnidad,     Validators.required],
            unidad:         [c.unidad     ?? 'Servicio'],
            descripcion:    [c.descripcion,     Validators.required],
            cantidad:       [c.cantidad ?? 1,   [Validators.required, Validators.min(0.001)]],
            precioUnitario: [c.precioUnitario,  [Validators.required, Validators.min(0.01)]],
            descuento:      [c.descuento ?? 0],
            tasaIva:        [c.tasaIva ?? 0.16]
          });
          this.conceptos.push(g);
        });
        this.calcTotal();
      }
    }, 100);
  }

  prefillDesdeCotizacion(c: Cotizacion): void {
    // Tipo I (ingreso) para facturas de venta
    this.form.get('tipoComprobante')!.setValue('I', { emitEvent: true });
    setTimeout(() => {
      this.form.patchValue({
        receptorRfc:    c.receptorRfc,
        receptorNombre: c.receptorNombre,
        moneda:         c.moneda ?? 'MXN',
        metodoPago:     'PUE',
        formaPago:      '03'
      });
      // Pre-llenar RFC del receptor si hay cliente con ese RFC en la lista
      const cliente = this.clientes.find(cl => cl.rfc === c.receptorRfc);
      if (cliente) {
        this.form.patchValue({
          receptorUsoCfdi: cliente.usoCfdi ?? 'S01',
          receptorRegimen: cliente.regimenFiscal ?? '616',
          receptorCp:      cliente.codigoPostal ?? ''
        });
      }
      this.onRfcChange();

      // Conceptos
      if (c.lineas?.length) {
        while (this.conceptos.length) this.conceptos.removeAt(0);
        c.lineas.forEach(l => {
          const g = this.fb.group({
            claveProdServ:  [l.claveProdServ,  Validators.required],
            claveUnidad:    [l.claveUnidad,     Validators.required],
            unidad:         [l.unidad ?? 'Servicio'],
            descripcion:    [l.descripcion,     Validators.required],
            cantidad:       [l.cantidad,        [Validators.required, Validators.min(0.001)]],
            precioUnitario: [l.precioUnitario,  [Validators.required, Validators.min(0.01)]],
            descuento:      [l.descuento ?? 0],
            tasaIva:        [l.tasaIva ?? 0.16]
          });
          this.conceptos.push(g);
        });
        this.calcTotal();
      }
    }, 100);
  }

  // ── Submit ────────────────────────────────────────────────────
  submit(): void {
    this.form.markAllAsTouched();
    this.camposConError = [];
    if (this.form.invalid) {
      this.camposConError = this.getCamposInvalidos();
      setTimeout(() => this.scrollAlPrimerError(), 100);
      return;
    }
    this.loading = true; this.errorMsg = '';
    const returnTo     = this.route.snapshot.queryParamMap.get('returnTo');
    const cotizacionId = this.cotizacionCargada?.id ?? null;
    const payload      = { ...this.buildPayload(), cotizacionId };
    this.cfdiSvc.emitir(payload).subscribe({
      next: () => {
        if (cotizacionId) {
          this.router.navigate(['/cotizaciones', cotizacionId]);
        } else {
          this.router.navigate(returnTo === 'cuentas-cobrar' ? ['/cuentas-cobrar'] : ['/cfdis']);
        }
      },
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = err.error?.error ?? 'Error al timbrar el CFDI.';
      }
    });
  }
}