export interface ActualizarSerieRequest {
  nombre: string;
  descripcion?: string;
  tipoComprobante: string;
  prefijo?: string;
  sufijo?: string;
  digitos: number;
  porDefecto: boolean;
}
