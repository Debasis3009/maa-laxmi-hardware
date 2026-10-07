'use strict';
function number(value, label, min = 0, max = 1e9) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < min || n > max) throw new Error(`${label} must be between ${min} and ${max}.`);
  return n;
}
const money = value => Math.round(number(value, 'Amount', -1e9) * 100) / 100;
function calculate(items, sameState = true) {
  let subtotal = 0, discount = 0, taxable = 0, cgst = 0, sgst = 0, igst = 0;
  const lines = items.map(item => {
    const quantity = number(item.quantity, 'Quantity', 0.001, 1e6);
    if (Math.abs(quantity * 1000 - Math.round(quantity * 1000)) > 1e-6) throw new Error('Quantity supports up to three decimal places.');
    const unitPrice = money(number(item.unitPrice, 'Unit price', 0, 1e7));
    const discountRate = number(item.discount, 'Discount', 0, 100);
    const gstRate = number(item.gstRate, 'GST rate', 0, 100);
    const gross = Math.round(quantity * unitPrice * 100);
    const disc = Math.round(gross * discountRate / 100);
    const tax = gross - disc, gst = Math.round(tax * gstRate / 100);
    const c = sameState ? Math.round(gst / 2) : 0, s = sameState ? gst - c : 0, i = sameState ? 0 : gst;
    subtotal += gross; discount += disc; taxable += tax; cgst += c; sgst += s; igst += i;
    return {...item, quantity, unitPrice, discount: discountRate, gstRate, cgst: c/100, sgst: s/100, igst: i/100, lineTotal: (tax+gst)/100};
  });
  const before = taxable + cgst + sgst + igst, total = Math.round(before/100);
  return {items: lines, subtotal: subtotal/100, discount: discount/100, taxable: taxable/100, cgst: cgst/100, sgst: sgst/100, igst: igst/100, total, roundOff: (total*100-before)/100};
}
function gstin(value) {
  const v=String(value || '').trim().toUpperCase();
  if (v && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(v)) throw new Error('Enter a valid 15-character GSTIN or leave it blank.');
  return v || null;
}
module.exports={number,money,calculate,gstin};
