import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
function firstString(value:unknown):string{if(typeof value==="string"&&value.trim())return value.trim();if(Array.isArray(value))for(const item of value){const v=firstString(item);if(v)return v;}if(value&&typeof value==="object"){const r=value as Record<string,unknown>;for(const k of ["default","api_key","key","value"]){const v=firstString(r[k]);if(v)return v;}for(const item of Object.values(r)){const v=firstString(item);if(v)return v;}}return"";}
function readJsonEnv(name:string){const raw=Deno.env.get(name);if(!raw)return"";try{return firstString(JSON.parse(raw));}catch{return raw.trim();}}
const SUPABASE_SECRET_KEY=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||Deno.env.get("SUPABASE_SECRET_KEY")||readJsonEnv("SUPABASE_SECRET_KEYS");
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};
function json(data:Record<string,unknown>,status=200){return new Response(JSON.stringify(data),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});}
function hex(bytes:Uint8Array){return Array.from(bytes).map(b=>b.toString(16).padStart(2,"0")).join("");}
async function sha256(value:string){const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value));return hex(new Uint8Array(digest));}

Deno.serve(async(req:Request)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({success:false,error:"Only POST requests are allowed."},405);
  try{
    if(!SUPABASE_URL||!SUPABASE_SECRET_KEY)throw new Error("Verification service is not configured.");
    const body=await req.json().catch(()=>({}));const token=String(body?.token||"").trim();
    if(!/^[a-f0-9]{64}$/i.test(token))return json({success:false,error:"Invalid verification link."},400);
    const tokenHash=await sha256(token);const now=new Date().toISOString();
    const admin=createClient(SUPABASE_URL,SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const found=await admin.from("account_verification_email_tokens").select("id,user_id,expires_at,used_at").eq("token_hash",tokenHash).maybeSingle();
    if(found.error)throw found.error;
    if(!found.data||found.data.used_at)return json({success:false,error:"This verification link is invalid or has already been used."},400);
    if(new Date(found.data.expires_at).getTime()<=Date.now())return json({success:false,error:"This verification link has expired. Request a new email from Profile."},400);

    const upsert=await admin.from("account_verifications").upsert({user_id:found.data.user_id,email_verified_at:now,updated_at:now},{onConflict:"user_id"});
    if(upsert.error)throw upsert.error;
    await admin.from("account_verification_email_tokens").update({used_at:now}).eq("id",found.data.id);
    await admin.from("account_verification_email_tokens").update({used_at:now}).eq("user_id",found.data.user_id).is("used_at",null);
    return json({success:true,message:"Email verified successfully."});
  }catch(error){return json({success:false,error:error instanceof Error?error.message:"Unexpected server error."},500);}
});
