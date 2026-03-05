import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { RfcList } from '../../core/models/RFC/RfcList';
import { ClienteListDto } from '../../core/models/cliente/ClienteListDto';
import { UNIDADES_SAT } from '../../core/models/CFDI/Catálogos/UNIDADES_SAT';
import { CLAVES_PROD_SERV_TOP } from '../../core/models/serie/catalogos/CLAVES_PROD_SERV_TOP';
import { ConceptoCatalogoService } from '../../core/services/conceptoc.atalogo/ConceptoCatalogoService';
import { RfcService } from '../../core/services/RFC/RfcService';
import { ClienteService } from '../../core/services/cliente/ClienteService';

@Component({
  selector: 'app-concepto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-in" style="max-width:680px">

      <!-- Header -->
      <div style="margin-bottom:24px">
        <a routerLink="/conceptos" class="btn-mag btn-ghost btn-sm" style="margin-bottom:16px;display:inline-flex">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span> Conceptos
        </a>
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">
          {{ esEdicion ? 'Editar Concepto' : 'Nuevo Concepto' }}
        </h1>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- Asociación -->
          <div class="card-mag animate-in delay-1">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">link</span>
                Asociación
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-mag">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>EMISOR (RFC)</label>
                    <select formControlName="rfcId" class="form-control-mag">
                      <option [value]="null">Seleccionar emisor</option>
                      <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial | slice:0:20 }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>CLIENTE</label>
                    <select formControlName="clienteId" class="form-control-mag">
                      <option [value]="null">Seleccionar cliente</option>
                      <option *ngFor="let c of clientes" [value]="c.id">{{ c.rfc }} — {{ c.nombre | slice:0:20 }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Datos del concepto -->
          <div class="card-mag animate-in delay-2">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">description</span>
                Datos del Concepto
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-mag">

                <!-- Clave prod/serv con búsqueda -->
                <div class="form-group">
                  <label>CLAVE PRODUCTO/SERVICIO SAT *</label>
                  <div style="position:relative">
                    <input type="text" formControlName="buscarClave"
                           class="form-control-mag" placeholder="Buscar por clave o descripción..."
                           (input)="buscarClaves()" (focus)="mostrarOpciones=true"
                           (blur)="ocultarOpciones()">
                    <span class="material-icons-round"
                          style="position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--text-muted);font-size:18px;pointer-events:none">arrow_drop_down</span>
                    <div *ngIf="mostrarOpciones && clavesFiltradas.length>0"
                         style="position:absolute;top:100%;left:0;right:0;z-index:50;background:var(--bg-card);border:1.5px solid var(--border-light);border-radius:8px;max-height:220px;overflow-y:auto;margin-top:4px;box-shadow:0 8px 24px rgba(0,0,0,.3)">
                      <div *ngFor="let c of clavesFiltradas"
                           (mousedown)="seleccionarClave(c)"
                           style="padding:10px 14px;cursor:pointer;font-size:13px;border-bottom:1px solid var(--border-light)"
                           (mouseenter)="hoverClave($event,true)"
                           (mouseleave)="hoverClave($event,false)">
                        <span style="font-weight:700;color:var(--accent);margin-right:8px">{{ c.clave }}</span>
                        <span style="color:var(--text-secondary)">{{ c.descripcion }}</span>
                      </div>
                    </div>
                  </div>
                  <div style="margin-top:6px;font-size:12px;color:var(--text-muted)">
                    Clave SAT seleccionada:
                    <strong style="color:var(--accent)">{{ form.get('claveProdServ')?.value || 'Ninguna' }}</strong>
                  </div>
                </div>

                <div class="form-group">
                  <label>DESCRIPCIÓN *</label>
                  <input type="text" formControlName="descripcion" class="form-control-mag"
                         [class.error-field]="hasErr('descripcion')"
                         placeholder="Descripción del producto o servicio" maxlength="1000">
                  <div class="field-error" *ngIf="hasErr('descripcion')">La descripción es requerida</div>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>CLAVE UNIDAD *</label>
                    <select formControlName="claveUnidad" class="form-control-mag" (change)="onUnidadChange()">
                      <option *ngFor="let u of unidades" [value]="u.value">{{ u.label }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>CANTIDAD *</label>
                    <input type="number" formControlName="cantidad" class="form-control-mag"
                           min="0.0001" step="0.01" (input)="calcular()">
                  </div>
                  <div class="form-group">
                    <label>VALOR UNITARIO *</label>
                    <input type="number" formControlName="precioUnitario" class="form-control-mag"
                           [class.error-field]="hasErr('precioUnitario')"
                           min="0" step="0.01" placeholder="0.00" (input)="calcular()">
                    <div class="field-error" *ngIf="hasErr('precioUnitario')">Requerido</div>
                  </div>
                  <div class="form-group">
                    <label>OBJETO DE IMPUESTO *</label>
                    <select formControlName="objetoImpuesto" class="form-control-mag">
                      <option value="01">01 - No objeto de impuesto</option>
                      <option value="02">02 - Sí objeto de impuesto</option>
                      <option value="03">03 - Sí objeto, no obligado</option>
                    </select>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- Impuestos -->
          <div class="card-mag animate-in delay-3">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">receipt</span>
                Impuestos
              </div>
            </div>
            <div class="card-body-mag">

              <!-- Traslado IVA -->
              <div style="background:rgba(20,184,166,.06);border:1px solid rgba(20,184,166,.2);border-radius:10px;padding:14px 16px;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
                  <span class="material-icons-round" style="font-size:18px;color:var(--accent)">check_circle</span>
                  <span style="font-weight:700;font-size:13px;color:var(--accent)">Traslado IVA</span>
                  <span style="font-size:11px;color:var(--text-muted);background:var(--bg-card2);padding:2px 8px;border-radius:20px">(automático)</span>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px">
                  <div>
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Base</div>
                    <div style="font-weight:700;font-size:14px">{{ importe | currency }}</div>
                  </div>
                  <div>
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Tasa</div>
                    <select formControlName="tasaIva" class="form-control-mag"
                            style="padding:6px 10px;font-size:13px" (change)="calcular()">
                      <option value="0.16">16%</option>
                      <option value="0.08">8%</option>
                      <option value="0.00">0% (exento)</option>
                    </select>
                  </div>
                  <div>
                    <div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:.6px;margin-bottom:4px">Importe</div>
                    <div style="font-weight:700;font-size:14px;color:var(--accent)">{{ importeIva | currency }}</div>
                  </div>
                </div>
              </div>

              <!-- Retenciones -->
              <div>
                <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
                  <span style="font-size:13px;font-weight:700">Retenciones</span>
                  <button type="button" (click)="mostrarRetenciones=!mostrarRetenciones"
                          class="btn-mag btn-ghost btn-sm" style="font-size:12px;gap:4px;padding:4px 10px">
                    <span class="material-icons-round" style="font-size:14px">add</span>
                    {{ mostrarRetenciones ? 'Ocultar' : 'Agregar retención' }}
                  </button>
                </div>

                <div *ngIf="!mostrarRetenciones && !tieneRetenciones"
                     style="font-size:12px;color:var(--text-muted);font-style:italic">
                  Sin retenciones configuradas
                </div>

                <div *ngIf="mostrarRetenciones || tieneRetenciones" style="display:flex;flex-direction:column;gap:10px">
                  <!-- ISR -->
                  <div style="display:flex;align-items:center;gap:12px;background:var(--bg-card2);padding:12px 14px;border-radius:8px">
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;min-width:100px">
                      <input type="checkbox" [checked]="form.get('aplicaIsr')?.value"
                             (change)="toggleIsr($event)" style="accent-color:var(--accent)">
                      <span style="font-size:13px;font-weight:700">Retención ISR</span>
                    </label>
                    <div *ngIf="form.get('aplicaIsr')?.value" style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Base</div>
                        <div style="font-size:13px;font-weight:600">{{ importe | currency }}</div>
                      </div>
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Tasa</div>
                        <select formControlName="tasaIsr" class="form-control-mag" style="padding:5px 8px;font-size:13px" (change)="calcular()">
                          <option value="0.10">10%</option>
                          <option value="0.125">12.5%</option>
                          <option value="0.20">20%</option>
                          <option value="0.25">25%</option>
                        </select>
                      </div>
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Importe</div>
                        <div style="font-size:13px;font-weight:700;color:var(--danger)">-{{ importeIsr | currency }}</div>
                      </div>
                    </div>
                  </div>
                  <!-- IVA Ret -->
                  <div style="display:flex;align-items:center;gap:12px;background:var(--bg-card2);padding:12px 14px;border-radius:8px">
                    <label style="display:flex;align-items:center;gap:8px;cursor:pointer;min-width:100px">
                      <input type="checkbox" [checked]="form.get('aplicaIvaRet')?.value"
                             (change)="toggleIvaRet($event)" style="accent-color:var(--accent)">
                      <span style="font-size:13px;font-weight:700">Ret. IVA</span>
                    </label>
                    <div *ngIf="form.get('aplicaIvaRet')?.value" style="flex:1;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Base</div>
                        <div style="font-size:13px;font-weight:600">{{ importeIva | currency }}</div>
                      </div>
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Tasa</div>
                        <select formControlName="tasaIvaRet" class="form-control-mag" style="padding:5px 8px;font-size:13px" (change)="calcular()">
                          <option value="0.1067">10.67%</option>
                          <option value="0.04">4%</option>
                          <option value="0.0667">6.67%</option>
                        </select>
                      </div>
                      <div>
                        <div style="font-size:11px;color:var(--text-muted);margin-bottom:3px">Importe</div>
                        <div style="font-size:13px;font-weight:700;color:var(--danger)">-{{ importeIvaRet | currency }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Resumen -->
          <div class="card-mag animate-in delay-4">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">summarize</span>
                Resumen
              </div>
            </div>
            <div class="card-body-mag">
              <div style="display:flex;flex-direction:column;gap:8px">
                <div style="display:flex;justify-content:space-between;font-size:13px">
                  <span style="color:var(--text-secondary)">Subtotal</span>
                  <span style="font-weight:600">{{ importe | currency }}</span>
                </div>
                <div *ngIf="+form.get('tasaIva')!.value > 0"
                     style="display:flex;justify-content:space-between;font-size:13px">
                  <span style="color:var(--text-secondary)">IVA ({{ porcentajeIva }}%)</span>
                  <span style="color:var(--accent);font-weight:600">+ {{ importeIva | currency }}</span>
                </div>
                <div *ngIf="form.get('aplicaIsr')?.value && importeIsr > 0"
                     style="display:flex;justify-content:space-between;font-size:13px">
                  <span style="color:var(--text-secondary)">Ret. ISR</span>
                  <span style="color:var(--danger);font-weight:600">- {{ importeIsr | currency }}</span>
                </div>
                <div *ngIf="form.get('aplicaIvaRet')?.value && importeIvaRet > 0"
                     style="display:flex;justify-content:space-between;font-size:13px">
                  <span style="color:var(--text-secondary)">Ret. IVA</span>
                  <span style="color:var(--danger);font-weight:600">- {{ importeIvaRet | currency }}</span>
                </div>
                <div style="border-top:2px solid var(--border-light);padding-top:10px;display:flex;justify-content:space-between;font-size:16px">
                  <span style="font-weight:800">Total</span>
                  <span style="font-weight:800;color:var(--accent)">{{ total | currency }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="errorMsg"
               style="background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:var(--radius-md);padding:14px 18px;font-size:13px;color:var(--danger);display:flex;gap:10px;align-items:center">
            <span class="material-icons-round" style="font-size:20px;flex-shrink:0">error_outline</span>
            {{ errorMsg }}
          </div>

          <!-- Botones -->
          <div style="display:flex;justify-content:space-between;padding-bottom:32px">
            <a routerLink="/conceptos" class="btn-mag btn-ghost btn-lg">Cancelar</a>
            <button type="submit" class="btn-mag btn-primary btn-lg" [disabled]="loading">
              <span *ngIf="loading" class="material-icons-round" style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!loading" class="material-icons-round" style="font-size:20px">save</span>
              {{ loading ? 'Guardando...' : 'Guardar Concepto' }}
            </button>
          </div>

        </div>
      </form>
    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `
})
export class ConceptoFormComponent implements OnInit {
  form: FormGroup;
  loading = false; errorMsg = '';
  esEdicion = false; conceptoId: number | null = null;
  rfcs: RfcList[] = [];
  clientes: ClienteListDto[] = [];

  unidades = UNIDADES_SAT;
  todasClaves = CLAVES_PROD_SERV_TOP;
  clavesFiltradas = CLAVES_PROD_SERV_TOP;
  mostrarOpciones = false;
  mostrarRetenciones = false;

  // Calculados
  importe = 0; importeIva = 0; importeIsr = 0; importeIvaRet = 0; total = 0;
  porcentajeIva = 16;

  constructor(
    private fb: FormBuilder,
    private conceptoSvc: ConceptoCatalogoService,
    private rfcSvc: RfcService,
    private clienteSvc: ClienteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      rfcId:          [null],
      clienteId:      [null],
      buscarClave:    [''],
      claveProdServ:  ['01010101', Validators.required],
      claveUnidad:    ['E48'],
      unidad:         ['Unidad de servicio'],
      descripcion:    ['', [Validators.required, Validators.maxLength(1000)]],
      objetoImpuesto: ['02'],
      precioUnitario: [0, [Validators.required, Validators.min(0)]],
      cantidad:       [1, [Validators.required, Validators.min(0.0001)]],
      descuento:      [0],
      tasaIva:        ['0.16'],
      aplicaIva:      [true],
      aplicaIsr:      [false],
      tasaIsr:        ['0.10'],
      aplicaIvaRet:   [false],
      tasaIvaRet:     ['0.1067'],
    });
  }

  ngOnInit() {
    this.rfcSvc.listar().subscribe(rs => this.rfcs = rs);
    this.clienteSvc.listar().subscribe(cs => this.clientes = cs);
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') { this.esEdicion = true; this.conceptoId = +id; this.cargar(+id); }
  }

  cargar(id: number) {
    this.loading = true;
    this.conceptoSvc.obtener(id).subscribe({
      next: c => {
        const clave = this.todasClaves.find(x => x.clave === c.claveProdServ);
        this.form.patchValue({
          ...c,
          buscarClave:  clave ? `${c.claveProdServ} - ${clave.descripcion}` : c.claveProdServ,
          tasaIva:      String(c.tasaIva),
          tasaIsr:      String(c.tasaIsr ?? '0.10'),
          tasaIvaRet:   String(c.tasaIvaRet ?? '0.1067'),
          aplicaIsr:    c.tasaIsr != null,
          aplicaIvaRet: c.tasaIvaRet != null,
        });
        this.calcular();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  hasErr(f: string) { const c = this.form.get(f)!; return c.invalid && c.touched; }

  hoverClave(e: MouseEvent, h: boolean) { (e.currentTarget as HTMLElement).style.background = h ? 'var(--bg-card2)' : ''; }

  buscarClaves() {
    const q = (this.form.get('buscarClave')!.value ?? '').toLowerCase();
    this.clavesFiltradas = !q ? this.todasClaves
      : this.todasClaves.filter(c => c.clave.includes(q) || c.descripcion.toLowerCase().includes(q));
    this.mostrarOpciones = true;
  }

  seleccionarClave(c: {clave: string; descripcion: string}) {
    this.form.patchValue({ claveProdServ: c.clave, buscarClave: `${c.clave} - ${c.descripcion}` });
    this.mostrarOpciones = false;
  }

  ocultarOpciones() { setTimeout(() => this.mostrarOpciones = false, 200); }

  onUnidadChange() {
    const v = this.form.get('claveUnidad')!.value;
    const u = this.unidades.find(x => x.value === v);
    if (u) this.form.get('unidad')!.setValue(u.label.split(' - ')[1] ?? u.label);
  }

  calcular() {
    const precio   = +this.form.get('precioUnitario')!.value || 0;
    const cantidad = +this.form.get('cantidad')!.value || 1;
    const desc     = +this.form.get('descuento')!.value || 0;
    const tasaIva  = +this.form.get('tasaIva')!.value || 0;
    this.porcentajeIva = Math.round(tasaIva * 100);
    this.importe    = precio * cantidad - desc;
    this.importeIva = this.importe * tasaIva;
    this.importeIsr    = this.form.get('aplicaIsr')!.value ? this.importe * (+this.form.get('tasaIsr')!.value || 0) : 0;
    this.importeIvaRet = this.form.get('aplicaIvaRet')!.value ? this.importeIva * (+this.form.get('tasaIvaRet')!.value || 0) : 0;
    this.total = this.importe + this.importeIva - this.importeIsr - this.importeIvaRet;
  }

  get tieneRetenciones() { return this.form.get('aplicaIsr')!.value || this.form.get('aplicaIvaRet')!.value; }

  toggleIsr(e: Event)    { this.form.get('aplicaIsr')!.setValue((e.target as HTMLInputElement).checked); this.calcular(); }
  toggleIvaRet(e: Event) { this.form.get('aplicaIvaRet')!.setValue((e.target as HTMLInputElement).checked); this.calcular(); }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.errorMsg = 'Completa los campos requeridos.'; return; }
    this.loading = true; this.errorMsg = '';
    const v = this.form.value;

    const req = {
      rfcId:          v.rfcId ?? null,
      clienteId:      v.clienteId ?? null,
      claveProdServ:  v.claveProdServ,
      claveUnidad:    v.claveUnidad,
      unidad:         v.unidad,
      descripcion:    v.descripcion,
      objetoImpuesto: v.objetoImpuesto,
      precioUnitario: +v.precioUnitario,
      cantidad:       +v.cantidad,
      descuento:      +v.descuento,
      tasaIva:        +v.tasaIva,
      aplicaIva:      true,
      tasaIsr:        v.aplicaIsr ? +v.tasaIsr : null,
      tasaIvaRet:     v.aplicaIvaRet ? +v.tasaIvaRet : null,
    };

    const op = this.esEdicion && this.conceptoId
      ? this.conceptoSvc.actualizar(this.conceptoId, req)
      : this.conceptoSvc.crear(req);

    op.subscribe({
      next: () => this.router.navigate(['/conceptos']),
      error: err => { this.loading = false; this.errorMsg = err.error?.error ?? 'Error al guardar el concepto.'; }
    });
  }
}