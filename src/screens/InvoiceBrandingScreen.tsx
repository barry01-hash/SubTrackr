import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { colors, spacing, typography, borderRadius } from '../utils/constants';
import { useInvoiceStore } from '../store';
import { RootStackParamList } from '../navigation/types';
import { generateInvoicePdfPreview } from '../utils/invoice';
import {
  INVOICE_FIELD_LIMIT,
  type InvoiceDateFormat,
  normalizeInvoiceBranding,
  truncateInvoiceField,
} from '../utils/invoiceBranding';
import { Invoice, InvoiceStatus } from '../types/invoice';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SAMPLE_INVOICE: Invoice = {
  id: 'preview-invoice',
  invoiceNumber: 'INV-000001',
  subscriptionId: 'sample-subscription',
  subscriptionName: 'Sample Subscription',
  merchantName: 'Sample Merchant',
  lineItems: [
    {
      description: 'Pro plan',
      quantity: 1,
      unitPrice: 12000,
      currency: 'USD',
      exchangeRate: 1_000_000,
      taxRateBps: 500,
      lineTotal: 12000,
    },
  ],
  tax: 600,
  total: 12600,
  subtotal: 12000,
  dueDate: new Date('2026-06-30T00:00:00Z'),
  status: InvoiceStatus.DRAFT,
  currency: 'USD',
  region: 'GLOBAL',
  exchangeRate: 1_000_000,
  period: {
    start: new Date('2026-06-01T00:00:00Z'),
    end: new Date('2026-06-30T00:00:00Z'),
  },
  createdAt: new Date('2026-06-01T00:00:00Z'),
  updatedAt: new Date('2026-06-01T00:00:00Z'),
};

const DATE_FORMATS: InvoiceDateFormat[] = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];

const InvoiceBrandingScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const branding = useInvoiceStore((state) => state.branding);
  const setBranding = useInvoiceStore((state) => state.setBranding);
  const resetBranding = useInvoiceStore((state) => state.resetBranding);

  const [logoUri, setLogoUri] = useState(branding.logoUri ?? '');
  const [primaryColor, setPrimaryColor] = useState(branding.primaryColor);
  const [accentColor, setAccentColor] = useState(branding.accentColor);
  const [footerNote, setFooterNote] = useState(branding.footerNote);
  const [paymentTerms, setPaymentTerms] = useState(branding.paymentTerms);
  const [lateFeePolicy, setLateFeePolicy] = useState(branding.lateFeePolicy);
  const [legalText, setLegalText] = useState(branding.legalText);
  const [poNumber, setPoNumber] = useState(branding.poNumber);
  const [vatId, setVatId] = useState(branding.vatId);
  const [costCenter, setCostCenter] = useState(branding.costCenter);
  const [department, setDepartment] = useState(branding.department);
  const [locale, setLocale] = useState(branding.locale);
  const [currencyPosition, setCurrencyPosition] = useState(branding.currencyPosition);
  const [dateFormat, setDateFormat] = useState<InvoiceDateFormat>(branding.dateFormat);
  const [customFields, setCustomFields] = useState(branding.customFields);
  const [draftLabel, setDraftLabel] = useState('');
  const [draftValue, setDraftValue] = useState('');

  const nextBranding = useMemo(
    () =>
      normalizeInvoiceBranding({
        logoUri,
        primaryColor,
        accentColor,
        footerNote,
        paymentTerms,
        lateFeePolicy,
        legalText,
        poNumber,
        vatId,
        costCenter,
        department,
        locale,
        currencyPosition,
        dateFormat,
        customFields,
      }),
    [
      logoUri,
      primaryColor,
      accentColor,
      footerNote,
      paymentTerms,
      lateFeePolicy,
      legalText,
      poNumber,
      vatId,
      costCenter,
      department,
      locale,
      currencyPosition,
      dateFormat,
      customFields,
    ]
  );

  const preview = useMemo(
    () => generateInvoicePdfPreview({ ...SAMPLE_INVOICE, branding: nextBranding }),
    [nextBranding]
  );

  const save = () => {
    setBranding(nextBranding);
    Alert.alert('Branding saved', 'Invoice branding will be used for new previews and exports.');
  };

  const addCustomField = () => {
    const label = draftLabel.trim();
    const value = draftValue.trim();

    if (!label && !value) {
      return;
    }

    const nextFields = [...customFields, { label, value }];
    setCustomFields(nextFields);
    setDraftLabel('');
    setDraftValue('');

    if (label.length > INVOICE_FIELD_LIMIT || value.length > INVOICE_FIELD_LIMIT) {
      Alert.alert(
        'Field trimmed',
        'Custom field values are limited to keep invoice layouts readable. Long values were truncated.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} testID="invoice-branding-screen">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Invoice Branding</Text>
          <Text style={styles.subtitle}>
            Customize invoices with your logo, colors, fields, and legal notes.
          </Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Brand Assets</Text>
          <TextInput
            style={styles.input}
            placeholder="Logo URI"
            placeholderTextColor={colors.textSecondary}
            value={logoUri}
            onChangeText={setLogoUri}
            autoCapitalize="none"
          />
          <View style={styles.colorRow}>
            <TextInput
              style={[styles.input, styles.colorInput]}
              placeholder="Primary color"
              placeholderTextColor={colors.textSecondary}
              value={primaryColor}
              onChangeText={setPrimaryColor}
              autoCapitalize="characters"
            />
            <TextInput
              style={[styles.input, styles.colorInput]}
              placeholder="Accent color"
              placeholderTextColor={colors.textSecondary}
              value={accentColor}
              onChangeText={setAccentColor}
              autoCapitalize="characters"
            />
          </View>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoPreview} resizeMode="contain" />
          ) : (
            <Text style={styles.helperText}>Paste a logo URL or local URI to preview it here.</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Custom Fields</Text>
          <TextInput
            style={styles.input}
            placeholder="PO number"
            placeholderTextColor={colors.textSecondary}
            value={poNumber}
            onChangeText={setPoNumber}
          />
          <TextInput
            style={styles.input}
            placeholder="VAT ID"
            placeholderTextColor={colors.textSecondary}
            value={vatId}
            onChangeText={setVatId}
          />
          <TextInput
            style={styles.input}
            placeholder="Cost center"
            placeholderTextColor={colors.textSecondary}
            value={costCenter}
            onChangeText={setCostCenter}
          />
          <TextInput
            style={styles.input}
            placeholder="Department"
            placeholderTextColor={colors.textSecondary}
            value={department}
            onChangeText={setDepartment}
          />
          {customFields.length > 0 ? (
            customFields.map((field, index) => (
              <View key={`${field.label}-${index}`} style={styles.customFieldRow}>
                <Text style={styles.customFieldLabel}>
                  {truncateInvoiceField(field.label || `Field ${index + 1}`, 22)}
                </Text>
                <Text style={styles.customFieldValue}>{truncateInvoiceField(field.value, 44)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.helperText}>No extra custom fields yet.</Text>
          )}
          <View style={styles.colorRow}>
            <TextInput
              style={[styles.input, styles.colorInput]}
              placeholder="Field label"
              placeholderTextColor={colors.textSecondary}
              value={draftLabel}
              onChangeText={setDraftLabel}
            />
            <TextInput
              style={[styles.input, styles.colorInput]}
              placeholder="Field value"
              placeholderTextColor={colors.textSecondary}
              value={draftValue}
              onChangeText={setDraftValue}
            />
          </View>
          <Button title="Add custom field" variant="outline" onPress={addCustomField} />
          <Text style={styles.helperText}>
            Add one or more extra fields. Values above {INVOICE_FIELD_LIMIT} characters are trimmed
            automatically.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Legal Copy</Text>
          <TextInput
            style={styles.input}
            placeholder="Footer note"
            placeholderTextColor={colors.textSecondary}
            value={footerNote}
            onChangeText={setFooterNote}
          />
          <TextInput
            style={styles.input}
            placeholder="Payment terms"
            placeholderTextColor={colors.textSecondary}
            value={paymentTerms}
            onChangeText={setPaymentTerms}
          />
          <TextInput
            style={styles.input}
            placeholder="Late fee policy"
            placeholderTextColor={colors.textSecondary}
            value={lateFeePolicy}
            onChangeText={setLateFeePolicy}
          />
          <TextInput
            style={styles.textArea}
            placeholder="Legal text"
            placeholderTextColor={colors.textSecondary}
            value={legalText}
            onChangeText={setLegalText}
            multiline
          />
          <Text style={styles.helperText}>
            Long legal text automatically continues onto a second page in the invoice preview.
          </Text>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Locale and Layout</Text>
          <View style={styles.colorRow}>
            <TextInput
              style={[styles.input, styles.colorInput]}
              placeholder="Locale"
              placeholderTextColor={colors.textSecondary}
              value={locale}
              onChangeText={setLocale}
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, styles.colorInput]}
              placeholder="Date format"
              placeholderTextColor={colors.textSecondary}
              value={dateFormat}
              onChangeText={(value) =>
                setDateFormat(
                  DATE_FORMATS.includes(value as InvoiceDateFormat)
                    ? (value as InvoiceDateFormat)
                    : branding.dateFormat
                )
              }
            />
          </View>
          <View style={styles.segmentedRow}>
            {(['prefix', 'suffix'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.segment, currencyPosition === option && styles.segmentActive]}
                onPress={() => setCurrencyPosition(option)}>
                <Text
                  style={[
                    styles.segmentText,
                    currencyPosition === option && styles.segmentTextActive,
                  ]}>
                  {option === 'prefix' ? 'Currency prefix' : 'Currency suffix'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.previewCard}>
          <Text style={styles.sectionTitle}>Preview</Text>
          <Text style={styles.previewMeta}>
            {nextBranding.logoUri ? 'Logo configured' : 'No logo yet'} · {nextBranding.locale}
          </Text>
          <Text style={styles.previewText}>{preview}</Text>
        </Card>

        <View style={styles.actions}>
          <Button title="Save branding" onPress={save} />
          <Button
            title="Reset branding"
            variant="outline"
            onPress={() => {
              resetBranding();
              navigation.goBack();
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.md },
  header: { gap: spacing.xs },
  title: { ...typography.h1, color: colors.text },
  subtitle: { ...typography.body, color: colors.textSecondary },
  card: { gap: spacing.sm },
  previewCard: { gap: spacing.sm, marginBottom: spacing.xl },
  sectionTitle: { ...typography.h3, color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 120,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlignVertical: 'top',
  },
  colorRow: { flexDirection: 'row', gap: spacing.sm },
  colorInput: { flex: 1 },
  logoPreview: {
    width: '100%',
    height: 120,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  helperText: { ...typography.caption, color: colors.textSecondary },
  customFieldRow: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    backgroundColor: colors.surface,
  },
  customFieldLabel: { ...typography.caption, color: colors.textSecondary },
  customFieldValue: { ...typography.body, color: colors.text },
  segmentedRow: { flexDirection: 'row', gap: spacing.sm },
  segment: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  segmentActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  segmentText: { ...typography.body, color: colors.text },
  segmentTextActive: { color: colors.primary, fontWeight: '700' },
  previewMeta: { ...typography.caption, color: colors.textSecondary },
  previewText: {
    ...typography.caption,
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    minHeight: 220,
  },
  actions: { gap: spacing.sm, marginBottom: spacing.xl },
});

export default InvoiceBrandingScreen;
