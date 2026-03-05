import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
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
import { RfcService } from '../../core/services/RFC/RfcService';
import { ClienteService } from '../../core/services/cliente/ClienteService';
import { SerieService } from '../../core/services/serie/SerieService';
import { ConceptoCatalogoService } from '../../core/services/conceptoc.atalogo/ConceptoCatalogoService';

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
    <div class="animate-in" style="max-width:960px">

      <div style="margin-bottom:24px">
        <a routerLink="/cfdis" class="btn-mag btn-ghost btn-sm" style="margin-bottom:16px">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span>
          Mis CFDIs
        </a>
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">Emitir CFDI</h1>
        <p style="font-size:14px;color:var(--text-muted);margin-top:4px">Nuevo comprobante fiscal digital versión 4.0</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- ══ 1: Configuración general ══ -->
          <div class="card-mag animate-in delay-1">
            <div class="card-header-mag">
              <div>
                <div class="card-title">1. Configuración general</div>
                <div class="card-subtitle">RFC emisor y tipo de comprobante</div>
              </div>
              <div *ngIf="rfcSeleccionado" style="text-align:right">
                <div style="font-size:11px;color:var(--text-muted)">Timbres disponibles</div>
                <div style="font-family:var(--font-display);font-size:18px;font-weight:800;color:var(--accent)">
                  {{ rfcSeleccionado.saldoTimbres }}
                </div>
              </div>
            </div>
            <div class="card-body-mag">
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px" class="form-mag">

                <div class="form-group" style="grid-column:1/3">
                  <label>RFC Emisor *</label>
                  <select formControlName="rfcId" class="form-control-mag"
                          [class.error-field]="hasError('rfcId')" (change)="onRfcChange()">
                    <option value="">Seleccionar RFC...</option>
                    <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
                  </select>
                  <div class="field-error" *ngIf="hasError('rfcId')">Selecciona un RFC</div>
                  <div *ngIf="rfcSeleccionado && !rfcSeleccionado.csdActivo"
                       style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.2);border-radius:6px;padding:8px 12px;font-size:12px;color:var(--warning);margin-top:6px;display:flex;gap:6px;align-items:center">
                    <span class="material-icons-round" style="font-size:15px">warning_amber</span>
                    Este RFC no tiene CSD activo. No podrá timbrar.
                  </div>
                </div>

                <div class="form-group">
                  <label>Tipo de comprobante *</label>
                  <select formControlName="tipoComprobante" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let t of tipos" [value]="t.value">{{ t.label }}</option>
                  </select>
                  <div *ngIf="tipoActual === 'T'"
                       style="margin-top:6px;padding:6px 10px;background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2);border-radius:6px;font-size:11px;color:#2563eb;display:flex;gap:5px;align-items:center">
                    <span class="material-icons-round" style="font-size:13px">info</span>
                    Traslado: sin forma/método de pago
                  </div>
                  <div *ngIf="tipoActual === 'P'"
                       style="margin-top:6px;padding:6px 10px;background:rgba(124,58,237,0.08);border:1px solid rgba(124,58,237,0.2);border-radius:6px;font-size:11px;color:#7c3aed;display:flex;gap:5px;align-items:center">
                    <span class="material-icons-round" style="font-size:13px">info</span>
                    Complemento de pago: llena la sección 3
                  </div>
                  <div *ngIf="tipoActual === 'N'"
                       style="margin-top:6px;padding:6px 10px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:6px;font-size:11px;color:#10b981;display:flex;gap:5px;align-items:center">
                    <span class="material-icons-round" style="font-size:13px">info</span>
                    Nómina: usa complemento de nómina
                  </div>
                </div>

                <div class="form-group">
                  <label>Serie
                    <span *ngIf="!rfcSeleccionado" style="font-size:11px;color:var(--text-muted);font-weight:400"> (selecciona un RFC)</span>
                  </label>
                  <div style="display:flex;gap:8px">
                    <div style="flex:1">
                      <input type="text" formControlName="serie" class="form-control-mag"
                             placeholder="Sin serie o escribe una letra..."
                             maxlength="10" style="text-transform:uppercase" list="series-list">
                      <datalist id="series-list">
                        <option value="">Sin serie</option>
                        <option *ngFor="let s of series" [value]="s.codigo">
                          {{ s.codigo }}{{ s.descripcion ? ' — ' + s.descripcion : '' }}
                        </option>
                      </datalist>
                    </div>
                    <button type="button" class="btn-mag btn-outline btn-sm"
                            (click)="guardarSerieLibre()"
                            *ngIf="rfcSeleccionado && serieEsNueva()" style="padding:0 10px;flex-shrink:0">
                      <span class="material-icons-round" style="font-size:15px">save</span>
                    </button>
                  </div>
                </div>

                <div class="form-group" *ngIf="tipoActual !== 'T' && tipoActual !== 'P'">
                  <label>Forma de pago *</label>
                  <select formControlName="formaPago" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let f of formasPago" [value]="f.value">{{ f.label }}</option>
                  </select>
                </div>

                <!-- Para tipo P: forma de pago del complemento (visible pero informativo) -->
                <div class="form-group" *ngIf="tipoActual === 'P'">
                  <label>Forma de pago del complemento *</label>
                  <select formControlName="formaPago" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let f of formasPago" [value]="f.value">{{ f.label }}</option>
                  </select>
                </div>

                <div class="form-group" *ngIf="tipoActual === 'I' || tipoActual === 'E' || tipoActual === 'N'">
                  <label>Método de pago *</label>
                  <select formControlName="metodoPago" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let m of metodosPago" [value]="m.value">{{ m.label }}</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Moneda</label>
                  <select formControlName="moneda" class="form-control-mag">
                    <option value="MXN">MXN — Peso Mexicano</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Lugar de expedición (CP) *</label>
                  <input type="text" formControlName="lugarExpedicion" class="form-control-mag"
                         placeholder="06600" maxlength="5"
                         [readonly]="!!rfcSeleccionado"
                         [style.background]="rfcSeleccionado ? 'var(--bg-card2)' : ''"
                         [style.color]="rfcSeleccionado ? 'var(--text-muted)' : ''">
                </div>

              </div>
            </div>
          </div>

          <!-- ══ 2: Receptor ══ -->
          <div class="card-mag animate-in delay-2">
            <div class="card-header-mag">
              <div>
                <div class="card-title">2. Receptor</div>
                <div class="card-subtitle">Datos del cliente / trabajador</div>
              </div>
            </div>
            <div class="card-body-mag">
              <div style="margin-bottom:16px">
                <div style="display:flex;gap:10px;align-items:flex-end">
                  <div style="flex:1">
                    <label>Seleccionar cliente</label>
                    <select class="form-control-mag" (change)="onClienteSelect($event)">
                      <option value="">— Buscar en mis clientes —</option>
                      <option *ngFor="let c of clientes" [value]="c.id">{{ c.rfc }} — {{ c.nombre }}</option>
                    </select>
                  </div>
                  <button type="button" class="btn-mag btn-outline btn-sm"
                          (click)="mostrarAgregarCliente = !mostrarAgregarCliente" style="white-space:nowrap">
                    <span class="material-icons-round" style="font-size:15px">person_add</span> Nuevo
                  </button>
                </div>

                <div *ngIf="mostrarAgregarCliente"
                     style="margin-top:12px;padding:14px;background:var(--bg-card2);border-radius:8px;border:1px solid var(--border-light)">
                  <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px">Nuevo cliente</div>
                  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 16px" class="form-mag">
                    <div class="form-group">
                      <label>RFC *</label>
                      <input [(ngModel)]="nuevoCliente.rfc" [ngModelOptions]="{standalone:true}"
                             class="form-control-mag" placeholder="XAXX010101000" maxlength="13"
                             style="font-family:monospace;font-weight:700">
                    </div>
                    <div class="form-group" style="grid-column:span 2">
                      <label>Nombre / Razón Social *</label>
                      <input [(ngModel)]="nuevoCliente.nombre" [ngModelOptions]="{standalone:true}"
                             class="form-control-mag" placeholder="NOMBRE DEL CLIENTE">
                    </div>
                    <div class="form-group">
                      <label>Uso CFDI</label>
                      <select [(ngModel)]="nuevoCliente.usoCfdi" [ngModelOptions]="{standalone:true}" class="form-control-mag">
                        <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>Régimen Fiscal</label>
                      <select [(ngModel)]="nuevoCliente.regimenFiscal" [ngModelOptions]="{standalone:true}" class="form-control-mag">
                        <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label>CP</label>
                      <input [(ngModel)]="nuevoCliente.codigoPostal" [ngModelOptions]="{standalone:true}"
                             class="form-control-mag" placeholder="06600" maxlength="5">
                    </div>
                  </div>
                  <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
                    <button type="button" class="btn-mag btn-ghost btn-sm" (click)="mostrarAgregarCliente=false">Cancelar</button>
                    <button type="button" class="btn-mag btn-primary btn-sm" (click)="guardarCliente()">
                      <span class="material-icons-round" style="font-size:15px">save</span> Guardar
                    </button>
                  </div>
                </div>

                <div *ngIf="clienteSeleccionado"
                     style="margin-top:10px;padding:10px 14px;background:rgba(20,184,166,0.06);border:1px solid rgba(20,184,166,0.2);border-radius:6px;display:flex;align-items:center;gap:10px">
                  <span class="material-icons-round" style="font-size:18px;color:var(--accent)">check_circle</span>
                  <div style="flex:1">
                    <div style="font-weight:700;font-size:13px">{{ clienteSeleccionado.nombre }}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ clienteSeleccionado.rfc }}</div>
                  </div>
                  <button type="button" class="btn-mag btn-ghost btn-sm" (click)="limpiarReceptor()" style="padding:4px 8px">
                    <span class="material-icons-round" style="font-size:14px">close</span>
                  </button>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px" class="form-mag">
                <div class="form-group">
                  <label>RFC Receptor *</label>
                  <input type="text" formControlName="receptorRfc" class="form-control-mag"
                         [class.error-field]="hasError('receptorRfc')"
                         placeholder="XAXX010101000" maxlength="13"
                         style="font-family:monospace;font-weight:700;letter-spacing:1px">
                  <div class="field-error" *ngIf="hasError('receptorRfc')">Campo requerido</div>
                </div>
                <div class="form-group" style="grid-column:span 2">
                  <label>Nombre / Razón Social *</label>
                  <input type="text" formControlName="receptorNombre" class="form-control-mag"
                         [class.error-field]="hasError('receptorNombre')" placeholder="PUBLICO EN GENERAL">
                </div>
                <div class="form-group">
                  <label>Uso CFDI *</label>
                  <select formControlName="usoCfdi" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
                  </select>
                  <div *ngIf="tipoActual === 'T' || tipoActual === 'P' || tipoActual === 'N'"
                       style="font-size:11px;color:#2563eb;margin-top:3px;display:flex;gap:4px;align-items:center">
                    <span class="material-icons-round" style="font-size:12px">lock</span>
                    Fijado por tipo de comprobante
                  </div>
                </div>
                <div class="form-group">
                  <label>Uso CFDI Receptor</label>
                  <select formControlName="receptorUsoCfdi" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let u of usosCfdi" [value]="u.value">{{ u.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>Régimen Fiscal Receptor *</label>
                  <select formControlName="receptorRegimen" class="form-control-mag">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
                  </select>
                </div>
                <div class="form-group">
                  <label>CP Receptor *</label>
                  <input type="text" formControlName="receptorCp" class="form-control-mag" placeholder="06600" maxlength="5">
                </div>
              </div>
            </div>
          </div>

          <!-- ══ 3: Conceptos — solo I/E/T ══ -->
          <div class="card-mag animate-in delay-3" *ngIf="tipoActual !== 'N' && tipoActual !== 'P'">
            <div class="card-header-mag">
              <div>
                <div class="card-title">3. Conceptos</div>
                <div class="card-subtitle">Productos o servicios a facturar</div>
              </div>
              <div style="display:flex;align-items:center;gap:10px">
                <div style="text-align:right">
                  <div style="font-size:11px;color:var(--text-muted)">Total</div>
                  <div style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--text-primary)">
                    {{ total | currency:'MXN':'symbol-narrow':'1.2-2' }}
                  </div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm"
                        (click)="mostrarCatalogoConceptos = !mostrarCatalogoConceptos">
                  <span class="material-icons-round" style="font-size:16px">inventory_2</span> Catálogo
                </button>
                <button type="button" class="btn-mag btn-outline btn-sm" (click)="addConcepto()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
            </div>

            <div *ngIf="mostrarCatalogoConceptos"
                 style="padding:12px 20px;background:var(--bg-card2);border-bottom:1px solid var(--border-light)">
              <div style="display:flex;flex-wrap:wrap;gap:8px" *ngIf="conceptosCatalogo.length > 0">
                <button *ngFor="let cc of conceptosCatalogo" type="button"
                        class="btn-mag btn-ghost btn-sm" style="font-size:12px"
                        (click)="addConceptoDesde(cc)">
                  <span class="material-icons-round" style="font-size:13px">add_circle</span>
                  {{ cc.descripcion }}
                  <span style="color:var(--text-muted);margin-left:4px">{{ cc.precioUnitario | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
                </button>
              </div>
              <div *ngIf="conceptosCatalogo.length === 0" style="font-size:13px;color:var(--text-muted)">
                No tienes conceptos guardados.
              </div>
            </div>

            <div class="card-body-mag" style="padding:0" formArrayName="conceptos">
              <div *ngFor="let c of conceptos.controls; let i=index"
                   [formGroupName]="i"
                   style="padding:16px 20px;border-bottom:1px solid var(--border-light)">
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
                  <span style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase">Concepto {{ i+1 }}</span>
                  <div style="display:flex;gap:6px">
                    <button type="button" class="btn-mag btn-ghost btn-sm" (click)="guardarEnCatalogo(c)" style="padding:4px 8px">
                      <span class="material-icons-round" style="font-size:13px">bookmark_add</span>
                    </button>
                    <button type="button" class="btn-mag btn-danger btn-sm"
                            (click)="removeConcepto(i)" *ngIf="conceptos.length > 1">
                      <span class="material-icons-round" style="font-size:14px">delete</span>
                    </button>
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0 16px" class="form-mag">
                  <div class="form-group" style="grid-column:1/-1">
                    <label>Descripción *</label>
                    <input type="text" formControlName="descripcion" class="form-control-mag"
                           placeholder="Descripción del producto/servicio"
                           [attr.list]="'conceptos-list-' + i"
                           (change)="onDescripcionSelect(c, $event)">
                    <datalist [id]="'conceptos-list-' + i">
                      <option *ngFor="let cc of conceptosCatalogo" [value]="cc.descripcion"></option>
                    </datalist>
                  </div>
                  <div class="form-group">
                    <label>Clave Prod/Serv *</label>
                    <input type="text" formControlName="claveProdServ" class="form-control-mag"
                           placeholder="Clave SAT" [attr.list]="'claves-list-' + i">
                    <datalist [id]="'claves-list-' + i">
                      <option *ngFor="let cc of conceptosCatalogo" [value]="cc.claveProdServ">{{ cc.descripcion }}</option>
                    </datalist>
                  </div>
                  <div class="form-group">
                    <label>Unidad *</label>
                    <select formControlName="claveUnidad" class="form-control-mag" (change)="onUnidadChange(c, $event)">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let u of unidades" [value]="u.value">{{ u.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>IVA %</label>
                    <select formControlName="tasaIva" class="form-control-mag" (change)="calcTotal()">
                      <option [value]="0.16">16%</option>
                      <option [value]="0.08">8%</option>
                      <option [value]="0">0%</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Cantidad *</label>
                    <input type="number" formControlName="cantidad" class="form-control-mag" min="0.001" step="0.001" (input)="calcTotal()">
                  </div>
                  <div class="form-group">
                    <label>Precio unitario *</label>
                    <input type="number" formControlName="precioUnitario" class="form-control-mag" min="0.01" step="0.01" (input)="calcTotal()">
                  </div>
                  <div class="form-group">
                    <label>Descuento</label>
                    <input type="number" formControlName="descuento" class="form-control-mag" min="0" step="0.01" (input)="calcTotal()">
                  </div>
                  <div class="form-group">
                    <label>Importe</label>
                    <div style="padding:11px 14px;background:var(--bg-card2);border:1.5px solid var(--border-light);border-radius:var(--radius-sm);font-family:var(--font-display);font-weight:700;font-size:14px">
                      {{ importeConcepto(c) | currency:'MXN':'symbol-narrow':'1.2-2' }}
                    </div>
                  </div>
                </div>
              </div>
              <div style="padding:16px 20px;background:var(--bg-card2);border-top:2px solid var(--border-light)">
                <div style="display:flex;justify-content:flex-end">
                  <div style="width:280px">
                    <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:var(--text-secondary)">
                      <span>Subtotal</span><span>{{ subtotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:var(--text-secondary)">
                      <span>IVA</span><span>{{ iva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:8px 0;font-family:var(--font-display);font-size:18px;font-weight:800;border-top:1px solid var(--border);margin-top:4px">
                      <span>Total</span>
                      <span style="color:var(--accent)">{{ total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ══ 3P: Complemento de Pago — solo tipo P ══ -->
          <ng-container *ngIf="tipoActual === 'P'" [formGroup]="pago">
            <div class="card-mag animate-in delay-3">
              <div class="card-header-mag">
                <div>
                  <div class="card-title">3. Complemento de Pago</div>
                  <div class="card-subtitle">Datos del pago recibido y CFDIs que se están liquidando</div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm"
                        (click)="docsPago.push(newDocumentoRelacionado())">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar documento
                </button>
              </div>
              <div class="card-body-mag">

                <!-- Datos del pago -->
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0 20px" class="form-mag">
                  <div class="form-group">
                    <label>Fecha de pago *</label>
                    <input type="date" formControlName="fechaPago" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Monto pagado *</label>
                    <input type="number" formControlName="monto" class="form-control-mag" min="0.01" step="0.01">
                  </div>
                  <div class="form-group">
                    <label>Moneda del pago</label>
                    <select formControlName="moneda" class="form-control-mag">
                      <option value="MXN">MXN — Peso Mexicano</option>
                      <option value="USD">USD — Dólar</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>No. Operación</label>
                    <input type="text" formControlName="numOperacion" class="form-control-mag"
                           placeholder="Referencia bancaria / transferencia">
                  </div>
                </div>

                <!-- Documentos relacionados -->
                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:20px 0 12px;text-transform:uppercase;letter-spacing:0.5px;display:flex;align-items:center;gap:8px">
                  <span class="material-icons-round" style="font-size:16px">receipt_long</span>
                  CFDIs que se están pagando
                </div>

                <div formArrayName="documentosRelacionados">
                  <div *ngFor="let d of docsPago.controls; let i=index"
                       [formGroupName]="i"
                       style="padding:16px;margin-bottom:12px;background:var(--bg-card2);border-radius:8px;border:1px solid var(--border-light)">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                      <span style="font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase">
                        Documento {{ i+1 }}
                      </span>
                      <button type="button" class="btn-mag btn-danger btn-sm"
                              (click)="docsPago.removeAt(i)" *ngIf="docsPago.length > 1">
                        <span class="material-icons-round" style="font-size:14px">delete</span>
                      </button>
                    </div>
                    <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:0 16px" class="form-mag">
                      <div class="form-group" style="grid-column:1/-1">
                        <label>UUID del CFDI original *</label>
                        <input type="text" formControlName="idDocumento" class="form-control-mag"
                               placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                               style="font-family:monospace;font-size:12px;letter-spacing:0.5px">
                      </div>
                      <div class="form-group">
                        <label>Serie del CFDI</label>
                        <input type="text" formControlName="serie" class="form-control-mag" maxlength="10">
                      </div>
                      <div class="form-group">
                        <label>Folio del CFDI</label>
                        <input type="text" formControlName="folio" class="form-control-mag">
                      </div>
                      <div class="form-group">
                        <label>Moneda CFDI</label>
                        <select formControlName="moneda" class="form-control-mag">
                          <option value="MXN">MXN</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Método de pago orig.</label>
                        <select formControlName="metodoPago" class="form-control-mag">
                          <option value="PPD">PPD — Parcialidades</option>
                          <option value="PUE">PUE — Una exhibición</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>No. Parcialidad *</label>
                        <input type="number" formControlName="numeroParcialidad"
                               class="form-control-mag" min="1">
                      </div>
                      <div class="form-group">
                        <label>Saldo anterior *</label>
                        <input type="number" formControlName="saldoAnterior"
                               class="form-control-mag" min="0" step="0.01"
                               (input)="calcSaldoInsoluto(d)">
                      </div>
                      <div class="form-group">
                        <label>Importe pagado *</label>
                        <input type="number" formControlName="importePagado"
                               class="form-control-mag" min="0" step="0.01"
                               (input)="calcSaldoInsoluto(d)">
                      </div>
                      <div class="form-group">
                        <label>Saldo insoluto</label>
                        <div style="padding:11px 14px;background:var(--bg-card);border:1.5px solid var(--border-light);border-radius:var(--radius-sm);font-family:var(--font-display);font-weight:700;font-size:14px"
                             [style.color]="(d.get('saldoInsoluto')?.value || 0) > 0 ? 'var(--warning)' : 'var(--accent)'">
                          {{ (d.get('saldoInsoluto')?.value || 0) | currency:'MXN':'symbol-narrow':'1.2-2' }}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </ng-container>

          <!-- ══ 3N: Complemento de Nómina — solo tipo N ══ -->
          <ng-container *ngIf="tipoActual === 'N'" formGroupName="complementoNomina">

            <div class="card-mag animate-in delay-3">
              <div class="card-header-mag">
                <div>
                  <div class="card-title">3. Complemento de Nómina — Datos generales</div>
                  <div class="card-subtitle">Período y datos del empleador</div>
                </div>
              </div>
              <div class="card-body-mag">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px" class="form-mag">
                  <div class="form-group">
                    <label>Tipo de nómina *</label>
                    <select formControlName="tipoNomina" class="form-control-mag">
                      <option value="O">O — Ordinaria</option>
                      <option value="E">E — Extraordinaria</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Fecha de pago *</label>
                    <input type="date" formControlName="fechaPago" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Días pagados *</label>
                    <input type="number" formControlName="diasPagados" class="form-control-mag" min="0" step="0.001">
                  </div>
                  <div class="form-group">
                    <label>Fecha inicial período *</label>
                    <input type="date" formControlName="fechaInicialPago" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Fecha final período *</label>
                    <input type="date" formControlName="fechaFinalPago" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Periodicidad de pago *</label>
                    <select formControlName="periodicidadPago" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let p of periodicidades" [value]="p.value">{{ p.label }}</option>
                    </select>
                  </div>
                </div>

                <div style="font-size:12px;font-weight:700;color:var(--text-muted);margin:16px 0 8px;text-transform:uppercase;letter-spacing:0.5px">
                  Datos del empleador
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px" class="form-mag">
                  <div class="form-group">
                    <label>Registro patronal *</label>
                    <input type="text" formControlName="registroPatronal" class="form-control-mag" placeholder="A1234567891">
                  </div>
                  <div class="form-group">
                    <label>CURP patrón</label>
                    <input type="text" formControlName="curpPatron" class="form-control-mag" maxlength="18">
                  </div>
                  <div class="form-group">
                    <label>Entidad federativa empleador *</label>
                    <select formControlName="entidadFederativa" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let e of entidades" [value]="e.value">{{ e.label }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div class="card-mag">
              <div class="card-header-mag">
                <div>
                  <div class="card-title">Datos del trabajador</div>
                  <div class="card-subtitle">Información laboral del empleado</div>
                </div>
              </div>
              <div class="card-body-mag">
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px" class="form-mag">
                  <div class="form-group">
                    <label>CURP *</label>
                    <input type="text" formControlName="curpEmpleado" class="form-control-mag" maxlength="18" style="font-family:monospace">
                  </div>
                  <div class="form-group">
                    <label>NSS *</label>
                    <input type="text" formControlName="nss" class="form-control-mag" maxlength="11" style="font-family:monospace">
                  </div>
                  <div class="form-group">
                    <label>Fecha inicio relación laboral *</label>
                    <input type="date" formControlName="fechaInicioRelLaboral" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Tipo de contrato *</label>
                    <select formControlName="tipoContrato" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let t of tiposContrato" [value]="t.value">{{ t.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Tipo de régimen *</label>
                    <select formControlName="tipoRegimen" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let t of tiposRegimenLaboral" [value]="t.value">{{ t.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>No. empleado *</label>
                    <input type="text" formControlName="numEmpleado" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Departamento</label>
                    <input type="text" formControlName="departamento" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Puesto</label>
                    <input type="text" formControlName="puesto" class="form-control-mag">
                  </div>
                  <div class="form-group">
                    <label>Riesgo de trabajo *</label>
                    <select formControlName="riesgoTrabajo" class="form-control-mag">
                      <option value="1">1 — Clase I</option>
                      <option value="2">2 — Clase II</option>
                      <option value="3">3 — Clase III</option>
                      <option value="4">4 — Clase IV</option>
                      <option value="5">5 — Clase V</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Banco</label>
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
                  </div>
                  <div class="form-group">
                    <label>Cuenta bancaria (CLABE)</label>
                    <input type="text" formControlName="cuentaBancaria" class="form-control-mag" maxlength="18" style="font-family:monospace">
                  </div>
                  <div class="form-group">
                    <label>Clave entidad federativa *</label>
                    <select formControlName="claveEntFed" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let e of entidades" [value]="e.value">{{ e.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>Salario base cotización *</label>
                    <input type="number" formControlName="salarioBase" class="form-control-mag" min="0" step="0.01">
                  </div>
                  <div class="form-group">
                    <label>Salario diario integrado *</label>
                    <input type="number" formControlName="salarioDiarioIntegrado" class="form-control-mag" min="0" step="0.01">
                  </div>
                </div>
              </div>
            </div>

            <div class="card-mag">
              <div class="card-header-mag">
                <div>
                  <div class="card-title">Percepciones</div>
                  <div class="card-subtitle">Ingresos del trabajador en este período</div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm" (click)="addPercepcion()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
              <div class="card-body-mag" style="padding:0" formArrayName="percepciones">
                <div *ngFor="let p of percepciones.controls; let i=index"
                     [formGroupName]="i"
                     style="padding:14px 20px;border-bottom:1px solid var(--border-light)">
                  <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 1fr auto;gap:0 12px;align-items:end" class="form-mag">
                    <div class="form-group" style="margin-bottom:0">
                      <label>Tipo *</label>
                      <select formControlName="tipoPercepcion" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let t of tiposPercepcion" [value]="t.value">{{ t.label }}</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Clave *</label>
                      <input type="text" formControlName="clave" class="form-control-mag" placeholder="001">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Concepto *</label>
                      <input type="text" formControlName="concepto" class="form-control-mag" placeholder="Sueldo">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Imp. Gravado *</label>
                      <input type="number" formControlName="importeGravado" class="form-control-mag" min="0" step="0.01" (input)="calcTotalesNomina()">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Imp. Exento</label>
                      <input type="number" formControlName="importeExento" class="form-control-mag" min="0" step="0.01" (input)="calcTotalesNomina()">
                    </div>
                    <button type="button" class="btn-mag btn-danger btn-sm" (click)="removePercepcion(i)" style="margin-bottom:2px">
                      <span class="material-icons-round" style="font-size:14px">delete</span>
                    </button>
                  </div>
                </div>
                <div *ngIf="percepciones.length === 0"
                     style="padding:16px 20px;text-align:center;font-size:13px;color:var(--text-muted)">
                  Agrega al menos una percepción
                </div>
                <div style="padding:12px 20px;background:var(--bg-card2);border-top:1px solid var(--border-light);display:flex;gap:24px;justify-content:flex-end;font-size:13px">
                  <span>Total sueldos: <strong>{{ nomTotalSueldos | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                  <span>Gravado: <strong>{{ nomTotalGravado | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                  <span>Exento: <strong>{{ nomTotalExento | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                </div>
              </div>
            </div>

            <div class="card-mag">
              <div class="card-header-mag">
                <div>
                  <div class="card-title">Deducciones <span style="font-size:12px;font-weight:400;color:var(--text-muted)">opcional</span></div>
                  <div class="card-subtitle">Descuentos aplicados al trabajador</div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm" (click)="addDeduccion()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
              <div class="card-body-mag" style="padding:0" formArrayName="deducciones">
                <div *ngFor="let d of deducciones.controls; let i=index"
                     [formGroupName]="i"
                     style="padding:14px 20px;border-bottom:1px solid var(--border-light)">
                  <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:0 12px;align-items:end" class="form-mag">
                    <div class="form-group" style="margin-bottom:0">
                      <label>Tipo *</label>
                      <select formControlName="tipoDeduccion" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let t of tiposDeduccion" [value]="t.value">{{ t.label }}</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Clave *</label>
                      <input type="text" formControlName="clave" class="form-control-mag" placeholder="001">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Concepto *</label>
                      <input type="text" formControlName="concepto" class="form-control-mag">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Importe *</label>
                      <input type="number" formControlName="importe" class="form-control-mag" min="0" step="0.01" (input)="calcTotalesNomina()">
                    </div>
                    <button type="button" class="btn-mag btn-danger btn-sm" (click)="removeDeduccion(i)" style="margin-bottom:2px">
                      <span class="material-icons-round" style="font-size:14px">delete</span>
                    </button>
                  </div>
                </div>
                <div *ngIf="deducciones.length === 0"
                     style="padding:16px 20px;text-align:center;font-size:13px;color:var(--text-muted)">
                  Sin deducciones
                </div>
                <div *ngIf="deducciones.length > 0"
                     style="padding:12px 20px;background:var(--bg-card2);border-top:1px solid var(--border-light);display:flex;gap:24px;justify-content:flex-end;font-size:13px">
                  <span>Total otras ded.: <strong>{{ nomTotalOtrasDed | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                  <span>Total imp. ret.: <strong>{{ nomTotalImpRet | currency:'MXN':'symbol-narrow':'1.2-2' }}</strong></span>
                </div>
              </div>
            </div>

            <div class="card-mag">
              <div class="card-header-mag">
                <div>
                  <div class="card-title">Otros pagos <span style="font-size:12px;font-weight:400;color:var(--text-muted)">opcional</span></div>
                  <div class="card-subtitle">Subsidio al empleo u otros conceptos</div>
                </div>
                <button type="button" class="btn-mag btn-outline btn-sm" (click)="addOtroPago()">
                  <span class="material-icons-round" style="font-size:16px">add</span> Agregar
                </button>
              </div>
              <div class="card-body-mag" style="padding:0" formArrayName="otrosPagos">
                <div *ngFor="let o of otrosPagos.controls; let i=index"
                     [formGroupName]="i"
                     style="padding:14px 20px;border-bottom:1px solid var(--border-light)">
                  <div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr auto;gap:0 12px;align-items:end" class="form-mag">
                    <div class="form-group" style="margin-bottom:0">
                      <label>Tipo *</label>
                      <select formControlName="tipoPago" class="form-control-mag">
                        <option value="">Seleccionar...</option>
                        <option *ngFor="let t of tiposOtroPago" [value]="t.value">{{ t.label }}</option>
                      </select>
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Clave *</label>
                      <input type="text" formControlName="clave" class="form-control-mag">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Concepto *</label>
                      <input type="text" formControlName="concepto" class="form-control-mag">
                    </div>
                    <div class="form-group" style="margin-bottom:0">
                      <label>Importe *</label>
                      <input type="number" formControlName="importe" class="form-control-mag" min="0" step="0.01">
                    </div>
                    <button type="button" class="btn-mag btn-danger btn-sm" (click)="removeOtroPago(i)" style="margin-bottom:2px">
                      <span class="material-icons-round" style="font-size:14px">delete</span>
                    </button>
                  </div>
                </div>
                <div *ngIf="otrosPagos.length === 0"
                     style="padding:16px 20px;text-align:center;font-size:13px;color:var(--text-muted)">
                  Sin otros pagos
                </div>
              </div>
            </div>

          </ng-container>

          <!-- ══ 4: CFDI Relacionados ══ -->
          <div class="card-mag animate-in delay-4">
            <div class="card-header-mag">
              <div>
                <div class="card-title">
                  4. CFDI Relacionados
                  <span style="font-size:12px;font-weight:400;color:var(--text-muted);margin-left:8px">opcional</span>
                </div>
              </div>
              <button type="button" class="btn-mag btn-outline btn-sm" (click)="addRelacionado()">
                <span class="material-icons-round" style="font-size:16px">add</span> Agregar
              </button>
            </div>
            <div *ngIf="relacionados.length > 0" class="card-body-mag" style="padding:0" formArrayName="cfdiRelacionados">
              <div *ngFor="let r of relacionados.controls; let i=index"
                   [formGroupName]="i"
                   style="padding:14px 20px;border-bottom:1px solid var(--border-light)">
                <div style="display:grid;grid-template-columns:1fr 2fr auto;gap:0 16px;align-items:end" class="form-mag">
                  <div class="form-group" style="margin-bottom:0">
                    <label>Tipo de relación *</label>
                    <select formControlName="tipoRelacion" class="form-control-mag">
                      <option value="">Seleccionar...</option>
                      <option *ngFor="let t of tiposRelacion" [value]="t.value">{{ t.label }}</option>
                    </select>
                  </div>
                  <div class="form-group" style="margin-bottom:0">
                    <label>UUID *</label>
                    <input type="text" formControlName="uuid" class="form-control-mag"
                           placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                           style="font-family:monospace;font-size:12px">
                  </div>
                  <button type="button" class="btn-mag btn-danger btn-sm" (click)="removeRelacionado(i)" style="margin-bottom:2px">
                    <span class="material-icons-round" style="font-size:14px">delete</span>
                  </button>
                </div>
              </div>
            </div>
            <div *ngIf="relacionados.length === 0"
                 style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">
              Sin CFDIs relacionados.
            </div>
          </div>

          <!-- ══ Errores de validación ══ -->
          <div *ngIf="camposConError.length > 0"
               style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:14px 18px;font-size:13px;color:var(--danger)">
            <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px;font-weight:700;font-size:14px">
              <span class="material-icons-round" style="font-size:20px;flex-shrink:0">error_outline</span>
              Completa los siguientes campos obligatorios:
            </div>
            <ul style="margin:0 0 0 30px;padding:0;display:flex;flex-direction:column;gap:3px">
              <li *ngFor="let campo of camposConError">{{ campo }}</li>
            </ul>
          </div>

          <!-- ══ Error API ══ -->
          <div *ngIf="errorMsg"
               style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:14px 18px;font-size:13px;color:var(--danger);display:flex;gap:10px;align-items:center">
            <span class="material-icons-round" style="font-size:20px;flex-shrink:0">error_outline</span>
            {{ errorMsg }}
          </div>

          <!-- ══ Botones ══ -->
          <div style="display:flex;justify-content:flex-end;gap:10px;padding-bottom:32px">
            <a routerLink="/cfdis" class="btn-mag btn-ghost btn-lg">Cancelar</a>
            <button type="button" class="btn-mag btn-outline btn-lg"
                    (click)="verPreview()" [disabled]="loading || loadingPreview">
              <span *ngIf="loadingPreview" class="material-icons-round"
                    style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!loadingPreview" class="material-icons-round" style="font-size:20px">picture_as_pdf</span>
              {{ loadingPreview ? 'Generando...' : 'Vista previa' }}
            </button>
            <button type="submit" class="btn-mag btn-primary btn-lg" [disabled]="loading">
              <span *ngIf="loading" class="material-icons-round"
                    style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!loading" class="material-icons-round" style="font-size:20px">receipt</span>
              {{ loading ? 'Timbrando...' : 'Timbrar CFDI' }}
            </button>
          </div>

        </div>
      </form>
    </div>

    <!-- ══ Modal PDF Preview ══ -->
    <div *ngIf="mostrarPreview"
         style="position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;padding:20px"
         (click)="cerrarPreview()">
      <div style="background:var(--bg-card);border-radius:var(--radius-lg);width:100%;max-width:900px;height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 24px 64px rgba(0,0,0,0.4)"
           (click)="$event.stopPropagation()">
        <div style="padding:16px 20px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;flex-shrink:0">
          <div style="display:flex;align-items:center;gap:10px">
            <span class="material-icons-round" style="color:#ef4444;font-size:22px">picture_as_pdf</span>
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
        <div style="flex:1;overflow:hidden;background:#525659;display:flex;align-items:center;justify-content:center">
          <div *ngIf="loadingPreview" style="text-align:center;color:white">
            <span class="material-icons-round" style="font-size:56px;animation:spin 1s linear infinite;display:block">refresh</span>
            <div style="margin-top:16px;font-size:15px;font-weight:500">Generando vista previa...</div>
          </div>
          <iframe *ngIf="previewUrl && !loadingPreview"
                  [src]="previewSafeUrl!" style="width:100%;height:100%;border:none" type="application/pdf">
          </iframe>
        </div>
        <div style="padding:14px 20px;border-top:1px solid var(--border-light);display:flex;justify-content:space-between;align-items:center;flex-shrink:0">
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
      @keyframes spin { to { transform: rotate(360deg); } }
      .ng-invalid.ng-touched:not(form):not(ng-container):not(div) {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 2px rgba(239,68,68,0.12);
      }
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

  camposConError: string[] = [];

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

  mostrarAgregarCliente    = false;
  mostrarAgregarSerie      = false;
  mostrarCatalogoConceptos = false;

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
    private sanitizer:      DomSanitizer,
    private router:         Router
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
    this.rfcSvc.listar().subscribe(rs => this.rfcs = rs);
    this.clienteSvc.listar().subscribe(cs => this.clientes = cs);
    this.conceptoCatSvc.listar().subscribe(cc => this.conceptosCatalogo = cc);

    this.nomina.get('tipoRegimen')!.valueChanges.subscribe(val => {
      if (val !== '02') return;
      const yaExiste = this.otrosPagos.controls.some(c => c.get('tipoPago')?.value === '002');
      const tieneExcepcion = this.otrosPagos.controls.some(c => ['007', '008'].includes(c.get('tipoPago')?.value));
      if (!yaExiste && !tieneExcepcion) {
        this.otrosPagos.push(this.fb.group({
          tipoPago: ['002'], clave: ['002'],
          concepto: ['Subsidio para el empleo'], importe: [0]
        }));
      }
    });
  }

  // ── Getters ───────────────────────────────────────────────────
  get tipoActual(): string     { return this.form.get('tipoComprobante')?.value ?? 'I'; }
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
    this.conceptos.push(g);
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
  private buildPayload(): any {
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
    this.cfdiSvc.emitir(this.buildPayload()).subscribe({
      next:  () => this.router.navigate(['/cfdis']),
      error: (err: any) => {
        this.loading  = false;
        this.errorMsg = err.error?.error ?? 'Error al timbrar el CFDI.';
      }
    });
  }
}