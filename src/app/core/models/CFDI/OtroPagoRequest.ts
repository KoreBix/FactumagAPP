export interface OtroPagoRequest {
  tipoPago: string;
  clave:    string;
  concepto: string;
  importe:  number;
}