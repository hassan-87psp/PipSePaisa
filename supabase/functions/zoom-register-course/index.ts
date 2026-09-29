import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ZOOM_ACCOUNT_ID=Deno.env.get("ZOOM_ACCOUNT_ID")??"";
const ZOOM_CLIENT_ID=Deno.env.get("ZOOM_CLIENT_ID")??"";
const ZOOM_CLIENT_SECRET=Deno.env.get("ZOOM_CLIENT_SECRET")??"";
const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SUPABASE_SERVER_KEY=Deno.env.get("SUPABASE_SECRET_KEY")??Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};

type Webinar={course_key:string;class_number:number;title:string;webinar_id:string;scheduled_at:string};
const WEBINARS:Record<string,Webinar[]>={
  "basic-b2":[
    {course_key:"basic-b2",class_number:1,title:"FINANCIAL MARKETS BLUEPRINT",webinar_id:"96530550551",scheduled_at:"2026-09-03T22:00:00+05:00"},
    {course_key:"basic-b2",class_number:2,title:"THE LANGUAGE OF PRICE INTELLIGENCE",webinar_id:"95963996559",scheduled_at:"2026-09-04T22:00:00+05:00"},
    {course_key:"basic-b2",class_number:3,title:"DECODING AND DISSECTING CANDLESTICKS",webinar_id:"96493123401",scheduled_at:"2026-09-05T22:00:00+05:00"},
    {course_key:"basic-b2",class_number:4,title:"EXPLORING TRADER'S TOOLKIT",webinar_id:"91289682755",scheduled_at:"2026-09-06T22:00:00+05:00"},
    {course_key:"basic-b2",class_number:5,title:"BUILDING YOUR TRADING EDGE",webinar_id:"94330222793",scheduled_at:"2026-09-07T22:00:00+05:00"}
  ],
  "fundamental":[
    {course_key:"fundamental",class_number:1,title:"TRADING WITH THE ECONOMIC CALENDAR",webinar_id:"96753074646",scheduled_at:"2026-09-08T22:00:00+05:00"},
    {course_key:"fundamental",class_number:2,title:"CENTRAL BANKS & MARKET IMPACT",webinar_id:"93418121824",scheduled_at:"2026-09-09T22:00:00+05:00"},
    {course_key:"fundamental",class_number:3,title:"DECODING THE FOMC",webinar_id:"93113166876",scheduled_at:"2026-09-10T22:00:00+05:00"}
  ]
};
function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{...corsHeaders,"Content-Type":"application/json"}})}
function splitName(full:string){const p=full.trim().replace(/\s+/g," ").split(" ").filter(Boolean);return{firstName:p[0]||"PipSePaisa",lastName:p.slice(1).join(" ")||"Student"}}
async function readJson(r:Response){try{return await r.json()}catch{return{}}}
async function token(){const u=new URL("https://zoom.us/oauth/token");u.searchParams.set("grant_type","account_credentials");u.searchParams.set("account_id",ZOOM_ACCOUNT_ID);const r=await fetch(u,{method:"POST",headers:{Authorization:`Basic ${btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`)}`,"Content-Type":"application/x-www-form-urlencoded"}});const d=await readJson(r);if(!r.ok||!d.access_token)throw new Error(String(d.reason??d.error_description??d.error??"Could not get Zoom access token."));return String(d.access_token)}
async function register(accessToken:string,webinarId:string,email:string,firstName:string,lastName:string){const r=await fetch(`https://api.zoom.us/v2/webinars/${encodeURIComponent(webinarId)}/registrants`,{method:"POST",headers:{Authorization:`Bearer ${accessToken}`,"Content-Type":"application/json"},body:JSON.stringify({email,first_name:firstName,last_name:lastName})});return{ok:r.ok,status:r.status,data:await readJson(r)}}
async function findExisting(accessToken:string,webinarId:string,email:string){for(const status of ["approved","pending"]){const u=new URL(`https://api.zoom.us/v2/webinars/${encodeURIComponent(webinarId)}/registrants`);u.searchParams.set("status",status);u.searchParams.set("page_size","300");const r=await fetch(u,{headers:{Authorization:`Bearer ${accessToken}`}});const d=await readJson(r);if(!r.ok)continue;const arr=Array.isArray(d.registrants)?d.registrants:[];const hit=arr.find((x:any)=>String(x.email??"").toLowerCase()===email.toLowerCase());if(hit)return hit}return null}

Deno.serve(async(req)=>{
  if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST")return json({success:false,error:"Only POST requests are allowed."},405);
  try{
    if(!ZOOM_ACCOUNT_ID||!ZOOM_CLIENT_ID||!ZOOM_CLIENT_SECRET||!SUPABASE_URL||!SUPABASE_SERVER_KEY)throw new Error("Zoom/Supabase server secrets are not configured.");
    const auth=req.headers.get("Authorization")||"";if(!auth.startsWith("Bearer "))return json({success:false,error:"Please sign in first."},401);
    const admin=createClient(SUPABASE_URL,SUPABASE_SERVER_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data:{user},error:userError}=await admin.auth.getUser(auth.slice(7));if(userError||!user?.email)return json({success:false,error:"Your login session is invalid or expired."},401);
    let body:any={};try{body=await req.json()}catch{}
    const courseKey=String(body.course_key||"").trim().toLowerCase();
    const webinars=WEBINARS[courseKey];if(!webinars)return json({success:false,error:"Automatic Zoom registration is available only for current free courses."},400);
    const {data:enrollment,error:enrollErr}=await admin.from("course_enrollments").select("id,enrollment_status,payment_status").eq("user_id",user.id).eq("course_key",courseKey).maybeSingle();
    if(enrollErr)throw new Error(`Course enrollment check failed: ${enrollErr.message}`);
    const blocked=["rejected","cancelled","revoked"].includes(String(enrollment?.enrollment_status??enrollment?.payment_status??"").toLowerCase());
    if(!enrollment||blocked)return json({success:false,error:"Free course enrollment is required before Zoom registration."},403);
    const fullName=body.full_name||user.user_metadata?.full_name||user.user_metadata?.name||"PipSePaisa Student";const {firstName,lastName}=splitName(fullName);
    const grace=3*60*60*1000;const eligible=webinars.filter(w=>Date.now()<=new Date(w.scheduled_at).getTime()+grace);
    const {data:existing,error:existingErr}=await admin.from("zoom_course_registrations").select("*").eq("user_id",user.id).eq("course_key",courseKey);if(existingErr)throw new Error(`Zoom registration table unavailable: ${existingErr.message}`);
    const byClass=new Map((existing||[]).map((r:any)=>[Number(r.class_number),r]));
    const accessToken=eligible.length?await token():"";const results:any[]=[];
    for(const w of webinars){
      if(!eligible.some(x=>x.class_number===w.class_number)){results.push({class_no:w.class_number,status:"completed",success:true,join_url:null});continue}
      const cached:any=byClass.get(w.class_number);if(cached?.registration_status==="registered"&&String(cached?.join_url||"").startsWith("http")){results.push({class_no:w.class_number,status:"registered",success:true,cached:true,join_url:cached.join_url});continue}
      await admin.from("zoom_course_registrations").upsert({user_id:user.id,course_key:courseKey,class_number:w.class_number,title:w.title,webinar_id:w.webinar_id,scheduled_at:w.scheduled_at,registration_status:"pending",last_attempt_at:new Date().toISOString()},{onConflict:"user_id,course_key,class_number"});
      const r=await register(accessToken,w.webinar_id,user.email,firstName,lastName);let d:any=r.data;let recovered=false;
      if(!r.ok&&/already|exist|registered/i.test(String(d.message??d.error??""))){const found=await findExisting(accessToken,w.webinar_id,user.email);if(found){d=found;recovered=true}}
      const joinUrl=d?.join_url?String(d.join_url):null;const registrantId=d?.registrant_id??d?.id??null;const approved=!!joinUrl;const apiSucceeded=r.ok||recovered;const status=approved?"registered":apiSucceeded?"pending":"failed";const err=apiSucceeded?null:String(d?.message??d?.error??"Zoom registration failed.");
      const saved=await admin.from("zoom_course_registrations").upsert({user_id:user.id,course_key:courseKey,class_number:w.class_number,title:w.title,webinar_id:w.webinar_id,scheduled_at:w.scheduled_at,registrant_id:registrantId,join_url:joinUrl,registration_status:status,zoom_http_status:r.status,zoom_error_message:err,registered_at:approved?new Date().toISOString():null,last_attempt_at:new Date().toISOString()},{onConflict:"user_id,course_key,class_number"});if(saved.error)throw new Error(`Could not save Session ${w.class_number} Zoom link: ${saved.error.message}`);
      results.push({class_no:w.class_number,status,success:approved,join_url:joinUrl,message:err});
    }
    const registered=results.filter(x=>x.status==="registered").length,pending=results.filter(x=>x.status==="pending").length,failed=results.filter(x=>x.status==="failed").length,completed=results.filter(x=>x.status==="completed").length;
    return json({success:failed===0,complete:registered===eligible.length,course_key:courseKey,enrollment_id:enrollment.id,registered,pending,failed,completed_count:completed,eligible_count:eligible.length,total_classes:webinars.length,results},failed?207:200);
  }catch(e){console.error("zoom-register-course",e);return json({success:false,error:e instanceof Error?e.message:"Unexpected Zoom registration error."},500)}
});
