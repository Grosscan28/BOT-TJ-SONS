import {createServerClient} from '@supabase/ssr';
import {createClient} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
export function publicAuthConfig(){return {url:process.env.NEXT_PUBLIC_SUPABASE_URL,key:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY};}
export async function authClient(){
 const {url,key}=publicAuthConfig();if(!url||!key)throw new Error('Sign-in is not configured. Follow docs/VERCEL-SETUP.md.');
 const jar=await cookies();
 return createServerClient(url,key,{cookieOptions:{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/'},cookies:{getAll:()=>jar.getAll(),setAll:values=>{for(const {name,value,options} of values)jar.set(name,value,options);}}});
}
let admin:ReturnType<typeof createClient>|undefined;
export function storageClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Private file storage is not configured. Follow docs/VERCEL-SETUP.md.');
 return admin??=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
