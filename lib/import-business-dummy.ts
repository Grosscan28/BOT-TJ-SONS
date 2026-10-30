import {businessDummy} from './business-dummy-data';
import {timeOverlap,type Data} from './domain';
const marker='sample-business-import-20261030';
// Owner-requested, bounded, one-time runtime import; not a schema migration.
export async function importBusinessDummy(db:D1Database,bucket:R2Bucket|undefined,member:{id:string;role:string;name:string}){
 if(member.role!=='owner')return;
 if(await db.prepare('SELECT id FROM audit WHERE id=?').bind(marker).first())return;
 if(!bucket)throw new Error('File storage is required to import the requested training dataset.');
 const now=new Date().toISOString();
 const pic=await db.prepare("SELECT id FROM members WHERE role='pic' AND active=1 AND email NOT LIKE '%@tj-sons-demo.invalid' ORDER BY created_at LIMIT 1").first<{id:string}>();
 const existing=(await db.prepare("SELECT data FROM records WHERE kind='workorders'").all<{data:string}>()).results.map(r=>JSON.parse(r.data));
 const fixtures=structuredClone(businessDummy.records) as {id:string;kind:string;data:Data}[];
 // Give the user's test PIC one runnable assignment; preserve all other assignments.
 const scheduled=fixtures.find(r=>r.id==='sample-wo-5')!;
 if(pic)scheduled.data.picId=pic.id;
 // Imported active assignments must not reserve resources already booked by the user.
 for(const r of fixtures.filter(r=>r.kind==='workorders'&&!['Draft','Completed','Cancelled'].includes(r.data.status))){
  let attempts=0;
  while(existing.some(d=>!['Draft','Completed','Cancelled'].includes(d.status)&&timeOverlap(d,r.data)&&(d.picId===r.data.picId||d.teamId===r.data.teamId||d.truckId===r.data.truckId))){
   if(++attempts>90)throw new Error('No free schedule found for the dummy assignments.');
   r.data.start=new Date(new Date(r.data.start).getTime()+86400000).toISOString();r.data.end=new Date(new Date(r.data.end).getTime()+86400000).toISOString();
  }
  existing.push(r.data);
 }
 // Write real downloadable placeholder files before creating their metadata.
 for(const f of businessDummy.files){const bytes=Uint8Array.from(atob(f.base64),c=>c.charCodeAt(0));await bucket.put(f.id,bytes,{httpMetadata:{contentType:f.mime}});}
 const statements:D1PreparedStatement[]=[];
 for(const r of fixtures){
  const at=r.data.date?r.data.date+'T08:00:00.000Z':now;
  statements.push(db.prepare('INSERT OR IGNORE INTO records (id,kind,data,version,created_at,updated_at) VALUES (?,?,?,1,?,?)').bind(r.id,r.kind,JSON.stringify(r.data),at,at));
  statements.push(db.prepare('INSERT OR IGNORE INTO audit (id,actor,record_id,action,details,created_at) VALUES (?,?,?,?,?,?)').bind('audit-'+r.id,member.name,r.id,'Imported dummy training record','Fictional starting state requested by the owner. Not evidence of a real transaction or approval.',now));
 }
 for(const f of businessDummy.files)statements.push(db.prepare('INSERT OR IGNORE INTO files (id,record_id,name,mime,size,category,area,uploaded_by,created_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(f.id,f.recordId,f.name,f.mime,atob(f.base64).length,f.category,f.area,'[DUMMY] Training import',now));
 const notices=[{id:'sample-owner-notification',memberId:member.id,recordId:'sample-wo-3',title:'[DUMMY] Report ready for review',body:'WO-2026-003 has sample checklists and clearly marked placeholder evidence.'},{id:'sample-pic-notification',memberId:scheduled.data.picId,recordId:scheduled.id,title:'[DUMMY] Training assignment',body:'Open this sample work order to try confirming availability. No travel or customer contact required.'}];
 for(const n of notices)statements.push(db.prepare('INSERT OR IGNORE INTO notifications (id,member_id,record_id,title,body,read,created_at) VALUES (?,?,?,?,?,0,?)').bind(n.id,n.memberId,n.recordId,n.title,n.body,now));
 statements.push(db.prepare('INSERT OR IGNORE INTO audit (id,actor,record_id,action,details,created_at) VALUES (?,?,?,?,?,?)').bind(marker,member.name,marker,'Imported complete dummy business flow','37 fictional business records and 16 placeholder attachments. Simulated financial totals; no money or WhatsApp messages sent.',now));
 await db.batch(statements);
}
