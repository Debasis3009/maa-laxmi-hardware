'use strict';
const {randomUUID}=require('node:crypto');
const {number,money,calculate,gstin}=require('./billingMath');
const now=()=>new Date().toISOString();
const receiptNo=()=>`MLH-RCP-${randomUUID()}`;
const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const methodOf=value=>{const v=String(value||'cash').toLowerCase();if(!['cash','upi','bank','card','cheque','other'].includes(v))throw new Error('Choose a valid payment method.');return v;};
const dateOf=value=>{const v=String(value||today());if(!/^\d{4}-\d{2}-\d{2}$/.test(v)||new Date(v+'T00:00:00Z').toISOString().slice(0,10)!==v)throw new Error('Enter a valid invoice date.');return v+'T12:00:00+05:30';};
async function createCustomerBillingService(db,auditService,inventoryService){
 const customerSelect=`SELECT c.*,c.opening_due-COALESCE((SELECT SUM(opening_applied) FROM payments WHERE customer_id=c.id),0) AS opening_balance,COALESCE((SELECT SUM(due_amount) FROM invoices WHERE customer_id=c.id AND status='issued'),0) AS invoice_due,COALESCE((SELECT SUM(unallocated_amount) FROM payments WHERE customer_id=c.id),0) AS advance_balance FROM customers c`;
 async function listCustomers(search=''){const q=`%${String(search).trim()}%`;return db.query(`${customerSelect} WHERE c.is_active=true AND (c.name ILIKE ? OR COALESCE(c.phone,'') ILIKE ? OR COALESCE(c.gstin,'') ILIKE ?) ORDER BY c.name`,[q,q,q]);}
 async function getCustomer(id){return await db.queryOne(`${customerSelect} WHERE c.id=? AND c.is_active=true`,[id])||null;}
 async function createCustomer(input,userId){
  const name=String(input.name||'').trim();if(!name)throw new Error('Customer name is required.');
  const opening=money(number(input.openingBalance,'Opening due')),credit=money(number(input.creditLimit,'Credit limit'));
  const id=randomUUID(),t=now();
  return db.transaction(async()=>{await db.run(`INSERT INTO customers(id,customer_code,name,phone,email,address,gstin,state,opening_due,credit_limit,notes,is_active,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[id,`CUST-${id.slice(0,12)}`,name,input.phone||null,input.email||null,input.address||null,gstin(input.gstin),input.state||'West Bengal',opening,credit,input.notes||null,true,t,t]);await auditService.log({userId,action:'CREATE_CUSTOMER',entityType:'customer',entityId:id,after:{name}});return getCustomer(id);});
 }
 const productSelect=`SELECT p.id,p.sku,p.name,p.selling_price,p.gst_rate,p.hsn_code,u.name unit_name,u.abbreviation unit_abbreviation,COALESCE(i.quantity_on_hand,0) quantity_on_hand FROM products p LEFT JOIN units u ON u.id=p.unit_id LEFT JOIN inventory i ON i.product_id=p.id AND i.variant_id IS NULL`;
 async function getProducts(search=''){const q=`%${String(search).trim()}%`;return db.query(`${productSelect} WHERE p.is_active=true AND (p.name ILIKE ? OR p.sku ILIKE ?) ORDER BY p.name`,[q,q]);}
 async function getProduct(id){return db.queryOne(`${productSelect} WHERE p.id=? AND p.is_active=true`,[id]);}
 async function nextInvoiceNo(){const year=today().slice(0,4);await db.queryOne("SELECT pg_advisory_xact_lock(hashtext('mlh-invoice-number'))");const r=await db.queryOne('SELECT MAX(invoice_number) n FROM invoices WHERE invoice_number LIKE ?',[`MLH-${year}-%`]);return `MLH-${year}-${String(r?.n?Number(r.n.split('-').pop())+1:1).padStart(5,'0')}`;}
 async function updateBalance(inv,applied){const paid=money(Number(inv.paid_amount)+applied),due=money(Number(inv.total)-paid);await db.run('UPDATE invoices SET paid_amount=?,due_amount=?,payment_status=?,updated_at=? WHERE id=?',[paid,due,due<=0?'paid':paid>0?'partial':'unpaid',now(),inv.id]);inv.paid_amount=paid;inv.due_amount=due;}
 async function applyAdvance(inv){
  if(!inv.customer_id||Number(inv.due_amount)<=0)return 0;
  const credits=await db.query('SELECT * FROM payments WHERE customer_id=? AND unallocated_amount>0 ORDER BY payment_date,id FOR UPDATE',[inv.customer_id]);let used=0;
  for(const p of credits){const applied=money(Math.min(Number(p.unallocated_amount),Number(inv.due_amount)));if(applied<=0)break;
   await db.run('UPDATE payments SET unallocated_amount=unallocated_amount-? WHERE id=?',[applied,p.id]);await db.run('INSERT INTO advance_allocations(payment_id,invoice_id,amount) VALUES(?,?,?)',[p.id,inv.id,applied]);await updateBalance(inv,applied);used=money(used+applied);
  }return used;
 }
 async function createInvoice(input,userId){
  if(!Array.isArray(input.items)||!input.items.length)throw new Error('At least one product is required.');
  const paid=money(number(input.paid,'Paid amount')),paymentMethod=paid>0?methodOf(input.paymentMethod):'cash';
  const invoiceDate=dateOf(input.invoiceDate),sellerGstin=gstin(input.sellerGstin);
  return db.transaction(async()=>{
   await db.queryOne("SELECT pg_advisory_xact_lock(hashtext('mlh-invoice-number'))");
   if(input.requestKey){const previous=await db.queryOne('SELECT id FROM invoices WHERE request_key=?',[input.requestKey]);if(previous)return getInvoice(previous.id);}
   if(input.customerId)await db.queryOne('SELECT id FROM customers WHERE id=? FOR UPDATE',[input.customerId]);
   const c=input.customerId?await getCustomer(input.customerId):null;if(input.customerId&&!c)throw new Error('Customer not found.');
   const name=c?.name||String(input.walkInName||'').trim();if(!name)throw new Error('Customer name is required.');
   const state=String(c?.state||input.walkInState||'West Bengal').trim(),sameState=state.toLowerCase()==='west bengal';
   const lines=[];for(const item of input.items){const p=await getProduct(item.productId);if(!p)throw new Error('Product not found.');lines.push({...item,sku:p.sku,productName:p.name,hsnCode:p.hsn_code,unitLabel:p.unit_abbreviation||p.unit_name||'unit',unitPrice:item.unitPrice??p.selling_price,gstRate:item.gstRate??p.gst_rate});}
   const totals=calculate(lines,sameState);if(paid>totals.total)throw new Error('Paid amount cannot exceed the invoice total.');
   const id=randomUUID(),invoiceNo=await nextInvoiceNo(),t=now(),due=money(totals.total-paid);
   await db.run(`INSERT INTO invoices(id,invoice_number,customer_id,invoice_date,status,payment_status,subtotal,discount,taxable_amount,cgst,sgst,igst,round_off,total,paid_amount,due_amount,place_of_supply,billing_name,billing_phone,billing_gstin,seller_gstin,billing_address,billing_state,billing_whatsapp,billing_customer_type,request_key,notes,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[id,invoiceNo,c?.id||null,invoiceDate,'issued',due<=0?'paid':paid>0?'partial':'unpaid',totals.subtotal,totals.discount,totals.taxable,totals.cgst,totals.sgst,totals.igst,totals.roundOff,totals.total,paid,due,state,name,c?.phone||input.walkInPhone||null,gstin(c?.gstin||input.walkInGstin),sellerGstin,c?.address||input.walkInAddress||null,state,input.walkInWhatsapp||c?.phone||null,c?'registered':'walk_in',input.requestKey||null,input.notes||null,userId,t,t]);
   // Stable product order avoids deadlocks across concurrent invoices.
   for(const item of [...totals.items].sort((a,b)=>a.productId.localeCompare(b.productId))){await db.run(`INSERT INTO invoice_items(invoice_id,product_id,sku,product_name,quantity,unit_price,discount,gst_rate,hsn,cgst,sgst,igst,line_total,unit_label) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,[id,item.productId,item.sku,item.productName,item.quantity,item.unitPrice,item.discount,item.gstRate,item.hsnCode,item.cgst,item.sgst,item.igst,item.lineTotal,item.unitLabel]);await inventoryService.recordStockTransaction({productId:item.productId,type:'sale',quantity:item.quantity,reason:`Invoice ${invoiceNo}`,referenceType:'invoice',referenceId:id,performedBy:userId});}
   if(paid>0)await db.run(`INSERT INTO payments(id,receipt_number,customer_id,invoice_id,payment_date,amount,method,reference_no,received_by) VALUES(?,?,?,?,?,?,?,?,?)`,[randomUUID(),receiptNo(),c?.id||null,id,t,paid,paymentMethod,input.paymentReference||null,userId]);
   if(input.useAdvance!==false&&c)await applyAdvance({id,customer_id:c.id,total:totals.total,paid_amount:paid,due_amount:due});
   await auditService.log({userId,action:'CREATE_INVOICE',entityType:'invoice',entityId:id,after:{invoiceNo,total:totals.total,customerType:c?'registered':'walk_in'}});return getInvoice(id);
  });
 }
 async function getInvoice(id){const i=await db.queryOne(`SELECT i.*,i.invoice_number AS invoice_no,i.paid_amount AS paid,i.due_amount AS due,UPPER(i.payment_status::text) payment_status,i.billing_name customer_name,i.billing_phone customer_phone,i.billing_address customer_address,i.billing_gstin customer_gstin,i.billing_state customer_state,to_char(i.invoice_date AT TIME ZONE 'Asia/Kolkata','YYYY-MM-DD') invoice_date FROM invoices i WHERE i.id=?`,[id]);if(!i)return null;return {...i,items:await db.query('SELECT * FROM invoice_items WHERE invoice_id=? ORDER BY id',[id]),payments:await db.query(`SELECT p.*,p.reference_no AS reference,p.payment_date AS paid_at,UPPER(p.method::text) method FROM payments p WHERE invoice_id=? ORDER BY payment_date`,[id]),advanceUsed:money((await db.queryOne('SELECT COALESCE(SUM(amount),0) amount FROM advance_allocations WHERE invoice_id=?',[id])).amount)};}
 async function recordPayment(input,userId){
  const amount=money(number(input.amount,'Payment',0.01)),method=methodOf(input.method),key=input.requestKey||randomUUID();
  return db.transaction(async()=>{
   await db.queryOne('SELECT pg_advisory_xact_lock(hashtext(?))',[`mlh-payment-${key}`]);if(await db.queryOne('SELECT id FROM payments WHERE request_key=?',[key]))return;
   let customer=null;if(input.customerId){await db.queryOne('SELECT id FROM customers WHERE id=? FOR UPDATE',[input.customerId]);customer=await getCustomer(input.customerId);if(!customer)throw new Error('Customer not found.');}
   let inv=null;if(input.invoiceId){inv=await db.queryOne("SELECT * FROM invoices WHERE id=? AND status='issued' FOR UPDATE",[input.invoiceId]);if(!inv)throw new Error('Invoice not found.');if((inv.customer_id||null)!==(customer?.id||null))throw new Error('Invoice does not belong to this customer.');if(amount>Number(inv.due_amount))throw new Error('Payment cannot exceed this invoice’s due. Use a customer advance instead.');}
   if(!customer&&!inv)throw new Error('Select a customer or invoice.');
   const id=randomUUID();let remaining=amount,opening=0;
   await db.run(`INSERT INTO payments(id,receipt_number,customer_id,invoice_id,payment_date,amount,method,reference_no,notes,received_by,request_key) VALUES(?,?,?,?,?,?,?,?,?,?,?)`,[id,receiptNo(),customer?.id||null,inv?.id||null,now(),amount,method,input.reference||null,input.notes||null,userId,key]);
   if(inv){await updateBalance(inv,amount);remaining=0;}else{
    opening=money(Math.min(remaining,Number(customer.opening_balance)));remaining=money(remaining-opening);
    const dues=await db.query("SELECT * FROM invoices WHERE customer_id=? AND due_amount>0 AND status='issued' ORDER BY invoice_date,id FOR UPDATE",[customer.id]);
    for(const i of dues){const applied=money(Math.min(remaining,Number(i.due_amount)));if(applied<=0)break;await db.run('INSERT INTO advance_allocations(payment_id,invoice_id,amount) VALUES(?,?,?)',[id,i.id,applied]);await updateBalance(i,applied);remaining=money(remaining-applied);}
   }
   await db.run('UPDATE payments SET unallocated_amount=?,opening_applied=? WHERE id=?',[remaining,opening,id]);
   await auditService.log({userId,action:'RECORD_PAYMENT',entityType:inv?'invoice':'customer',entityId:inv?.id||customer.id,after:{amount,method}});
  });
 }
 async function customerLedger(id){const c=await getCustomer(id);if(!c)return null;const invoices=await searchInvoices({customerId:id,limit:10000});const payments=await db.query(`SELECT p.*,p.reference_no reference,to_char(p.payment_date AT TIME ZONE 'Asia/Kolkata','YYYY-MM-DD HH24:MI') paid_at,UPPER(p.method::text) method,i.invoice_number invoice_no FROM payments p LEFT JOIN invoices i ON i.id=p.invoice_id WHERE p.customer_id=? ORDER BY p.payment_date,p.id`,[id]);const entries=[{date:String(c.created_at),label:'Opening due',debit:Number(c.opening_due),credit:0},...invoices.map(i=>({date:String(i.created_at),label:i.invoice_no,debit:Number(i.total),credit:0})),...payments.map(p=>({date:String(p.payment_date),label:p.receipt_number,debit:0,credit:Number(p.amount)}))].sort((a,b)=>new Date(a.date)-new Date(b.date));let balance=0;for(const e of entries){balance=money(balance+e.debit-e.credit);e.balance=balance;}return {customer:c,invoices,payments,entries,openingBalance:money(c.opening_balance),invoiceDue:money(c.invoice_due),advance:money(c.advance_balance),netOutstanding:money(Number(c.opening_balance)+Number(c.invoice_due)-Number(c.advance_balance))};}
 async function searchInvoices(f={}){const where=["i.status='issued'"],params=[];if(f.customerId){where.push('i.customer_id=?');params.push(f.customerId);}if(f.q){const q=`%${String(f.q).trim()}%`;where.push(`(i.invoice_number ILIKE ? OR COALESCE(i.billing_name,'') ILIKE ? OR COALESCE(i.billing_phone,'') ILIKE ?)`);params.push(q,q,q);}if(f.status){where.push('UPPER(i.payment_status::text)=?');params.push(String(f.status).toUpperCase());}for(const bound of ['from','to']){if(f[bound]){dateOf(f[bound]);where.push(`(i.invoice_date AT TIME ZONE 'Asia/Kolkata')::date${bound==='from'?'>=':'<='}?`);params.push(f[bound]);}}params.push(Math.min(Number(f.limit||100),10000));return db.query(`SELECT i.*,i.invoice_number invoice_no,i.paid_amount paid,i.due_amount due,UPPER(i.payment_status::text) payment_status,i.billing_name customer_name,i.billing_phone customer_phone,to_char(i.invoice_date AT TIME ZONE 'Asia/Kolkata','YYYY-MM-DD') invoice_date FROM invoices i WHERE ${where.join(' AND ')} ORDER BY i.invoice_date DESC,i.created_at DESC LIMIT ?`,params);}
 async function listInvoices(limit=50){return searchInvoices({limit});}
 async function salesSummary(period='day'){const end=today(),start=period==='month'?`${end.slice(0,7)}-01`:end;return db.queryOne(`SELECT COUNT(*) bills,COALESCE(SUM(total),0) sales,COALESCE(SUM(paid_amount),0) paid,COALESCE(SUM(due_amount),0) due,COALESCE((SELECT SUM(amount) FROM payments WHERE (payment_date AT TIME ZONE 'Asia/Kolkata')::date BETWEEN ? AND ? AND method='cash'),0) cash,COALESCE((SELECT SUM(amount) FROM payments WHERE (payment_date AT TIME ZONE 'Asia/Kolkata')::date BETWEEN ? AND ? AND method='upi'),0) upi FROM invoices WHERE status='issued' AND (invoice_date AT TIME ZONE 'Asia/Kolkata')::date BETWEEN ? AND ?`,[start,end,start,end,start,end]);}
 async function periodSales(from='',to=''){
  const end=to||today(),start=from||`${end.slice(0,7)}-01`;dateOf(start);dateOf(end);if(start>end)throw new Error('Start date must be before end date.');
  const daily=await db.query(`WITH sales AS (SELECT (invoice_date AT TIME ZONE 'Asia/Kolkata')::date AS period_date,COUNT(*) bills,SUM(total) sales,SUM(due_amount) due FROM invoices WHERE status='issued' GROUP BY 1),collections AS (SELECT (payment_date AT TIME ZONE 'Asia/Kolkata')::date AS period_date,SUM(amount) collected,SUM(CASE WHEN method='cash' THEN amount ELSE 0 END) cash,SUM(CASE WHEN method='upi' THEN amount ELSE 0 END) upi FROM payments GROUP BY 1) SELECT to_char(COALESCE(s.period_date,c.period_date),'YYYY-MM-DD') AS "day",COALESCE(s.bills,0) bills,COALESCE(s.sales,0) sales,COALESCE(s.due,0) due,COALESCE(c.collected,0) collected,COALESCE(c.cash,0) cash,COALESCE(c.upi,0) upi FROM sales s FULL JOIN collections c ON c.period_date=s.period_date WHERE COALESCE(s.period_date,c.period_date) BETWEEN ? AND ? ORDER BY COALESCE(s.period_date,c.period_date) DESC`,[start,end]);
  const grouped={};for(const d of daily){const month=d.day.slice(0,7);const g=grouped[month]||(grouped[month]={month,bills:0,sales:0,due:0,collected:0,cash:0,upi:0});for(const k of ['bills','sales','due','collected','cash','upi'])g[k]=money(g[k]+Number(d[k]));}
  return {start,end,daily,monthly:Object.values(grouped)};
 }
 async function outstandingReport(){const cs=await listCustomers();const result=cs.map(c=>({...c,total_due:money(Number(c.opening_balance)+Number(c.invoice_due)-Number(c.advance_balance))})).filter(c=>c.total_due>0);const walk=await db.query("SELECT id,billing_name name,billing_phone phone,due_amount total_due,'walk_in' customer_type FROM invoices WHERE customer_id IS NULL AND due_amount>0 AND status='issued'");return [...result,...walk].sort((a,b)=>b.total_due-a.total_due);}
 async function stockVsSalesReport(){return db.query(`SELECT p.id,p.sku,p.name,COALESCE(inv.quantity_on_hand,0) quantity_on_hand,COALESCE((SELECT SUM(ii.quantity) FROM invoice_items ii JOIN invoices i ON i.id=ii.invoice_id WHERE ii.product_id=p.id AND i.status='issued'),0) qty_sold FROM products p LEFT JOIN inventory inv ON inv.product_id=p.id AND inv.variant_id IS NULL WHERE p.is_active=true ORDER BY qty_sold DESC,p.name`);}
 return {listCustomers,getCustomer,createCustomer,getProducts,getProduct,createInvoice,getInvoice,listInvoices,recordPayment,customerLedger,searchInvoices,salesSummary,periodSales,outstandingReport,stockVsSalesReport,dashboardSummary:()=>salesSummary('day')};
}
module.exports={createCustomerBillingService};
