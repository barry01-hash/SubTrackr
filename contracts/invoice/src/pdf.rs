extern crate alloc;

use alloc::format;
use alloc::string::{String as StdString, ToString};
use soroban_sdk::{Bytes, Env};
use subtrackr_types::{Invoice, InvoiceLineItem};

fn line_item_text(item: &InvoiceLineItem) -> StdString {
    format!(
        "{} | qty {} | unit {} {} | total {} | tax {} bps",
        item.description.to_string(),
        item.quantity,
        item.unit_price,
        item.currency.to_string(),
        item.line_total,
        item.tax_rate_bps
    )
}

fn collect_lines(invoice: &Invoice) -> StdString {
    let mut body = StdString::new();
    body.push_str("SubTrackr Invoice\n");
    body.push_str("=================\n");
    body.push_str(&format!(
        "Invoice number: {}\n",
        invoice.invoice_number.to_string()
    ));
    body.push_str(&format!("Invoice ID: {}\n", invoice.id));
    body.push_str(&format!("Subscription ID: {}\n", invoice.subscription_id));
    body.push_str(&format!("Status: {:?}\n", invoice.status));
    body.push_str(&format!("Currency: {}\n", invoice.currency.to_string()));
    body.push_str(&format!("Region: {}\n", invoice.region.to_string()));
    body.push_str(&format!("Due date: {}\n", invoice.due_date));
    body.push_str("\nBranding:\n");
    body.push_str(&format!(
        "Primary color: {}\n",
        invoice.branding.primary_color.to_string()
    ));
    body.push_str(&format!(
        "Accent color: {}\n",
        invoice.branding.accent_color.to_string()
    ));
    body.push_str(&format!(
        "Logo URI: {}\n",
        invoice.branding.logo_uri.to_string()
    ));
    body.push_str(&format!(
        "Locale: {}\n",
        invoice.branding.locale.to_string()
    ));
    body.push_str(&format!(
        "Date format: {}\n",
        invoice.branding.date_format.to_string()
    ));
    body.push_str(&format!(
        "Currency position: {}\n",
        invoice.branding.currency_position.to_string()
    ));
    body.push_str(&format!(
        "PO number: {}\n",
        invoice.branding.po_number.to_string()
    ));
    body.push_str(&format!("VAT ID: {}\n", invoice.branding.vat_id.to_string()));
    body.push_str(&format!(
        "Cost center: {}\n",
        invoice.branding.cost_center.to_string()
    ));
    body.push_str(&format!(
        "Department: {}\n",
        invoice.branding.department.to_string()
    ));
    body.push_str(&format!(
        "Payment terms: {}\n",
        invoice.branding.payment_terms.to_string()
    ));
    body.push_str(&format!(
        "Late fee policy: {}\n",
        invoice.branding.late_fee_policy.to_string()
    ));
    body.push_str(&format!("Footer note: {}\n", invoice.branding.footer_note.to_string()));
    body.push_str("\nCustom fields:\n");
    for field in invoice.branding.custom_fields.iter() {
        body.push_str(&format!(
            "  - {}: {}\n",
            field.label.to_string(),
            field.value.to_string()
        ));
    }
    body.push_str("\nLine items:\n");
    for item in invoice.line_items.iter() {
        body.push_str("  - ");
        body.push_str(&line_item_text(&item));
        body.push('\n');
    }
    body.push('\n');
    body.push_str(&format!("Subtotal: {}\n", invoice.subtotal));
    body.push_str(&format!("Tax: {}\n", invoice.tax));
    body.push_str(&format!("Total: {}\n", invoice.total));
    if invoice.branding.legal_text.len() > 240 {
        body.push_str("\n--- Page 2 ---\n");
    }
    body.push_str(&invoice.branding.legal_text.to_string());
    body.push('\n');
    body
}

pub fn render_pdf(env: &Env, invoice: &Invoice) -> Bytes {
    let content = collect_lines(invoice);
    let escaped = content
        .replace('\\', "\\\\")
        .replace('(', "\\(")
        .replace(')', "\\)");
    let pdf = format!(
        "%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length {} >> stream\nBT /F1 10 Tf 40 800 Td ({}) Tj\nET\nendstream endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\nxref\n0 6\n0000000000 65535 f \ntrailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF\n",
        escaped.len(),
        escaped
    );

    Bytes::from_slice(env, pdf.as_bytes())
}
