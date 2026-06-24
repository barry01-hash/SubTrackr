import { BillingCycle, Subscription } from '../types/subscription';
import {
  DEFAULT_INVOICE_CONFIG,
  Invoice,
  InvoiceConfig,
  InvoiceLineItem,
  InvoicePeriod,
  InvoiceStatus,
  InvoiceTotals,
} from '../types/invoice';
import { formatCurrency } from './formatting';
import {
  getInvoicePreviewLines,
  normalizeInvoiceBranding,
  formatInvoiceCurrency,
  formatInvoiceDate,
} from './invoiceBranding';

const SECOND = 1000;
const DAY = 24 * 60 * 60 * SECOND;

export const calculateInvoiceTax = (subtotal: number, taxRateBps: number): number => {
  return Math.round((subtotal * taxRateBps) / 10_000);
};

export const convertCurrencyAmount = (
  amount: number,
  exchangeRate: number,
  scale: number = DEFAULT_INVOICE_CONFIG.exchangeRateScale
): number => {
  if (!Number.isFinite(amount) || !Number.isFinite(exchangeRate) || scale <= 0) {
    return 0;
  }
  return Math.round((amount * exchangeRate) / scale);
};

export const formatInvoiceNumber = (
  sequence: number,
  config: InvoiceConfig = DEFAULT_INVOICE_CONFIG
): string => {
  const padded = `${Math.max(sequence, 1)}`.padStart(config.numberingPadding, '0');
  return `${config.numberingPrefix}-${padded}`;
};

export const calculateInvoiceTotals = (
  lineItems: InvoiceLineItem[],
  taxRateBps: number
): InvoiceTotals => {
  const subtotal = lineItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const tax = calculateInvoiceTax(subtotal, taxRateBps);
  return {
    subtotal,
    tax,
    total: subtotal + tax,
  };
};

export const buildBillingPeriod = (subscription: Subscription): InvoicePeriod => {
  const end = new Date(subscription.nextBillingDate);
  const start = new Date(end.getTime());

  switch (subscription.billingCycle) {
    case BillingCycle.YEARLY:
      start.setFullYear(start.getFullYear() - 1);
      break;
    case BillingCycle.WEEKLY:
      start.setDate(start.getDate() - 7);
      break;
    case BillingCycle.CUSTOM:
      start.setMonth(start.getMonth() - 1);
      break;
    case BillingCycle.MONTHLY:
    default:
      start.setMonth(start.getMonth() - 1);
      break;
  }

  return { start, end };
};

export const buildInvoiceLineItem = (
  subscription: Subscription,
  config: InvoiceConfig = DEFAULT_INVOICE_CONFIG,
  exchangeRate = config.exchangeRateScale,
  taxRateBps = config.defaultTaxRateBps
): InvoiceLineItem => {
  const unitPrice = convertCurrencyAmount(
    subscription.price,
    exchangeRate,
    config.exchangeRateScale
  );

  return {
    description: subscription.name,
    quantity: 1,
    unitPrice,
    currency: config.defaultCurrency,
    exchangeRate,
    taxRateBps,
    lineTotal: unitPrice,
  };
};

export const buildInvoice = (
  subscription: Subscription,
  sequence: number,
  period: InvoicePeriod,
  config: InvoiceConfig = DEFAULT_INVOICE_CONFIG,
  taxRateBps = config.defaultTaxRateBps,
  exchangeRate = config.exchangeRateScale,
  region = config.defaultRegion,
  recipientEmail?: string,
  notes?: string
): Invoice => {
  const lineItem = buildInvoiceLineItem(subscription, config, exchangeRate, taxRateBps);
  const totals = calculateInvoiceTotals([lineItem], taxRateBps);
  const createdAt = new Date();
  const dueDate = new Date(period.end.getTime() + config.paymentTermsDays * DAY);
  const branding = normalizeInvoiceBranding(config.branding);

  return {
    id: `${subscription.id}-${sequence}`,
    invoiceNumber: formatInvoiceNumber(sequence, config),
    subscriptionId: subscription.id,
    subscriptionName: subscription.name,
    merchantName: subscription.description ?? subscription.name,
    lineItems: [lineItem],
    tax: totals.tax,
    total: totals.total,
    subtotal: totals.subtotal,
    dueDate,
    status: InvoiceStatus.DRAFT,
    currency: config.defaultCurrency,
    region,
    exchangeRate,
    period,
    createdAt,
    updatedAt: createdAt,
    recipientEmail,
    notes,
    branding,
  };
};

export const generateInvoicePdfPreview = (invoice: Invoice): string => {
  const branding = normalizeInvoiceBranding(invoice.branding);
  const lines = [
    'SubTrackr Invoice',
    `Primary color: ${branding.primaryColor}`,
    `Accent color: ${branding.accentColor}`,
    `Locale: ${branding.locale}`,
    branding.logoUri ? `Logo: ${branding.logoUri}` : 'Logo: not set',
    `Invoice: ${invoice.invoiceNumber}`,
    `Status: ${invoice.status}`,
    `Period: ${formatInvoiceDate(invoice.period.start, branding)} - ${formatInvoiceDate(invoice.period.end, branding)}`,
    `Due: ${formatInvoiceDate(invoice.dueDate, branding)}`,
    `Subtotal: ${formatInvoiceCurrency(invoice.subtotal, invoice.currency, branding)}`,
    `Tax: ${formatInvoiceCurrency(invoice.tax, invoice.currency, branding)}`,
    `Total: ${formatInvoiceCurrency(invoice.total, invoice.currency, branding)}`,
    branding.poNumber ? `PO Number: ${branding.poNumber}` : '',
    branding.vatId ? `VAT ID: ${branding.vatId}` : '',
    branding.costCenter ? `Cost Center: ${branding.costCenter}` : '',
    branding.department ? `Department: ${branding.department}` : '',
    branding.paymentTerms ? `Payment Terms: ${branding.paymentTerms}` : '',
    branding.lateFeePolicy ? `Late Fee Policy: ${branding.lateFeePolicy}` : '',
    branding.footerNote ? `Footer: ${branding.footerNote}` : '',
    'Items:',
    ...invoice.lineItems.map(
      (item) =>
        `${item.description} x${item.quantity} @ ${formatCurrency(item.unitPrice, item.currency)}`
    ),
    ...getInvoicePreviewLines(branding),
    ...(branding.legalText.length > 240
      ? ['--- Page 2 ---', branding.legalText]
      : [branding.legalText]),
  ];

  return lines.filter(Boolean).join('\n');
};
