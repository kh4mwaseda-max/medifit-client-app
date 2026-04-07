(()=>{var e={};e.id=846,e.ids=[846],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},27910:e=>{"use strict";e.exports=require("stream")},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},37830:e=>{"use strict";e.exports=require("node:stream/web")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},52478:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>x,routeModule:()=>l,serverHooks:()=>g,workAsyncStorage:()=>m,workUnitAsyncStorage:()=>_});var s={};r.r(s),r.d(s,{POST:()=>p});var i=r(96559),a=r(48088),n=r(37719),o=r(32190),u=r(78290),c=r(56621);let d=new u.Ay;async function p(e){let t;let{clientId:r}=await e.json();if(!r)return o.NextResponse.json({error:"clientId required"},{status:400});let s=(0,c.Ri)(),i=await s.from("clients").select("name, goal, start_date").eq("id",r).single();if(i.error||!i.data)return o.NextResponse.json({error:"Client not found"},{status:404});let a=i.data,n=await s.from("body_records").select("*").eq("client_id",r).order("recorded_at",{ascending:!1}).limit(30),u=await s.from("training_sessions").select("*, training_sets(*)").eq("client_id",r).order("session_date",{ascending:!1}).limit(20),p=await s.from("meal_records").select("*").eq("client_id",r).order("meal_date",{ascending:!1}).limit(30),l=n.data??[],m=u.data??[],_=p.data??[],g=l[0],x=l[l.length-1],h=`
あなたはパーソナルトレーナーのアシスタントAIです。
以下のクライアントデータをもとに、アセスメントレポートをJSON形式で生成してください。

【クライアント基本情報】
- 名前: ${a.name}
- 目標: ${a.goal??"未設定"}
- 開始日: ${a.start_date}

【身体データ（最新）】
${g?`
- 体重: ${g.weight_kg??"未記録"} kg
- 体脂肪率: ${g.body_fat_pct??"未記録"} %
- 筋肉量: ${g.muscle_mass_kg??"未記録"} kg
- 収縮期血圧: ${g.systolic_bp??"未記録"} mmHg
- 睡眠時間: ${g.sleep_hours??"未記録"} 時間
- コンディションスコア: ${g.condition_score??"未記録"} / 10
`:"データなし"}

【身体データ（開始時）】
${x&&x.id!==g?.id?`
- 体重: ${x.weight_kg??"未記録"} kg
- 体脂肪率: ${x.body_fat_pct??"未記録"} %
`:"開始時データなし"}

【直近トレーニングセッション数】${m.length} 回

【食事データ概要（直近30日）】
${_.length>0?`平均カロリー: ${Math.round(_.reduce((e,t)=>e+(t.calories??0),0)/_.length)} kcal/食`:"データなし"}

以下のJSONフォーマットで回答してください（日本語）:
{
  "current_summary": "現状の総合評価（200字以内）",
  "prediction_1m": "現トレンドが続いた場合の1ヶ月後の予測（150字以内）",
  "prediction_3m": "3ヶ月後の予測と見た目・数値の変化（200字以内）",
  "risk_obesity": "low | medium | high",
  "risk_musculoskeletal": "low | medium | high",
  "risk_nutrition": "low | medium | high",
  "risk_sleep": "low | medium | high",
  "action_plan": "今週取り組む具体的な1〜3のアクション（200字以内）"
}
JSON以外のテキストは含めないでください。
`,w=await d.messages.create({model:"claude-sonnet-4-6",max_tokens:1024,messages:[{role:"user",content:h}]}),q="text"===w.content[0].type?w.content[0].text:"";try{t=JSON.parse(q)}catch{return o.NextResponse.json({error:"AI parse error",raw:q},{status:500})}let{data:k,error:f}=await s.from("assessments").insert({client_id:r,generated_at:new Date().toISOString(),published_at:null,...t}).select().single();return f?o.NextResponse.json({error:f.message},{status:500}):o.NextResponse.json({assessment:k})}let l=new i.AppRouteRouteModule({definition:{kind:a.RouteKind.APP_ROUTE,page:"/api/assessment/generate/route",pathname:"/api/assessment/generate",filename:"route",bundlePath:"app/api/assessment/generate/route"},resolvedPagePath:"C:\\Users\\user\\Documents\\InagawaMasayaProject\\PersonalTrainer\\product\\medifit-client-app\\src\\app\\api\\assessment\\generate\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:m,workUnitAsyncStorage:_,serverHooks:g}=l;function x(){return(0,n.patchFetch)({workAsyncStorage:m,workUnitAsyncStorage:_})}},55591:e=>{"use strict";e.exports=require("https")},56621:(e,t,r)=>{"use strict";r.d(t,{Ri:()=>n});var s=r(73026);let i=()=>{let e=process.env.NEXT_PUBLIC_SUPABASE_URL,t=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return(0,s.UU)(e,t)},a=null;new Proxy({},{get:(e,t)=>(a||(a=i()),a[t])});let n=()=>{let e=process.env.NEXT_PUBLIC_SUPABASE_URL,t=process.env.SUPABASE_SERVICE_ROLE_KEY;return(0,s.UU)(e,t)}},57075:e=>{"use strict";e.exports=require("node:stream")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:e=>{"use strict";e.exports=require("node:fs")},73566:e=>{"use strict";e.exports=require("worker_threads")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},96487:()=>{}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[447,26,580,290],()=>r(52478));module.exports=s})();