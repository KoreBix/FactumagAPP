export interface SerieConfig {
  id: number;
  userId: number;
  rfcId: number | null;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipoComprobante: string;
  prefijo: string | null;
  sufijo: string | null;
  folioInicial: number;
  folioActual: number;
  digitos: number;
  porDefecto: boolean;
  activa: boolean;
  proximoFolio: string;
  createdAt: string;
}