export type Role = 'owner'|'admin'|'pic';
export type Kind = 'customers'|'enquiries'|'quotations'|'pos'|'workorders'|'invoices'|'payments'|'expenses'|'fleet'|'teams'|'accounts'|'transfers'|'settings';
export type Data = Record<string, any>;
export type Item = { area:string; serviceName?:string; description:string; quantity:number; unit:string; rate:number; taxable:boolean };
export type Entry = { id:string;kind:Kind;data:Data;version:number;createdAt:string;updatedAt:string };
export const kinds:Kind[]=['customers','enquiries','quotations','pos','workorders','invoices','payments','expenses','fleet','teams','accounts','transfers','settings'];
export function fail(message:string):never {throw new Error(message)}
export function cents(n:unknown):number {const s=String(n??'');if(!/^\d+(\.\d{1,2})?$/.test(s))fail('Amount must be a non-negative number with at most 2 decimals.');const v=Math.round(Number(s)*100);if(!Number.isSafeInteger(v)||v>1e12)fail('Amount is too large.');return v;}
export function totals(d:Data) {
 const items:Item[]=d.items??[];let subtotal=0,taxable=0;
 for(const x of items){if(!Number.isFinite(Number(x.quantity))||Number(x.quantity)<=0||Number(x.quantity)>1e6)fail('Item quantity must be positive.');const amount=Math.round(Number(x.quantity)*cents(x.rate));subtotal+=amount;if(x.taxable)taxable+=amount;}
 const discount=Number(d.discount??0),tax=Number(d.taxRate??0);if(discount<0||discount>100||tax<0||tax>100||!Number.isFinite(discount+tax))fail('Invalid discount or tax rate.');
 const deduction=Math.round(subtotal*discount/100),net=subtotal-deduction,mobilisation=cents(d.mobilisation??0);
 const taxAmount=Math.round((Math.round(taxable*(1-discount/100))+(d.mobilisationTaxable?mobilisation:0))*tax/100);
 return {subtotal,discount:deduction,net,mobilisation,tax:taxAmount,total:net+mobilisation+taxAmount};
}
export function money(c:number){return new Intl.NumberFormat('en-MY',{style:'currency',currency:'MYR'}).format(c/100)}
export function paymentSum(invoiceId:string,entries:Entry[]){return entries.filter(r=>r.kind==='payments'&&r.data.invoiceId===invoiceId).reduce((s,r)=>s+cents(r.data.amount),0)}
export function invoiceTotal(r:Entry){return totals(r.data).total}
export function finance(entries:Entry[],month?:string){const selected=(r:Entry)=>!month||String(r.data.date??r.createdAt).startsWith(month);const paid=entries.filter(r=>r.kind==='payments'&&selected(r)).reduce((s,r)=>s+cents(r.data.amount),0);const spent=entries.filter(r=>r.kind==='expenses'&&selected(r)).reduce((s,r)=>s+cents(r.data.amount),0);const invoices=entries.filter(r=>r.kind==='invoices'&&r.data.status!=='Void');const outstanding=invoices.reduce((s,r)=>s+Math.max(0,invoiceTotal(r)-paymentSum(r.id,entries)),0);return {paid,spent,net:paid-spent,outstanding};}
export function canRead(role:Role,memberId:string,r:Entry){return role!=='pic'||r.kind==='workorders'&&r.data.picId===memberId;}
export function timeOverlap(a:Data,b:Data){return new Date(a.start).getTime()<new Date(b.end).getTime()&&new Date(b.start).getTime()<new Date(a.end).getTime();}
export function validateSchedule(d:Data,others:Entry[],fleet:Entry|undefined){
 if(!d.picId||!d.truckId||!d.teamId||!d.start||!d.end)fail('Choose PIC, team, truck and start/end time.');
 const start=new Date(d.start).getTime(),end=new Date(d.end).getTime();if(!Number.isFinite(start+end)||end<=start)fail('End time must be after start time.');
 if(!fleet||fleet.data.status!=='Available')fail('Truck is not available.');
 for(const key of ['insurance','roadtax','puspakom']){const expiry=fleet.data[key];if(!expiry||new Date(expiry+'T23:59:59+08:00').getTime()<end)fail(`Truck ${key} is missing or expires before the job ends.`);}
 for(const r of others){if(['Cancelled','Completed','Draft'].includes(r.data.status))continue;if(timeOverlap(d,r.data)&&(r.data.picId===d.picId||r.data.truckId===d.truckId||r.data.teamId===d.teamId))fail(`Schedule conflicts with ${r.data.number}: PIC, team or truck is already assigned.`);}
}
export const transitions:Record<string,string[]>={Scheduled:['Confirmed','Reschedule requested'],Confirmed:['Travelling','Reschedule requested'],Travelling:['On site','Reschedule requested'],'On site':['In progress'],'In progress':['Pending review'],'Needs revision':['Pending review']};
export function validateReport(d:Data,attached:Data[]){
 const areas=[...new Set((d.items??[]).map((x:Item)=>x.area||'General'))];if(!areas.length)fail('Work order has no scope.');
 for(const area of areas){const report=d.report?.[String(area)];if(!report?.pumped||!report?.cleaned||!report?.safe)fail(`Complete every checklist in ${area}.`);for(const category of ['before','after'])if(!attached.some(f=>f.area===area&&f.category===category))fail(`Add a ${category} photo for ${area}.`);}
}
export function accountBalance(account:Entry,entries:Entry[]){return cents(account.data.opening??0)+entries.reduce((sum,r)=>{
 if(r.kind==='payments'&&r.data.accountId===account.id)return sum+cents(r.data.amount);
 if(r.kind==='expenses'&&r.data.accountId===account.id)return sum-cents(r.data.amount);
 if(r.kind==='transfers'){if(r.data.toAccountId===account.id)sum+=cents(r.data.amount);if(r.data.fromAccountId===account.id)sum-=cents(r.data.amount);}return sum;},0);}
