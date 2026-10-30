import {readFile} from 'node:fs/promises';
import pg from 'pg';
if(!process.env.DATABASE_URL)throw new Error('Set DATABASE_URL before running this command. Alternatively run supabase/setup.sql in Supabase SQL Editor.');
const client=new pg.Client({connectionString:process.env.DATABASE_URL});
try{await client.connect();await client.query(await readFile(new URL('../supabase/setup.sql',import.meta.url),'utf8'));console.log('Database tables and private storage bucket are ready.');}finally{await client.end();}
