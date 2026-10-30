// One-time fixture import requested by the workspace owner on 30 October 2026.
// Runtime data deliberately lives outside schema migrations. No external messages.
const marker='dummy-operations-import-20261030';
export async function importRequestedDummy(db:D1Database,member:{role:string;name:string}){
 if(member.role!=='owner')return;
 if(await db.prepare('SELECT id FROM audit WHERE id=?').bind(marker).first())return;
 const now=new Date().toISOString();
 const people=[['amir','Amir Hassan'],['daniel','Daniel Lim'],['ravi','Ravi Kumar']];
 const statements=people.map(([id,name])=>db.prepare('INSERT OR IGNORE INTO members (id,email,name,role,phone,active,created_at) VALUES (?,?,?,?,?,?,?)').bind('dummy-pic-'+id,id+'@tj-sons-demo.invalid','[DUMMY] '+name,'pic','',1,now));
 const records=[
  ['dummy-team-alpha','teams',{name:'[DUMMY] Alpha Team',members:'Amir Hassan — Supervisor\nFarid — Operator\nAzlan — Crew',notes:'Training data only. Suggested PIC: [DUMMY] Amir Hassan. Septic tank desludging and vacuum tanker operation.'}],
  ['dummy-team-bravo','teams',{name:'[DUMMY] Bravo Team',members:'Daniel Lim — Supervisor\nJason — Operator\nHafiz — Crew',notes:'Training data only. Suggested PIC: [DUMMY] Daniel Lim. Manhole and drainage cleaning.'}],
  ['dummy-team-charlie','teams',{name:'[DUMMY] Charlie Team',members:'Ravi Kumar — Supervisor\nSuresh — Operator\nKumar — Crew',notes:'Training data only. Suggested PIC: [DUMMY] Ravi Kumar. Industrial cleaning and high-pressure jetting.'}],
  ...[['01','Vacuum Tanker 01','Available'],['02','Vacuum Tanker 02','Available'],['03','Jetting Truck 01','Available'],['04','Backup Tanker','Maintenance']].map(([id,name,status])=>['dummy-truck-'+id,'fleet',{plate:'DEMO-'+id,name:'[DUMMY] '+name,status,insurance:'2027-12-31',roadtax:'2027-12-31',puspakom:'2027-12-31',maintenance:'2027-06-30',notes:'Training data only. Fictional registration and document expiry dates; replace before real dispatch.'}]),
 ] as [string,string,Record<string,string>][];
 for(const [id,kind,data] of records)statements.push(db.prepare('INSERT OR IGNORE INTO records (id,kind,data,version,created_at,updated_at) VALUES (?,?,?,1,?,?)').bind(id,kind,JSON.stringify(data),now,now));
 statements.push(db.prepare('INSERT OR IGNORE INTO audit (id,actor,record_id,action,details,created_at) VALUES (?,?,?,?,?,?)').bind(marker,member.name,marker,'Imported requested dummy operations data','3 fictional PICs, 3 teams, 4 trucks. No customer, financial, approval or messaging records changed.',now));
 // D1 batch is atomic; stable IDs also protect against simultaneous page refreshes.
 await db.batch(statements);
}
