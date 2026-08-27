"use client";

import { Printer, X, Download } from "lucide-react";

export default function InvoiceView({ invoice, onClose }) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="invoice-modal-overlay fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="invoice-card bg-white border border-line rounded-2xl max-w-2xl w-full p-8 md:p-12 shadow-2xl relative my-8">
        {/* Modal Controls (Not printed) */}
        <div className="invoice-controls flex justify-between items-center mb-8 pb-4 border-b border-line print:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="btn btn-solid btn-sm"
              style={{ fontSize: "0.8rem", padding: "6px 14px" }}
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-mist hover:text-emerald hover:bg-stone-100"
              aria-label="Close invoice"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Invoice Printable Document */}
        <div className="invoice-document space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <span className="brand-mark inline-block border border-gold text-gold px-2 py-0.5 text-xs font-bold mb-2">
                SL
              </span>
              <h2 className="font-serif text-2xl font-bold text-emerald">{invoice.hotel.name}</h2>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed mt-1">
                {invoice.hotel.address}<br />
                {invoice.hotel.phone} · {invoice.hotel.email}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xs font-bold uppercase tracking-widest text-gold block mb-1">
                Official Tax Invoice
              </span>
              <div className="font-mono text-sm font-bold text-stone-800">{invoice.invoice_number}</div>
              <div className="text-xs text-stone-500 mt-1">Date: {invoice.issued_date}</div>
            </div>
          </div>

          {/* Guest / Reservation Details */}
          <div className="grid grid-cols-2 gap-6 p-4 bg-stone-50 border border-line rounded-lg text-xs">
            <div>
              <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-1">Billed To</span>
              <strong className="text-stone-900 text-sm block">{invoice.guest.name}</strong>
              <span className="text-stone-600 block">{invoice.guest.email}</span>
              {invoice.guest.phone && <span className="text-stone-600 block">{invoice.guest.phone}</span>}
            </div>

            <div>
              <span className="text-stone-400 font-semibold uppercase tracking-wider block mb-1">
                {invoice.type} Details
              </span>
              {invoice.booking.room_type && (
                <div className="text-stone-700">
                  <strong>{invoice.booking.room_type}</strong> (Room {invoice.booking.room_number || "TBC"})<br />
                  {invoice.booking.check_in} → {invoice.booking.check_out}<br />
                  {invoice.booking.guests}
                </div>
              )}
              {invoice.booking.event_type && (
                <div className="text-stone-700">
                  <strong>{invoice.booking.event_type}</strong> ({invoice.booking.venue || "Venue TBC"})<br />
                  {invoice.booking.event_date}<br />
                  {invoice.booking.guests}
                </div>
              )}
              {invoice.booking.date && (
                <div className="text-stone-700">
                  Date: {invoice.booking.date} at {invoice.booking.time}<br />
                  Party: {invoice.booking.covers}
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-stone-300 text-stone-500 uppercase">
                  <th className="text-left py-2">Description</th>
                  <th className="text-center py-2">Qty</th>
                  <th className="text-right py-2">Unit Rate</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {invoice.line_items.map((item, i) => (
                  <tr key={i} className="text-stone-800">
                    <td className="py-2.5 font-medium">{item.description}</td>
                    <td className="py-2.5 text-center text-stone-500">{item.qty}</td>
                    <td className="py-2.5 text-right text-stone-500">{item.unit}</td>
                    <td className="py-2.5 text-right font-mono font-semibold">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          {invoice.totals && (
            <div className="border-t border-line pt-4 flex justify-end">
              <div className="w-64 space-y-2 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal:</span>
                  <span className="font-mono">{invoice.totals.subtotal}</span>
                </div>
                {invoice.totals.tax && (
                  <div className="flex justify-between text-stone-500 text-2xs">
                    <span>{invoice.totals.tax_label}:</span>
                    <span className="font-mono">{invoice.totals.tax}</span>
                  </div>
                )}
                {invoice.totals.service_charge && (
                  <div className="flex justify-between text-stone-500 text-2xs">
                    <span>{invoice.totals.service_charge_label}:</span>
                    <span className="font-mono">{invoice.totals.service_charge}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-emerald border-t border-line pt-2">
                  <span>Total (LKR):</span>
                  <span className="font-serif text-base">{invoice.totals.grand_total}</span>
                </div>
              </div>
            </div>
          )}

          {/* Footer Notes */}
          <div className="border-t border-stone-200 pt-6 text-center text-3xs text-stone-400">
            <p>Thank you for choosing St. Lachland Hotel, Negombo. We hope you enjoy your stay.</p>
            <p className="mt-1">Registered Hotel Entity · VAT Reg: SL-94002-E · Sri Lanka Tourism Development Authority</p>
          </div>
        </div>
      </div>
    </div>
  );
}
