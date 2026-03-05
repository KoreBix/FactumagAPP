export interface CfdiList {
  id: number;
  emisorRfc: string;
  receptorRfc: string;
  receptorNombre: string;
  tipoComprobante: string;
  folio: string | null;
  uuid: string | null;
  estado: 'Borrador' | 'Timbrado' | 'Cancelado' | 'Error';
  total: number;
  fechaTimbrado: string | null;
}