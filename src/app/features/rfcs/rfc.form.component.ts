import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { REGIMENES_FISCALES } from '../../core/models/CFDI/Catálogos/REGIMENES_FISCALES';
import { RfcService } from '../../core/services/RFC/RfcService';

@Component({
  selector: 'app-rfc-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="animate-in" style="max-width:760px">

      <div style="margin-bottom:24px">
        <a routerLink="/rfcs" class="btn-mag btn-ghost btn-sm" style="margin-bottom:16px">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span>
          Volver
        </a>
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">
          {{ isEdit ? 'Editar RFC' : 'Nuevo RFC' }}
        </h1>
        <p style="font-size:14px;color:var(--text-muted);margin-top:4px">
          {{ isEdit ? 'Actualiza los datos de tu empresa' : 'Registra una nueva empresa emisora de facturas' }}
        </p>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">

        <!-- Datos del RFC -->
        <div class="card-mag" style="grid-column:1/-1">
          <div class="card-header-mag">
            <div>
              <div class="card-title">Datos fiscales</div>
              <div class="card-subtitle">Información del SAT</div>
            </div>
          </div>
          <div class="card-body-mag">
            <form [formGroup]="form" (ngSubmit)="submit()" class="form-mag">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">

                <div class="form-group" style="grid-column:1/-1">
                  <label>RFC *</label>
                  <input type="text" formControlName="rfc" class="form-control-mag"
                         [class.error-field]="hasError('rfc')"
                         placeholder="AAA010101AAA"
                         style="font-family:monospace;font-size:15px;font-weight:700;letter-spacing:1px"
                         [readonly]="isEdit">
                  <div class="field-error" *ngIf="hasError('rfc')">RFC inválido (12 o 13 caracteres)</div>
                  <div class="field-hint" *ngIf="!isEdit">Persona Moral: 12 chars · Persona Física: 13 chars</div>
                </div>

                <div class="form-group" style="grid-column:1/-1">
                  <label>Razón Social *</label>
                  <input type="text" formControlName="razonSocial" class="form-control-mag"
                         [class.error-field]="hasError('razonSocial')"
                         placeholder="EMPRESA SA DE CV">
                  <div class="field-error" *ngIf="hasError('razonSocial')">Campo requerido</div>
                </div>

                <div class="form-group">
                  <label>Régimen Fiscal *</label>
                  <select formControlName="regimenFiscal" class="form-control-mag"
                          [class.error-field]="hasError('regimenFiscal')">
                    <option value="">Seleccionar...</option>
                    <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
                  </select>
                  <div class="field-error" *ngIf="hasError('regimenFiscal')">Campo requerido</div>
                </div>

                <div class="form-group">
                  <label>Código Postal *</label>
                  <input type="text" formControlName="codigoPostal" class="form-control-mag"
                         [class.error-field]="hasError('codigoPostal')"
                         placeholder="06600" maxlength="5">
                  <div class="field-error" *ngIf="hasError('codigoPostal')">5 dígitos requeridos</div>
                </div>

                <div class="form-group" style="grid-column:1/-1">
                  <label>Proveedor de timbrado</label>
                  <div style="display:flex;gap:12px">
                    <label *ngFor="let p of proveedores"
                           style="display:flex;align-items:center;gap:8px;padding:12px 16px;border:1.5px solid var(--border);border-radius:var(--radius-sm);cursor:pointer;flex:1;transition:var(--transition)"
                           [style.border-color]="form.get('proveedorDefault')?.value === p.value ? 'var(--accent)' : 'var(--border)'"
                           [style.background]="form.get('proveedorDefault')?.value === p.value ? 'var(--accent-light)' : 'transparent'">
                      <input type="radio" formControlName="proveedorDefault" [value]="p.value" style="display:none">
                      <span class="material-icons-round"
                            [style.color]="form.get('proveedorDefault')?.value === p.value ? 'var(--accent)' : 'var(--text-muted)'"
                            style="font-size:20px">cloud</span>
                      <div>
                        <div style="font-size:14px;font-weight:600">{{ p.label }}</div>
                        <div style="font-size:11px;color:var(--text-muted)">{{ p.desc }}</div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              <div *ngIf="errorMsg"
                   style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--danger);margin-bottom:16px;display:flex;gap:8px;align-items:center">
                <span class="material-icons-round" style="font-size:18px">error_outline</span>
                {{ errorMsg }}
              </div>

              <div style="display:flex;gap:10px;justify-content:flex-end">
                <a routerLink="/rfcs" class="btn-mag btn-ghost">Cancelar</a>
                <button type="submit" class="btn-mag btn-primary" [disabled]="loading">
                  <span *ngIf="loading" class="material-icons-round"
                        style="font-size:18px;animation:spin 1s linear infinite">refresh</span>
                  <span *ngIf="!loading" class="material-icons-round" style="font-size:18px">save</span>
                  {{ loading ? 'Guardando...' : (isEdit ? 'Actualizar' : 'Registrar RFC') }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- CSD Upload -->
        <div class="card-mag" style="grid-column:1/-1" *ngIf="isEdit">
          <div class="card-header-mag">
            <div>
              <div class="card-title">Certificado CSD</div>
              <div class="card-subtitle">Arrastra tus archivos o haz clic para seleccionarlos</div>
            </div>
            <div *ngIf="csdCargado"
                 style="display:flex;align-items:center;gap:8px;padding:7px 14px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm)">
              <span class="material-icons-round" style="color:var(--success);font-size:18px">verified</span>
              <span style="font-size:13px;font-weight:600;color:var(--success)">CSD activo</span>
            </div>
          </div>

          <div class="card-body-mag">
            <form [formGroup]="csdForm" (ngSubmit)="submitCsd()" class="form-mag">

              <!-- Zonas drag & drop -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px">

                <!-- .CER -->
                <div>
                  <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px">
                    Archivo .CER *
                  </label>
                  <div (click)="fileCer.click()"
                       (dragover)="$event.preventDefault(); draggingCer=true"
                       (dragleave)="draggingCer=false"
                       (drop)="onDrop($event,'cer')"
                       [style.border-color]="draggingCer ? 'var(--accent)' : (cerNombre ? 'var(--success)' : 'var(--border)')"
                       [style.background]="cerNombre ? 'rgba(16,185,129,0.04)' : (draggingCer ? 'var(--accent-light)' : 'var(--bg-card2)')"
                       style="border:2px dashed;border-radius:var(--radius-md);padding:28px 16px;text-align:center;cursor:pointer;transition:var(--transition)">
                    <input #fileCer type="file" accept=".cer" style="display:none"
                           (change)="onFileChange($event,'cer')">
                    <span class="material-icons-round"
                          [style.color]="cerNombre ? 'var(--success)' : 'var(--text-muted)'"
                          style="font-size:40px;display:block;margin-bottom:8px">
                      {{ cerNombre ? 'task_alt' : 'upload_file' }}
                    </span>
                    <div *ngIf="!cerNombre">
                      <div style="font-size:14px;font-weight:600;color:var(--text-secondary)">Arrastra o haz clic</div>
                      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Archivo <strong>.cer</strong></div>
                    </div>
                    <div *ngIf="cerNombre">
                      <div style="font-size:13px;font-weight:700;color:var(--success)">{{ cerNombre }}</div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Clic para cambiar</div>
                    </div>
                  </div>
                </div>

                <!-- .KEY -->
                <div>
                  <label style="font-size:13px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px">
                    Archivo .KEY *
                  </label>
                  <div (click)="fileKey.click()"
                       (dragover)="$event.preventDefault(); draggingKey=true"
                       (dragleave)="draggingKey=false"
                       (drop)="onDrop($event,'key')"
                       [style.border-color]="draggingKey ? 'var(--accent)' : (keyNombre ? 'var(--success)' : 'var(--border)')"
                       [style.background]="keyNombre ? 'rgba(16,185,129,0.04)' : (draggingKey ? 'var(--accent-light)' : 'var(--bg-card2)')"
                       style="border:2px dashed;border-radius:var(--radius-md);padding:28px 16px;text-align:center;cursor:pointer;transition:var(--transition)">
                    <input #fileKey type="file" accept=".key" style="display:none"
                           (change)="onFileChange($event,'key')">
                    <span class="material-icons-round"
                          [style.color]="keyNombre ? 'var(--success)' : 'var(--text-muted)'"
                          style="font-size:40px;display:block;margin-bottom:8px">
                      {{ keyNombre ? 'task_alt' : 'key' }}
                    </span>
                    <div *ngIf="!keyNombre">
                      <div style="font-size:14px;font-weight:600;color:var(--text-secondary)">Arrastra o haz clic</div>
                      <div style="font-size:12px;color:var(--text-muted);margin-top:4px">Archivo <strong>.key</strong></div>
                    </div>
                    <div *ngIf="keyNombre">
                      <div style="font-size:13px;font-weight:700;color:var(--success)">{{ keyNombre }}</div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">Clic para cambiar</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contraseña + Vigencia -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">

                <div class="form-group">
                  <label>Contraseña del CSD *</label>
                  <div style="position:relative">
                    <input [type]="showCsdPass ? 'text' : 'password'"
                           formControlName="password" class="form-control-mag"
                           placeholder="Contraseña del certificado"
                           style="padding-right:44px">
                    <button type="button"
                            style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--text-muted);display:flex"
                            (click)="showCsdPass=!showCsdPass">
                      <span class="material-icons-round" style="font-size:20px">
                        {{ showCsdPass ? 'visibility_off' : 'visibility' }}
                      </span>
                    </button>
                  </div>
                </div>

                <div class="form-group">
                  <label style="display:flex;align-items:center;gap:6px">
                    Fecha de vigencia *
                    <span *ngIf="vigenciaAutoDetectada"
                          style="background:rgba(0,212,170,0.1);color:var(--accent);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">
                      AUTO
                    </span>
                  </label>
                  <input type="datetime-local" formControlName="vigencia" class="form-control-mag">
                  <div class="field-hint" *ngIf="vigenciaAutoDetectada">
                    <span class="material-icons-round" style="font-size:12px;vertical-align:middle">auto_awesome</span>
                    Detectada automáticamente del certificado
                  </div>
                </div>
              </div>

              <!-- Mensajes -->
              <div *ngIf="csdError"
                   style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--danger);margin-bottom:16px;display:flex;gap:8px;align-items:center">
                <span class="material-icons-round" style="font-size:18px">error_outline</span>
                {{ csdError }}
              </div>
              <div *ngIf="csdSuccess"
                   style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--success);margin-bottom:16px;display:flex;gap:8px;align-items:center">
                <span class="material-icons-round" style="font-size:18px">check_circle</span>
                CSD guardado correctamente ✅
              </div>

              <div style="display:flex;justify-content:flex-end">
                <button type="submit" class="btn-mag btn-primary"
                        [disabled]="loadingCsd || !cerNombre || !keyNombre">
                  <span *ngIf="loadingCsd" class="material-icons-round"
                        style="font-size:18px;animation:spin 1s linear infinite">refresh</span>
                  <span *ngIf="!loadingCsd" class="material-icons-round" style="font-size:18px">upload_file</span>
                  {{ loadingCsd ? 'Subiendo...' : 'Guardar CSD' }}
                </button>
              </div>
            </form>
          </div>
        </div>


        <!-- Logo del RFC -->
        <div class="card-mag" style="grid-column:1/-1" *ngIf="isEdit">
          <div class="card-header-mag">
            <div>
              <div class="card-title">Logotipo</div>
              <div class="card-subtitle">Se incluirá en tus facturas PDF</div>
            </div>
            <button type="button" class="btn-mag btn-danger btn-sm"
                    *ngIf="logoPreview" (click)="eliminarLogo()"
                    [disabled]="loadingLogo">
              <span class="material-icons-round" style="font-size:15px">delete</span> Quitar logo
            </button>
          </div>
          <div class="card-body-mag">

            <!-- Preview actual -->
            <div *ngIf="logoPreview" style="margin-bottom:20px">
              <div style="font-size:12px;font-weight:600;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px">
                Logo actual
              </div>
              <div style="display:inline-block;padding:16px 24px;background:white;border:1px solid var(--border-light);border-radius:var(--radius-md)">
                <img [src]="logoPreview" alt="Logo RFC"
                     style="max-height:80px;max-width:280px;object-fit:contain;display:block">
              </div>
            </div>

            <!-- Zona de carga -->
            <div (click)="fileLogo.click()"
                 (dragover)="$event.preventDefault(); draggingLogo=true"
                 (dragleave)="draggingLogo=false"
                 (drop)="onDropLogo($event)"
                 [style.border-color]="draggingLogo ? 'var(--accent)' : 'var(--border)'"
                 [style.background]="draggingLogo ? 'var(--accent-light)' : 'var(--bg-card2)'"
                 style="border:2px dashed;border-radius:var(--radius-md);padding:32px 16px;text-align:center;cursor:pointer;transition:var(--transition)">
              <input #fileLogo type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                     style="display:none" (change)="onLogoFileChange($event)">
              <span class="material-icons-round" style="font-size:48px;display:block;margin-bottom:10px;color:var(--text-muted)">
                add_photo_alternate
              </span>
              <div style="font-size:14px;font-weight:600;color:var(--text-secondary)">
                {{ logoPreview ? 'Haz clic para cambiar el logo' : 'Arrastra o haz clic para subir tu logo' }}
              </div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:6px">
                PNG, JPG o SVG · Máximo 500KB · Recomendado: fondo transparente
              </div>
            </div>

            <!-- Mensajes -->
            <div *ngIf="logoError"
                 style="margin-top:12px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--danger);display:flex;gap:8px;align-items:center">
              <span class="material-icons-round" style="font-size:18px">error_outline</span>
              {{ logoError }}
            </div>
            <div *ngIf="logoSuccess"
                 style="margin-top:12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--success);display:flex;gap:8px;align-items:center">
              <span class="material-icons-round" style="font-size:18px">check_circle</span>
              Logo actualizado correctamente ✅
            </div>

            <div *ngIf="loadingLogo" style="margin-top:12px;text-align:center;color:var(--text-muted);font-size:13px">
              <span class="material-icons-round" style="font-size:18px;vertical-align:middle;animation:spin 1s linear infinite">refresh</span>
              Subiendo logo...
            </div>
          </div>
        </div>

      </div>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class RfcFormComponent implements OnInit {
  form:    FormGroup;
  csdForm: FormGroup;

  isEdit   = false;
  rfcId:   number | null = null;
  loading    = false;
  loadingCsd = false;
  errorMsg   = '';
  csdError   = '';
  csdSuccess = false;
  csdCargado = false;

  cerNombre = '';
  keyNombre = '';
  draggingCer = false;
  draggingKey = false;
  showCsdPass = false;
  vigenciaAutoDetectada = false;

  // Logo
  readonly apiBase = environment.facturacionUrl;
  logoPreview:   string | null = null;
  draggingLogo = false;
  loadingLogo  = false;
  logoError    = '';
  logoSuccess  = false;

  regimenes = REGIMENES_FISCALES;
  proveedores = [
    { value: 'Facturama', label: 'Facturama', desc: 'API oficial de Facturama' },
    { value: 'NovaCfdi',  label: 'NovaCFDI',  desc: 'Proveedor alternativo'   }
  ];

  constructor(
    private fb:     FormBuilder,
    private rfcSvc: RfcService,
    private route:  ActivatedRoute,
    private router: Router
  ) {
    this.form = this.fb.group({
      rfc:              ['', [Validators.required, Validators.minLength(12), Validators.maxLength(13)]],
      razonSocial:      ['', Validators.required],
      regimenFiscal:    ['', Validators.required],
      codigoPostal:     ['', [Validators.required, Validators.minLength(5), Validators.maxLength(5)]],
      proveedorDefault: ['Facturama']
    });

    this.csdForm = this.fb.group({
      certificadoBase64: ['', Validators.required],
      llaveBase64:       ['', Validators.required],
      password:          ['', Validators.required],
      vigencia:          ['', Validators.required]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit = true;
      this.rfcId  = +id;
      this.rfcSvc.obtener(this.rfcId).subscribe(rfc => {
        this.form.patchValue(rfc);
        this.csdCargado = rfc.csdActivo;
        // Si ya tiene logo, mostrar URL completa
        if (rfc.logoUrl) {
          // logoUrl es relativa ("/logos/rfc_5.png"), construir URL completa
          this.logoPreview = `${this.apiBase}${rfc.logoUrl}?t=${Date.now()}`;
        }
      });
    }
  }

  hasError(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && c.touched;
  }

  // ── Manejo de archivos ─────────────────────────────────────────────────────

  onFileChange(event: Event, tipo: 'cer' | 'key'): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.procesarArchivo(input.files[0], tipo);
  }

  onDrop(event: DragEvent, tipo: 'cer' | 'key'): void {
    event.preventDefault();
    if (tipo === 'cer') this.draggingCer = false;
    else                this.draggingKey = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.procesarArchivo(file, tipo);
  }

  private procesarArchivo(file: File, tipo: 'cer' | 'key'): void {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Quitar el prefijo "data:...;base64,"
      const base64 = (e.target?.result as string).split(',')[1];
      if (tipo === 'cer') {
        this.cerNombre = file.name;
        this.csdForm.patchValue({ certificadoBase64: base64 });
        this.intentarExtraerVigencia(base64);
      } else {
        this.keyNombre = file.name;
        this.csdForm.patchValue({ llaveBase64: base64 });
      }
    };
    reader.readAsDataURL(file);
  }

  // Extrae la fecha de vigencia del certificado .cer (DER/ASN.1)
  private intentarExtraerVigencia(base64: string): void {
    try {
      const binary = atob(base64);
      // Buscar fechas UTCTime en el DER: formato YYMMDDHHMMSSZ
      const matches = binary.match(/\d{12}Z/g);
      if (matches && matches.length >= 2) {
        const raw  = matches[1]; // La segunda fecha = notAfter (vigencia)
        const yy   = parseInt(raw.substring(0, 2));
        const year = yy >= 50 ? 1900 + yy : 2000 + yy;
        const fecha = `${year}-${raw.substring(2,4)}-${raw.substring(4,6)}T${raw.substring(6,8)}:${raw.substring(8,10)}:${raw.substring(10,12)}`;
        this.csdForm.patchValue({ vigencia: fecha });
        this.vigenciaAutoDetectada = true;
      }
    } catch {
      this.vigenciaAutoDetectada = false;
    }
  }

  // ── Submit RFC ─────────────────────────────────────────────────────────────

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.loading  = true;
    this.errorMsg = '';
    const req$ = this.isEdit
      ? this.rfcSvc.actualizar(this.rfcId!, this.form.value)
      : this.rfcSvc.crear(this.form.value);
    req$.subscribe({
      next:  () => this.router.navigate(['/rfcs']),
      error: (err) => {
        this.loading  = false;
        this.errorMsg = err.error?.error ?? 'Error al guardar el RFC.';
      }
    });
  }

  // ── Logo ──────────────────────────────────────────────────────────────────

  onLogoFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    this.procesarLogo(input.files[0]);
  }

  onDropLogo(event: DragEvent): void {
    event.preventDefault();
    this.draggingLogo = false;
    const file = event.dataTransfer?.files[0];
    if (file) this.procesarLogo(file);
  }

  private procesarLogo(file: File): void {
    this.logoError = '';
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      this.logoError = 'El archivo supera los 500KB permitidos.';
      return;
    }
    const tiposValidos = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!tiposValidos.includes(file.type)) {
      this.logoError = 'Solo se permiten PNG, JPG o SVG.';
      return;
    }
    // Obtener extensión del tipo MIME
    const extMap: Record<string, string> = {
      'image/png': 'png',
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/svg+xml': 'svg'
    };
    const extension = extMap[file.type] ?? 'png';

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const base64  = dataUrl.split(',')[1];
      // Preview local inmediato mientras sube
      this.logoPreview = dataUrl;
      this.subirLogo(base64, extension);
    };
    reader.readAsDataURL(file);
  }

  private subirLogo(base64: string, extension: string): void {
    if (!this.rfcId) return;
    this.loadingLogo = true;
    this.rfcSvc.subirLogo(this.rfcId, base64, extension).subscribe({
      next: (res) => {
        this.loadingLogo = false;
        this.logoSuccess = true;
        // Actualizar preview con URL real del servidor
        this.logoPreview = `${this.apiBase}/logos/rfc_${this.rfcId}.${extension}?t=${Date.now()}`;
        setTimeout(() => this.logoSuccess = false, 4000);
      },
      error: (err) => {
        this.loadingLogo = false;
        this.logoError   = err.error?.error ?? 'Error al subir el logo.';
        this.logoPreview = null;
      }
    });
  }

  eliminarLogo(): void {
    if (!this.rfcId) return;
    this.loadingLogo = true;
    this.rfcSvc.eliminarLogo(this.rfcId).subscribe({
      next: () => {
        this.loadingLogo = false;
        this.logoPreview = null;
        this.logoSuccess = true;
        setTimeout(() => this.logoSuccess = false, 4000);
      },
      error: (err) => {
        this.loadingLogo = false;
        this.logoError   = err.error?.error ?? 'Error al eliminar el logo.';
      }
    });
  }

  // ── Submit CSD ─────────────────────────────────────────────────────────────

  submitCsd(): void {
    this.csdError = '';
    if (!this.cerNombre) { this.csdError = 'Selecciona el archivo .cer'; return; }
    if (!this.keyNombre) { this.csdError = 'Selecciona el archivo .key'; return; }
    this.csdForm.markAllAsTouched();
    if (this.csdForm.invalid) { this.csdError = 'Completa todos los campos'; return; }
    if (!this.rfcId) return;
    this.loadingCsd = true;
    this.rfcSvc.subirCsd(this.rfcId, this.csdForm.value).subscribe({
      next: () => {
        this.loadingCsd = false;
        this.csdSuccess = true;
        this.csdCargado = true;
        setTimeout(() => this.csdSuccess = false, 5000);
      },
      error: (err) => {
        this.loadingCsd = false;
        this.csdError   = err.error?.error ?? 'Error al guardar el CSD.';
      }
    });
  }
}