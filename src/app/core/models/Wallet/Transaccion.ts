export interface Transaccion {
  id: number;
  tipo: 'Credito' | 'Debito';
  cantidad: number;
  concepto: string;
  referencia: string | null;
  monto: number | null;
  proveedor: string | null;
  createdAt: string;
}