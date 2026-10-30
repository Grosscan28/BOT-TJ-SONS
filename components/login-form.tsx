'use client';
import {useState} from 'react';
export default function LoginForm({returnTo}:{returnTo:string}){
 const [error,setError]=useState(''),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');const form=new FormData(e.currentTarget);
  try{const response=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:form.get('email'),password:form.get('password')})});const data:any=await response.json();if(!response.ok)throw new Error(data.error||'Unable to sign in.');window.location.assign(returnTo);}catch(e){setError((e as Error).message);setBusy(false);}
 }
 return <form className="email-login-form" onSubmit={submit}>
  <label className="field"><span>Email address</span><input name="email" type="email" autoComplete="username" required placeholder="you@company.com"/></label>
  <label className="field"><span>Password</span><input name="password" type="password" autoComplete="current-password" required/></label>
  {error&&<div className="error" role="alert">{error}</div>}
  <button className="login-button" type="submit" disabled={busy}>{busy?'Signing in…':'Sign in'}</button>
  <p className="small muted">Use the email and password provided by your administrator. Your account role determines your access.</p>
 </form>
}
