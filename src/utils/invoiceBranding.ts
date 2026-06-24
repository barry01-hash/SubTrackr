export type InvoiceDateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
export type InvoiceCurrencyPosition = 'prefix' | 'suffix';

export interface InvoiceBrandingCustomField {
  label: string;
  value: string;
}

export interface InvoiceBrandingConfig {
  logoUri?: string;
  primaryColor: string;
  accentColor: string;
  footerNote: string;
  paymentTerms: string;
  lateFeePolicy: string;
  legalText: string;
  poNumber: string;
  vatId: string;
  costCenter: string;
  department: string;
  locale: string;
  currencyPosition: InvoiceCurrencyPosition;
  dateFormat: InvoiceDateFormat;
  customFields: InvoiceBrandingCustomField[];
}

export const INVOICE_FIELD_LIMIT = 80;
export const INVOICE_LEGAL_TEXT_LIMIT = 600;

export const DEFAULT_INVOICE_BRANDING: InvoiceBrandingConfig = {
  logoUri: '',
  primaryColor: '#0F172A',
  accentColor: '#2563EB',
  footerNote: 'Thank you for your business.',
  paymentTerms: 'Net 14',
  lateFeePolicy: 'Late fees may apply after the due date.',
  legalText: 'All services are billed according to the agreed subscription terms.',
  poNumber: '',
  vatId: '',
  costCenter: '',
  department: '',
  locale: 'en-US',
  currencyPosition: 'prefix',
  dateFormat: 'MM/DD/YYYY',
  customFields: [],
};

const clampText = (value: string | undefined, maxLength = INVOICE_FIELD_LIMIT): string =>
  (value ?? '').slice(0, maxLength);

export const normalizeInvoiceBranding = (
  branding?: Partial<InvoiceBrandingConfig> | null
): InvoiceBrandingConfig => ({
  ...DEFAULT_INVOICE_BRANDING,
  ...branding,
  logoUri: clampText(branding?.logoUri, 256),
  footerNote: clampText(branding?.footerNote),
  paymentTerms: clampText(branding?.paymentTerms),
  lateFeePolicy: clampText(branding?.lateFeePolicy),
  legalText: clampText(branding?.legalText, INVOICE_LEGAL_TEXT_LIMIT),
  poNumber: clampText(branding?.poNumber),
  vatId: clampText(branding?.vatId),
  costCenter: clampText(branding?.costCenter),
  department: clampText(branding?.department),
  locale: branding?.locale ?? DEFAULT_INVOICE_BRANDING.locale,
  currencyPosition: branding?.currencyPosition ?? DEFAULT_INVOICE_BRANDING.currencyPosition,
  dateFormat: branding?.dateFormat ?? DEFAULT_INVOICE_BRANDING.dateFormat,
  customFields: Array.isArray(branding?.customFields)
    ? branding.customFields.map((field) => ({
        label: clampText(field.label),
        value: clampText(field.value),
      }))
    : [],
});

export const truncateInvoiceField = (value: string, maxLength = INVOICE_FIELD_LIMIT): string =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

export const formatInvoiceDate = (date: Date, branding: InvoiceBrandingConfig): string => {
  const year = date.getUTCFullYear();
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0');
  const day = `${date.getUTCDate()}`.padStart(2, '0');

  if (branding.dateFormat === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }

  if (branding.dateFormat === 'DD/MM/YYYY') {
    return `${day}/${month}/${year}`;
  }

  return `${month}/${day}/${year}`;
};

export const formatInvoiceCurrency = (
  amount: number,
  currency: string,
  branding: InvoiceBrandingConfig
): string => {
  const formatter = new Intl.NumberFormat(branding.locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  });
  const parts = formatter.formatToParts(amount);
  const currencyPart = parts.find((part) => part.type === 'currency')?.value ?? currency;
  const body = parts
    .filter((part) => part.type !== 'currency')
    .map((part) => part.value)
    .join('')
    .trim();

  return branding.currencyPosition === 'suffix'
    ? `${body} ${currencyPart}`.trim()
    : `${currencyPart}${body.startsWith(' ') ? '' : ' '}${body}`.trim();
};

export const getInvoicePreviewLines = (branding: InvoiceBrandingConfig): string[] => {
  const lines = [
    `Brand: ${branding.primaryColor} / ${branding.accentColor}`,
    `Locale: ${branding.locale} · Date format: ${branding.dateFormat}`,
    `Currency placement: ${branding.currencyPosition}`,
    `PO number: ${branding.poNumber || 'Not set'}`,
    `VAT ID: ${branding.vatId || 'Not set'}`,
    `Cost center: ${branding.costCenter || 'Not set'}`,
    `Department: ${branding.department || 'Not set'}`,
    `Footer: ${branding.footerNote}`,
    `Payment terms: ${branding.paymentTerms}`,
    `Late fee policy: ${branding.lateFeePolicy}`,
    'Legal text:',
  ];

  const customFieldLines = branding.customFields.map(
    (field) => `${field.label || 'Custom field'}: ${field.value || 'Not set'}`
  );

  const legalWords = branding.legalText.split(/\s+/);
  const legalLines: string[] = [];
  let current = '';

  legalWords.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > 70) {
      if (current) {
        legalLines.push(current);
      }
      current = word;
    } else {
      current = next;
    }
  });

  if (current) {
    legalLines.push(current);
  }

  return [...lines, 'Custom fields:', ...customFieldLines, ...legalLines];
};
