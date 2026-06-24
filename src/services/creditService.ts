import {
  CreditAccountState,
  CreditApplication,
  CreditApplicationInput,
  CreditApplicationResult,
  CreditExpirationResult,
  CreditLedgerEntry,
  CreditPolicy,
  CreditPurchaseInput,
  CreditTransferInput,
  CreditTransferResult,
  DEFAULT_CREDIT_POLICY,
} from '../types/credit';

const generateId = (): string =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
};

const cloneLedgerEntry = (entry: CreditLedgerEntry): CreditLedgerEntry => ({
  ...entry,
  createdAt: new Date(entry.createdAt),
});

const cloneApplication = (application: CreditApplication): CreditApplication => ({
  ...application,
  createdAt: new Date(application.createdAt),
});

export const buildCreditAccount = (
  accountId: string,
  currency = 'USD',
  policy?: Partial<CreditPolicy>
): CreditAccountState => ({
  accountId,
  currency,
  balance: 0,
  reservedBalance: 0,
  revision: 0,
  policy: {
    ...DEFAULT_CREDIT_POLICY,
    ...policy,
  },
  lots: [],
  ledger: [],
  applications: [],
  nextExpirationAt: null,
});

export const normalizeCreditAccount = (
  account: Partial<CreditAccountState>
): CreditAccountState => ({
  ...buildCreditAccount(account.accountId ?? 'unknown', account.currency ?? 'USD', account.policy),
  ...account,
  policy: {
    ...DEFAULT_CREDIT_POLICY,
    ...account.policy,
  },
  lots: (account.lots ?? []).map((lot) => ({
    ...lot,
    createdAt: new Date(lot.createdAt),
    expiresAt: normalizeDate(lot.expiresAt),
  })),
  ledger: (account.ledger ?? []).map(cloneLedgerEntry),
  applications: (account.applications ?? []).map(cloneApplication),
  nextExpirationAt: normalizeDate(account.nextExpirationAt),
});

export const purchaseCredit = (
  account: CreditAccountState,
  input: CreditPurchaseInput
): CreditAccountState => {
  if (input.expectedRevision != null && input.expectedRevision !== account.revision) {
    throw new Error('Credit account revision mismatch');
  }

  const amount = Math.max(0, input.amount);
  const currency = input.currency ?? account.currency;
  const expiresAt =
    normalizeDate(input.expiresAt) ??
    (account.policy.expiryDays > 0
      ? new Date(Date.now() + account.policy.expiryDays * 24 * 60 * 60 * 1000)
      : null);

  const lot = {
    id: generateId(),
    amount,
    remainingAmount: amount,
    currency,
    createdAt: new Date(),
    expiresAt,
    note: input.note,
    reference: input.reference,
  };

  return {
    ...account,
    currency,
    balance: account.balance + amount,
    revision: account.revision + 1,
    lots: [...account.lots, lot],
    ledger: [
      ...account.ledger,
      {
        id: generateId(),
        type: 'purchase',
        amount,
        currency,
        createdAt: new Date(),
        reference: input.reference,
        note: input.note,
      },
    ],
    nextExpirationAt:
      expiresAt && (!account.nextExpirationAt || expiresAt < account.nextExpirationAt)
        ? expiresAt
        : account.nextExpirationAt,
  };
};

export const transferCredit = (
  source: CreditAccountState,
  target: CreditAccountState,
  input: CreditTransferInput
): CreditTransferResult => {
  if (input.expectedRevision != null && input.expectedRevision !== source.revision) {
    throw new Error('Credit account revision mismatch');
  }

  const amount = Math.max(0, Math.min(input.amount, source.balance));
  const currency = input.currency ?? source.currency;

  const sourceNext: CreditAccountState = {
    ...source,
    currency,
    balance: source.balance - amount,
    revision: source.revision + 1,
    ledger: [
      ...source.ledger,
      {
        id: generateId(),
        type: 'transfer_out',
        amount,
        currency,
        createdAt: new Date(),
        reference: input.reference,
        note: input.note,
      },
    ],
  };

  const targetNext: CreditAccountState = {
    ...target,
    currency,
    balance: target.balance + amount,
    revision: target.revision + 1,
    ledger: [
      ...target.ledger,
      {
        id: generateId(),
        type: 'transfer_in',
        amount,
        currency,
        createdAt: new Date(),
        reference: input.reference,
        note: input.note,
      },
    ],
  };

  return {
    source: sourceNext,
    target: targetNext,
  };
};

export const applyCreditToInvoice = (
  account: CreditAccountState,
  input: CreditApplicationInput
): CreditApplicationResult => {
  if (input.expectedRevision != null && input.expectedRevision !== account.revision) {
    throw new Error('Credit account revision mismatch');
  }

  const appliedAmount = Math.min(Math.max(0, input.invoiceTotal), account.balance);
  const remainingDue = Math.max(input.invoiceTotal - appliedAmount, 0);

  if (appliedAmount <= 0) {
    return {
      account,
      application: null,
      appliedAmount: 0,
      remainingDue,
    };
  }

  const application: CreditApplication = {
    id: generateId(),
    invoiceId: input.invoiceId,
    subscriptionId: input.subscriptionId,
    appliedAmount,
    remainingDue,
    currency: input.currency,
    createdAt: new Date(),
    reference: input.reference,
    note: input.note,
  };

  return {
    account: {
      ...account,
      balance: account.balance - appliedAmount,
      revision: account.revision + 1,
      applications: [...account.applications, application],
      ledger: [
        ...account.ledger,
        {
          id: generateId(),
          type: 'application',
          amount: appliedAmount,
          currency: input.currency,
          createdAt: new Date(),
          reference: input.reference,
          note: input.note,
        },
      ],
    },
    application,
    appliedAmount,
    remainingDue,
  };
};

export const expireCredits = (account: CreditAccountState): CreditExpirationResult => {
  const now = new Date();
  const expiredLots = account.lots.filter((lot) => lot.expiresAt != null && lot.expiresAt <= now);
  const expiredAmount = expiredLots.reduce((total, lot) => total + lot.remainingAmount, 0);

  if (expiredAmount <= 0) {
    return {
      account,
      expiredAmount: 0,
      notificationMessage: null,
    };
  }

  return {
    account: {
      ...account,
      balance: Math.max(account.balance - expiredAmount, 0),
      revision: account.revision + 1,
      lots: account.lots.filter((lot) => lot.expiresAt == null || lot.expiresAt > now),
      ledger: [
        ...account.ledger,
        {
          id: generateId(),
          type: 'expiration',
          amount: expiredAmount,
          currency: account.currency,
          createdAt: new Date(),
          note: 'Expired credit balance',
        },
      ],
      nextExpirationAt:
        account.lots
          .filter((lot) => lot.expiresAt != null && lot.expiresAt > now)
          .map((lot) => lot.expiresAt as Date)
          .sort((a, b) => a.getTime() - b.getTime())[0] ?? null,
    },
    expiredAmount,
    notificationMessage: `Expired ${expiredAmount.toFixed(2)} ${account.currency} in unused credits.`,
  };
};
