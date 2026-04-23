import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { REGIMENES_FISCALES } from '../../core/models/CFDI/Catálogos/REGIMENES_FISCALES';
import { USOS_CFDI } from '../../core/models/CFDI/Catálogos/USOS_CFDI';
import { ESTADOS_MEXICO } from '../../core/models/serie/catalogos/ESTADOS_MEXICO';
import { ClienteService } from '../../core/services/cliente/ClienteService';

interface XmlPreview {
  rfc: string; nombre: string; regimenFiscal: string; codigoPostal: string;
  estado: 'pendiente' | 'importado' | 'omitido' | 'error'; mensaje?: string;
}

@Component({
  selector: 'app-cliente-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, FormsModule],
  template: `
    <div class="animate-in">

      <!-- Header -->
      <div style="margin-bottom:24px">
        <a routerLink="/clientes" class="btn-mag btn-ghost btn-sm" style="margin-bottom:16px;display:inline-flex">
          <span class="material-icons-round" style="font-size:16px">arrow_back</span> Clientes
        </a>
        <h1 style="font-family:var(--font-display);font-size:22px;font-weight:800">
          {{ esEdicion ? 'Editar Cliente' : 'Nuevo Cliente' }}
        </h1>
      </div>

      <!-- Tabs (solo en creación) -->
      <div *ngIf="!esEdicion" style="display:flex;gap:4px;background:var(--bg-card2);padding:4px;border-radius:10px;margin-bottom:24px;width:fit-content">
        <button type="button" (click)="tab='manual'"
                [style]="tab==='manual' ? tabActivo : tabInactivo">
          <span class="material-icons-round" style="font-size:16px">edit_note</span> Formulario Manual
        </button>
        <button type="button" (click)="tab='xml'"
                [style]="tab==='xml' ? tabActivo : tabInactivo">
          <span class="material-icons-round" style="font-size:16px">upload_file</span> Importar desde XML
        </button>
      </div>

      <!-- ══ TAB FORMULARIO ══ -->
      <form *ngIf="tab==='manual'" [formGroup]="form" (ngSubmit)="submit()">
        <div style="display:flex;flex-direction:column;gap:20px">

          <!-- Datos Fiscales -->
          <div class="card-mag animate-in delay-1">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">account_balance</span>
                Datos Fiscales
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-mag">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>RFC *</label>
                    <input type="text" formControlName="rfc" class="form-control-mag"
                           [class.error-field]="hasErr('rfc')"
                           placeholder="XAXX010101000" maxlength="13"
                           style="text-transform:uppercase;font-weight:700;letter-spacing:1px"
                           [readonly]="esEdicion">
                    <div class="field-error" *ngIf="hasErr('rfc')">RFC requerido</div>
                  </div>
                  <div class="form-group">
                    <label>RAZÓN SOCIAL / NOMBRE *</label>
                    <input type="text" formControlName="nombre" class="form-control-mag"
                           [class.error-field]="hasErr('nombre')"
                           placeholder="NOMBRE COMPLETO O RAZÓN SOCIAL" maxlength="300">
                    <div class="field-error" *ngIf="hasErr('nombre')">Nombre requerido</div>
                  </div>
                  <div class="form-group">
                    <label>RÉGIMEN FISCAL *</label>
                    <select formControlName="regimenFiscal" class="form-control-mag" [class.error-field]="hasErr('regimenFiscal')">
                      <option value="">Seleccionar régimen</option>
                      <option *ngFor="let r of regimenes" [value]="r.value">{{ r.label }}</option>
                    </select>
                    <div class="field-error" *ngIf="hasErr('regimenFiscal')">Requerido</div>
                  </div>
                  <div class="form-group">
                    <label>USO DE CFDI *</label>
                    <select formControlName="usoCfdi" class="form-control-mag">
                      <option *ngFor="let u of usos" [value]="u.value">{{ u.label }}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Dirección -->
          <div class="card-mag animate-in delay-2">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">location_on</span>
                Dirección
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-mag">
                <div style="display:grid;grid-template-columns:160px 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>CÓDIGO POSTAL *</label>
                    <input type="text" formControlName="codigoPostal" class="form-control-mag"
                           [class.error-field]="hasErr('codigoPostal')"
                           placeholder="01000" maxlength="5">
                    <div class="field-error" *ngIf="hasErr('codigoPostal')">Requerido</div>
                  </div>
                  <div class="form-group">
                    <label>CALLE</label>
                    <input type="text" formControlName="calle" class="form-control-mag" placeholder="Av. Principal" maxlength="200">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>NÚM. EXTERIOR</label>
                    <input type="text" formControlName="numExterior" class="form-control-mag" placeholder="123" maxlength="20">
                  </div>
                  <div class="form-group">
                    <label>NÚM. INTERIOR</label>
                    <input type="text" formControlName="numInterior" class="form-control-mag" placeholder="A" maxlength="20">
                  </div>
                  <div class="form-group">
                    <label>COLONIA</label>
                    <input type="text" formControlName="colonia" class="form-control-mag" placeholder="Centro" maxlength="150">
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>CIUDAD</label>
                    <input type="text" formControlName="ciudad" class="form-control-mag" placeholder="Ciudad de México" maxlength="100">
                  </div>
                  <div class="form-group">
                    <label>ESTADO</label>
                    <select formControlName="estado" class="form-control-mag">
                      <option value="">Seleccionar estado</option>
                      <option *ngFor="let e of estados" [value]="e">{{ e }}</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label>PAÍS</label>
                    <input type="text" formControlName="pais" class="form-control-mag" placeholder="México" maxlength="100">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Contacto -->
          <div class="card-mag animate-in delay-3">
            <div class="card-header-mag">
              <div class="card-title" style="display:flex;align-items:center;gap:8px">
                <span class="material-icons-round" style="font-size:18px;color:var(--accent)">contacts</span>
                Contacto
              </div>
            </div>
            <div class="card-body-mag">
              <div class="form-mag">
                <div class="form-group">
                  <label>CORREOS ELECTRÓNICOS <span style="font-weight:400;color:var(--text-muted)">({{ emailCount }}/10)</span></label>
                  <input type="text" formControlName="emails" class="form-control-mag"
                         placeholder="correo@empresa.com"
                         (input)="contarEmails()"
                         maxlength="500">
                  <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
                    Separa los correos con coma, espacio o Enter. Mínimo 1, máximo 10.
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:0 20px">
                  <div class="form-group">
                    <label>TELÉFONO</label>
                    <input type="text" formControlName="telefono" class="form-control-mag" placeholder="5512345678" maxlength="30">
                  </div>
                  <div class="form-group">
                    <label>PERSONA DE CONTACTO</label>
                    <input type="text" formControlName="personaContacto" class="form-control-mag" placeholder="Juan Pérez" maxlength="150">
                  </div>
                </div>
                <div class="form-group">
                  <label>NOTAS</label>
                  <textarea formControlName="notas" class="form-control-mag" rows="3"
                            placeholder="Notas adicionales sobre el cliente..." maxlength="1000"
                            style="resize:vertical"></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- Opciones -->
          <div class="card-mag animate-in delay-4">
            <div class="card-body-mag" style="padding:18px 20px">
              <label style="display:flex;align-items:flex-start;gap:12px;cursor:pointer">
                <input type="checkbox" formControlName="predeterminado"
                       style="margin-top:3px;width:16px;height:16px;accent-color:var(--accent)">
                <div>
                  <div style="font-weight:700;font-size:13px">Establecer como cliente predeterminado</div>
                  <div style="font-size:12px;color:var(--text-muted);margin-top:2px">
                    Este cliente se seleccionará automáticamente al crear nuevas facturas
                  </div>
                </div>
              </label>
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
            <a routerLink="/clientes" class="btn-mag btn-ghost btn-lg">Cancelar</a>
            <button type="submit" class="btn-mag btn-primary btn-lg" [disabled]="loading">
              <span *ngIf="loading" class="material-icons-round" style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
              <span *ngIf="!loading" class="material-icons-round" style="font-size:20px">save</span>
              {{ loading ? 'Guardando...' : 'Guardar Cliente' }}
            </button>
          </div>

        </div>
      </form>

      <!-- ══ TAB XML ══ -->
      <div *ngIf="tab==='xml'" class="animate-in">
        <div class="card-mag">
          <div class="card-body-mag" style="padding:32px">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
              <span class="material-icons-round" style="font-size:28px;color:var(--accent)">upload_file</span>
              <div>
                <div style="font-weight:800;font-size:17px">Importar desde XML de Facturas</div>
                <div style="font-size:13px;color:var(--text-muted);margin-top:4px">
                  Sube archivos XML de facturas recibidas (CFDI) y extraeremos automáticamente los datos del emisor para crear nuevos clientes.
                </div>
              </div>
            </div>

            <!-- Drop zone -->
            <div (dragover)="$event.preventDefault()" (drop)="onDrop($event)"
                 (click)="fileInput.click()"
                 style="border:2px dashed var(--border-light);border-radius:12px;padding:48px 24px;text-align:center;cursor:pointer;margin:20px 0;transition:border-color .2s"
                 (mouseenter)="hoverDrop($event,true)"
                 (mouseleave)="hoverDrop($event,false)">
              <span class="material-icons-round" style="font-size:40px;color:var(--text-muted);display:block;margin-bottom:12px">cloud_upload</span>
              <div style="font-size:15px;font-weight:600">Arrastra archivos XML aquí o haz clic para seleccionar</div>
              <div style="font-size:13px;color:var(--text-muted);margin-top:6px">Puedes seleccionar múltiples archivos</div>
              <input #fileInput type="file" accept=".xml" multiple hidden (change)="onFileChange($event)">
            </div>

            <!-- Archivos cargados -->
            <div *ngIf="xmlPreviews.length > 0" style="margin-bottom:20px">
              <div style="font-size:13px;font-weight:700;margin-bottom:10px;color:var(--text-secondary)">
                {{ xmlPreviews.length }} archivo(s) cargado(s)
              </div>
              <div *ngFor="let p of xmlPreviews"
                   style="display:flex;align-items:center;gap:12px;padding:10px 14px;background:var(--bg-card2);border-radius:8px;margin-bottom:8px">
                <span class="material-icons-round" [style.color]="colorEstado(p.estado)" style="font-size:20px">{{ iconEstado(p.estado) }}</span>
                <div style="flex:1">
                  <div style="font-weight:700;font-size:13px">{{ p.rfc }} — {{ p.nombre }}</div>
                  <div style="font-size:11px;color:var(--text-muted)">CP: {{ p.codigoPostal }} | Régimen: {{ p.regimenFiscal }}</div>
                  <div *ngIf="p.mensaje" style="font-size:11px;color:var(--danger);margin-top:2px">{{ p.mensaje }}</div>
                </div>
                <span [style]="'font-size:11px;font-weight:700;padding:3px 10px;border-radius:20px;' + badgeXml(p.estado)">
                  {{ labelEstado(p.estado) }}
                </span>
              </div>
            </div>

            <!-- Opción omitir -->
            <label style="display:flex;align-items:center;gap:10px;cursor:pointer;margin-bottom:24px">
              <input type="checkbox" [(ngModel)]="omitirExistentes"
                     style="width:16px;height:16px;accent-color:var(--accent)">
              <div>
                <div style="font-weight:700;font-size:13px">Omitir clientes existentes</div>
                <div style="font-size:12px;color:var(--text-muted)">Si el RFC ya existe, se omitirá sin mostrar error</div>
              </div>
            </label>

            <div *ngIf="xmlMsg" style="padding:12px 16px;border-radius:8px;font-size:13px;margin-bottom:16px"
                 [style.background]="xmlOk ? 'rgba(20,184,166,.1)' : 'rgba(239,68,68,.08)'"
                 [style.color]="xmlOk ? 'var(--accent)' : 'var(--danger)'">
              {{ xmlMsg }}
            </div>

            <div style="display:flex;justify-content:space-between;align-items:center">
              <a routerLink="/clientes" class="btn-mag btn-ghost">Cancelar</a>
              <button type="button" class="btn-mag btn-primary btn-lg"
                      [disabled]="xmlPreviews.length===0 || importando"
                      (click)="importarXml()">
                <span *ngIf="importando" class="material-icons-round" style="font-size:20px;animation:spin 1s linear infinite">refresh</span>
                <span *ngIf="!importando" class="material-icons-round" style="font-size:20px">upload</span>
                {{ importando ? 'Importando...' : 'Importar Clientes' }}
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
    <style>@keyframes spin{to{transform:rotate(360deg)}}</style>
  `
})
export class ClienteFormComponent implements OnInit {
  form: FormGroup;
  loading = false; errorMsg = '';
  esEdicion = false; clienteId: number | null = null;

  tab: 'manual' | 'xml' = 'manual';
  xmlPreviews:    XmlPreview[] = [];
  xmlFiles:       File[] = [];
  omitirExistentes = true;
  importando = false; xmlMsg = ''; xmlOk = false;
  emailCount = 0;

  regimenes = REGIMENES_FISCALES;
  usos      = USOS_CFDI;
  estados   = ESTADOS_MEXICO;

  tabActivo   = 'display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;background:var(--accent);color:#000;font-weight:700;font-size:13px;border:none;cursor:pointer';
  tabInactivo = 'display:flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;background:transparent;color:var(--text-secondary);font-weight:600;font-size:13px;border:none;cursor:pointer';

  constructor(
    private fb: FormBuilder,
    private clienteSvc: ClienteService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.form = this.fb.group({
      rfc:             ['XAXX010101000', [Validators.required, Validators.maxLength(13)]],
      nombre:          ['', [Validators.required, Validators.maxLength(300)]],
      regimenFiscal:   ['', Validators.required],
      usoCfdi:         ['G03'],
      codigoPostal:    ['01000', [Validators.required, Validators.maxLength(5)]],
      calle:           [''], numExterior: [''], numInterior: [''],
      colonia:         [''], ciudad: [''], estado: [''], pais: ['México'],
      emails:          [''], telefono: [''], personaContacto: [''],
      notas:           [''], predeterminado: [false],
    });
    this.form.get('rfc')!.valueChanges.subscribe(v => {
      if (v !== v?.toUpperCase()) this.form.get('rfc')!.setValue(v?.toUpperCase(), {emitEvent:false});
    });
    this.form.get('nombre')!.valueChanges.subscribe(v => {
      if (v !== v?.toUpperCase()) this.form.get('nombre')!.setValue(v?.toUpperCase(), {emitEvent:false});
    });
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') { this.esEdicion = true; this.clienteId = +id; this.cargar(+id); }
  }

  cargar(id: number) {
    this.loading = true;
    this.clienteSvc.obtener(id).subscribe({
      next: c => { this.form.patchValue(c); this.contarEmails(); this.loading = false; },
      error: () => { this.loading = false; this.errorMsg = 'No se pudo cargar el cliente.'; }
    });
  }

  hasErr(f: string) { const c = this.form.get(f)!; return c.invalid && c.touched; }
  contarEmails() {
    const v = this.form.get('emails')!.value ?? '';
    this.emailCount = v ? v.split(',').filter((e: string) => e.trim()).length : 0;
  }

  submit() {
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.errorMsg = 'Completa los campos requeridos.'; return; }
    this.loading = true; this.errorMsg = '';
    const v = this.form.value;
    const req = { ...v, rfcId: null };

    const op = this.esEdicion && this.clienteId
      ? this.clienteSvc.actualizar(this.clienteId, req)
      : this.clienteSvc.crear(req);

    op.subscribe({
      next: () => this.router.navigate(['/clientes']),
      error: err => { this.loading = false; this.errorMsg = err.error?.error ?? 'Error al guardar el cliente.'; }
    });
  }

  // XML import
  onFileChange(e: Event) {
    const files = Array.from((e.target as HTMLInputElement).files ?? []);
    this.procesarArchivos(files);
  }
  onDrop(e: DragEvent) {
    e.preventDefault();
    const files = Array.from(e.dataTransfer?.files ?? []).filter(f => f.name.endsWith('.xml'));
    this.procesarArchivos(files);
  }

  procesarArchivos(files: File[]) {
    this.xmlPreviews = []; this.xmlFiles = files;
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const xml = new DOMParser().parseFromString(e.target!.result as string, 'text/xml');
          const emisor = xml.querySelector('Emisor');
          if (!emisor) { this.xmlPreviews.push({rfc:'?', nombre:'Sin Emisor', regimenFiscal:'', codigoPostal:'', estado:'error', mensaje:'Nodo Emisor no encontrado'}); return; }
          const receptor = xml.querySelector('Receptor');
          this.xmlPreviews.push({
            rfc:           emisor.getAttribute('Rfc') ?? '',
            nombre:        emisor.getAttribute('Nombre') ?? '',
            regimenFiscal: emisor.getAttribute('RegimenFiscal') ?? '',
            codigoPostal:  receptor?.getAttribute('DomicilioFiscalReceptor') ?? '01000',
            estado:        'pendiente'
          });
        } catch { this.xmlPreviews.push({rfc:'?', nombre:file.name, regimenFiscal:'', codigoPostal:'', estado:'error', mensaje:'XML inválido'}); }
      };
      reader.readAsText(file);
    });
  }

  importarXml() {
    if (!this.xmlFiles.length) return;
    this.importando = true; this.xmlMsg = '';
    let procesados = 0, importados = 0, omitidos = 0;
    const total = this.xmlFiles.length;

    this.xmlFiles.forEach((file, i) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const xmlContent = e.target!.result as string;
        this.clienteSvc.importarXml(xmlContent, this.omitirExistentes).subscribe({
          next: res => {
            importados += res.importados; omitidos += res.omitidos;
            this.xmlPreviews[i].estado = res.importados > 0 ? 'importado' : res.omitidos > 0 ? 'omitido' : 'error';
            if (res.errores.length) this.xmlPreviews[i].mensaje = res.errores[0];
          },
          error: () => { this.xmlPreviews[i].estado = 'error'; this.xmlPreviews[i].mensaje = 'Error al importar'; },
          complete: () => {
            procesados++;
            if (procesados === total) {
              this.importando = false;
              this.xmlOk = importados > 0;
              this.xmlMsg = `Importación completada: ${importados} importado(s), ${omitidos} omitido(s).`;
              if (importados > 0) setTimeout(() => this.router.navigate(['/clientes']), 1800);
            }
          }
        });
      };
      reader.readAsText(file);
    });
  }

  hoverDrop(e: MouseEvent, h: boolean) { (e.currentTarget as HTMLElement).style.borderColor = h ? 'var(--accent)' : 'var(--border-light)'; }

  colorEstado(e: string) { return e==='importado' ? 'var(--accent)' : e==='error' ? 'var(--danger)' : e==='omitido' ? 'var(--warning)' : 'var(--text-muted)'; }
  iconEstado(e: string)  { return e==='importado' ? 'check_circle' : e==='error' ? 'error' : e==='omitido' ? 'skip_next' : 'hourglass_empty'; }
  labelEstado(e: string) { return e==='importado' ? 'Importado' : e==='error' ? 'Error' : e==='omitido' ? 'Omitido' : 'Pendiente'; }
  badgeXml(e: string)    {
    const m = {importado:'background:rgba(20,184,166,.15);color:var(--accent)', error:'background:rgba(239,68,68,.15);color:var(--danger)', omitido:'background:rgba(245,158,11,.15);color:var(--warning)', pendiente:'background:rgba(100,100,100,.15);color:var(--text-muted)'} as Record<string,string>;
    return m[e] ?? m['pendiente'];
  }
}