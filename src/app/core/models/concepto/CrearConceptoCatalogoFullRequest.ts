export interface CrearConceptoCatalogoFullRequest {
  rfcId: number | null;
  clienteId: number | null;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  descripcion: string;
  objetoImpuesto: string;
  precioUnitario: number;
  cantidad: number;
  descuento: number;
  tasaIva: number;
  aplicaIva: boolean;
  tasaIsr: number | null;
  tasaIvaRet: number | null;
}