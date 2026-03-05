export interface Wallet {
  id: number;
  userId: number;
  rfcId: number | null;
  tipo: 'Global' | 'PorRfc';
  saldo: number;
  updatedAt: string;
}