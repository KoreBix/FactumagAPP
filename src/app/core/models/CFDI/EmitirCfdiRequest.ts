import { CfdiRelacionadoRequest } from "./CfdiRelacionadoRequest";
import { ComplementoNominaRequest } from "./ComplementoNominaRequest";
import { ConceptoRequest } from "./ConceptoRequest";

export interface EmitirCfdiRequest {
  rfcId: number;
  tipoComprobante: string;
  formaPago: string;
  metodoPago: string;
  lugarExpedicion: string;
  moneda: string;
  serie: string;
  usoCfdi: string;
  receptorRfc: string;
  receptorNombre: string;
  receptorUsoCfdi: string;
  receptorRegimen: string;
  receptorCp: string;
  conceptos: ConceptoRequest[];
  proveedorOverride?: string;
  cfdiRelacionados?: CfdiRelacionadoRequest[];
  complementoNomina?: ComplementoNominaRequest | null;
}