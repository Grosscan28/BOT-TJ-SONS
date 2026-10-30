import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {createRequire} from 'node:module';
import {readFileSync,mkdirSync} from 'node:fs';
import {totals,paymentSum,finance,accountBalance,validateReport,timeOverlap} from '../lib/domain.ts';
import {importRequestedDummy} from '../lib/requested-dummy.ts';
const require=createRequire(import.meta.url);const {build}=require(require.resolve('esbuild',{paths:[require.resolve('vite')]}));
mkdirSync('.sites-runtime/tests',{recursive:true});
await build({entryPoints:['lib/import-business-dummy.ts'],outfile:'.sites-runtime/tests/business-dummy.mjs',bundle:true,platform:'node',format:'esm'});
const {importBusinessDummy}=await import('../.sites-runtime/tests/business-dummy.mjs');
test('complete training flow preserves existing data, links documents, supplies evidence and balances finances',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0000_handy_sentinel.sql','utf8'));
 const db={prepare(query){let values=[];return {bind(...args){values=args;return this},async first(){return sql.prepare(query).get(...values)},async all(){return {results:sql.prepare(query).all(...values)}},async run(){return sql.prepare(query).run(...values)}}},async batch(statements){sql.exec('BEGIN');try{for(const s of statements)await s.run();sql.exec('COMMIT')}catch(e){sql.exec('ROLLBACK');throw e}}};
 const objects=new Map(),bucket={async put(id,bytes){objects.set(id,bytes)}};
 const owner={id:'owner',name:'Owner',role:'owner'};
 await importBusinessDummy(db,bucket,{...owner,role:'pic'});assert.equal(objects.size,0);
 await importRequestedDummy(db,owner);
 sql.prepare("INSERT INTO members VALUES ('test-pic','training-pic@example.invalid','Joshua','pic','',1,'now')").run();
 const real={number:'REAL-WO',status:'Scheduled',picId:'test-pic',teamId:'real-team',truckId:'real-truck',start:'2026-10-31T01:00:00Z',end:'2026-10-31T05:00:00Z'};
 sql.prepare("INSERT INTO records VALUES ('real-wo','workorders',?,1,'now','now')").run(JSON.stringify(real));
 await importBusinessDummy(db,bucket,owner);
 const rows=sql.prepare('SELECT * FROM records').all().map(r=>({...r,data:JSON.parse(r.data)}));const samples=rows.filter(r=>r.data.dummy);assert.equal(samples.length,37);assert.equal(objects.size,16);
 const find=id=>rows.find(r=>r.id===id);
 for(const r of samples){
  for(const key of ['customerId','quotationId','enquiryId','poId','workorderId','invoiceId','accountId','fromAccountId','toAccountId','teamId','truckId'])if(r.data[key])assert.ok(find(r.data[key]),`${r.id} missing ${key}`);
  if(r.kind==='pos'){const q=find(r.data.quotationId);assert.equal(q.data.status,'Approved');assert.equal(r.data.amount*100,totals(q.data).total);if(r.data.status==='Verified')assert.ok(sql.prepare('SELECT id FROM files WHERE record_id=?').get(r.id));}
  if(r.kind==='invoices')assert.ok(paymentSum(r.id,rows)<=totals(r.data).total);
  if(r.kind==='workorders'&&['Pending review','Completed'].includes(r.data.status))validateReport(r.data,sql.prepare('SELECT * FROM files WHERE record_id=?').all(r.id));
 }
 const scheduled=find('sample-wo-5');assert.equal(scheduled.data.picId,'test-pic');assert.equal(timeOverlap(scheduled.data,real),false);
 assert.deepEqual(find('real-wo').data,real);
 assert.deepEqual(finance(samples),{paid:310000,spent:110000,net:200000,outstanding:350000});
 assert.equal(accountBalance(find('sample-bank'),rows),1162000);assert.equal(accountBalance(find('sample-cash'),rows),88000);
 const closed=find('sample-wo-1');assert.ok(closed.data.closedAt);assert.equal(paymentSum('sample-invoice-1',rows),totals(find('sample-invoice-1').data).total);
 for(const f of sql.prepare('SELECT * FROM files').all()){assert.ok(objects.has(f.id));assert.match(f.name,/DUMMY/);assert.equal(objects.get(f.id).length,f.size);}
 const before=sql.prepare('SELECT count(*) n FROM records').get().n;await importBusinessDummy(db,bucket,owner);assert.equal(sql.prepare('SELECT count(*) n FROM records').get().n,before);
 assert.equal(sql.prepare('SELECT count(*) n FROM outbox').get().n,0);
 sql.close();
});
