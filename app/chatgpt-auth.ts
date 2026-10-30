// Compatibility export for existing business rules. Identity now comes from Supabase Auth.
import {authClient,publicAuthConfig} from '@/lib/supabase/server';
export async function getChatGPTUser(){
 const config=publicAuthConfig();if(!config.url||!config.key)return null;
 const client=await authClient();const {data:{user},error}=await client.auth.getUser();
 if(error||!user?.email||!user.email_confirmed_at)return null;
 return {userId:user.id,email:user.email,displayName:user.user_metadata?.full_name||user.email.split('@')[0],fullName:user.user_metadata?.full_name??null};
}
