import {Pool} from 'pg';
let pool:Pool|undefined;
function productionPool(){
 if(!process.env.DATABASE_URL)throw new Error('Database is not configured. Follow docs/VERCEL-SETUP.md.');
 return pool??=new Pool({connectionString:process.env.DATABASE_URL,max:2,idleTimeoutMillis:20000,connectionTimeoutMillis:10000});
}
// Keep the reviewed business queries parameterised while moving SQLite storage to Postgres.
export function postgresQuery(input:string){
 let sql=input.replace(/json_extract\(([\w.]+),\s*'\$\.([\w]+)'\)/g,"($1::jsonb->>'$2')").replace(/\bAS REAL\b/gi,'AS numeric');
 const ignore=/^\s*INSERT OR IGNORE INTO\b/i.test(sql);sql=sql.replace(/INSERT OR IGNORE INTO/i,'INSERT INTO');
 let n=0,quoted=false,result='';
 for(let i=0;i<sql.length;i++){const c=sql[i];if(c==="'"){result+=c;if(quoted&&sql[i+1]==="'"){result+=sql[++i];continue}quoted=!quoted;}else result+=c==='?'&&!quoted?'$'+(++n):c;}
 if(ignore)result=result.replace(/;\s*$/,'')+' ON CONFLICT DO NOTHING';
 return result;
}
type Connection={query:(text:string,values?:any[])=>Promise<any>;release:()=>void};
type PoolLike={query:(text:string,values?:any[])=>Promise<any>;connect:()=>Promise<Connection>};
class Statement{
 values:any[]=[];
 db:PostgresDatabase;sql:string;
 constructor(db:PostgresDatabase,sql:string){this.db=db;this.sql=sql;}
 bind(...values:any[]){const s=new Statement(this.db,this.sql);s.values=values;return s;}
 async first<T=Record<string,unknown>>(){const r=await this.db.read(this);return (r.rows[0]??null) as T|null;}
 async all<T=Record<string,unknown>>(){const r=await this.db.read(this);return {results:r.rows as T[],success:true};}
 async run(){return (await this.db.write([this]))[0];}
}
export class PostgresDatabase{
 private provider:()=>PoolLike;
 constructor(provider:()=>PoolLike=productionPool){this.provider=provider;}
 prepare(sql:string){return new Statement(this,sql);}
 async read(s:Statement){return this.provider().query(postgresQuery(s.sql),s.values);}
 async batch(statements:Statement[]){return this.write(statements);}
 async write(statements:Statement[]){
  const client=await this.provider().connect();
  try{
   await client.query('BEGIN');
   // SQLite previously serialised writes. Keep that property for payment and booking guards.
   // A transaction-level lock works with Supabase transaction pooling and releases on rollback.
   await client.query("SELECT pg_advisory_xact_lock(hashtext('tj-sons-workspace-writes'))");
   const results=[];
   for(const s of statements){const r=await client.query(postgresQuery(s.sql),s.values);results.push({success:true,meta:{changes:r.rowCount??0},results:r.rows});}
   await client.query('COMMIT');return results;
  }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
 }
}
