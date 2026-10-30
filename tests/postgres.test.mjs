import test from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import {PostgresDatabase,postgresQuery} from '../lib/adapters/postgres.ts';
test('Postgres adapter binds parameters and rolls back batches atomically',async()=>{
 const pg=new PGlite();await pg.exec('CREATE TABLE items (id text PRIMARY KEY, data text NOT NULL)');
 const history=[];const query=async(text,values)=>{history.push(text);const r=await pg.query(text,values);return {rows:r.rows,rowCount:r.affectedRows};};
 const db=new PostgresDatabase(()=>({query,async connect(){return {query,release(){}}}}));
 assert.equal(postgresQuery("SELECT '?' AS literal, ? AS value"),"SELECT '?' AS literal, $1 AS value");
 await db.prepare('INSERT OR IGNORE INTO items (id,data) VALUES (?,?)').bind('one',JSON.stringify({amount:3.25,status:'Issued'})).run();
 await db.prepare('INSERT OR IGNORE INTO items (id,data) VALUES (?,?)').bind('one','{}').run();
 assert.equal((await db.prepare("SELECT ROUND(CAST(json_extract(data,'$.amount') AS REAL)*100) AS cents FROM items WHERE json_extract(data,'$.status')=?").bind('Issued').first()).cents,'325');
 await assert.rejects(()=>db.batch([db.prepare('INSERT INTO items VALUES (?,?)').bind('two','{}'),db.prepare('INSERT INTO items VALUES (?,?)').bind('one','{}')]));
 assert.equal(await db.prepare('SELECT id FROM items WHERE id=?').bind('two').first(),null);
 assert.ok(history.some(s=>s.includes('pg_advisory_xact_lock')));assert.ok(history.includes('ROLLBACK'));await pg.close();
});
