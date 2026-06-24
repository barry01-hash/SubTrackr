export interface CreditPolicy {
  expiryDays: number;
  transferFeeBps: number;
  minimumTopUp: number;
  bonusRate: number;
}

export interface CreditLot {
  id: string;
  amount: number;
  remainingAmount: number;
  currency: string;
  createdAt: Date;
  expiresAt: Date | null;
  note?: string;
  reference?: string;
}

export interface CreditLedgerEntry {
  id: string;
  type: 'purchase' | 'transfer_in' | 'transfer_out' | 'application' | 'expiration';
  amount: number;
  currency: string;
  createdAt: Date;
  reference?: string;
  note?: string;
}

export interface CreditApplication {
  id: string;
  invoiceId: string;
  subscriptionId: string;
  appliedAmount: number;
  remainingDue: number;
  currency: string;
  createdAt: Date;
  reference?: string;
  note?: string;
}

export interface CreditAccountState {
  accountId: string;
  currency: string;
  balance: number;
  reservedBalance: number;
  revision: number;
  policy: CreditPolicy;
  lots: CreditLot[];
  ledger: CreditLedgerEntry[];
  applications: CreditApplication[];
  nextExpirationAt: Date | null;
}

export interface CreditPurchaseInput {
  amount: number;
  currency?: string;
  expectedRevision?: number;
  note?: string;
  reference?: string;
  subscriptionId?: string;
  expiresAt?: Date | null;
}

export interface CreditTransferInput {
  amount: number;
  currency?: string;
  expectedRevision?: number;
  note?: string;
  reference?: string;
}

export interface CreditApplicationInput {
  invoiceId: string;
  subscriptionId: string;
  invoiceTotal: number;
  currency: string;
  expectedRevision?: number;
  reference?: string;
  note?: string;
}

export interface CreditApplicationResult {
  account: CreditAccountState;
  application: CreditApplication | null;
  appliedAmount: number;
  remainingDue: number;
}

export interface CreditTransferResult {
  source: CreditAccountState;
  target: CreditAccountState;
}

export interface CreditExpirationResult {
  account: CreditAccountState;
  expiredAmount: number;
  notificationMessage: string | null;
}

export const DEFAULT_CREDIT_POLICY: CreditPolicy = {
  expiryDays: 365,
  transferFeeBps: 0,
  minimumTopUp: 0,
  bonusRate: 0,
};
