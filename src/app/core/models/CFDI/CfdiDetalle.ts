import { CfdiComplemento } from "./CfdiComplemento";
import { CfdiLinea } from "./CfdiLinea";
import { CfdiList } from "./CfdiList";

export interface CfdiDetalle extends CfdiList {
  rfcId: number;
  emisorRazonSocial: string;
  serie: string;
  formaPago: string;
  metodoPago: string;
  moneda: string;
  subTotal: number;
  descuento: number;
  lineas: CfdiLinea[];
  complementos: CfdiComplemento[];
  createdAt: string;
}