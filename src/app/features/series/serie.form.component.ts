import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { RfcList } from '../../core/models/RFC/RfcList';
import { TIPOS_COMPROBANTE } from '../../core/models/CFDI/Catálogos/TIPOS_COMPROBANTE';
import { SerieService } from '../../core/services/serie/SerieService';
import { RfcService } from '../../core/services/RFC/RfcService';

@Component({
  selector: 'app-serie-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-in" style="max-width:600px">

      <div style="margin-bottom:24px">
        <a routerLink="/series" class="btn-mag btn-ghost btn-sm" style="margin-bottom:16px">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span>
          Series
        </a>
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">
          {{ esEdicion ? 'Editar Serie' : 'Nueva Serie' }}
        </h1>
        <p style="font-size:14px;color:var(--text-muted);margin-top:4px">
          {{ esEdicion ? 'Modifica la configuración de la serie' : 'Configura una nueva serie de folios' }}
        </p>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()">
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- ══ Información general ══ -->
          <div class="card-mag animate-in delay-1">
            <div class="card-header-mag">
              <div>
                <div class="card-title" style="display:flex;align-items:center;gap:8px">
                  <span class="material-icons-round" style="font-size:18px;color:var(--accent)">info</span>
                  Información General
                </div>
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-mag" style="display:flex;flex-direction:column;gap:0">

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>CÓDIGO DE SERIE *</label>
                    <input type="text" formControlName="codigo" class="form-control-mag"
                           [class.error-field]="hasError('codigo')"
                           placeholder="Ej: NV" maxlength="25"
                           style="font-family:var(--font-display);font-weight:800;font-size:16px;text-transform:uppercase;letter-spacing:2px"
                           [readonly]="esEdicion">
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Máximo 25 caracteres alfanuméricos</div>
                    <div class="field-error" *ngIf="hasError('codigo')">El código es requerido</div>
                  </div>
                  <div class="form-group">
                    <label>NOMBRE *</label>
                    <input type="text" formControlName="nombre" class="form-control-mag"
                           [class.error-field]="hasError('nombre')"
                           placeholder="Ej: Facturas 2026" maxlength="100">
                    <div class="field-error" *ngIf="hasError('nombre')">El nombre es requerido</div>
                  </div>
                </div>

                <div class="form-group">
                  <label>DESCRIPCIÓN</label>
                  <textarea formControlName="descripcion" class="form-control-mag"
                            placeholder="Descripción opcional de la serie..."
                            rows="3" maxlength="300"
                            style="resize:vertical;line-height:1.5"></textarea>
                </div>

                <div class="form-group">
                  <label>PERFIL FISCAL (OPCIONAL)</label>
                  <select formControlName="rfcId" class="form-control-mag">
                    <option [value]="null">Todos los perfiles</option>
                    <option *ngFor="let r of rfcs" [value]="r.id">{{ r.rfc }} — {{ r.razonSocial }}</option>
                  </select>
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                    Si se selecciona, la serie solo estará disponible para este RFC
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- ══ Tipo de comprobante ══ -->
          <div class="card-mag animate-in delay-2">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">receipt</span>
                Tipo de Comprobante
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-group" style="margin-bottom:0">
                <label>TIPO *</label>
                <select formControlName="tipoComprobante" class="form-control-mag">
                  <option *ngFor="let t of tipos" [value]="t.value">{{ t.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- ══ Configuración de folio ══ -->
          <div class="card-mag animate-in delay-3">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">#</span>
                Configuración de Folio
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-mag">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">

                  <div class="form-group">
                    <label>PREFIJO</label>
                    <input type="text" formControlName="prefijo" class="form-control-mag"
                           placeholder="Ej: A-" maxlength="20">
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Se agrega antes del número</div>
                  </div>
                  <div class="form-group">
                    <label>SUFIJO</label>
                    <input type="text" formControlName="sufijo" class="form-control-mag"
                           placeholder="Ej: -MX" maxlength="20">
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Se agrega después del número</div>
                  </div>

                  <div class="form-group">
                    <label>FOLIO INICIAL *</label>
                    <input type="number" formControlName="folioInicial" class="form-control-mag"
                           min="1" step="1" [readonly]="esEdicion">
                    <div *ngIf="esEdicion" style="font-size:11px;color:var(--text-muted);margin-top:4px">
                      No editable — usa "Resetear folio" desde la lista
                    </div>
                  </div>
                  <div class="form-group">
                    <label>DÍGITOS (PADDING) *</label>
                    <input type="number" formControlName="digitos" class="form-control-mag"
                           min="1" max="15" step="1" (input)="actualizarPreview()">
                    <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Rellena con ceros a la izquierda</div>
                  </div>

                </div>

                <!-- Vista previa del folio -->
                <div style="margin-top:8px;padding:14px 18px;background:var(--bg-card2);border-radius:8px;border:1px solid var(--border-light)">
                  <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:8px">
                    Vista previa del folio
                  </div>
                  <div style="font-family:var(--font-display);font-size:24px;font-weight:800;letter-spacing:2px">
                    <span style="color:var(--text-muted)">{{ form.get('prefijo')?.value || 'XX' }}-</span><span style="color:var(--accent)">{{ preview }}</span><span style="color:var(--text-muted)">{{ form.get('sufijo')?.value || '' }}</span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <!-- ══ Opciones ══ -->
          <div class="card-mag animate-in delay-4">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">settings</span>
                Opciones
              </div>
            </div>
            <div class="card-body-mag">
              <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer">
                <input type="checkbox" formControlName="porDefecto"
                       style="margin-top:3px;width:16px;height:16px;accent-color:var(--accent)">
                <div>
                  <div style="font-weight:600;font-size:13px">Serie por defecto</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
                    Esta serie se seleccionará automáticamente al crear facturas del tipo seleccionado
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Error -->
          <div *ngIf="errorMsg"
               style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-md);padding:14px 18px;font-size:13px;color:var(--danger);display:flex;gap:10px;align-items:center">
            <span class="material-icons-round" style="font-size:20px;flex-shrink:0">error_outline</span>
            {{ errorMsg }}
          </div>

          <!-- Botones -->
          <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:32px">
            <a routerLink="/series" class="btn-mag btn-ghost btn-lg">Cancelar</a>
            <button type="submit" class="btn-mag btn-primary btn-lg" [disabled]="loading">
              <span *ngIf="loading" class="material-icons-round"
                    style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!loading" class="material-icons-round" style="font-size:20px">save</span>
              {{ loading ? 'Guardando...' : 'Guardar Serie' }}
            </button>
          </div>

        </div>
      </form>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class SerieFormComponent implements OnInit {
  form:     FormGroup;
  rfcs:     RfcList[] = [];
  loading   = false;
  errorMsg  = '';
  esEdicion = false;
  serieId:  number | null = null;
  preview   = '000001';

  tipos = TIPOS_COMPROBANTE;

  constructor(
    private fb:       FormBuilder,
    private serieSvc: SerieService,
    private rfcSvc:   RfcService,
    private router:   Router,
    private route:    ActivatedRoute
  ) {
    this.form = this.fb.group({
      codigo:          ['', [Validators.required, Validators.maxLength(25)]],
      nombre:          ['', [Validators.required, Validators.maxLength(100)]],
      descripcion:     [''],
      rfcId:           [null],
      tipoComprobante: ['I', Validators.required],
      prefijo:         [''],
      sufijo:          [''],
      folioInicial:    [1, [Validators.required, Validators.min(1)]],
      digitos:         [6, [Validators.required, Validators.min(1), Validators.max(15)]],
      porDefecto:      [false]
    });

    // Auto uppercase en código
    this.form.get('codigo')!.valueChanges.subscribe(v => {
      if (v !== v?.toUpperCase()) {
        this.form.get('codigo')!.setValue(v?.toUpperCase(), { emitEvent: false });
      }
    });

    // Actualizar preview al cambiar folio, dígitos, prefijo o sufijo
    ['folioInicial', 'digitos', 'prefijo', 'sufijo'].forEach(f =>
      this.form.get(f)!.valueChanges.subscribe(() => this.actualizarPreview())
    );
  }

  ngOnInit(): void {
    this.rfcSvc.listar().subscribe(rs => this.rfcs = rs);

    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.esEdicion = true;
      this.serieId   = +id;
      this.cargarSerie(+id);
    }

    this.actualizarPreview();
  }

  cargarSerie(id: number): void {
    this.loading = true;
    this.serieSvc.obtener(id).subscribe({
      next: s => {
        this.form.patchValue({
          codigo:          s.codigo,
          nombre:          s.nombre,
          descripcion:     s.descripcion ?? '',
          rfcId:           s.rfcId,
          tipoComprobante: s.tipoComprobante,
          prefijo:         s.prefijo ?? '',
          sufijo:          s.sufijo ?? '',
          folioInicial:    s.folioInicial,
          digitos:         s.digitos,
          porDefecto:      s.porDefecto
        });
        this.loading = false;
        this.actualizarPreview();
      },
      error: () => {
        this.errorMsg = 'No se pudo cargar la serie.';
        this.loading  = false;
      }
    });
  }

  actualizarPreview(): void {
    const folio   = this.form.get('folioInicial')?.value ?? 1;
    const digitos = this.form.get('digitos')?.value ?? 6;
    this.preview  = String(folio).padStart(digitos, '0');
  }

  hasError(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && c.touched;
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.errorMsg = 'Completa los campos requeridos.'; return; }

    this.loading  = true;
    this.errorMsg = '';
    const v = this.form.value;

    if (this.esEdicion && this.serieId) {
      this.serieSvc.actualizar(this.serieId, {
        nombre:          v.nombre,
        descripcion:     v.descripcion || undefined,
        tipoComprobante: v.tipoComprobante,
        prefijo:         v.prefijo  || undefined,
        sufijo:          v.sufijo   || undefined,
        digitos:         v.digitos,
        porDefecto:      v.porDefecto
      }).subscribe({
        next:  () => this.router.navigate(['/series']),
        error: (err) => {
          this.loading  = false;
          this.errorMsg = err.error?.error ?? 'Error al actualizar la serie.';
        }
      });
    } else {
      this.serieSvc.crear({
        rfcId:           v.rfcId ?? null,
        codigo:          v.codigo,
        nombre:          v.nombre,
        descripcion:     v.descripcion || undefined,
        tipoComprobante: v.tipoComprobante,
        prefijo:         v.prefijo  || undefined,
        sufijo:          v.sufijo   || undefined,
        folioInicial:    v.folioInicial,
        digitos:         v.digitos,
        porDefecto:      v.porDefecto
      }).subscribe({
        next:  () => this.router.navigate(['/series']),
        error: (err) => {
          this.loading  = false;
          this.errorMsg = err.error?.error ?? 'Error al crear la serie.';
        }
      });
    }
  }
}