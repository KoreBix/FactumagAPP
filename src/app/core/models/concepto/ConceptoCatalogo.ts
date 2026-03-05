export interface ConceptoCatalogo {
  id: number;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  descripcion: string;
  precioUnitario: number;
  tasaIva: number;
  cantidad:       number;   // ← agregar
  descuento:      number;   // ← agregar
  activo:         boolean;
}