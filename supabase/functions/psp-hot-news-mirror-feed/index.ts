// Read-only public mirror of headlines already broadcast to PipSePaisa's
// "Total Subscriptions" segment. No push credentials, subscriber data, or
// unpublished/queued articles are returned. This does NOT send any pushes.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {createClient} from "npm:@supabase/supabase-js@2.49.8";
const URL_BASE=Deno.env.get("SUPABASE_URL")||"";
const SECRET=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")||"";
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{
 status,headers:{"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}
});
Deno.serve(async(req:Request)=>{
 if(req.method!=="GET")return json({success:false,error:"Method not allowed"},405);
 if(!URL_BASE||!SECRET)return json({success:false,error:"Feed unavailable"},503);
 try{
  const db=createClient(URL_BASE,SECRET,{auth:{persistSession:false,autoRefreshToken:false}});
  const since=new Date(Date.now()-20*60000).toISOString();
  const {data,error}=await db.from("psp_hot_news_push_log")
   .select("headline,article_url,source,published_at,sent_at")
   .eq("status","sent").gte("sent_at",since)
   .order("sent_at",{ascending:false}).limit(36);
  if(error)throw Error("Pip HOT push history unavailable");
  const items=(data||[]).filter(x=>x.sent_at&&x.article_url&&
   /^https:\/\//i.test(String(x.article_url))).map(x=>({
    headline:String(x.headline||"").slice(0,240),
    article_url:String(x.article_url||"").slice(0,1800),
    source:String(x.source||"Publisher").slice(0,100),
    published_at:x.published_at,sent_at:x.sent_at
   }));
  return json({success:true,items});
 }catch(e){
  console.error("psp HOT public mirror",e instanceof Error?e.message:"error");
  return json({success:false,error:"Recent headline mirror unavailable"},503);
 }
});
