import {authClient} from '@/lib/supabase/server';
export const runtime='nodejs';
export async function POST(request:Request){
 if(request.headers.get('origin')!==new URL(request.url).origin)return Response.json({error:'Invalid origin'},{status:403});
 try{const client=await authClient();await client.auth.signOut();return Response.json({success:true},{headers:{'Cache-Control':'no-store'}});}catch{return Response.json({error:'Unable to sign out. Please try again.'},{status:503});}
}
