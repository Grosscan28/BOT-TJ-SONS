import { env } from 'cloudflare:workers';
import { importBusinessDummy } from '@/lib/import-business-dummy';
import { importRequestedDummy } from '@/lib/requested-dummy';
import { currentMember, snapshot, mutation, database } from '@/lib/store';
export const dynamic='force-dynamic';
function error(e:unknown){const message=e instanceof Error?e.message:'Request failed';return Response.json({error:message.includes('UNIQUE constraint')?'This value already exists.':message},{status:message==='UNAUTHENTICATED'?401:message.startsWith('FORBIDDEN')?403:400});}
export async function GET(){try{const member=await currentMember();await importRequestedDummy(database(),member);await importBusinessDummy(database(),env.BUCKET,member);return Response.json(await snapshot(member),{headers:{'Cache-Control':'no-store'}})}catch(e){return error(e)}}
export async function POST(request:Request){try{if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});if(Number(request.headers.get('content-length')??0)>200000)throw new Error('Request too large.');const input:any=await request.json();const result=await mutation(await currentMember(),input);return Response.json({result});}catch(e){return error(e)}}
