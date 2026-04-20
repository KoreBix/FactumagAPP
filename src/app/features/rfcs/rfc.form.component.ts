import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { REGIMENES_FISCALES } from '../../core/models/CFDI/Catálogos/REGIMENES_FISCALES';
import { RfcService } from '../../core/services/RFC/RfcService';
import { decodeId } from '../../core/utils/id-cipher';

@Component({
  selector: 'app-rfc-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule],
  template: `
    <div class="animate-in" style="max-width:760px">

      <!-- Header -->
      <div style="margin-bottom:24px">
        <a routerLink="/rfcs" class="btn-mag btn-ghost btn-sm" style="margin-bottom:16px">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span>
          Volver
        </a>
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">
          {{ isEdit ? 'Editar RFC' : 'Nuevo RFC' }}
        </h1>
        <p style="font-size:14px;color:var(--text-muted);margin-top:4px">
          {{ isEdit ? 'Actualiza los datos de tu empresa' : 'Completa los datos y opcionalmente sube tu CSD y logotipo' }}
        </p>
      </div>

      <form [formGroup]="form" (ngSubmit)="guardar()" class="form-mag">
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- ── SECCIÓN 1: Datos fiscales ───────────────────────────── -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div>
                <div class="card-title">Datos fiscales</div>
                <div class="card-subtitle">Información del SAT</div>
              </div>
              <div style="display:flex;align-items:center;gap:6px;padding:5px 12px;background:var(--accent-light);border-radius:var(--radius-sm)">
                <span class="material-icons-round" style="font-size:14px;color:var(--accent)">looks_one</span>
                <span style="font-size:12px;font-weight:600;color:var(--accent)">Requerido</span>
              </div>
            </div>
            <div class="card-body-mag">
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

              </div>
            </div>
          </div>

          <!-- ── SECCIÓN 2: CSD ──────────────────────────────────────── -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div>
                <div class="card-title">Certificado CSD</div>
                <div class="card-subtitle">Opcional — puedes agregarlo después</div>
              </div>
              <div *ngIf="csdCargado && !cerNombre"
                   style="display:flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:var(--radius-sm)">
                <span class="material-icons-round" style="font-size:14px;color:var(--success)">verified</span>
                <span style="font-size:12px;font-weight:600;color:var(--success)">CSD activo</span>
              </div>
              <div *ngIf="cerNombre || keyNombre"
                   style="display:flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(59,99,217,0.08);border-radius:var(--radius-sm)">
                <span class="material-icons-round" style="font-size:14px;color:var(--accent)">upload_file</span>
                <span style="font-size:12px;font-weight:600;color:var(--accent)">Se subirá al guardar</span>
              </div>
            </div>
            <div class="card-body-mag">

              <!-- Zonas drag & drop -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

                <!-- .CER -->
                <div>
                  <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px">
                    Archivo .CER
                  </label>
                  <div (click)="fileCer.click()"
                       (dragover)="$event.preventDefault(); draggingCer=true"
                       (dragleave)="draggingCer=false"
                       (drop)="onDrop($event,'cer')"
                       [style.border-color]="draggingCer ? 'var(--accent)' : (cerNombre ? 'var(--success)' : 'var(--border)')"
                       [style.background]="cerNombre ? 'rgba(16,185,129,0.04)' : (draggingCer ? 'var(--accent-light)' : 'var(--bg-card2)')"
                       style="border:2px dashed;border-radius:var(--radius-md);padding:24px 12px;text-align:center;cursor:pointer;transition:var(--transition)">
                    <input #fileCer type="file" accept=".cer" style="display:none"
                           (change)="onFileChange($event,'cer')">
                    <span class="material-icons-round"
                          [style.color]="cerNombre ? 'var(--success)' : 'var(--text-muted)'"
                          style="font-size:36px;display:block;margin-bottom:6px">
                      {{ cerNombre ? 'task_alt' : 'upload_file' }}
                    </span>
                    <div *ngIf="!cerNombre" style="font-size:13px;color:var(--text-secondary)">Arrastra o haz clic<br><small style="color:var(--text-muted)">.cer</small></div>
                    <div *ngIf="cerNombre">
                      <div style="font-size:12px;font-weight:700;color:var(--success);word-break:break-all">{{ cerNombre }}</div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Clic para cambiar</div>
                    </div>
                  </div>
                </div>

                <!-- .KEY -->
                <div>
                  <label style="font-size:12px;font-weight:600;color:var(--text-secondary);display:block;margin-bottom:6px">
                    Archivo .KEY
                  </label>
                  <div (click)="fileKey.click()"
                       (dragover)="$event.preventDefault(); draggingKey=true"
                       (dragleave)="draggingKey=false"
                       (drop)="onDrop($event,'key')"
                       [style.border-color]="draggingKey ? 'var(--accent)' : (keyNombre ? 'var(--success)' : 'var(--border)')"
                       [style.background]="keyNombre ? 'rgba(16,185,129,0.04)' : (draggingKey ? 'var(--accent-light)' : 'var(--bg-card2)')"
                       style="border:2px dashed;border-radius:var(--radius-md);padding:24px 12px;text-align:center;cursor:pointer;transition:var(--transition)">
                    <input #fileKey type="file" accept=".key" style="display:none"
                           (change)="onFileChange($event,'key')">
                    <span class="material-icons-round"
                          [style.color]="keyNombre ? 'var(--success)' : 'var(--text-muted)'"
                          style="font-size:36px;display:block;margin-bottom:6px">
                      {{ keyNombre ? 'task_alt' : 'key' }}
                    </span>
                    <div *ngIf="!keyNombre" style="font-size:13px;color:var(--text-secondary)">Arrastra o haz clic<br><small style="color:var(--text-muted)">.key</small></div>
                    <div *ngIf="keyNombre">
                      <div style="font-size:12px;font-weight:700;color:var(--success);word-break:break-all">{{ keyNombre }}</div>
                      <div style="font-size:11px;color:var(--text-muted);margin-top:2px">Clic para cambiar</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Contraseña + Vigencia -->
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
                <div class="form-group">
                  <label>Contraseña del CSD</label>
                  <div style="position:relative">
                    <input [type]="showCsdPass ? 'text' : 'password'"
                           [(ngModel)]="csdPassword" [ngModelOptions]="{standalone:true}"
                           class="form-control-mag"
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
                    Vigencia
                    <span *ngIf="vigenciaAutoDetectada"
                          style="background:var(--accent-light);color:var(--accent);font-size:10px;font-weight:700;padding:2px 7px;border-radius:20px">
                      AUTO
                    </span>
                  </label>
                  <input type="datetime-local" [(ngModel)]="csdVigencia" [ngModelOptions]="{standalone:true}"
                         class="form-control-mag">
                  <div class="field-hint" *ngIf="vigenciaAutoDetectada">
                    <span class="material-icons-round" style="font-size:12px;vertical-align:middle">auto_awesome</span>
                    Detectada del certificado
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- ── SECCIÓN 3: Logo ─────────────────────────────────────── -->
          <div class="card-mag">
            <div class="card-header-mag">
              <div>
                <div class="card-title">Logotipo</div>
                <div class="card-subtitle">Opcional — aparecerá en tus facturas PDF</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <div *ngIf="logoPendiente"
                     style="display:flex;align-items:center;gap:6px;padding:5px 12px;background:rgba(59,99,217,0.08);border-radius:var(--radius-sm)">
                  <span class="material-icons-round" style="font-size:14px;color:var(--accent)">image</span>
                  <span style="font-size:12px;font-weight:600;color:var(--accent)">Se subirá al guardar</span>
                </div>
                <button type="button" class="btn-mag btn-danger btn-sm"
                        *ngIf="logoPreview && !logoPendiente && isEdit"
                        (click)="eliminarLogo()" [disabled]="loadingLogo">
                  <span class="material-icons-round" style="font-size:15px">delete</span> Quitar
                </button>
                <button type="button" class="btn-mag btn-danger btn-sm"
                        *ngIf="logoPendiente"
                        (click)="cancelarLogo()">
                  <span class="material-icons-round" style="font-size:15px">close</span> Cancelar
                </button>
              </div>
            </div>
            <div class="card-body-mag">

              <!-- Preview -->
              <div *ngIf="logoPreview" style="margin-bottom:16px">
                <div style="display:inline-block;padding:16px 24px;background:white;border:1px solid var(--border-light);border-radius:var(--radius-md)">
                  <img [src]="logoPreview" alt="Logo RFC"
                       style="max-height:70px;max-width:260px;object-fit:contain;display:block">
                </div>
              </div>

              <!-- Zona drag & drop -->
              <div (click)="fileLogo.click()"
                   (dragover)="$event.preventDefault(); draggingLogo=true"
                   (dragleave)="draggingLogo=false"
                   (drop)="onDropLogo($event)"
                   [style.border-color]="draggingLogo ? 'var(--accent)' : 'var(--border)'"
                   [style.background]="draggingLogo ? 'var(--accent-light)' : 'var(--bg-card2)'"
                   style="border:2px dashed;border-radius:var(--radius-md);padding:28px 16px;text-align:center;cursor:pointer;transition:var(--transition)">
                <input #fileLogo type="file" accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                       style="display:none" (change)="onLogoFileChange($event)">
                <span class="material-icons-round" style="font-size:40px;display:block;margin-bottom:8px;color:var(--text-muted)">
                  add_photo_alternate
                </span>
                <div style="font-size:14px;font-weight:600;color:var(--text-secondary)">
                  {{ logoPreview ? 'Haz clic para cambiar el logo' : 'Arrastra o haz clic para subir tu logo' }}
                </div>
                <div style="font-size:12px;color:var(--text-muted);margin-top:4px">
                  PNG, JPG o SVG · Máximo 500KB
                </div>
              </div>

              <div *ngIf="logoError"
                   style="margin-top:10px;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:10px 14px;font-size:13px;color:var(--danger);display:flex;gap:8px;align-items:center">
                <span class="material-icons-round" style="font-size:18px">error_outline</span>
                {{ logoError }}
              </div>
            </div>
          </div>

          <!-- ── Progreso de guardado ────────────────────────────────── -->
          <div *ngIf="saving"
               style="background:var(--bg-card);border:1px solid var(--border-light);border-radius:var(--radius-md);padding:16px 20px;display:flex;align-items:center;gap:14px">
            <span class="material-icons-round" style="font-size:22px;color:var(--accent);animation:spin 1s linear infinite">refresh</span>
            <div>
              <div style="font-size:14px;font-weight:600;color:var(--text-primary)">{{ pasoActual }}</div>
              <div style="font-size:12px;color:var(--text-muted);margin-top:2px">{{ pasoDetalle }}</div>
            </div>
          </div>

          <!-- ── Error global ────────────────────────────────────────── -->
          <div *ngIf="errorMsg"
               style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:var(--radius-sm);padding:12px 14px;font-size:13px;color:var(--danger);display:flex;gap:8px;align-items:center">
            <span class="material-icons-round" style="font-size:18px">error_outline</span>
            {{ errorMsg }}
          </div>

          <!-- ── Acciones ────────────────────────────────────────────── -->
          <div style="display:flex;gap:10px;justify-content:flex-end;padding-bottom:32px">
            <a routerLink="/rfcs" class="btn-mag btn-ghost" [class.disabled]="saving">Cancelar</a>
            <button type="submit" class="btn-mag btn-primary btn-lg" [disabled]="saving">
              <span *ngIf="saving" class="material-icons-round" style="font-size:18px;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!saving" class="material-icons-round" style="font-size:18px">save</span>
              {{ saving ? 'Guardando...' : (isEdit ? 'Guardar cambios' : 'Registrar RFC') }}
            </button>
          </div>

        </div>
      </form>
    </div>
    <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
  `
})
export class RfcFormComponent implements OnInit {
  form: FormGroup;

  isEdit  = false;
  rfcId:  number | null = null;
  saving  = false;
  errorMsg = '';

  // CSD
  cerNombre = '';
  keyNombre = '';
  csdCertB64 = '';
  csdKeyB64  = '';
  csdPassword = '';
  csdVigencia = '';
  draggingCer = false;
  draggingKey = false;
  showCsdPass = false;
  vigenciaAutoDetectada = false;
  csdCargado = false;

  // Logo
  readonly apiBase = environment.facturacionUrl;
  logoPreview:  string | null = null;
  logoPendiente = false;
  logoBase64    = '';
  logoExtension = '';
  draggingLogo  = false;
  loadingLogo   = false;
  logoError     = '';

  // Progreso
  pasoActual  = '';
  pasoDetalle = '';

  regimenes = REGIMENES_FISCALES;

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
  }

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    if (raw) {
      const decoded = decodeId(raw);
      if (!decoded) { this.router.navigate(['/rfcs']); return; }
      this.isEdit = true;
      this.rfcId  = decoded;
      this.rfcSvc.obtener(this.rfcId).subscribe(rfc => {
        this.form.patchValue(rfc);
        this.csdCargado = rfc.csdActivo;
        if (rfc.logoUrl) {
          this.logoPreview = `${this.apiBase}${rfc.logoUrl}?t=${Date.now()}`;
        }
      });
    }
  }

  hasError(field: string): boolean {
    const c = this.form.get(field)!;
    return c.invalid && c.touched;
  }

  // ── Archivos CSD ──────────────────────────────────────────────────────────

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
      const base64 = (e.target?.result as string).split(',')[1];
      if (tipo === 'cer') {
        this.cerNombre = file.name;
        this.csdCertB64 = base64;
        this.intentarExtraerVigencia(base64);
      } else {
        this.keyNombre = file.name;
        this.csdKeyB64 = base64;
      }
    };
    reader.readAsDataURL(file);
  }

  private intentarExtraerVigencia(base64: string): void {
    try {
      const binary  = atob(base64);
      const matches = binary.match(/\d{12}Z/g);
      if (matches && matches.length >= 2) {
        const raw  = matches[1];
        const yy   = parseInt(raw.substring(0, 2));
        const year = yy >= 50 ? 1900 + yy : 2000 + yy;
        this.csdVigencia = `${year}-${raw.substring(2,4)}-${raw.substring(4,6)}T${raw.substring(6,8)}:${raw.substring(8,10)}:${raw.substring(10,12)}`;
        this.vigenciaAutoDetectada = true;
      }
    } catch {
      this.vigenciaAutoDetectada = false;
    }
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
    if (file.size > 500 * 1024) { this.logoError = 'El archivo supera los 500KB permitidos.'; return; }
    const tipos = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!tipos.includes(file.type)) { this.logoError = 'Solo se permiten PNG, JPG o SVG.'; return; }
    const extMap: Record<string, string> = { 'image/png':'png','image/jpeg':'jpg','image/jpg':'jpg','image/svg+xml':'svg' };
    this.logoExtension = extMap[file.type] ?? 'png';
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      this.logoBase64   = dataUrl.split(',')[1];
      this.logoPreview  = dataUrl;
      this.logoPendiente = true;
    };
    reader.readAsDataURL(file);
  }

  cancelarLogo(): void {
    this.logoBase64    = '';
    this.logoExtension = '';
    this.logoPendiente = false;
    this.logoPreview   = null;
  }

  eliminarLogo(): void {
    if (!this.rfcId) return;
    this.loadingLogo = true;
    this.rfcSvc.eliminarLogo(this.rfcId).subscribe({
      next: () => {
        this.loadingLogo  = false;
        this.logoPreview  = null;
        this.logoPendiente = false;
      },
      error: (err) => {
        this.loadingLogo = false;
        this.logoError   = err.error?.error ?? 'Error al eliminar el logo.';
      }
    });
  }

  // ── Guardar todo ──────────────────────────────────────────────────────────

  guardar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.saving   = true;
    this.errorMsg = '';

    // Paso 1 — crear o actualizar RFC
    this.pasoActual  = 'Guardando datos fiscales...';
    this.pasoDetalle = 'RFC · Razón Social · Régimen · Código Postal';

    const req$ = this.isEdit
      ? this.rfcSvc.actualizar(this.rfcId!, this.form.value)
      : this.rfcSvc.crear(this.form.value);

    req$.subscribe({
      next: (rfc) => {
        const id = this.rfcId ?? rfc.id;
        this.rfcId = id;
        this.subirCsdSiHay(id);
      },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = err.error?.error ?? 'Error al guardar los datos fiscales.';
      }
    });
  }

  private subirCsdSiHay(id: number): void {
    const tieneCsd = this.cerNombre && this.keyNombre && this.csdPassword && this.csdVigencia;
    if (!tieneCsd) { this.subirLogoSiHay(id); return; }

    this.pasoActual  = 'Subiendo certificado CSD...';
    this.pasoDetalle = `${this.cerNombre} · ${this.keyNombre}`;

    this.rfcSvc.subirCsd(id, {
      certificadoBase64: this.csdCertB64,
      llaveBase64:       this.csdKeyB64,
      password:          this.csdPassword,
      vigencia:          this.csdVigencia
    }).subscribe({
      next: () => {
        this.csdCargado = true;
        this.subirLogoSiHay(id);
      },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = `RFC guardado, pero el CSD falló: ${err.error?.error ?? 'error desconocido'}. Puedes subirlo de nuevo editando el RFC.`;
      }
    });
  }

  private subirLogoSiHay(id: number): void {
    if (!this.logoPendiente || !this.logoBase64) { this.finalizar(); return; }

    this.pasoActual  = 'Subiendo logotipo...';
    this.pasoDetalle = 'Se incluirá en tus facturas PDF';

    this.rfcSvc.subirLogo(id, this.logoBase64, this.logoExtension).subscribe({
      next: () => {
        this.logoPendiente = false;
        this.finalizar();
      },
      error: (err) => {
        this.saving   = false;
        this.errorMsg = `RFC guardado, pero el logo falló: ${err.error?.error ?? 'error desconocido'}. Puedes subirlo de nuevo editando el RFC.`;
      }
    });
  }

  private finalizar(): void {
    this.router.navigate(['/rfcs']);
  }
}
