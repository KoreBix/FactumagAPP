export interface RfcList {
  id: number;
  rfc: string;
  razonSocial: string;
  csdActivo: boolean;
  activo: boolean;
  isDefault: boolean;
  saldoTimbres: number;
  codigoPostal: string;
  logoUrl: string | null;
}