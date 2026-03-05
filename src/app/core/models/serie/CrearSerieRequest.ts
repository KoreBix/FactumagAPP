export interface CrearSerieRequest {
  rfcId: number | null;
  codigo: string;          // ← campo correcto (antes era "serie")
  nombre: string;
  descripcion?: string;
  tipoComprobante?: string;
  prefijo?: string;
  sufijo?: string;
  folioInicial?: number;
  digitos?: number;
  porDefecto?: boolean;
}