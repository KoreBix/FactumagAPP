import { DeduccionRequest } from "./DeduccionRequest";
import { OtroPagoRequest } from "./OtroPagoRequest";
import { PercepcionRequest } from "./PercepcionRequest";

export interface ComplementoNominaRequest {
  tipoNomina:             string;
  fechaPago:              string;
  fechaInicialPago:       string;
  fechaFinalPago:         string;
  diasPagados:            number;
  registroPatronal:       string;
  curpPatron:             string | null;
  entidadFederativa:      string;
  curpEmpleado:           string;
  nss:                    string;
  fechaInicioRelLaboral:  string;
  tipoContrato:           string;
  tipoRegimen:            string;
  numEmpleado:            string;
  departamento:           string | null;
  puesto:                 string | null;
  riesgoTrabajo:          string;
  periodicidadPago:       string;
  banco:                  string | null;
  cuentaBancaria:         string | null;
  salarioBase:            number;
  salarioDiarioIntegrado: number;
  claveEntFed:            string;
  totalSueldos:           number;
  totalExento:            number;
  totalGravado:           number;
  totalOtrasDeducciones:  number;
  totalImpuestosRetenidos:number;
  percepciones:           PercepcionRequest[];
  deducciones:            DeduccionRequest[] | null;
  otrosPagos:             OtroPagoRequest[]  | null;
}