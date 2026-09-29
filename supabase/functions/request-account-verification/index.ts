import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SMTP_HOST = Deno.env.get("SMTP_HOST") ?? "";
const SMTP_PORT = Number(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") ?? "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") ?? "";
const SMTP_FROM_EMAIL = Deno.env.get("SMTP_FROM_EMAIL") ?? "no-reply@pipsepaisa.com";
const SMTP_FROM_NAME = Deno.env.get("SMTP_FROM_NAME") ?? "PipSePaisa";
const SITE_URL = "https://pipsepaisa.com";

function firstString(value: unknown): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (Array.isArray(value)) for (const item of value) { const v=firstString(item); if(v) return v; }
  if (value && typeof value === "object") {
    const r=value as Record<string,unknown>;
    for (const k of ["default","api_key","key","value"]) { const v=firstString(r[k]); if(v) return v; }
    for (const item of Object.values(r)) { const v=firstString(item); if(v) return v; }
  }
  return "";
}
function readJsonEnv(name:string):string{const raw=Deno.env.get(name);if(!raw)return"";try{return firstString(JSON.parse(raw));}catch{return raw.trim();}}
const SUPABASE_SECRET_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_SECRET_KEY") || readJsonEnv("SUPABASE_SECRET_KEYS");
const SUPABASE_PUBLISHABLE_KEY = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY") || readJsonEnv("SUPABASE_PUBLISHABLE_KEYS");

const corsHeaders={
  "Access-Control-Allow-Origin":"*",
  "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":"POST, OPTIONS",
};
function json(data:Record<string,unknown>,status=200){return new Response(JSON.stringify(data),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});}
function esc(v:unknown){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");}
function hex(bytes:Uint8Array){return Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");}
async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return hex(new Uint8Array(digest));}
async function verifyCaller(token:string,apiKey:string){
  const key=apiKey||SUPABASE_PUBLISHABLE_KEY;if(!key)throw Object.assign(new Error("Supabase publishable key is unavailable."),{status:500});
  const r=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:key,Authorization:`Bearer ${token}`}});
  const d=await r.json().catch(()=>({}));if(!r.ok||!d?.id||!d?.email)throw Object.assign(new Error(d?.message||d?.msg||"Invalid login session."),{status:401});return d;
}

const transporter=nodemailer.createTransport({
  host:SMTP_HOST,port:SMTP_PORT,secure:SMTP_PORT===465,requireTLS:SMTP_PORT===587,
  auth:{user:SMTP_USERNAME,pass:SMTP_PASSWORD},connectionTimeout:18000,greetingTimeout:18000,socketTimeout:30000,
  tls:{servername:SMTP_HOST,rejectUnauthorized:true},
});

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({success:false,error:"Only POST requests are allowed."},405);
  const requestId=crypto.randomUUID();
  try{
    if(!SUPABASE_URL||!SUPABASE_SECRET_KEY||!SMTP_HOST||!SMTP_USERNAME||!SMTP_PASSWORD)throw new Error("Verification email service is not configured.");
    const auth=req.headers.get("Authorization");if(!auth?.startsWith("Bearer "))return json({success:false,error:"Authentication required."},401);
    const user=await verifyCaller(auth.slice(7).trim(),req.headers.get("apikey")||"");
    const admin=createClient(SUPABASE_URL,SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});

    const current=await admin.from("account_verifications").select("email_verified_at").eq("user_id",user.id).maybeSingle();
    if(current.data?.email_verified_at)return json({success:true,already_verified:true,message:"Your email is already verified."});

    await admin.from("account_verifications").upsert({user_id:user.id,updated_at:new Date().toISOString()},{onConflict:"user_id"});
    await admin.from("account_verification_email_tokens").delete().eq("user_id",user.id).is("used_at",null);

    const rawBytes=crypto.getRandomValues(new Uint8Array(32));
    const token=hex(rawBytes);const tokenHash=await sha256(token);
    const expiresAt=new Date(Date.now()+30*60*1000).toISOString();
    const ins=await admin.from("account_verification_email_tokens").insert({user_id:user.id,token_hash:tokenHash,expires_at:expiresAt});
    if(ins.error)throw ins.error;

    const name=user.user_metadata?.full_name||user.user_metadata?.name||String(user.email).split("@")[0]||"User";
    const verifyUrl=`${SITE_URL}/verify-account/?token=${encodeURIComponent(token)}`;
    const html=`<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827"><table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 12px"><tr><td align="center"><table width="100%" style="max-width:620px;background:#fff;border:1px solid #e5e7eb;border-radius:17px;overflow:hidden"><tr><td style="background:#0b172a;padding:24px;text-align:center;color:white"><div style="font-size:26px;font-weight:900">Pip<span style="color:#f59e0b">Se</span>Paisa</div><div style="font-size:12px;color:#cbd5e1;margin-top:5px">Account Verification</div></td></tr><tr><td style="padding:32px 28px"><h1 style="font-size:24px;margin:0 0 18px">Verify Your PipSePaisa Account</h1><p style="font-size:16px;line-height:1.7">Hi <strong>${esc(name)}</strong>,</p><p style="font-size:15px;line-height:1.7;color:#374151">Click the button below to verify your email address. You are already able to sign in; this verification is required for the Free All Access process.</p><p style="margin:27px 0"><a href="${esc(verifyUrl)}" style="display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;padding:14px 23px;border-radius:10px;font-weight:800">Verify Account Email</a></p><p style="font-size:13px;color:#6b7280;line-height:1.6">This verification link expires in 30 minutes and can be used only once.</p></td></tr><tr><td style="padding:18px 28px;background:#fafafa;border-top:1px solid #e5e7eb;color:#6b7280;font-size:12px">This is an automated email from PipSePaisa. Please do not reply.</td></tr></table></td></tr></table></body></html>`;
    const result=await transporter.sendMail({from:{name:SMTP_FROM_NAME,address:SMTP_FROM_EMAIL},to:user.email,subject:"Verify Your PipSePaisa Account",html});
    console.info(`[${requestId}] verification email sent`,{user_id:user.id,email:user.email,message_id:result.messageId||null});
    return json({success:true,message:"Verification email sent. Please check your inbox.",expires_in_minutes:30});
  }catch(error){
    console.error(`[${requestId}] request verification failed`,error);
    const status=Number((error as any)?.status)||500;
    return json({success:false,error:error instanceof Error?error.message:"Unexpected server error.",request_id:requestId},status);
  }
});
