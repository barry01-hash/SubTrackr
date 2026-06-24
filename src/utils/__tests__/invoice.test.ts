import { expect, describe, it } from '@jest/globals';
import { BillingCycle, SubscriptionCategory } from '../../types/subscription';
import {
  buildBillingPeriod,
  calculateInvoiceTax,
  calculateInvoiceTotals,
  convertCurrencyAmount,
  formatInvoiceNumber,
} from '../invoice';
import { DEFAULT_INVOICE_CONFIG, InvoiceStatus } from '../../types/invoice';
import {
  DEFAULT_INVOICE_BRANDING,
  formatInvoiceCurrency,
  formatInvoiceDate,
  getInvoicePreviewLines,
  normalizeInvoiceBranding,
  truncateInvoiceField,
} from '../invoiceBranding';

describe('invoice utilities', () => {
  it('formats invoice numbers with configurable padding', () => {
    expect(formatInvoiceNumber(7)).toBe('INV-000007');
    expect(
      formatInvoiceNumber(42, {
        ...DEFAULT_INVOICE_CONFIG,
        numberingPrefix: 'ACME',
        numberingPadding: 4,
      })
    ).toBe('ACME-0042');
  });

  it('calculates tax and totals consistently', () => {
    expect(calculateInvoiceTax(10000, 500)).toBe(500);
    expect(
      calculateInvoiceTotals(
        [
          {
            description: 'Pro plan',
            quantity: 1,
            unitPrice: 10000,
            currency: 'USD',
            exchangeRate: 1_000_000,
            taxRateBps: 500,
            lineTotal: 10000,
          },
        ],
        500
      )
    ).toEqual({ subtotal: 10000, tax: 500, total: 10500 });
  });

  it('converts currency amounts using the configured scale', () => {
    expect(convertCurrencyAmount(100, 1_250_000)).toBe(125);
    expect(convertCurrencyAmount(100, 1_000_000)).toBe(100);
  });

  it('derives a billing period from the subscription cycle', () => {
    const period = buildBillingPeriod({
      id: 'sub-1',
      name: 'Pro',
      category: SubscriptionCategory.SOFTWARE,
      price: 100,
      currency: 'USD',
      billingCycle: BillingCycle.MONTHLY,
      nextBillingDate: new Date('2026-05-01T00:00:00Z'),
      isActive: true,
      isCryptoEnabled: false,
      createdAt: new Date('2026-04-01T00:00:00Z'),
      updatedAt: new Date('2026-04-01T00:00:00Z'),
    });

    expect(period.end.toISOString()).toBe('2026-05-01T00:00:00.000Z');
    expect(period.start.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('keeps invoice status values aligned with the contract model', () => {
    expect(InvoiceStatus.DRAFT).toBe('draft');
    expect(InvoiceStatus.PAID).toBe('paid');
  });

  it('normalizes branding inputs and formats locale-aware values', () => {
    const branding = normalizeInvoiceBranding({
      ...DEFAULT_INVOICE_BRANDING,
      currencyPosition: 'suffix',
      dateFormat: 'YYYY-MM-DD',
      customFields: [{ label: 'Department', value: 'Operations' }],
      legalText: 'This is a long legal note that should survive normalization.',
    });

    expect(formatInvoiceDate(new Date('2026-06-24T00:00:00Z'), branding)).toBe('2026-06-24');
    expect(formatInvoiceCurrency(1234.5, 'USD', branding)).toContain('$');
    expect(truncateInvoiceField('x'.repeat(100), 20)).toBe('x'.repeat(17) + '...');
    expect(getInvoicePreviewLines(branding)).toContain('Custom fields:');
    expect(getInvoicePreviewLines(branding)).toContain('Department: Operations');
  });
});
