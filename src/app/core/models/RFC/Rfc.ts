export interface Rfc {
  id: number;
  userId: number;
  rfc: string;
  razonSocial: string;
  regimenFiscal: string;
  codigoPostal: string;
  proveedorDefault: string;
  csdActivo: boolean;
  csdVigencia: string | null;
  activo: boolean;
  saldoTimbres: number;
  createdAt: string;
  logoUrl: string | null;
}