import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { importRequestedDummy } from '../lib/requested-dummy.ts';
test('requested fixtures are owner-only, atomic and imported only once without changing existing records',async()=>{
 const sql=new DatabaseSync(':memory:');sql.exec(readFileSync('drizzle/0000_handy_sentinel.sql','utf8'));
 const db={prepare(query){let values=[];return {bind(...args){values=args;return this},async first(){return sql.prepare(query).get(...values)},async run(){return sql.prepare(query).run(...values)}}},async batch(statements){sql.exec('BEGIN');try{for(const s of statements)await s.run();sql.exec('COMMIT')}catch(e){sql.exec('ROLLBACK');throw e}}};
 sql.prepare("INSERT INTO records VALUES ('existing','teams','{\"name\":\"Real team\"}',1,'now','now')").run();
 for(const role of ['admin','pic'])await importRequestedDummy(db,{role,name:'Member'});
 assert.equal(sql.prepare('SELECT count(*) AS n FROM members').get().n,0);
 await importRequestedDummy(db,{role:'owner',name:'Owner'});
 assert.equal(sql.prepare('SELECT count(*) AS n FROM members').get().n,3);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM records').get().n,8);
 assert.equal(JSON.parse(sql.prepare("SELECT data FROM records WHERE id='existing'").get().data).name,'Real team');
 assert.equal(sql.prepare("SELECT count(*) AS n FROM records WHERE kind NOT IN ('teams','fleet')").get().n,0);
 for(const m of sql.prepare('SELECT * FROM members').all()){assert.equal(m.role,'pic');assert.equal(m.phone,'');assert.match(m.email,/\.invalid$/);}
 sql.prepare("DELETE FROM records WHERE id='dummy-team-alpha'").run();
 await importRequestedDummy(db,{role:'owner',name:'Owner'});
 assert.equal(sql.prepare('SELECT count(*) AS n FROM records').get().n,7);
 assert.equal(sql.prepare('SELECT count(*) AS n FROM audit').get().n,1);
 sql.close();
});
