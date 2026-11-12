
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.10.1";
const SITE="https://www.pipsepaisa.com";
const config=(name:string)=>Deno.env.get(name)||"";
function secret(name:string) {
  const value=config(name); if(!value)return "";
  try{const parsed=JSON.parse(value);return typeof parsed==="string"?parsed:String(parsed?.default?.api_key||parsed?.default?.key||parsed?.default?.value||parsed?.[0]?.api_key||parsed?.[0]?.value||"");}catch{return value;}
}
const publicKey=secret("SUPABASE_ANON_KEY")||secret("SUPABASE_PUBLISHABLE_KEY")||secret("SUPABASE_PUBLISHABLE_KEYS");
const serviceKey=secret("SUPABASE_SERVICE_ROLE_KEY")||secret("SUPABASE_SECRET_KEY")||secret("SUPABASE_SECRET_KEYS");
const url=config("SUPABASE_URL");
const roles=["viewer","creator","editor","approver"];
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const escape=(v:unknown)=>String(v||"").replace(/[&<>"']/g,(c)=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"} as Record<string,string>)[c]||c);
function cors(req:Request){const origin=req.headers.get("origin")||"";return {"Content-Type":"application/json","Vary":"Origin","Access-Control-Allow-Origin":["https://pipsepaisa.com",SITE].includes(origin)?origin:SITE,"Access-Control-Allow-Methods":"POST,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Cache-Control":"no-store"};}
function reply(req:Request,data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:cors(req)});}
function emailHtml(name:string,role:string){
  const person=escape(name),label=escape(role[0].toUpperCase()+role.slice(1));
  return '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#0d1118;padding:28px 12px;font-family:Arial,sans-serif;color:#e7eef7"><table width="100%" role="presentation"><tr><td align="center"><table width="100%" role="presentation" style="max-width:560px;background:#17202b;border:1px solid #374353;border-radius:19px;overflow:hidden"><tr><td style="background:#f39522;height:6px"></td></tr><tr><td style="padding:30px 28px"><div style="font-size:20px;font-weight:800;color:#fff">PipSe<span style="color:#f39522">Paisa</span> <span style="font-size:11px;color:#b7c5d3">AI STUDIO</span></div><div style="margin-top:28px;color:#f6b46b;font-size:11px;letter-spacing:2px;font-weight:700">PRIVATE CREATOR WORKSPACE</div><h1 style="font-size:28px;line-height:1.25;color:#fff">Your Studio is ready.</h1><p style="font-size:15px;line-height:1.8;color:#d3dce6">Hello <b>'+person+'</b>,<br>Your private access to the <b>PipSePaisa AI Content Studio</b> has been approved.</p><table width="100%" style="margin:20px 0;background:#222e3b;border:1px solid #445267;border-radius:12px"><tr><td style="padding:17px;color:#bac5d1">Access</td><td align="right" style="padding:17px;color:#96ecc0;font-weight:700">ACTIVE</td></tr><tr><td style="padding:0 17px 17px;color:#bac5d1">Permission</td><td align="right" style="padding:0 17px 17px;color:#fff;font-weight:700">'+label+'</td></tr></table><p style="font-size:14px;line-height:1.75;color:#c5d0dc">Generate video scripts, explore market news, save projects and use your professional creator tools.</p><a href="'+SITE+'/content-studio/" style="display:inline-block;margin:14px 0;padding:16px 24px;background:#f39522;color:#211609;text-decoration:none;border-radius:12px;font-weight:800">Open My AI Studio →</a><p style="font-size:12px;line-height:1.7;color:#a6b5c6">Use your existing PipSePaisa login. Access remains active until changed by an administrator. Never share your password.</p></td></tr><tr><td style="border-top:1px solid #354455;padding:18px 28px;color:#99aabb;font-size:11px">PipSePaisa · Professional Trading Education<br><a style="color:#f7ae56" href="'+SITE+'">'+SITE+'</a><br>This is an automated access approval notification.</td></tr></table></td></tr></table></body></html>';
}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response(null,{status:204,headers:cors(req)});
 if(req.method!=="POST")return reply(req,{error:"Only POST is supported"},405);
 try{
  if(!url||!publicKey||!serviceKey)return reply(req,{error:"Access service configuration is incomplete."},503);
  const jwt=(req.headers.get("authorization")||"").replace(/^Bearer\s+/i,"").trim();
  if(!jwt)return reply(req,{error:"Sign in as administrator."},401);
  const authClient=createClient(url,publicKey,{global:{headers:{Authorization:"Bearer "+jwt}},auth:{persistSession:false,autoRefreshToken:false}});
  const caller=await authClient.auth.getUser(jwt);
  if(caller.error||!caller.data.user)return reply(req,{error:"Please sign in again."},401);
  const service=createClient(url,serviceKey,{auth:{persistSession:false,autoRefreshToken:false}});
  const admin=await service.from("profiles").select("role").eq("id",caller.data.user.id).maybeSingle();
  if(admin.error||admin.data?.role!=="admin")return reply(req,{error:"Administrator permission required."},403);
  const body=await req.json().catch(()=>null);
  if(!body||typeof body.user_id!=="string"||!uuid.test(body.user_id)||!["save","resend"].includes(body.action))return reply(req,{error:"Invalid access request."},400);
  if(body.action==="save"&&(!roles.includes(body.permission)||typeof body.enabled!=="boolean"))return reply(req,{error:"Invalid permission settings."},400);
  const before=await service.from("psp_content_access").select("enabled,permission").eq("user_id",body.user_id).maybeSingle();
  if(before.error)throw before.error;
  let enabled=!!before.data?.enabled,role=before.data?.permission||"creator";
  if(body.action==="save"){
    const result=await authClient.rpc("psp_content_set_access_v1",{p_user_id:body.user_id,p_permission:body.permission,p_enabled:body.enabled});
    if(result.error||result.data!==true)return reply(req,{saved:false,error:result.error?.message||"Access could not be saved."},400);
    enabled=body.enabled;role=body.permission;
  }
  const emailNeeded=enabled&&(body.action==="resend"||!before.data?.enabled||before.data?.permission!==role);
  if(!emailNeeded)return reply(req,{saved:body.action==="save",email_sent:false,notification_needed:false});
  const member=await service.from("profiles").select("email,full_name").eq("id",body.user_id).maybeSingle();
  if(member.error)throw member.error;
  let email=String(member.data?.email||"").trim();
  if(!email){const user=await service.auth.admin.getUserById(body.user_id);email=String(user.data?.user?.email||"").trim();}
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return reply(req,{saved:body.action==="save",notification_needed:true,email_sent:false,error:"User has no valid email address."});
  if(!config("SMTP_HOST")||!config("SMTP_USERNAME")||!config("SMTP_PASSWORD"))return reply(req,{saved:body.action==="save",notification_needed:true,email_sent:false,error:"SMTP email service is not configured."});
  const port=Number(config("SMTP_PORT")||587);
  const transporter=nodemailer.createTransport({host:config("SMTP_HOST"),port,secure:port===465,requireTLS:port===587,auth:{user:config("SMTP_USERNAME"),pass:config("SMTP_PASSWORD")},connectionTimeout:15000,greetingTimeout:15000,socketTimeout:25000,tls:{servername:config("SMTP_HOST"),rejectUnauthorized:true}});
  try{
    const result=await transporter.sendMail({from:{name:config("SMTP_FROM_NAME")||"PipSePaisa",address:config("SMTP_FROM_EMAIL")||"no-reply@pipsepaisa.com"},to:email,subject:"Your PipSePaisa AI Studio Access Is Ready",html:emailHtml(member.data?.full_name||"Creator",role)});
    console.info("Studio access email accepted by SMTP",{user_id:body.user_id,message_id:result.messageId});
    return reply(req,{saved:body.action==="save",notification_needed:true,email_sent:true});
  }catch(e){
    console.error("Studio access SMTP failure",e);
    return reply(req,{saved:body.action==="save",notification_needed:true,email_sent:false,error:"Email failed to send. Use Resend Email."});
  }finally{transporter.close();}
 }catch(e){console.error("Studio access request error",e);return reply(req,{error:"Unable to process Studio access."},500);}
});
