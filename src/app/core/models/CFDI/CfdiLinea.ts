export interface CfdiLinea {
  id: number;
  claveProdServ: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  importe: number;
  importeIva: number;
  total: number;
}