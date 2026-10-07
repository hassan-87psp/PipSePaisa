/* PipSePaisa V446 — Infinity callback for VIP/Premium payments. */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")??"";
const SERVICE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??Deno.env.get("SUPABASE_SECRET_KEY")??"";
const VERSION="v446";

function json(data:Record<string,unknown>,status=200){return new Response(JSON.stringify(data),{status,headers:{"Content-Type":"application/json","Cache-Control":"no-store"}})}
function first(p:Record<string,unknown>,keys:string[]){for(const k of keys){const v=p[k];if(v!==undefined&&v!==null&&String(v).trim()!=="")return String(v).trim()}return""}
function normalize(v:unknown):"accepted"|"rejected"|"expired"|""{
  const s=String(v??"").trim().toLowerCase().replace(/[\s-]+/g,"_");
  if(["accepted","approved","approve","success","successful","paid","completed","complete","captured","confirmed","verified","settled","payment_success","payment_approved"].includes(s))return"accepted";
  if(["rejected","reject","declined","failed","failure","cancelled","canceled","void","reversed","payment_failed","payment_rejected"].includes(s))return"rejected";
  if(["expired","timeout","timed_out"].includes(s))return"expired";
  if(/accept|approv|success|paid|verif|settled|complete/.test(s))return"accepted";
  if(/reject|declin|fail|cancel|reverse|void/.test(s))return"rejected";
  if(/expir|timeout/.test(s))return"expired";
  return"";
}
function tokenFrom(req:Request){
  const u=new URL(req.url);
  const qp=u.searchParams.get("token")||"";
  if(qp)return qp;
  const parts=u.pathname.split("/").filter(Boolean);
  return parts[parts.length-1]||"";
}
async function payloadOf(req:Request){
  const u=new URL(req.url);const out:Record<string,unknown>={};
  u.searchParams.forEach((v,k)=>out[k]=v);
  if(req.method==="POST"){
    const ct=req.headers.get("content-type")||"";
    try{
      if(ct.includes("application/json"))Object.assign(out,await req.json());
      else {const fd=await req.formData();for(const [k,v] of fd.entries())out[k]=String(v)}
    }catch{}
  }
  return out;
}

Deno.serve(async(req:Request)=>{
  if(!["GET","POST"].includes(req.method))return json({success:false,error:"Only GET/POST are allowed.",version:VERSION},405);
  if(!SUPABASE_URL||!SERVICE)return json({success:false,error:"Callback configuration incomplete.",version:VERSION},500);

  try{
    const p=await payloadOf(req);
    const requestId=first(p,["request_id","requestId","id","transaction_id"]);
    const rawStatus=first(p,["status","payment_status","paymentStatus","transaction_status","request_status","state","result"]);
    const reason=first(p,["rejection_reason","reason","message","status_message","verification_message","error"]);
    const amountRaw=first(p,["amount","payment_amount","paymentAmount","paid_amount","transaction_amount"]);
    const status=normalize(rawStatus)||(/reject|declin|fail/i.test(reason)?"rejected":"");
    if(!/^\d+$/.test(requestId))return json({success:false,error:"Invalid request_id.",version:VERSION},400);
    if(!status)return json({success:false,error:"Unsupported payment status.",version:VERSION},400);

    const service=createClient(SUPABASE_URL,SERVICE,{auth:{persistSession:false}});
    const row=await service.from("payment_requests")
      .select("id,provider_amount,provider_status,status")
      .eq("provider","infinity").eq("provider_request_id",Number(requestId))
      .limit(1).maybeSingle();
    if(row.error||!row.data)return json({success:false,error:"VIP payment request not found.",version:VERSION},404);

    const supplied=tokenFrom(req);
    if(!supplied||supplied.length<32)return json({success:false,error:"Invalid callback token.",version:VERSION},401);
    const tokenVerify=await service.rpc("psp_verify_payment_callback_v493",{
      p_scope:"vip",
      p_request_id:Number(requestId),
      p_token:supplied,
    });
    if(tokenVerify.error||tokenVerify.data!==true)return json({success:false,error:"Invalid callback token.",version:VERSION},401);

    const amount = (status==="rejected"||status==="expired")
      ? Number(row.data.provider_amount??0)
      : Number(amountRaw||row.data.provider_amount||0);
    if(!Number.isFinite(amount)||amount<=0)return json({success:false,error:"Invalid callback amount.",version:VERSION},400);

    const fin=await service.rpc("finalize_infinity_vip_payment_v446",{
      p_request_id:Number(requestId),
      p_provider_status:status,
      p_callback_amount:amount,
      p_rejection_reason:reason||null,
      p_payload:{...p,_psp_received_status:rawStatus,_psp_normalized_status:status},
    });
    if(fin.error)return json({success:false,error:fin.error.message,version:VERSION},400);

    return json({success:true,request_id:requestId,status,idempotent:Array.isArray(fin.data)&&fin.data[0]?.idempotent===true,version:VERSION});
  }catch(error){
    console.error("infinity-vip-payment-callback failed",error);
    return json({success:false,error:error instanceof Error?error.message:"Callback processing failed.",version:VERSION},500);
  }
});