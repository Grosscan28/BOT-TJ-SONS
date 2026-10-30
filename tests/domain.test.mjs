import test from 'node:test';
import assert from 'node:assert/strict';
import {cents,totals,finance,canRead,validateSchedule,validateReport,accountBalance} from '../lib/domain.ts';
const entry=(kind,data,id=kind)=>({id,kind,data,version:1,createdAt:'2026-10-30',updatedAt:'2026-10-30'});
test('money rounds line amounts, discounts services only, and applies SST selectively',()=>{
 const t=totals({items:[{quantity:1,rate:2807.2,taxable:true},{quantity:5,rate:20,taxable:false}],discount:12,mobilisation:3000,taxRate:8});
 assert.equal(t.subtotal,290720);assert.equal(t.discount,34886);assert.equal(t.mobilisation,300000);assert.equal(t.tax,19763);assert.equal(t.total,575597);
 assert.throws(()=>cents('12.345'));assert.throws(()=>cents(-1));assert.throws(()=>totals({items:[],discount:101}));
});
test('partial payments are cash, not quotation value; transfers are neither income nor expense',()=>{
 const records=[entry('quotations',{items:[{quantity:1,rate:9999}]}),entry('invoices',{status:'Issued',items:[{quantity:1,rate:1000}]},'invoice'),entry('payments',{amount:500,invoiceId:'invoice',date:'2026-10-30',accountId:'bank'}),entry('expenses',{amount:100,date:'2026-10-30',accountId:'bank'}),entry('transfers',{amount:200,fromAccountId:'bank',toAccountId:'cash'})];
 assert.deepEqual(finance(records,'2026-10'),{paid:50000,spent:10000,net:40000,outstanding:50000});
 assert.equal(accountBalance(entry('accounts',{opening:1000},'bank'),records),120000);
});
test('PIC access is limited to assigned work orders',()=>{assert.equal(canRead('pic','a',entry('workorders',{picId:'a'})),true);assert.equal(canRead('pic','b',entry('workorders',{picId:'a'})),false);assert.equal(canRead('pic','a',entry('invoices',{picId:'a'})),false)});
test('assignment rejects conflicts and documents expiring before job end',()=>{
 const job={picId:'a',teamId:'t',truckId:'truck',start:'2026-10-30T01:00:00Z',end:'2026-10-30T05:00:00Z'};
 const truck=entry('fleet',{status:'Available',insurance:'2027-01-01',roadtax:'2027-01-01',puspakom:'2027-01-01'});
 assert.doesNotThrow(()=>validateSchedule(job,[],truck));assert.throws(()=>validateSchedule(job,[entry('workorders',{...job,status:'Scheduled',number:'WO-1'})],truck),/conflicts/);
 assert.throws(()=>validateSchedule(job,[],{...truck,data:{...truck.data,roadtax:'2026-10-29'}}),/roadtax/);
});
test('report requires all checklists and before/after photos in every area',()=>{
 const job={items:[{area:'A'},{area:'B'}],report:{A:{pumped:true,cleaned:true,safe:true},B:{pumped:true,cleaned:true,safe:true}}};const files=[{area:'A',category:'before'},{area:'A',category:'after'},{area:'B',category:'before'}];
 assert.throws(()=>validateReport(job,files),/after photo for B/);assert.doesNotThrow(()=>validateReport(job,[...files,{area:'B',category:'after'}]));
});
