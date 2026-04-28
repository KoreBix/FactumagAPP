import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NotaDefaultService } from '../../core/services/nota-default.service';
import { Cotizacion, CotizacionLineaForm, EstadoCotizacion } from '../../core/models/cotizacion/Cotizacion';
import { CotizacionService } from '../../core/services/cotizacion/CotizacionService';
import { RfcService } from '../../core/services/RFC/RfcService';
import { ClienteService } from '../../core/services/cliente/ClienteService';
import { ConceptoCatalogoService } from '../../core/services/conceptoc.atalogo/ConceptoCatalogoService';
import { RfcList } from '../../core/models/RFC/RfcList';
import { ClienteListDto } from '../../core/models/cliente/ClienteListDto';
import { ConceptoCatalogo } from '../../core/models/concepto/ConceptoCatalogo';

@Component({
  selector: 'app-cotizacion-form',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="emit-wrap animate-in">

      <!-- ── Page header ──────────────────────────────────────────── -->
      <div class="emit-ph">
        <div class="emit-ph-left">
          <a routerLink="/cotizaciones" class="btn-mag btn-ghost btn-sm">
            <span class="material-icons-round" style="font-size:16px">arrow_back</span>
            Cotizaciones
          </a>
          <div class="emit-ph-title">
            <h1>{{ modoDetalle ? cotizacion?.folio : (editandoId ? 'Editar cotización' : 'Nueva cotización') }}</h1>
            <p *ngIf="!modoDetalle">Propuesta comercial — Documento no fiscal</p>
            <p *ngIf="modoDetalle && cotizacion" style="display:flex;align-items:center;gap:8px">
              <span class="estado-badge" [attr.data-estado]="cotizacion.estado">{{ cotizacion.estado }}</span>
              <span style="opacity:.4">·</span>
              <span>{{ cotizacion.receptorNombre }}</span>
            </p>
          </div>
        </div>

        <!-- Acciones en modo detalle -->
        <div *ngIf="modoDetalle && cotizacion" class="emit-ph-actions">
          <button class="btn-mag btn-ghost btn-sm" (click)="descargarPdf()">
            <span class="material-icons-round" style="font-size:16px">picture_as_pdf</span>
            PDF
          </button>
          <button *ngIf="cotizacion.estado === 'Borrador'"
                  class="btn-mag btn-outline btn-sm"
                  (click)="cambiarEstado('enviar')" [disabled]="cambiandoEstado">
            <span class="material-icons-round" style="font-size:16px">send</span>
            Marcar enviada
          </button>
          <ng-container *ngIf="cotizacion.estado === 'Enviada'">
            <button class="btn-mag btn-primary btn-sm"
                    (click)="cambiarEstado('aceptar')" [disabled]="cambiandoEstado">
              <span class="material-icons-round" style="font-size:16px">check_circle</span>
              Aceptar
            </button>
            <button class="btn-mag btn-ghost btn-sm"
                    (click)="cambiarEstado('rechazar')" [disabled]="cambiandoEstado">
              <span class="material-icons-round" style="font-size:16px">cancel</span>
              Rechazar
            </button>
          </ng-container>
          <a *ngIf="cotizacion.estado === 'Convertida' && cotizacion.cfdiUuid"
             routerLink="/cfdis"
             class="btn-mag btn-ghost btn-sm"
             style="background:rgba(5,150,105,.1);border-color:rgba(5,150,105,.3);color:#059669;gap:6px">
            <span class="material-icons-round" style="font-size:15px">verified</span>
            Ver CFDI timbrado
          </a>
          <button *ngIf="cotizacion.estado === 'Aceptada'" class="btn-mag btn-primary btn-sm"
                  (click)="convertirAFactura()">
            <span class="material-icons-round" style="font-size:16px">receipt</span>
            Convertir a factura
          </button>
          <button *ngIf="cotizacion.estado !== 'Cancelada' && cotizacion.estado !== 'Aceptada'"
                  class="btn-mag btn-ghost btn-sm"
                  (click)="router.navigate(['/cotizaciones', cotizacion.id, 'editar'])">
            <span class="material-icons-round" style="font-size:16px">edit</span>
            Editar
          </button>
          <button *ngIf="cotizacion.estado !== 'Cancelada'" class="btn-mag btn-ghost btn-sm btn-danger-ghost"
                  (click)="cambiarEstado('cancelar')" [disabled]="cambiandoEstado">
            <span class="material-icons-round" style="font-size:16px">block</span>
            Cancelar
          </button>
        </div>
      </div>

      <!-- ── Loading ────────────────────────────────────────────── -->
      <div *ngIf="cargando" class="base-loading">
        <span class="material-icons-round spin-anim" style="font-size:20px">refresh</span>
        Cargando cotización...
      </div>

      <!-- ══════════════════════════════════════════════════════════
           MODO DETALLE (read-only)
           ══════════════════════════════════════════════════════════ -->
      <ng-container *ngIf="modoDetalle && cotizacion && !cargando">
        <div class="emit-sections">

          <!-- § 1 Información general -->
          <div class="emit-card animate-in delay-1">
            <div class="emit-card-hdr">
              <div class="emit-sec-num">1</div>
              <div>
                <div class="emit-sec-title">Información general</div>
                <div class="emit-sec-sub">RFC emisor, folio, fechas y condiciones</div>
              </div>
              <div class="emit-badge-estado" [attr.data-estado]="cotizacion.estado" style="margin-left:auto">
                {{ cotizacion.estado }}
              </div>
            </div>
            <div class="emit-card-body">
              <div *ngIf="cotizacion.cfdiUuid" class="cfdi-vinculado-banner">
                <span class="material-icons-round" style="font-size:20px;color:#059669">verified</span>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:13px;color:#059669">CFDI timbrado correctamente</div>
                  <div style="font-size:11px;font-family:monospace;color:var(--text-muted);margin-top:2px">{{ cotizacion.cfdiUuid }}</div>
                </div>
                <a routerLink="/cfdis" class="btn-mag btn-ghost btn-sm" style="color:#059669;border-color:rgba(5,150,105,.3)">
                  <span class="material-icons-round" style="font-size:15px">open_in_new</span>
                  Ver CFDI
                </a>
              </div>
              <div class="emit-grid-4">
                <div class="fg"><div class="fl">Folio</div><div class="fld-display fld-mono">{{ cotizacion.folio }}</div></div>
                <div class="fg"><div class="fl">Moneda</div><div class="fld-display">{{ cotizacion.moneda }}</div></div>
                <div class="fg"><div class="fl">Fecha</div><div class="fld-display">{{ cotizacion.fecha | date:'dd/MM/yyyy' }}</div></div>
                <div class="fg">
                  <div class="fl">Vigencia</div>
                  <div class="fld-display" [class.fld-display-warn]="cotizacion.fechaVigencia && estaVencida(cotizacion.fechaVigencia!)">
                    {{ cotizacion.fechaVigencia ? (cotizacion.fechaVigencia | date:'dd/MM/yyyy') : '—' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- § 2 Cliente -->
          <div class="emit-card animate-in delay-2">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-blue">2</div>
              <div><div class="emit-sec-title">Cliente</div><div class="emit-sec-sub">Datos del receptor de la cotización</div></div>
            </div>
            <div class="emit-card-body">
              <div class="cliente-chip" style="margin-bottom:20px">
                <div class="cliente-chip-avatar">{{ cotizacion.receptorNombre.charAt(0) }}</div>
                <div style="flex:1;min-width:0">
                  <div style="font-weight:700;font-size:14px">{{ cotizacion.receptorNombre }}</div>
                  <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ cotizacion.receptorRfc }}</div>
                </div>
                <span *ngIf="cotizacion.receptorEmail" style="font-size:12px;color:var(--text-muted)">{{ cotizacion.receptorEmail }}</span>
              </div>
              <div class="emit-grid-3">
                <div class="fg"><div class="fl">RFC</div><div class="fld-display fld-mono">{{ cotizacion.receptorRfc }}</div></div>
                <div class="fg" style="grid-column:span 2"><div class="fl">Nombre / Razón Social</div><div class="fld-display">{{ cotizacion.receptorNombre }}</div></div>
                <div class="fg" *ngIf="cotizacion.receptorEmail" style="grid-column:span 3"><div class="fl">Email</div><div class="fld-display">{{ cotizacion.receptorEmail }}</div></div>
              </div>
            </div>
          </div>

          <!-- § 3 Conceptos -->
          <div class="emit-card animate-in delay-3">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-purple">3</div>
              <div>
                <div class="emit-sec-title">Conceptos</div>
                <div class="emit-sec-sub">{{ cotizacion.lineas.length }} concepto{{ cotizacion.lineas.length !== 1 ? 's' : '' }}</div>
              </div>
            </div>
            <div *ngFor="let l of cotizacion.lineas" class="concepto-row">
              <div class="concepto-row-hdr">
                <div class="concepto-num"><span class="material-icons-round" style="font-size:14px">drag_indicator</span>Concepto {{ l.orden }}</div>
                <div class="concepto-importe-badge">{{ l.total | currency:'MXN':'symbol':'1.2-2' }}</div>
              </div>
              <div class="emit-grid-4" style="padding:0">
                <div class="fg" style="grid-column:span 2"><div class="fl">Descripción</div><div class="fld-display">{{ l.descripcion }}</div><div style="font-size:11px;color:var(--text-muted);margin-top:3px">{{ l.claveProdServ }} · {{ l.claveUnidad }} · {{ l.unidad }}</div></div>
                <div class="fg"><div class="fl">Cantidad</div><div class="fld-display">{{ l.cantidad | number:'1.2-2' }}</div></div>
                <div class="fg"><div class="fl">Precio unitario</div><div class="fld-display">{{ l.precioUnitario | currency:'MXN':'symbol':'1.2-2' }}</div></div>
                <div class="fg" *ngIf="l.descuento > 0"><div class="fl">Descuento</div><div class="fld-display">{{ l.descuento | currency:'MXN':'symbol':'1.2-2' }}</div></div>
                <div class="fg"><div class="fl">IVA</div><div class="fld-display">{{ l.tasaIva * 100 | number:'1.0-0' }}%</div></div>
              </div>
            </div>
            <div class="concepto-totals">
              <div class="concepto-totals-row"><span class="concepto-totals-lbl">Subtotal</span><span class="concepto-totals-val">{{ cotizacion.subTotal | currency:'MXN':'symbol':'1.2-2' }}</span></div>
              <div *ngIf="cotizacion.descuento > 0" class="concepto-totals-row"><span class="concepto-totals-lbl">Descuento</span><span class="concepto-totals-val" style="color:#f87171">- {{ cotizacion.descuento | currency:'MXN':'symbol':'1.2-2' }}</span></div>
              <div class="concepto-totals-row"><span class="concepto-totals-lbl">IVA</span><span class="concepto-totals-val">{{ cotizacion.iva | currency:'MXN':'symbol':'1.2-2' }}</span></div>
              <div class="concepto-totals-row concepto-totals-grand"><span>TOTAL</span><span>{{ cotizacion.total | currency:'MXN':'symbol':'1.2-2' }} <span style="font-size:13px;opacity:.6">{{ cotizacion.moneda }}</span></span></div>
            </div>
          </div>

          <!-- § 4 Notas -->
          <div *ngIf="cotizacion.notas" class="emit-card animate-in delay-4">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-muted">4</div>
              <div><div class="emit-sec-title">Notas y condiciones</div><div class="emit-sec-sub">Observaciones para el cliente</div></div>
            </div>
            <div class="emit-card-body">
              <p style="font-size:14px;white-space:pre-line;color:var(--text-secondary);margin:0;line-height:1.7">{{ cotizacion.notas }}</p>
            </div>
          </div>

        </div>
      </ng-container>

      <!-- ══════════════════════════════════════════════════════════
           MODO FORMULARIO (crear / editar)
           ══════════════════════════════════════════════════════════ -->
      <ng-container *ngIf="!modoDetalle && !cargando">

        <div class="emit-layout">
        <div class="emit-main">
        <div class="emit-sections">

          <!-- § 1 Datos generales -->
          <div class="emit-card animate-in delay-1">
            <div class="emit-card-hdr">
              <div class="emit-sec-num">1</div>
              <div><div class="emit-sec-title">Datos generales</div><div class="emit-sec-sub">RFC emisor, moneda y vigencia</div></div>
            </div>
            <div class="emit-card-body">
              <div style="margin-bottom:20px">
                <label class="fl fl-req" style="display:block;margin-bottom:6px">RFC Emisor</label>

                <!-- RFC seleccionado → chip -->
                <div *ngIf="rfcSeleccionado && !buscandoRfc" class="cliente-chip"
                     style="border-color:rgba(124,58,237,.2);background:rgba(124,58,237,.05)">
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
                         placeholder="Escribe nombre o RFC para buscar..."
                         autocomplete="off"
                         (focus)="onRfcFocus()"
                         (blur)="onRfcBlur()"
                         (ngModelChange)="filtrarRfcs()">
                  <span class="material-icons-round cot-combo-arrow">expand_more</span>
                  <div *ngIf="rfcsFiltrados.length > 0" class="clientes-dropdown">
                    <div *ngFor="let r of rfcsFiltrados" class="clientes-dropdown-item"
                         (mousedown)="seleccionarRfc(r)">
                      <span class="fld-mono" style="font-weight:700;font-size:12px;flex-shrink:0">{{ r.rfc }}</span>
                      <span style="margin-left:8px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ r.razonSocial }}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="emit-grid-3">
                <div class="fg">
                  <label class="fl fl-req">Fecha</label>
                  <input type="date" class="form-control-mag" [(ngModel)]="form.fecha">
                </div>
                <div class="fg">
                  <label class="fl">Vigencia hasta</label>
                  <input type="date" class="form-control-mag" [(ngModel)]="form.fechaVigencia">
                </div>
                <div class="fg">
                  <label class="fl fl-req">Moneda</label>
                  <div class="sel-wrap">
                    <select class="form-control-mag" [(ngModel)]="form.moneda">
                      <option value="MXN">MXN — Peso mexicano</option>
                      <option value="USD">USD — Dólar</option>
                      <option value="EUR">EUR — Euro</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- § 2 Cliente / Receptor -->
          <div class="emit-card animate-in delay-2">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-blue">2</div>
              <div><div class="emit-sec-title">Cliente</div><div class="emit-sec-sub">Datos del receptor de la cotización</div></div>
            </div>
            <div class="emit-card-body">

              <!-- Combobox: chip cuando hay cliente, buscador cuando no o al cambiar -->
              <div style="margin-bottom:16px">
                <label class="fl" style="display:block;margin-bottom:6px">Buscar en mis clientes</label>

                <!-- Cliente seleccionado → chip con botón cambiar -->
                <div *ngIf="form.receptorNombre && !buscandoCliente" class="cliente-chip">
                  <div class="cliente-chip-avatar">{{ form.receptorNombre.charAt(0) }}</div>
                  <div style="flex:1;min-width:0">
                    <div style="font-weight:700;font-size:14px">{{ form.receptorNombre }}</div>
                    <div style="font-size:11px;color:var(--text-muted);font-family:monospace">{{ form.receptorRfc }}</div>
                  </div>
                  <button type="button" class="btn-mag btn-ghost btn-sm" (click)="abrirBusqueda()"
                          style="flex-shrink:0;gap:4px">
                    <span class="material-icons-round" style="font-size:15px">edit</span>
                    Cambiar
                  </button>
                </div>

                <!-- Sin cliente o buscando → combobox -->
                <div *ngIf="!form.receptorNombre || buscandoCliente" class="cot-combo-wrap">
                  <span class="material-icons-round cot-combo-icon">search</span>
                  <input #comboInput
                         class="form-control-mag cot-combo-input"
                         [(ngModel)]="busquedaCliente"
                         placeholder="Escribe nombre o RFC para buscar..."
                         autocomplete="off"
                         (focus)="onClienteFocus()"
                         (blur)="onClienteBlur()"
                         (ngModelChange)="filtrarClientes()">
                  <span class="material-icons-round cot-combo-arrow">expand_more</span>
                  <div *ngIf="clientesFiltrados.length > 0" class="clientes-dropdown">
                    <div *ngFor="let c of clientesFiltrados" class="clientes-dropdown-item"
                         (mousedown)="seleccionarCliente(c)">
                      <span class="fld-mono" style="font-weight:700;font-size:12px;flex-shrink:0">{{ c.rfc }}</span>
                      <span style="margin-left:8px;font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ c.nombre }}</span>
                    </div>
                    <div *ngIf="clientesFiltrados.length === 0 && busquedaCliente.length > 1"
                         class="clientes-dropdown-item" style="color:var(--text-muted);cursor:default">
                      Sin resultados para "{{ busquedaCliente }}"
                    </div>
                  </div>
                </div>
              </div>

              <div class="receptor-divider"><span>Datos del receptor</span></div>

              <div class="emit-grid-3">
                <div class="fg">
                  <label class="fl fl-req">RFC</label>
                  <input class="form-control-mag fld-mono" [(ngModel)]="form.receptorRfc"
                         maxlength="13" placeholder="XAXX010101000" style="text-transform:uppercase">
                </div>
                <div class="fg" style="grid-column:span 2">
                  <label class="fl fl-req">Nombre / Razón Social</label>
                  <input class="form-control-mag" [(ngModel)]="form.receptorNombre"
                         maxlength="300" placeholder="NOMBRE O RAZÓN SOCIAL">
                </div>
                <div class="fg" style="grid-column:span 3">
                  <label class="fl">Email <span class="optional-badge">opcional</span></label>
                  <input type="email" class="form-control-mag" [(ngModel)]="form.receptorEmail"
                         maxlength="200" placeholder="contacto@empresa.com">
                </div>
              </div>
            </div>
          </div>

          <!-- § 3 Conceptos -->
          <div class="emit-card animate-in delay-3">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-purple">3</div>
              <div><div class="emit-sec-title">Conceptos</div><div class="emit-sec-sub">Productos o servicios de la propuesta</div></div>
              <div class="emit-card-hdr-actions">
                <button type="button" class="btn-mag btn-ghost btn-sm"
                        (click)="mostrarCatalogo = !mostrarCatalogo">
                  <span class="material-icons-round" style="font-size:16px">inventory_2</span>
                  Catálogo
                </button>
                <button type="button" class="btn-mag btn-primary btn-sm" (click)="agregarLinea()">
                  <span class="material-icons-round" style="font-size:16px">add</span>
                  Agregar
                </button>
              </div>
            </div>

            <!-- Catálogo -->
            <div *ngIf="mostrarCatalogo && conceptosCatalogo.length > 0" class="catalogo-conceptos">
              <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:8px">
                Selecciona un concepto de tu catálogo
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                <button *ngFor="let cc of conceptosCatalogo" type="button"
                        class="btn-mag btn-ghost btn-sm catalogo-chip"
                        (click)="agregarDesde(cc)">
                  {{ cc.descripcion }}
                  <span class="catalogo-chip-price">{{ cc.precioUnitario | currency:'MXN':'symbol':'1.2-2' }}</span>
                </button>
              </div>
            </div>
            <div *ngIf="mostrarCatalogo && conceptosCatalogo.length === 0" class="catalogo-conceptos">
              <span style="font-size:13px;color:var(--text-muted)">No tienes conceptos en tu catálogo.</span>
            </div>

            <!-- Sin conceptos -->
            <div *ngIf="lineas.length === 0" class="empty-state-sm">
              <span class="material-icons-round" style="font-size:36px;display:block;margin-bottom:8px;opacity:.3">receipt_long</span>
              Agrega al menos un concepto para continuar
            </div>

            <!-- Filas de conceptos -->
            <div *ngFor="let l of lineas; let i = index" class="concepto-row">
              <div class="concepto-row-hdr">
                <div class="concepto-num">
                  <span class="material-icons-round" style="font-size:14px">drag_indicator</span>
                  Concepto {{ i + 1 }}
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                  <div class="concepto-importe-badge">{{ importeLinea(l) | currency:'MXN':'symbol':'1.2-2' }}</div>
                  <button type="button" class="btn-mag btn-ghost btn-sm"
                          style="padding:4px 8px;color:#f87171" (click)="eliminarLinea(i)">
                    <span class="material-icons-round" style="font-size:16px">delete</span>
                  </button>
                </div>
              </div>
              <div class="concepto-fields">
                <div class="fg" style="grid-column:1/-1">
                  <label class="fl fl-req">Descripción</label>
                  <input class="form-control-mag" [(ngModel)]="l.descripcion"
                         placeholder="Descripción del producto o servicio">
                </div>
                <div class="fg">
                  <label class="fl">Clave Prod/Serv</label>
                  <input class="form-control-mag fld-mono" [(ngModel)]="l.claveProdServ" maxlength="10" placeholder="01010101">
                </div>
                <div class="fg">
                  <label class="fl">Clave Unidad</label>
                  <input class="form-control-mag fld-mono" [(ngModel)]="l.claveUnidad" maxlength="10" placeholder="ACT">
                </div>
                <div class="fg">
                  <label class="fl">Unidad</label>
                  <input class="form-control-mag" [(ngModel)]="l.unidad" placeholder="Servicio">
                </div>
                <div class="fg">
                  <label class="fl fl-req">Cantidad</label>
                  <input type="number" class="form-control-mag" [(ngModel)]="l.cantidad"
                         min="0.001" step="1" (ngModelChange)="calcTotal()">
                </div>
                <div class="fg">
                  <label class="fl fl-req">Precio unitario</label>
                  <div class="input-wrap">
                    <span class="input-prefix">$</span>
                    <input type="number" class="form-control-mag fld-prefix" [(ngModel)]="l.precioUnitario"
                           min="0" step="0.01" (ngModelChange)="calcTotal()">
                  </div>
                </div>
                <div class="fg">
                  <label class="fl">Descuento $</label>
                  <div class="input-wrap">
                    <span class="input-prefix">$</span>
                    <input type="number" class="form-control-mag fld-prefix" [(ngModel)]="l.descuento"
                           min="0" step="0.01" (ngModelChange)="calcTotal()">
                  </div>
                </div>
                <div class="fg">
                  <label class="fl fl-req">IVA</label>
                  <div class="sel-wrap">
                    <select class="form-control-mag" [(ngModel)]="l.tasaIva" (ngModelChange)="calcTotal()">
                      <option [ngValue]="0.16">16%</option>
                      <option [ngValue]="0.08">8%</option>
                      <option [ngValue]="0">Exento 0%</option>
                    </select>
                    <span class="material-icons-round sel-ico">expand_more</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Totales -->
            <div *ngIf="lineas.length > 0" class="concepto-totals">
              <div class="concepto-totals-row"><span class="concepto-totals-lbl">Subtotal</span><span class="concepto-totals-val">{{ subTotal | currency:'MXN':'symbol':'1.2-2' }}</span></div>
              <div class="concepto-totals-row"><span class="concepto-totals-lbl">IVA</span><span class="concepto-totals-val">{{ iva | currency:'MXN':'symbol':'1.2-2' }}</span></div>
              <div class="concepto-totals-row concepto-totals-grand"><span>TOTAL</span><span>{{ total | currency:'MXN':'symbol':'1.2-2' }} <span style="font-size:13px;opacity:.6">{{ form.moneda }}</span></span></div>
            </div>
          </div>

          <!-- § 4 Notas y condiciones -->
          <div class="emit-card animate-in delay-4">
            <div class="emit-card-hdr">
              <div class="emit-sec-num emit-sec-num-muted">4</div>
              <div>
                <div class="emit-sec-title">Notas y condiciones</div>
                <div class="emit-sec-sub">Observaciones, vigencia, condiciones de pago <span class="optional-badge" style="margin-left:4px">opcional</span></div>
              </div>
              <button type="button" class="btn-mag btn-ghost btn-sm" style="margin-left:auto;gap:5px"
                      (click)="editandoDefault = !editandoDefault"
                      [title]="editandoDefault ? 'Cerrar configuración' : 'Configurar texto predeterminado'">
                <span class="material-icons-round" style="font-size:16px">{{ editandoDefault ? 'close' : 'settings' }}</span>
                <span style="font-size:12px">{{ editandoDefault ? 'Cerrar' : 'Predeterminado' }}</span>
              </button>
            </div>

            <!-- Panel editar default -->
            <div *ngIf="editandoDefault" class="nota-default-panel">
              <div class="nota-default-label">
                <span class="material-icons-round" style="font-size:15px;color:var(--accent)">auto_awesome</span>
                Texto predeterminado — se pre-llenará en todas las cotizaciones nuevas
              </div>
              <textarea class="form-control-mag nota-default-textarea"
                        [(ngModel)]="textoDefault" rows="3"
                        placeholder="Ej: Precios + IVA. Vigencia 15 días. Pago a 30 días neto..."></textarea>
              <div style="display:flex;gap:8px;margin-top:8px">
                <button type="button" class="btn-mag btn-primary btn-sm" (click)="guardarDefault()">
                  <span class="material-icons-round" style="font-size:15px">save</span>
                  Guardar como predeterminado
                </button>
                <button type="button" class="btn-mag btn-ghost btn-sm" (click)="aplicarDefault()"
                        *ngIf="textoDefault">
                  <span class="material-icons-round" style="font-size:15px">content_paste</span>
                  Aplicar a este documento
                </button>
              </div>
            </div>

            <div class="emit-card-body">
              <textarea class="form-control-mag" [(ngModel)]="form.notas" rows="4"
                        placeholder="Ej: Precio válido por 15 días. El pago debe realizarse en un plazo de 30 días..."></textarea>
            </div>
          </div>

        </div><!-- /emit-sections -->
        </div><!-- /emit-main -->

        <!-- ── Aside sticky: resumen + acciones ── -->
        <aside class="emit-aside">

          <!-- Resumen RFC + cliente + total -->
          <div class="emit-aside-card">

            <!-- RFC Emisor -->
            <div class="aside-section">
              <div class="aside-section-label">
                <span class="material-icons-round" style="font-size:14px">business</span>
                RFC Emisor
              </div>
              <ng-container *ngIf="rfcSeleccionado; else sinRfc">
                <div class="aside-rfc-nombre">{{ rfcSeleccionado.razonSocial }}</div>
                <div class="aside-rfc-clave">{{ rfcSeleccionado.rfc }}</div>
              </ng-container>
              <ng-template #sinRfc>
                <div class="aside-empty-hint">Selecciona un RFC emisor</div>
              </ng-template>
            </div>

            <div class="aside-divider"></div>

            <!-- Cliente -->
            <div class="aside-section">
              <div class="aside-section-label">
                <span class="material-icons-round" style="font-size:14px">person</span>
                Cliente
              </div>
              <ng-container *ngIf="form.receptorNombre; else sinCliente">
                <div class="aside-rfc-nombre">{{ form.receptorNombre }}</div>
                <div class="aside-rfc-clave">{{ form.receptorRfc }}</div>
              </ng-container>
              <ng-template #sinCliente>
                <div class="aside-empty-hint">Sin cliente seleccionado</div>
              </ng-template>
            </div>

            <!-- Total (cuando hay conceptos) -->
            <ng-container *ngIf="total > 0">
              <div class="aside-divider"></div>
              <div class="aside-section aside-total-block">
                <div class="aside-total-row"><span>Subtotal</span><span>{{ subTotal | currency:'MXN':'symbol-narrow':'1.2-2' }}</span></div>
                <div class="aside-total-row" *ngIf="iva > 0"><span>IVA</span><span>{{ iva | currency:'MXN':'symbol-narrow':'1.2-2' }}</span></div>
                <div class="aside-total-grand">
                  <span>Total</span>
                  <span style="color:var(--accent)">{{ total | currency:'MXN':'symbol-narrow':'1.2-2' }}</span>
                </div>
              </div>
            </ng-container>
          </div>

          <!-- Error -->
          <div *ngIf="errorMsg" class="error-panel">
            <div class="error-panel-hdr">
              <span class="material-icons-round" style="font-size:18px">error_outline</span>
              {{ errorMsg }}
            </div>
          </div>

          <!-- Acciones -->
          <div class="emit-aside-actions">
            <button class="btn-mag btn-primary btn-lg" style="width:100%;justify-content:center"
                    (click)="guardar()" [disabled]="guardando">
              <span *ngIf="guardando" class="material-icons-round spin-anim" style="font-size:20px">refresh</span>
              <span *ngIf="!guardando" class="material-icons-round" style="font-size:20px">request_quote</span>
              {{ guardando ? 'Guardando...' : (editandoId ? 'Actualizar cotización' : 'Crear cotización') }}
            </button>
            <a routerLink="/cotizaciones" class="btn-mag btn-ghost btn-lg" style="width:100%;justify-content:center">
              <span class="material-icons-round" style="font-size:18px">arrow_back</span>
              Cancelar
            </a>
          </div>

        </aside>
        </div><!-- /emit-layout -->

      </ng-container>

    </div>

    <style>
      @keyframes spin { to { transform:rotate(360deg); } }
      .spin-anim { animation:spin 1s linear infinite; }

      /* ── Layout ── */
      .emit-wrap  { max-width:none; padding-right:0; }
      .emit-ph      { display:flex;align-items:flex-start;gap:16px;margin-bottom:24px;flex-wrap:wrap; }
      .emit-ph-left { display:flex;align-items:flex-start;gap:14px;flex:1;min-width:0; }
      .emit-ph-title h1 { font-family:var(--font-display);font-size:24px;font-weight:900;margin:8px 0 4px; }
      .emit-ph-title p  { font-size:13px;color:var(--text-muted);margin:0;display:flex;align-items:center;gap:6px; }
      .emit-ph-actions  { display:flex;gap:8px;flex-wrap:wrap;align-items:center;padding-top:6px; }
      .emit-sections    { display:flex;flex-direction:column;gap:20px; }

      /* Two-column layout */
      .emit-layout { display:grid;grid-template-columns:1fr 300px;gap:24px;align-items:start; }
      .emit-main   { min-width:0; }

      /* Sticky aside */
      .emit-aside {
        position:sticky;top:80px;
        display:flex;flex-direction:column;gap:12px;
      }
      .emit-aside-card {
        background:var(--bg-card);border:1px solid var(--border-light);
        border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05);
      }
      .aside-section { padding:14px 16px; }
      .aside-section-label {
        display:flex;align-items:center;gap:5px;
        font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
        color:var(--text-muted);margin-bottom:8px;
      }
      .aside-rfc-nombre { font-size:13px;font-weight:700;color:var(--text-primary);margin-bottom:2px; }
      .aside-rfc-clave  { font-size:11px;font-family:monospace;color:var(--text-muted); }
      .aside-empty-hint { font-size:12px;color:var(--text-muted);font-style:italic; }
      .aside-divider    { height:1px;background:var(--border-light); }
      .aside-total-block { }
      .aside-total-row  { display:flex;justify-content:space-between;font-size:13px;color:var(--text-secondary);padding:2px 0; }
      .aside-total-grand { display:flex;justify-content:space-between;font-family:var(--font-display);font-size:18px;font-weight:900;color:var(--text-primary);border-top:2px solid var(--border-light);margin-top:8px;padding-top:10px; }
      .emit-aside-actions { display:flex;flex-direction:column;gap:8px; }

      @media(max-width:1100px) { .emit-layout { grid-template-columns:1fr 260px; } }
      @media(max-width:860px)  { .emit-layout { grid-template-columns:1fr; } .emit-aside { position:static; } }

      /* ── Cards ── */
      .emit-card     { background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.05); }
      .emit-card-hdr { display:flex;align-items:center;gap:14px;padding:18px 24px;border-bottom:1px solid var(--border-light);background:var(--bg-card2); }
      .emit-card-hdr-actions { display:flex;gap:8px;margin-left:auto; }
      .emit-card-body { padding:24px; }

      /* ── Section numbers ── */
      .emit-sec-num        { width:32px;height:32px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0; }
      .emit-sec-num-blue   { background:#2563eb; }
      .emit-sec-num-purple { background:#7c3aed; }
      .emit-sec-num-muted  { background:var(--border-light);color:var(--text-muted); }
      .emit-sec-title { font-size:15px;font-weight:700;color:var(--text-primary); }
      .emit-sec-sub   { font-size:12px;color:var(--text-muted);margin-top:1px; }

      /* ── Estado badges ── */
      .emit-badge-estado { padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700; }
      .emit-badge-estado[data-estado="Borrador"]   { background:rgba(107,114,128,.12);color:#6b7280; }
      .emit-badge-estado[data-estado="Enviada"]    { background:rgba(37,99,235,.1);color:#2563eb; }
      .emit-badge-estado[data-estado="Aceptada"]   { background:rgba(5,150,105,.1);color:#059669; }
      .emit-badge-estado[data-estado="Rechazada"]  { background:rgba(239,68,68,.1);color:#ef4444; }
      .emit-badge-estado[data-estado="Cancelada"]  { background:rgba(156,163,175,.1);color:#9ca3af; }
      .emit-badge-estado[data-estado="Convertida"] { background:rgba(5,150,105,.15);color:#059669;border:1px solid rgba(5,150,105,.3); }
      .estado-badge { padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700; }
      .estado-badge[data-estado="Borrador"]   { background:rgba(107,114,128,.1);color:#6b7280; }
      .estado-badge[data-estado="Enviada"]    { background:rgba(37,99,235,.1);color:#2563eb; }
      .estado-badge[data-estado="Aceptada"]   { background:rgba(5,150,105,.1);color:#059669; }
      .estado-badge[data-estado="Rechazada"]  { background:rgba(239,68,68,.1);color:#ef4444; }
      .estado-badge[data-estado="Cancelada"]  { background:rgba(156,163,175,.1);color:#9ca3af; }
      .estado-badge[data-estado="Convertida"] { background:rgba(5,150,105,.15);color:#059669; }

      /* ── Loading ── */
      .base-loading { display:flex;align-items:center;gap:10px;padding:14px 18px;margin-bottom:16px;background:var(--bg-card2);border:1px solid var(--border-light);border-radius:10px;font-size:13px;color:var(--text-muted); }

      /* ── CFDI vinculado banner ── */
      .cfdi-vinculado-banner { display:flex;align-items:center;gap:12px;padding:14px 16px;margin-bottom:20px;background:rgba(5,150,105,.06);border:1.5px solid rgba(5,150,105,.25);border-radius:10px; }

      /* ── Fields ── */
      .fg     { display:flex;flex-direction:column;gap:5px; }
      .fl     { font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted); }
      .fl-req::after { content:' *';color:#ef4444; }
      .optional-badge { font-size:11px;font-weight:500;color:var(--text-muted);background:var(--bg-card2);padding:1px 8px;border-radius:20px;border:1px solid var(--border-light);text-transform:none;letter-spacing:0; }

      /* ── form-control-mag ── */
      .emit-wrap .form-control-mag {
        display:block;width:100%;height:40px;padding:0 12px;
        border:1.5px solid var(--border);border-radius:var(--radius-sm,6px);
        font-family:var(--font-body);font-size:14px;color:var(--text-primary);
        background:var(--bg-card);outline:none;
        transition:border-color .15s,box-shadow .15s;box-sizing:border-box;
      }
      .emit-wrap .form-control-mag:focus { border-color:var(--accent);box-shadow:0 0 0 3px rgba(59,99,217,.12); }
      .emit-wrap select.form-control-mag { -webkit-appearance:none;appearance:none;cursor:pointer; }
      .emit-wrap textarea.form-control-mag { height:auto;padding:12px;resize:vertical; }
      .emit-wrap .form-control-mag::placeholder { color:var(--text-muted);opacity:1; }
      .fld-mono   { font-family:monospace !important;letter-spacing:.4px; }
      .fld-prefix { padding-left:22px !important; }

      /* ── Display fields (read-only) ── */
      .fld-display      { padding:9px 14px;background:var(--bg-card2);border:1.5px solid var(--border-light);border-radius:var(--radius-sm,6px);font-weight:700;font-size:14px;color:var(--text-primary);min-height:40px; }
      .fld-display-warn { border-color:rgba(245,158,11,.4);color:#d97706;background:rgba(245,158,11,.06); }

      /* ── Input helpers ── */
      .input-wrap   { position:relative; }
      .input-prefix { position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;color:var(--text-muted);font-weight:600;pointer-events:none;z-index:1; }
      .sel-wrap  { position:relative; }
      .sel-ico   { position:absolute;right:10px;top:50%;transform:translateY(-50%);font-size:18px;color:var(--text-muted);pointer-events:none;z-index:1; }
      .sel-wrap select { -webkit-appearance:none;appearance:none;padding-right:34px; }

      /* ── Grids ── */
      .emit-grid-3 { display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px; }
      .emit-grid-4 { display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:20px; }
      @media(max-width:720px) { .emit-grid-4 { grid-template-columns:1fr 1fr; } }
      @media(max-width:640px) { .emit-grid-3,.emit-grid-4 { grid-template-columns:1fr; } }

      /* ── Cliente combobox ── */
      .cot-combo-wrap {
        position:relative;
      }
      .cot-combo-icon {
        position:absolute;left:11px;top:50%;transform:translateY(-50%);
        font-size:18px !important;color:var(--text-muted);pointer-events:none;z-index:1;
      }
      .cot-combo-arrow {
        position:absolute;right:11px;top:50%;transform:translateY(-50%);
        font-size:18px !important;color:var(--text-muted);pointer-events:none;z-index:1;
      }
      .cot-combo-input { padding-left:36px !important;padding-right:36px !important; }

      /* ── Clientes dropdown ── */
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

      /* ── Cliente chip ── */
      .receptor-divider { display:flex;align-items:center;gap:12px;margin:4px 0 20px;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em; }
      .receptor-divider::before,.receptor-divider::after { content:'';flex:1;height:1px;background:var(--border-light); }
      .cliente-chip { display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--accent-light);border:1.5px solid rgba(59,99,217,.2);border-radius:10px; }
      .cliente-chip-avatar { width:36px;height:36px;border-radius:50%;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;flex-shrink:0; }

      /* ── Catálogo ── */
      .catalogo-conceptos { padding:14px 20px;background:var(--bg-card2);border-bottom:1px solid var(--border-light); }
      .catalogo-chip      { font-size:12px !important; }
      .catalogo-chip-price { color:var(--text-muted);margin-left:6px; }

      /* ── Conceptos ── */
      .concepto-row { border-bottom:1px solid var(--border-light);padding:20px 24px; }
      .concepto-row:last-of-type { border-bottom:none; }
      .concepto-row-hdr { display:flex;align-items:center;justify-content:space-between;margin-bottom:16px; }
      .concepto-num { display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:.05em; }
      .concepto-importe-badge { font-family:var(--font-display);font-weight:900;font-size:16px;color:var(--accent);background:var(--accent-light);border:1px solid rgba(59,99,217,.2);padding:4px 12px;border-radius:20px; }
      .concepto-fields { display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:16px; }
      @media(max-width:760px) { .concepto-fields { grid-template-columns:1fr 1fr; } }
      @media(max-width:480px) { .concepto-fields { grid-template-columns:1fr; } }

      /* ── Totales ── */
      .concepto-totals { padding:16px 24px;background:var(--bg-card2);border-top:2px solid var(--border-light);display:flex;flex-direction:column;align-items:flex-end; }
      .concepto-totals-row { display:flex;justify-content:space-between;align-items:center;padding:5px 0;font-size:13px;color:var(--text-secondary);width:280px; }
      .concepto-totals-lbl { color:var(--text-muted); }
      .concepto-totals-val { font-weight:600; }
      .concepto-totals-grand { font-family:var(--font-display);font-size:20px;font-weight:900;color:var(--text-primary);border-top:2px solid var(--border-light);margin-top:6px;padding-top:10px; }

      .empty-state-sm { padding:32px 24px;text-align:center;font-size:13px;color:var(--text-muted); }

      /* ── Error panel ── */
      .error-panel     { background:rgba(239,68,68,.06);border:1px solid rgba(239,68,68,.2);border-radius:12px;padding:16px 20px; }
      .error-panel-hdr { display:flex;align-items:center;gap:10px;font-weight:700;font-size:14px;color:#dc2626;margin-bottom:0; }

      .btn-danger-ghost { color:#f87171 !important; }

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
    </style>
  `
})
export class CotizacionFormComponent implements OnInit {

  modoDetalle = false;
  editandoId: number | null = null;
  cotizacion: Cotizacion | null = null;
  cargando = true;

  rfcs:              RfcList[]          = [];
  clientes:          ClienteListDto[]   = [];
  conceptosCatalogo: ConceptoCatalogo[] = [];
  clientesFiltrados: ClienteListDto[]   = [];
  busquedaCliente  = '';
  buscandoCliente  = false;
  busquedaRfc      = '';
  buscandoRfc      = false;
  rfcsFiltrados:   RfcList[] = [];
  mostrarCatalogo  = false;

  cambiandoEstado = false;
  guardando       = false;
  errorMsg        = '';
  editandoDefault = false;
  textoDefault    = '';

  form = {
    rfcId:          0,
    receptorNombre: '',
    receptorRfc:    '',
    receptorEmail:  '',
    fecha:          new Date().toISOString().split('T')[0],
    fechaVigencia:  '',
    notas:          '',
    moneda:         'MXN'
  };

  lineas: CotizacionLineaForm[] = [];
  subTotal = 0; iva = 0; total = 0;

  constructor(
    public  router:     Router,
    private route:      ActivatedRoute,
    private svc:        CotizacionService,
    private rfcSvc:     RfcService,
    private clienteSvc: ClienteService,
    private ccSvc:      ConceptoCatalogoService,
    private notaSvc:    NotaDefaultService
  ) {}

  ngOnInit(): void {
    const id     = this.route.snapshot.paramMap.get('id');
    const editar = this.route.snapshot.url.some(s => s.path === 'editar');

    this.rfcSvc.listar().subscribe(r => {
      this.rfcs = r;
      if (!this.form.rfcId) {
        const def = r.find(x => x.isDefault) ?? (r.length === 1 ? r[0] : null);
        if (def) this.form.rfcId = def.id;
      }
    });
    this.clienteSvc.listar().subscribe(c => this.clientes = c);
    this.ccSvc.listar().subscribe(cc => this.conceptosCatalogo = cc);

    if (id && !editar) {
      this.modoDetalle = true;
      this.svc.obtener(+id).subscribe({
        next: c => { this.cotizacion = c; this.cargando = false; },
        error: () => { this.cargando = false; }
      });
    } else if (id && editar) {
      this.editandoId = +id;
      this.svc.obtener(+id).subscribe({
        next: c => {
          this.cotizacion = c;
          this.form.rfcId          = c.rfcId;
          this.form.receptorNombre = c.receptorNombre;
          this.form.receptorRfc    = c.receptorRfc;
          this.form.receptorEmail  = c.receptorEmail ?? '';
          this.form.fecha          = c.fecha.split('T')[0];
          this.form.fechaVigencia  = c.fechaVigencia ? c.fechaVigencia.split('T')[0] : '';
          this.form.notas          = c.notas ?? '';
          this.form.moneda         = c.moneda;
          this.lineas = c.lineas.map(l => ({
            claveProdServ:  l.claveProdServ,
            claveUnidad:    l.claveUnidad,
            unidad:         l.unidad,
            descripcion:    l.descripcion,
            cantidad:       l.cantidad,
            precioUnitario: l.precioUnitario,
            descuento:      l.descuento,
            tasaIva:        l.tasaIva
          }));
          this.calcTotal();
          this.cargando = false;
        },
        error: () => { this.cargando = false; }
      });
    } else {
      // Modo crear — pre-llenar nota predeterminada
      this.form.notas = this.notaSvc.getCached();
      this.cargando = false;
      this.agregarLinea();
    }
    this.textoDefault = this.notaSvc.getCached();
    this.notaSvc.loadFromApi().subscribe(v => {
      this.textoDefault = v;
      if (!this.form.notas) this.form.notas = v;
    });
  }

  // ── Nota predeterminada ───────────────────────────────────────
  guardarDefault(): void {
    this.notaSvc.save(this.textoDefault).subscribe();
    this.editandoDefault = false;
  }
  aplicarDefault(): void {
    this.form.notas = this.textoDefault;
  }

  // ── RFC seleccionado ──────────────────────────────────────────
  get rfcSeleccionado(): RfcList | undefined {
    return this.rfcs.find(r => r.id === this.form.rfcId);
  }

  // ── Líneas ────────────────────────────────────────────────────
  agregarLinea(): void {
    this.lineas.push({
      claveProdServ: '01010101', claveUnidad: 'ACT', unidad: 'Servicio',
      descripcion: '', cantidad: 1, precioUnitario: 0, descuento: 0, tasaIva: 0.16
    });
  }

  agregarDesde(cc: ConceptoCatalogo): void {
    const linea: CotizacionLineaForm = {
      claveProdServ:  cc.claveProdServ,
      claveUnidad:    cc.claveUnidad,
      unidad:         cc.unidad,
      descripcion:    cc.descripcion,
      cantidad:       1,
      precioUnitario: cc.precioUnitario,
      descuento:      0,
      tasaIva:        cc.tasaIva ?? 0.16
    };
    const esPlaceholder =
      this.lineas.length === 1 &&
      !this.lineas[0].descripcion &&
      !(this.lineas[0].precioUnitario > 0);

    if (esPlaceholder) {
      this.lineas[0] = linea;
    } else {
      this.lineas.push(linea);
    }
    this.calcTotal();
    this.mostrarCatalogo = false;
  }

  eliminarLinea(i: number): void {
    this.lineas.splice(i, 1);
    this.calcTotal();
  }

  importeLinea(l: CotizacionLineaForm): number {
    const imp = l.cantidad * l.precioUnitario - l.descuento;
    return Math.round((imp + imp * l.tasaIva) * 100) / 100;
  }

  calcTotal(): void {
    let sub = 0, iv = 0;
    this.lineas.forEach(l => {
      const imp = l.cantidad * l.precioUnitario - l.descuento;
      sub += imp;
      iv  += imp * l.tasaIva;
    });
    this.subTotal = Math.round(sub * 100) / 100;
    this.iva      = Math.round(iv  * 100) / 100;
    this.total    = Math.round((sub + iv) * 100) / 100;
  }

  // ── Cliente combobox ──────────────────────────────────────────
  abrirBusqueda(): void {
    this.buscandoCliente = true;
    this.busquedaCliente = '';
    this.clientesFiltrados = this.clientes.slice(0, 10);
  }

  onClienteFocus(): void {
    const txt = this.busquedaCliente.toLowerCase().trim();
    if (!txt) {
      this.clientesFiltrados = this.clientes.slice(0, 10);
    } else {
      this.filtrarClientes();
    }
  }

  onClienteBlur(): void {
    setTimeout(() => {
      this.clientesFiltrados = [];
      if (this.form.receptorNombre) {
        this.buscandoCliente  = false;
        this.busquedaCliente  = '';
      }
    }, 200);
  }

  filtrarClientes(): void {
    const txt = this.busquedaCliente.toLowerCase().trim();
    if (!txt) { this.clientesFiltrados = this.clientes.slice(0, 10); return; }
    this.clientesFiltrados = this.clientes
      .filter(c => c.nombre.toLowerCase().includes(txt) || c.rfc.toLowerCase().includes(txt))
      .slice(0, 10);
  }

  seleccionarCliente(c: ClienteListDto): void {
    this.form.receptorNombre = c.nombre;
    this.form.receptorRfc    = c.rfc;
    this.busquedaCliente     = '';
    this.clientesFiltrados   = [];
    this.buscandoCliente     = false;
  }

  // ── RFC combobox ──────────────────────────────────────────────
  abrirBusquedaRfc(): void {
    this.buscandoRfc  = true;
    this.busquedaRfc  = '';
    this.rfcsFiltrados = this.rfcs.slice(0, 10);
  }

  onRfcFocus(): void {
    const txt = this.busquedaRfc.toLowerCase().trim();
    this.rfcsFiltrados = txt ? this.rfcs.filter(r =>
      r.rfc.toLowerCase().includes(txt) || r.razonSocial.toLowerCase().includes(txt)
    ).slice(0, 10) : this.rfcs.slice(0, 10);
  }

  onRfcBlur(): void {
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

  seleccionarRfc(r: RfcList): void {
    this.form.rfcId    = r.id;
    this.busquedaRfc   = '';
    this.rfcsFiltrados = [];
    this.buscandoRfc   = false;
  }

  estaVencida(fecha: string): boolean {
    return new Date(fecha) < new Date();
  }

  // ── Guardar ───────────────────────────────────────────────────
  guardar(): void {
    if (!this.form.rfcId || !this.form.receptorNombre || !this.form.receptorRfc || !this.form.fecha) {
      this.errorMsg = 'Completa los campos obligatorios.'; return;
    }
    if (this.lineas.length === 0) {
      this.errorMsg = 'Agrega al menos un concepto.'; return;
    }
    if (this.lineas.some(l => !l.descripcion || l.precioUnitario <= 0)) {
      this.errorMsg = 'Todos los conceptos deben tener descripción y precio mayor a cero.'; return;
    }
    this.guardando = true; this.errorMsg = '';

    const payload = {
      rfcId:          this.form.rfcId,
      receptorNombre: this.form.receptorNombre.toUpperCase().trim(),
      receptorRfc:    this.form.receptorRfc.toUpperCase().trim(),
      receptorEmail:  this.form.receptorEmail || undefined,
      fecha:          this.form.fecha,
      fechaVigencia:  this.form.fechaVigencia || undefined,
      notas:          this.form.notas || undefined,
      moneda:         this.form.moneda,
      lineas:         this.lineas
    };

    const op = this.editandoId
      ? this.svc.actualizar(this.editandoId, payload)
      : this.svc.crear(payload as any);

    op.subscribe({
      next: c => this.router.navigate(['/cotizaciones', c.id]),
      error: (err: any) => {
        this.guardando = false;
        this.errorMsg  = err.error?.error ?? 'Error al guardar la cotización.';
      }
    });
  }

  // ── Cambiar estado ────────────────────────────────────────────
  cambiarEstado(accion: string): void {
    if (!this.cotizacion) return;
    this.cambiandoEstado = true;
    this.svc.cambiarEstado(this.cotizacion.id, accion).subscribe({
      next: c => { this.cotizacion = c; this.cambiandoEstado = false; },
      error: () => { this.cambiandoEstado = false; }
    });
  }

  // ── PDF ───────────────────────────────────────────────────────
  descargarPdf(): void {
    if (!this.cotizacion) return;
    const token = localStorage.getItem('accessToken') || '';
    const url   = this.svc.pdfUrl(this.cotizacion.id);
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`Error ${r.status}`); return r.blob(); })
      .then(blob => {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `cotizacion-${this.cotizacion!.folio}.pdf`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(err => console.error('Error descargando PDF:', err));
  }

  // ── Convertir a factura ───────────────────────────────────────
  convertirAFactura(): void {
    if (!this.cotizacion) return;
    this.router.navigate(['/cfdis/new'], { queryParams: { cotizacionId: this.cotizacion.id } });
  }
}
