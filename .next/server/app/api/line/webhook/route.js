(()=>{var e={};e.id=366,e.ids=[366],e.modules={3295:e=>{"use strict";e.exports=require("next/dist/server/app-render/after-task-async-storage.external.js")},10846:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},11997:e=>{"use strict";e.exports=require("punycode")},27910:e=>{"use strict";e.exports=require("stream")},28354:e=>{"use strict";e.exports=require("util")},29021:e=>{"use strict";e.exports=require("fs")},29294:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-async-storage.external.js")},33873:e=>{"use strict";e.exports=require("path")},37830:e=>{"use strict";e.exports=require("node:stream/web")},44870:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},55591:e=>{"use strict";e.exports=require("https")},56621:(e,t,r)=>{"use strict";r.d(t,{Ri:()=>i});var s=r(73026);let a=()=>{let e=process.env.NEXT_PUBLIC_SUPABASE_URL,t=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;return(0,s.UU)(e,t)},n=null;new Proxy({},{get:(e,t)=>(n||(n=a()),n[t])});let i=()=>{let e=process.env.NEXT_PUBLIC_SUPABASE_URL,t=process.env.SUPABASE_SERVICE_ROLE_KEY;return(0,s.UU)(e,t)}},57075:e=>{"use strict";e.exports=require("node:stream")},63033:e=>{"use strict";e.exports=require("next/dist/server/app-render/work-unit-async-storage.external.js")},73024:e=>{"use strict";e.exports=require("node:fs")},73566:e=>{"use strict";e.exports=require("worker_threads")},74075:e=>{"use strict";e.exports=require("zlib")},78335:()=>{},79551:e=>{"use strict";e.exports=require("url")},81630:e=>{"use strict";e.exports=require("http")},94565:(e,t,r)=>{"use strict";r.r(t),r.d(t,{patchFetch:()=>q,routeModule:()=>k,serverHooks:()=>b,workAsyncStorage:()=>S,workUnitAsyncStorage:()=>E});var s={};r.r(s),r.d(s,{POST:()=>w});var a=r(96559),n=r(48088),i=r(37719),o=r(32190),l=r(56621);let u=require("crypto");var p=r.n(u);let _=process.env.LINE_CHANNEL_ACCESS_TOKEN,c=process.env.LINE_CHANNEL_SECRET;async function d(e){let t=await fetch(`https://api-data.line.me/v2/bot/message/${e}/content`,{headers:{Authorization:`Bearer ${_}`}});if(!t.ok)throw Error(`LINE content fetch failed: ${t.status}`);return t.arrayBuffer()}async function m(e,t){await fetch("https://api.line.me/v2/bot/message/reply",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${_}`},body:JSON.stringify({replyToken:e,messages:[{type:"text",text:t}]})})}let g=new(r(78290)).Ay;async function f(e){let t=Buffer.from(e).toString("base64"),r=`このスクリーンショットを解析してください。

まず、このスクリーンショットがどのアプリのものか判定してください：
- **あすけん**: 食事記録・栄養管理アプリ（食事名、カロリー、PFCが表示されている）
- **筋トレメモ**: トレーニング記録アプリ（種目名、重量、回数、セット数が表示されている）
- **unknown**: 上記以外

判定結果に応じて、以下のJSONのどちらかを返してください。JSON以外のテキストは含めないでください。

【あすけんの場合】
{
  "app_type": "asken",
  "date": "YYYY-MM-DD（画面に日付があれば。なければ今日の日付を入れる）",
  "meals": [
    {
      "meal_type": "breakfast|lunch|dinner|snack",
      "food_name": "食品名",
      "calories": 数値またはnull,
      "protein_g": 数値またはnull,
      "fat_g": 数値またはnull,
      "carbs_g": 数値またはnull
    }
  ],
  "total_calories": 数値またはnull,
  "total_protein_g": 数値またはnull,
  "total_fat_g": 数値またはnull,
  "total_carbs_g": 数値またはnull
}

【筋トレメモの場合】
{
  "app_type": "kintore",
  "date": "YYYY-MM-DD（画面に日付があれば。なければ今日の日付）",
  "sets": [
    {
      "exercise_name": "種目名（日本語）",
      "muscle_group": "部位またはnull",
      "weight_kg": 数値またはnull,
      "reps": 数値またはnull,
      "set_number": 1から始まる連番
    }
  ],
  "notes": "メモがあれば文字列、なければnull"
}

【どちらでもない場合】
{
  "app_type": "unknown",
  "reason": "判定できなかった理由"
}

注意：
- meal_typeはスクリーンショットの区分から判定（朝食→breakfast、昼食→lunch、夕食→dinner、間食→snack）
- 複数の食事や種目が表示されていれば全て抽出する
- 数値は単位を除いた数値のみ（例: "250kcal" → 250）
- 読み取れない値はnullにする`,s=await g.messages.create({model:"claude-sonnet-4-6",max_tokens:2048,messages:[{role:"user",content:[{type:"image",source:{type:"base64",media_type:"image/jpeg",data:t}},{type:"text",text:r}]}]}),a="text"===s.content[0].type?s.content[0].text:"",n=a.match(/```json\n?([\s\S]*?)\n?```/)??a.match(/(\{[\s\S]*\})/);return JSON.parse((n?n[1]:a).trim())}async function w(e){let t=await e.text(),r=e.headers.get("x-line-signature")??"";if(p().createHmac("SHA256",c).update(t).digest("base64")!==r)return o.NextResponse.json({error:"Invalid signature"},{status:401});let s=JSON.parse(t).events??[];return await Promise.allSettled(s.map(y)),o.NextResponse.json({ok:!0})}async function y(e){let{type:t,replyToken:r,source:s,message:a}=e;if("message"!==t)return;let n=s?.userId;if(!n)return;let i=(0,l.Ri)();if("text"===a.type){let e=a.text.trim();if(!/^\d{4,6}$/.test(e)){let{data:e}=await i.from("clients").select("id, name").eq("line_user_id",n).single();e?await m(r,`${e.name} さん、こんにちは！
あすけんか筋トレメモのスクリーンショットを送ってください📸
自動でダッシュボードに記録します✅`):await m(r,"はじめまして！\nトレーナーから共有された4〜6桁のPINコードを送ってください\uD83D\uDD11");return}let{data:t}=await i.from("clients").select("id, name, line_user_id").eq("pin",e).single();if(!t){await m(r,"PINコードが正しくありません。トレーナーに確認してください。");return}if(t.line_user_id&&t.line_user_id!==n){await m(r,"このPINは既に別のアカウントで登録済みです。トレーナーにお問い合わせください。");return}await i.from("clients").update({line_user_id:n}).eq("id",t.id),await m(r,`${t.name} さん、登録完了です🎉
あすけんか筋トレメモのスクリーンショットを送ると、自動でダッシュボードに記録します📊`);return}if("image"===a.type){let e,t;let{data:s}=await i.from("clients").select("id, name").eq("line_user_id",n).single();if(!s){await m(r,"まだ連携されていません。トレーナーから共有されたPINコードを送ってください\uD83D\uDD11");return}try{e=await d(a.id)}catch{await m(r,"画像の取得に失敗しました。もう一度送ってください。");return}try{t=await f(e)}catch{await i.from("line_parse_logs").insert({client_id:s.id,line_message_id:a.id,app_type:"unknown",raw_json:null,status:"failed",error_message:"Claude解析エラー"}),await m(r,"画像の解析に失敗しました。もう一度送ってください。");return}if("unknown"===t.app_type){await i.from("line_parse_logs").insert({client_id:s.id,line_message_id:a.id,app_type:"unknown",raw_json:t,status:"failed",error_message:t.reason}),await m(r,"あすけんまたは筋トレメモのスクリーンショットを送ってください\uD83D\uDCF1\n（他のアプリの画像は対応していません）");return}try{"asken"===t.app_type?await x(i,s.id,t):await h(i,s.id,t),await i.from("line_parse_logs").insert({client_id:s.id,line_message_id:a.id,app_type:t.app_type,raw_json:t,status:"success",error_message:null});let e=function(e){if("asken"===e.app_type)return[`✅ 食事記録を保存しました（${e.date}）`,null!=e.total_calories?`🔥 合計 ${e.total_calories} kcal`:null,null!=e.total_protein_g?`💪 P: ${e.total_protein_g}g`:null,null!=e.total_fat_g?`🫙 F: ${e.total_fat_g}g`:null,null!=e.total_carbs_g?`🍚 C: ${e.total_carbs_g}g`:null,`
${e.meals.length} 品目を記録しました📊`].filter(Boolean).join("\n");{let t=[...new Set(e.sets.map(e=>e.exercise_name))];return`✅ トレーニングを記録しました（${e.date}）
💪 ${t.join("・")}
📊 ${e.sets.length} セット記録`}}(t);await m(r,e)}catch(e){await i.from("line_parse_logs").insert({client_id:s.id,line_message_id:a.id,app_type:t.app_type,raw_json:t,status:"failed",error_message:e?.message??"DB保存エラー"}),await m(r,"記録の保存に失敗しました。トレーナーにお知らせください。")}}}async function x(e,t,r){let s=r.meals.map(e=>({client_id:t,meal_date:r.date,meal_type:e.meal_type,food_name:e.food_name,calories:e.calories,protein_g:e.protein_g,fat_g:e.fat_g,carbs_g:e.carbs_g}));if(s.length>0){let{error:t}=await e.from("meal_records").insert(s);if(t)throw Error(t.message)}}async function h(e,t,r){let{data:s,error:a}=await e.from("training_sessions").insert({client_id:t,session_date:r.date,notes:r.notes}).select().single();if(a)throw Error(a.message);let n=r.sets.map(e=>({session_id:s.id,exercise_name:e.exercise_name,muscle_group:e.muscle_group,weight_kg:e.weight_kg,reps:e.reps,set_number:e.set_number,rpe:null}));if(n.length>0){let{error:t}=await e.from("training_sets").insert(n);if(t)throw Error(t.message)}}let k=new a.AppRouteRouteModule({definition:{kind:n.RouteKind.APP_ROUTE,page:"/api/line/webhook/route",pathname:"/api/line/webhook",filename:"route",bundlePath:"app/api/line/webhook/route"},resolvedPagePath:"C:\\Users\\user\\Documents\\InagawaMasayaProject\\PersonalTrainer\\product\\medifit-client-app\\src\\app\\api\\line\\webhook\\route.ts",nextConfigOutput:"",userland:s}),{workAsyncStorage:S,workUnitAsyncStorage:E,serverHooks:b}=k;function q(){return(0,i.patchFetch)({workAsyncStorage:S,workUnitAsyncStorage:E})}},96487:()=>{}};var t=require("../../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[447,26,580,290],()=>r(94565));module.exports=s})();