export type Pair = 'GBPUSD' | 'EURUSD' | 'EURGBP';
export type Direction = 'LONG' | 'SHORT' | 'NO_TRADE';
export type Killzone = 'London' | 'NY';
export type SignalStatus = 'NEW' | 'ACTIVE' | 'EXPIRED' | 'HIT_TP' | 'HIT_SL';

export interface Signal {
  id: string;
  pair: Pair;
  direction: Direction;
  status: SignalStatus;
  entry: number;
  stopLoss: number;
  takeProfit: number;
  rr: number;
  killzone: Killzone;
  confidence: number;
  reasoning: string;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  preferredPairs: Pair[];
  notificationsEnabled: boolean;
}

export interface JournalTrade {
  id: string;
  pair: Pair;
  direction: Exclude<Direction, 'NO_TRADE'>;
  entry: number;
  exit: number;
  pnl: number;
  outcome: 'WIN' | 'LOSS';
  createdAt: string;
}

export interface DashboardSummary {
  currentSession: 'Asian' | 'London' | 'NY' | 'Off';
  adrToday: number;
  rollingWinRate: number;
  activeSignals: number;
}
