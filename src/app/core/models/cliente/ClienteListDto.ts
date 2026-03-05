export interface ClienteListDto {
  id: number;
  rfc: string;
  nombre: string;
  regimenFiscal: string;
  usoCfdi: string;
  codigoPostal: string;
  emails: string | null;
  telefono: string | null;
  personaContacto: string | null;
  predeterminado: boolean;
  activo: boolean;
}