import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Wallet } from '../../core/models/Wallet/Wallet';
import { Transaccion } from '../../core/models/Wallet/Transaccion';
import { WalletService } from '../../core/services/wallet/WalletService';

@Component({
  selector: 'app-wallet',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="animate-in">

      <div class="page-header">
        <h1 class="page-header-title">Wallet &amp; Timbres</h1>
        <p class="page-header-sub">Saldo de timbres y movimientos</p>
      </div>

      <!-- Wallets Cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px;margin-bottom:28px">

        <div *ngFor="let w of wallets; let i=index" class="animate-in" [class]="'delay-'+i">

          <!-- Wallet Global -->
          <div *ngIf="w.tipo === 'Global'"
               style="background:var(--grad-dark);border-radius:var(--radius-xl);padding:24px;position:relative;overflow:hidden;min-height:140px">
            <div style="position:absolute;top:-40px;right:-40px;width:150px;height:150px;background:radial-gradient(circle,rgba(0,212,170,0.2) 0%,transparent 70%);border-radius:50%"></div>
            <div style="position:absolute;bottom:-30px;left:-30px;width:120px;height:120px;background:radial-gradient(circle,rgba(0,153,204,0.15) 0%,transparent 70%);border-radius:50%"></div>

            <div style="position:relative;z-index:1">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
                <div style="display:flex;align-items:center;gap:8px">
                  <span class="material-icons-round" style="color:var(--accent);font-size:20px">account_balance_wallet</span>
                  <span style="font-size:12px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;color:rgba(255,255,255,0.5)">Wallet Global</span>
                </div>
                <span style="background:rgba(0,212,170,0.2);color:var(--accent);font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px">GLOBAL</span>
              </div>
              <div style="font-family:var(--font-display);font-size:42px;font-weight:900;color:white;line-height:1">
                {{ w.saldo }}
              </div>
              <div style="font-size:13px;color:rgba(255,255,255,0.45);margin-top:6px">timbres disponibles</div>
              <button class="btn-mag" style="margin-top:16px;background:rgba(255,255,255,0.1);color:white;font-size:12px;padding:7px 14px"
                      (click)="selectWallet(w)">
                <span class="material-icons-round" style="font-size:14px">history</span>
                Ver movimientos
              </button>
            </div>
          </div>

          <!-- Wallet por RFC -->
          <div *ngIf="w.tipo === 'PorRfc'" class="card-mag" style="padding:20px">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
              <div style="display:flex;align-items:center;gap:8px">
                <div style="width:36px;height:36px;background:var(--accent-light);border-radius:8px;display:flex;align-items:center;justify-content:center">
                  <span class="material-icons-round" style="color:var(--accent);font-size:18px">business</span>
                </div>
                <span style="font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:var(--text-muted)">
                  RFC #{{ w.rfcId }}
                </span>
              </div>
              <span style="background:rgba(59,130,246,0.1);color:var(--info);font-size:10px;font-weight:700;padding:3px 8px;border-radius:20px">POR RFC</span>
            </div>
            <div style="font-family:var(--font-display);font-size:32px;font-weight:900;color:var(--text-primary)">{{ w.saldo }}</div>
            <div style="font-size:12px;color:var(--text-muted);margin-top:4px">timbres exclusivos</div>
            <button class="btn-mag btn-ghost btn-sm" style="margin-top:14px;width:100%;justify-content:center"
                    (click)="selectWallet(w)">
              <span class="material-icons-round" style="font-size:14px">history</span>
              Ver movimientos
            </button>
          </div>
        </div>

        <!-- Info comprar -->
        <div class="card-mag" style="padding:20px;border:1.5px dashed var(--border);box-shadow:none">
          <div style="text-align:center;padding:16px 0">
            <div style="width:44px;height:44px;background:var(--accent-light);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 12px">
              <span class="material-icons-round" style="color:var(--accent);font-size:22px">add_circle_outline</span>
            </div>
            <div style="font-family:var(--font-display);font-size:15px;font-weight:700;margin-bottom:6px">¿Necesitas timbres?</div>
            <div style="font-size:13px;color:var(--text-muted);margin-bottom:16px">Contacta al administrador para recargar tu saldo</div>
            <a href="mailto:admin@facturacionmag.com" class="btn-mag btn-outline btn-sm" style="justify-content:center;width:100%">
              <span class="material-icons-round" style="font-size:16px">mail_outline</span>
              Solicitar recarga
            </a>
          </div>
        </div>
      </div>

      <!-- Movimientos -->
      <div class="card-mag animate-in delay-3" *ngIf="selectedWallet">
        <div class="card-header-mag">
          <div>
            <div class="card-title">
              Movimientos — {{ selectedWallet.tipo === 'Global' ? 'Wallet Global' : 'RFC #'+selectedWallet.rfcId }}
            </div>
            <div class="card-subtitle">Historial de créditos y débitos</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-family:var(--font-display);font-size:20px;font-weight:800;color:var(--text-primary)">
              {{ selectedWallet.saldo }}
            </span>
            <span style="font-size:13px;color:var(--text-muted)">timbres</span>
          </div>
        </div>
        <div class="card-body-mag" style="padding:0">

          <div *ngIf="loadingTx" style="padding:24px">
            <div *ngFor="let i of [1,2,3,4]" style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--border-light)">
              <div class="skeleton" style="width:36px;height:36px;border-radius:8px;flex-shrink:0"></div>
              <div style="flex:1">
                <div class="skeleton" style="height:13px;width:50%;margin-bottom:6px;border-radius:4px"></div>
                <div class="skeleton" style="height:11px;width:30%;border-radius:4px"></div>
              </div>
              <div class="skeleton" style="height:20px;width:60px;border-radius:4px"></div>
            </div>
          </div>

          <div *ngIf="!loadingTx && transacciones.length === 0" class="empty-state" style="padding:40px">
            <div class="empty-title">Sin movimientos</div>
          </div>

          <table class="table-mag" *ngIf="!loadingTx && transacciones.length > 0">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Concepto</th>
                <th>Referencia</th>
                <th style="text-align:right">Timbres</th>
                <th style="text-align:right">Monto</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let t of transacciones">
                <td>
                  <div style="display:flex;align-items:center;gap:8px">
                    <div [style.background]="t.tipo === 'Credito' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'"
                         style="width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center">
                      <span class="material-icons-round" [style.color]="t.tipo === 'Credito' ? 'var(--success)' : 'var(--danger)'"
                            style="font-size:16px">
                        {{ t.tipo === 'Credito' ? 'arrow_downward' : 'arrow_upward' }}
                      </span>
                    </div>
                    <span style="font-size:12px;font-weight:700" [style.color]="t.tipo === 'Credito' ? 'var(--success)' : 'var(--danger)'">
                      {{ t.tipo }}
                    </span>
                  </div>
                </td>
                <td>
                  <span style="font-size:13px">{{ t.concepto | slice:0:40 }}</span>
                </td>
                <td style="font-size:12px;color:var(--text-muted);font-family:monospace">{{ t.referencia ?? '—' }}</td>
                <td style="text-align:right">
                  <span style="font-family:var(--font-display);font-weight:700;font-size:15px"
                        [style.color]="t.tipo === 'Credito' ? 'var(--success)' : 'var(--danger)'">
                    {{ t.tipo === 'Credito' ? '+' : '-' }}{{ t.cantidad }}
                  </span>
                </td>
                <td style="text-align:right;font-size:13px;color:var(--text-secondary)">
                  {{ t.monto ? (t.monto | currency:'MXN':'symbol-narrow') : '—' }}
                </td>
                <td style="font-size:12px;color:var(--text-muted)">{{ t.createdAt | date:'dd/MM/yy HH:mm' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `
})
export class WalletComponent implements OnInit {
  wallets: Wallet[] = [];
  transacciones: Transaccion[] = [];
  selectedWallet: Wallet | null = null;
  loadingTx = false;

  constructor(private walletSvc: WalletService) {}

  ngOnInit(): void {
    this.walletSvc.saldos().subscribe((ws: any) => {
      this.wallets = ws;
      if (ws.length) this.selectWallet(ws[0]);
    });
  }

  selectWallet(w: Wallet): void {
    this.selectedWallet = w;
    this.loadingTx      = true;
    this.walletSvc.transacciones(w.id).subscribe((r: any) => {
      this.transacciones = r.data;
      this.loadingTx     = false;
    });
  }
}