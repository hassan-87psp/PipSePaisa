
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
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
  // Deliver via the SAME send-course-email Supabase Edge Function and
  // SMTP configuration used for other official PipSePaisa notifications.
  // That function independently verifies admin identity, active access,
  // recipient email in Auth, and the role in the database.
  try {
    const mailResponse = await fetch(url + "/functions/v1/send-course-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + jwt,
        "apikey": publicKey,
      },
      body: JSON.stringify({
        type: "studio_access_granted",
        target_user_id: body.user_id,
      }),
    });
    const delivered = await mailResponse.json().catch(() => ({}));
    if (!mailResponse.ok || delivered.success !== true) {
      console.error("Supabase central Studio email failed", {
        user_id: body.user_id,
        status: mailResponse.status,
        request_id: delivered.request_id || null,
        error: delivered.error || "Email not accepted",
      });
      return reply(req, {
        saved:body.action==="save",
        notification_needed:true,
        email_sent:false,
        error:delivered.error || "Email delivery failed. Please use Resend Email.",
      });
    }
    console.info("Studio access email sent through send-course-email",{
      user_id:body.user_id,
      request_id:delivered.request_id || null,
      message_id:delivered.message_id || null,
    });
    return reply(req, {
      saved:body.action==="save",
      notification_needed:true,
      email_sent:true,
      delivery_service:"supabase/send-course-email",
    });
  } catch(e) {
    console.error("Supabase central Studio email request failed",e);
    return reply(req,{
      saved:body.action==="save",
      notification_needed:true,
      email_sent:false,
      error:"Supabase email service unavailable. Please use Resend Email.",
    });
  }
 }catch(e){console.error("Studio access request error",e);return reply(req,{error:"Unable to process Studio access."},500);}
});
