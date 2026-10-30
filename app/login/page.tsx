import LoginForm from '@/components/login-form';
import {publicAuthConfig} from '@/lib/supabase/server';
export const dynamic='force-dynamic';
export default async function Login({searchParams}:{searchParams:Promise<{return_to?:string}>}){
 const {return_to}=await searchParams;const returnTo=return_to==='/petugas'?'/petugas':'/admin';const config=publicAuthConfig();
 const missing=[!config.url&&'NEXT_PUBLIC_SUPABASE_URL',!config.key&&'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',!process.env.DATABASE_URL&&'DATABASE_URL',!(process.env.SUPABASE_SECRET_KEY||process.env.SUPABASE_SERVICE_ROLE_KEY)&&'SUPABASE_SECRET_KEY',!process.env.OWNER_EMAIL&&'OWNER_EMAIL'].filter(Boolean);
 return <main className="login-page"><div className="login-brand"><div className="brand-mark">TJ</div><span>TJ & SONS</span></div><section className="login-card"><span className="eyebrow">OPERATIONS WORKSPACE</span><h1>Welcome back.</h1><p>Sign in to manage cleaning operations or view your assigned work orders.</p>{missing.length?<div className="setup-guide"><h2>Complete your deployment setup</h2><p>Add the following environment variables in Vercel, run the Supabase setup SQL, then redeploy.</p><ul>{missing.map(key=><li key={String(key)}><code>{key}</code></li>)}</ul><p>Follow <strong>docs/VERCEL-SETUP.md</strong> in your repository. No secret values are shown on this page.</p></div>:<LoginForm returnTo={returnTo}/>}<a className="text-button" href="/demo">Explore the read-only demo →</a><div className="login-footer">Private workspace · Role-based access</div></section></main>
}
