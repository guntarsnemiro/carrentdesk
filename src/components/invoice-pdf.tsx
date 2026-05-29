/**
 * Server-side PDF template for invoices.
 * Rendered via @react-pdf/renderer in the /api/invoices/[id]/pdf route.
 */
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const BRAND = "#1d4ed8";
const GRAY  = "#6b7280";
const LIGHT = "#f3f4f6";

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#111827",
    padding: 48,
    lineHeight: 1.5,
  },
  /* Header */
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 32 },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: BRAND },
  headerRight: { textAlign: "right" },
  invoiceTitle: { fontSize: 24, fontFamily: "Helvetica-Bold", color: BRAND, marginBottom: 4 },
  invoiceNumber: { fontSize: 11, color: GRAY },
  /* Parties */
  parties: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24 },
  partyBlock: { width: "46%" },
  partyLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  partyName: { fontFamily: "Helvetica-Bold", marginBottom: 2 },
  partyLine: { color: GRAY, marginBottom: 1 },
  /* Meta row */
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 24, backgroundColor: LIGHT, padding: 10, borderRadius: 4 },
  metaCell: { flex: 1 },
  metaLabel: { fontSize: 8, color: GRAY, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { fontFamily: "Helvetica-Bold" },
  /* Table */
  tableHeader: { flexDirection: "row", backgroundColor: BRAND, color: "white", padding: "6 8", borderRadius: 3, marginBottom: 2 },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: LIGHT },
  tableRowAlt: { flexDirection: "row", padding: "5 8", backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: LIGHT },
  colDesc: { flex: 3 },
  colNum: { flex: 1, textAlign: "right" },
  /* Totals */
  totalsSection: { flexDirection: "row", justifyContent: "flex-end", marginTop: 12 },
  totalsTable: { width: 200 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsLabel: { color: GRAY },
  totalsValue: {},
  totalRowFinal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#d1d5db", paddingTop: 6, marginTop: 4 },
  totalFinalLabel: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  totalFinalValue: { fontFamily: "Helvetica-Bold", fontSize: 12, color: BRAND },
  /* Footer */
  footer: { position: "absolute", bottom: 32, left: 48, right: 48, borderTopWidth: 1, borderTopColor: LIGHT, paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
  footerText: { fontSize: 8, color: GRAY },
  /* Notes */
  notes: { marginTop: 24, backgroundColor: LIGHT, padding: 10, borderRadius: 4 },
  notesLabel: { fontSize: 8, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  notesText: { color: GRAY, fontSize: 9 },
});

interface InvoiceRow {
  invoice_number: string;
  issue_date: string;
  due_date?: string | null;
  seller_name: string;
  seller_reg_number?: string | null;
  seller_vat_number?: string | null;
  seller_address?: string | null;
  seller_bank_name?: string | null;
  seller_iban?: string | null;
  seller_swift?: string | null;
  buyer_type: string;
  buyer_name: string;
  buyer_reg_number?: string | null;
  buyer_vat_number?: string | null;
  buyer_address?: string | null;
  buyer_email?: string | null;
  currency: string;
  subtotal: number | string;
  vat_amount: number | string;
  total: number | string;
  payment_terms?: string | null;
  notes?: string | null;
}

interface ItemRow {
  description: string;
  quantity: number | string;
  unit_price: number | string;
  vat_rate: number | string;
  line_total: number | string;
}

function fmt(n: number | string) { return Number(n).toFixed(2); }

function fmtDate(d: string | null | undefined) {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

export function InvoicePdf({ invoice, items }: { invoice: InvoiceRow; items: ItemRow[] }) {
  const cur = invoice.currency === "EUR" ? "€" : invoice.currency === "GBP" ? "£" : "$";

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{invoice.seller_name}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceNumber}>{invoice.invoice_number}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={styles.parties}>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>From</Text>
            <Text style={styles.partyName}>{invoice.seller_name}</Text>
            {invoice.seller_reg_number && <Text style={styles.partyLine}>Reg: {invoice.seller_reg_number}</Text>}
            {invoice.seller_vat_number && <Text style={styles.partyLine}>VAT: {invoice.seller_vat_number}</Text>}
            {invoice.seller_address && <Text style={styles.partyLine}>{invoice.seller_address}</Text>}
          </View>
          <View style={styles.partyBlock}>
            <Text style={styles.partyLabel}>To</Text>
            <Text style={styles.partyName}>{invoice.buyer_name}</Text>
            {invoice.buyer_reg_number && <Text style={styles.partyLine}>Reg: {invoice.buyer_reg_number}</Text>}
            {invoice.buyer_vat_number && <Text style={styles.partyLine}>VAT: {invoice.buyer_vat_number}</Text>}
            {invoice.buyer_address && <Text style={styles.partyLine}>{invoice.buyer_address}</Text>}
            {invoice.buyer_email && <Text style={styles.partyLine}>{invoice.buyer_email}</Text>}
          </View>
        </View>

        {/* Meta */}
        <View style={styles.metaRow}>
          {[
            { label: "Issue date", value: fmtDate(invoice.issue_date) },
            { label: "Due date", value: invoice.due_date ? fmtDate(invoice.due_date) : invoice.payment_terms ?? "Due on receipt" },
            { label: "Currency", value: invoice.currency },
          ].map((m) => (
            <View key={m.label} style={styles.metaCell}>
              <Text style={styles.metaLabel}>{m.label}</Text>
              <Text style={styles.metaValue}>{m.value}</Text>
            </View>
          ))}
        </View>

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={styles.colDesc}>Description</Text>
          <Text style={styles.colNum}>Qty</Text>
          <Text style={styles.colNum}>Unit price</Text>
          <Text style={styles.colNum}>VAT %</Text>
          <Text style={styles.colNum}>Total</Text>
        </View>
        {items.map((item, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.colDesc}>{item.description}</Text>
            <Text style={styles.colNum}>{Number(item.quantity)}</Text>
            <Text style={styles.colNum}>{cur}{fmt(item.unit_price)}</Text>
            <Text style={styles.colNum}>{Number(item.vat_rate)}%</Text>
            <Text style={styles.colNum}>{cur}{fmt(Number(item.quantity) * Number(item.unit_price))}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsTable}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{cur}{fmt(invoice.subtotal)}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>VAT</Text>
              <Text style={styles.totalsValue}>{cur}{fmt(invoice.vat_amount)}</Text>
            </View>
            <View style={styles.totalRowFinal}>
              <Text style={styles.totalFinalLabel}>Total</Text>
              <Text style={styles.totalFinalValue}>{cur}{fmt(invoice.total)}</Text>
            </View>
          </View>
        </View>

        {/* Banking */}
        {(invoice.seller_bank_name || invoice.seller_iban) && (
          <View style={{ marginTop: 20 }}>
            <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold", color: GRAY, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>
              Bank transfer details
            </Text>
            {invoice.seller_bank_name && <Text style={{ color: GRAY }}>{invoice.seller_bank_name}</Text>}
            {invoice.seller_iban && <Text style={{ color: GRAY, fontFamily: "Helvetica-Bold" }}>IBAN: {invoice.seller_iban}</Text>}
            {invoice.seller_swift && <Text style={{ color: GRAY }}>SWIFT: {invoice.seller_swift}</Text>}
          </View>
        )}

        {/* Notes */}
        {invoice.notes && (
          <View style={styles.notes}>
            <Text style={styles.notesLabel}>Notes</Text>
            <Text style={styles.notesText}>{invoice.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{invoice.seller_name}</Text>
          <Text style={styles.footerText}>{invoice.invoice_number} · {fmtDate(invoice.issue_date)}</Text>
        </View>

      </Page>
    </Document>
  );
}
