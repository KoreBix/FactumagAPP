export interface PlantillaCfdi {
  id: number;
  userId: number;
  tenantId: number | null;
  nombre: string;
  descripcion: string | null;
  datosJson: string;
  activo: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CrearPlantillaCfdiRequest {
  nombre: string;
  descripcion?: string;
  datosJson: string;
}

export interface ActualizarPlantillaCfdiRequest {
  nombre: string;
  descripcion?: string;
  datosJson: string;
}
