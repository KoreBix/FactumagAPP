export interface CotizacionLinea {
  id: number;
  orden: number;
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tasaIva: number;
  importe: number;
  importeIva: number;
  total: number;
}

export interface Cotizacion {
  id: number;
  userId: number;
  rfcId: number;
  tenantId: number | null;
  folio: string;
  receptorNombre: string;
  receptorRfc: string;
  receptorEmail: string | null;
  fecha: string;
  fechaVigencia: string | null;
  notas: string | null;
  moneda: string;
  subTotal: number;
  descuento: number;
  iva: number;
  total: number;
  estado: EstadoCotizacion;
  cfdiUuid: string | null;
  createdAt: string;
  updatedAt: string;
  lineas: CotizacionLinea[];
}

export interface CotizacionList {
  id: number;
  folio: string;
  receptorNombre: string;
  receptorRfc: string;
  fecha: string;
  fechaVigencia: string | null;
  total: number;
  moneda: string;
  estado: EstadoCotizacion;
  cfdiUuid: string | null;
  createdAt: string;
}

export type EstadoCotizacion = 'Borrador' | 'Enviada' | 'Aceptada' | 'Rechazada' | 'Cancelada' | 'Convertida';

export interface CotizacionLineaForm {
  claveProdServ: string;
  claveUnidad: string;
  unidad: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  tasaIva: number;
}

export interface CrearCotizacionRequest {
  rfcId: number;
  receptorNombre: string;
  receptorRfc: string;
  receptorEmail?: string;
  fecha: string;
  fechaVigencia?: string;
  notas?: string;
  moneda: string;
  lineas: CotizacionLineaForm[];
}

export interface ActualizarCotizacionRequest {
  receptorNombre: string;
  receptorRfc: string;
  receptorEmail?: string;
  fecha: string;
  fechaVigencia?: string;
  notas?: string;
  moneda: string;
  lineas: CotizacionLineaForm[];
}
