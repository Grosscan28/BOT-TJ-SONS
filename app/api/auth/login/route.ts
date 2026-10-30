import {authClient} from '@/lib/supabase/server';
export const runtime='nodejs';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 if(Number(request.headers.get('content-length')||0)>10000)return Response.json({error:'Request too large'},{status:413});
 try{const input:any=await request.json();if(!input||typeof input.email!=='string'||typeof input.password!=='string'||input.email.length>254||input.password.length>1000)return Response.json({error:'Enter your email and password.'},{status:400});
  const client=await authClient();const {error}=await client.auth.signInWithPassword({email:input.email.trim(),password:input.password});if(error)return Response.json({error:'Unable to sign in. Check your email and password.'},{status:401});
  return Response.json({success:true},{headers:{'Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Sign-in is unavailable. Ask your administrator to check the Supabase configuration.'},{status:503});}
}
