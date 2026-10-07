'use strict';
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {createApp}=require('../lib/core/src/app');
const ROLLBACK=Symbol('billing-verification-rollback');
async function verifyBilling(app){
 const db=app.db,svc=app.customerBillingService;let checks=0;
 const counts=()=>db.queryOne('SELECT (SELECT count(*) FROM invoices) invoices,(SELECT count(*) FROM payments) payments,(SELECT count(*) FROM customers) customers,(SELECT count(*) FROM products) products');
 const before=await counts();
 try{await db.transaction(async()=>{
  const user=await app.userService.getOwner();assert(user,'Configured owner required.');
  const category=await db.queryOne('SELECT id FROM categories LIMIT 1'),unit=await db.queryOne('SELECT id FROM units LIMIT 1');assert(category&&unit,'Catalog must be configured.');
  await db.queryOne('INSERT INTO auth_otp_challenges(user_id,channel,destination,otp_hash,expires_at,purpose) VALUES(?,?,?,?,?,?) RETURNING id',[user.id,'email','qa@example.test','test-hash',new Date(Date.now()+300000).toISOString(),'login']);
  const tag=randomUUID(),product=await app.productService.createProduct({sku:`QA-${tag}`,name:'Billing verification fixture',categoryId:category.id,unitId:unit.id,sellingPrice:100,gstRate:18,openingStock:20},user.id);
  assert.equal(Number(product.stock.quantity_on_hand),20);checks++;
  const c=await svc.createCustomer({name:`QA ${tag}`,state:'West Bengal',address:'Original address',openingBalance:50},user.id);
  const item={productId:product.id,quantity:2,unitPrice:100,discount:10,gstRate:18};
  const key=randomUUID(),inv=await svc.createInvoice({customerId:c.id,invoiceDate:'2026-10-07',items:[item],paid:50,paymentMethod:'cash',requestKey:key},user.id);
  assert.equal(Number(inv.total),212);assert.equal(Number(inv.cgst),16.2);assert.equal(Number(inv.sgst),16.2);assert.equal(Number(inv.due),162);assert.equal(inv.payment_status,'PARTIAL');assert.equal(inv.billing_customer_type,'registered');checks++;
  const duplicate=await svc.createInvoice({customerId:c.id,invoiceDate:'2026-10-07',items:[item],paid:50,paymentMethod:'cash',requestKey:key},user.id);assert.equal(duplicate.id,inv.id);assert.equal(Number((await app.inventoryService.getStockStatus(product.id)).quantity_on_hand),18);checks++;
  await db.run('UPDATE customers SET name=?,address=? WHERE id=?',['Changed name','Changed address',c.id]);const snapshot=await svc.getInvoice(inv.id);assert.equal(snapshot.customer_name,`QA ${tag}`);assert.equal(snapshot.customer_address,'Original address');checks++;
  const payKey=randomUUID();await svc.recordPayment({customerId:c.id,invoiceId:inv.id,amount:100,method:'upi',requestKey:payKey},user.id);await svc.recordPayment({customerId:c.id,invoiceId:inv.id,amount:100,method:'upi',requestKey:payKey},user.id);assert.equal(Number((await svc.getInvoice(inv.id)).due),62);checks++;
  await svc.recordPayment({customerId:c.id,amount:200,method:'cash'},user.id);const ledger=await svc.customerLedger(c.id);assert.equal(ledger.openingBalance,0);assert.equal(ledger.invoiceDue,0);assert.equal(ledger.advance,88);assert.equal(ledger.netOutstanding,-88);assert.equal(ledger.entries.at(-1).balance,-88);checks++;
  const next=await svc.createInvoice({customerId:c.id,items:[{...item,quantity:1,discount:0}],paid:0},user.id);assert.equal(Number(next.total),118);assert.equal(Number(next.paid),88);assert.equal(Number(next.due),30);assert.equal(next.advanceUsed,88);assert.equal((await svc.customerLedger(c.id)).advance,0);checks++;
  const walk=await svc.createInvoice({walkInName:`Walk ${tag}`,walkInPhone:'9000000000',walkInAddress:'Walk-in address',walkInState:'Odisha',sellerGstin:'19ABCDE1234F1Z5',items:[{...item,quantity:0.5,discount:0}],paid:10,paymentMethod:'cash'},user.id);assert.equal(walk.customer_id,null);assert.equal(walk.customer_address,'Walk-in address');assert.equal(walk.billing_customer_type,'walk_in');assert.equal(Number(walk.igst),9);assert.equal(Number(walk.total),59);checks++;
  await svc.recordPayment({invoiceId:walk.id,amount:49,method:'upi'},user.id);assert.equal((await svc.getInvoice(walk.id)).payment_status,'PAID');assert.equal((await svc.listCustomers()).filter(x=>x.name===`Walk ${tag}`).length,0);checks++;
  const bad=await svc.createCustomer({name:`Other ${tag}`},user.id);await assert.rejects(()=>svc.recordPayment({customerId:bad.id,invoiceId:inv.id,amount:1},user.id),/belong/);await assert.rejects(()=>svc.recordPayment({invoiceId:walk.id,amount:1},user.id),/exceed/);checks++;
  for(const fields of [{quantity:0},{quantity:NaN},{quantity:100},{discount:101},{gstRate:-1},{unitPrice:-1}])await assert.rejects(()=>svc.createInvoice({walkInName:'Invalid',items:[{...item,...fields}]},user.id));assert.equal(Number((await app.inventoryService.getStockStatus(product.id)).quantity_on_hand),16.5);checks++;
  const rows=await svc.searchInvoices({q:tag});assert.equal(rows.length,2);assert((await svc.outstandingReport()).some(x=>x.id===c.id&&x.total_due===30));assert((await svc.stockVsSalesReport()).some(x=>x.id===product.id&&Number(x.qty_sold)===3.5));await svc.salesSummary('day');await svc.salesSummary('month');const periods=await svc.periodSales('2026-01-01','2026-12-31');assert(periods.daily.length);assert(periods.monthly.length);checks++;
  await assert.rejects(()=>svc.createInvoice({walkInName:'Invalid',sellerGstin:'BAD',items:[item]},user.id),/GSTIN/);checks++;
  throw ROLLBACK;
 });}catch(e){if(e!==ROLLBACK)throw e;}
 assert.deepEqual(await counts(),before);checks++;
 return {checks,rollbackVerified:true};
}
module.exports={verifyBilling};
if(require.main===module){(async()=>{const app=await createApp();try{console.log('Billing verification:',JSON.stringify(await verifyBilling(app)));}finally{await app.db.close();}})().catch(e=>{console.error('Billing verification failed:',e.message);process.exitCode=1;});}
