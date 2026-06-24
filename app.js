const KEY="voice-events-v7",M=60000;
let rec,chunks=[],active=null;
const $=id=>document.getElementById(id);
const STATUS_LABELS={all:"Показать все",filled:"Заполнено",wait:"Ожидает",warning:"Внимание",danger:"Просрочено"};
let s=load();

function load(){
  let x=localStorage.getItem(KEY);
  return x?JSON.parse(x):{settings:{theme:"theme-standard",interval:60,ip:"",notify:false},filter:{date:"",status:"all"},events:[],tasks:[],chat:[{from:"bot",text:"Привет! Это чат Voice Events."}],docs:[]}
}
function save(){localStorage.setItem(KEY,JSON.stringify(s))}
function z(n){return String(n).padStart(2,"0")}
function iso(d){return d.getFullYear()+"-"+z(d.getMonth()+1)+"-"+z(d.getDate())}
function rd(d){return d.toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"})}
function hm(d){return d.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"})}
function esc(v){return String(v||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]))}
function st(e){
  if(e.items.length)return{c:"filled",i:"✓",t:"Заполнено",d:"Заполнено в "+hm(new Date(e.items.at(-1).created)),p:"Заполнено"};
  let h=Math.floor((Date.now()-new Date(e.time))/3600000);
  if(h>=5)return{c:"danger",i:"!",t:"Просрочено",d:"не заполнено "+h+" ч.",p:"Просрочено"};
  if(h>=3)return{c:"warning",i:"◉",t:"Ожидает заполнения",d:"не заполнено "+h+" ч.",p:"Ожидает"};
  return{c:"wait",i:"◷",t:"Ожидает заполнения",d:h?"не заполнено "+h+" ч.":"текущий интервал",p:"Ожидает"}
}
function ensure(){
  let step=Math.max(1,s.settings.interval||60)*M,d=new Date();
  d.setSeconds(0,0);
  let cur=Math.floor(d/step)*step,ids=new Set(s.events.map(e=>e.id));
  for(let t=cur;t>=cur-step*24;t-=step)if(!ids.has(String(t)))s.events.push({id:String(t),time:new Date(t).toISOString(),items:[]});
  s.events.sort((a,b)=>new Date(b.time)-new Date(a.time));save()
}
function bodyClass(){
  let cls=[s.settings.theme||"theme-standard"];
  if(active)cls.push("detail-mode");
  if(!$('tasks')?.classList.contains('hidden'))cls.push("tasks-mode");
  document.body.className=cls.join(" ")
}
function syncFilterUi(){
  if($("fd"))$("fd").value=s.filter.date||"";
  if($("fs"))$("fs").value=s.filter.status||"all";
  if($("fdOnly"))$("fdOnly").value=s.filter.date||"";
  if($("statusLabel"))$("statusLabel").textContent=STATUS_LABELS[s.filter.status||"all"]||"Показать все";
  document.querySelectorAll(".status-choice").forEach(b=>b.classList.toggle("active",b.dataset.status===(s.filter.status||"all")));
  if($("filterBtn"))$("filterBtn").classList.toggle("hasfilter",s.filter.status!="all");
  if($("dateBtn"))$("dateBtn").classList.toggle("hasfilter",!!s.filter.date)
}
function apply(){
  bodyClass();
  if($("ip"))$("ip").value=s.settings.ip||"";
  if($("hh"))$("hh").value=Math.floor((s.settings.interval||60)/60);
  if($("mm"))$("mm").value=(s.settings.interval||60)%60;
  if($("notify"))$("notify").checked=!!s.settings.notify;
  syncFilterUi()
}
function go(v){
  active=null;
  ["events","tasks","chat","docs","transport","map","settings","detail"].forEach(x=>$(x)?.classList.toggle("hidden",x!==v));
  $("nav")?.classList.toggle("hidden",v==="detail");
  document.querySelectorAll("#nav button").forEach(b=>b.classList.toggle("active",b.dataset.go===v));
  if($("subtitle"))$("subtitle").textContent={events:"Журнал событий",tasks:"Задачи",chat:"Чат",docs:"Документы",transport:"Транспорт",map:"Карта",settings:"Настройки"}[v]||"Журнал событий";
  render();apply()
}
function list(){
  ensure();
  if($("today"))$("today").textContent=s.filter.date?rd(new Date(s.filter.date+"T00:00")):rd(new Date());
  let arr=s.events.filter(e=>(!s.filter.date||iso(new Date(e.time))===s.filter.date)&&(!s.filter.status||s.filter.status==="all"||st(e).c===s.filter.status));
  if($("eventList")){
    $("eventList").innerHTML=arr.length?arr.map(e=>{let a=st(e),d=new Date(e.time),filled=a.c==="filled";return `<div class="event ${a.c}" data-id="${e.id}"><div class="ico">${a.i}</div><div><div class="time">${hm(d)}</div><div class="desc">${rd(d)}<br><b>${a.t}</b><br>${a.d}</div></div><div class="right">${filled?`<span class="check">✓</span><br>в ${hm(new Date(e.items.at(-1).created))}`:"›"}</div></div>`}).join(""):"<div class='msg'>По фильтру событий нет.</div>";
    document.querySelectorAll(".event[data-id]").forEach(el=>el.onclick=()=>openEv(el.dataset.id))
  }
  apply()
}
function openEv(id){
  active=id;apply();
  ["events","tasks","chat","docs","transport","map","settings"].forEach(x=>$(x)?.classList.add("hidden"));
  $("detail")?.classList.remove("hidden");$("nav")?.classList.add("hidden");
  let e=s.events.find(x=>x.id===id),a=st(e),d=new Date(e.time);
  $("dt").textContent="Событие "+hm(d);$("ds").textContent=rd(d)+" · "+a.t;$("pill").textContent=a.p;$("pill").classList.toggle("filled",a.c==="filled");msgs()
}
function closeEv(){
  if(rec&&rec.state==="recording")rec.stop();
  active=null;apply();$("detail")?.classList.add("hidden");$("events")?.classList.remove("hidden");$("nav")?.classList.remove("hidden");list()
}
function msgs(){
  let e=s.events.find(x=>x.id===active);if(!e||!$("msgs"))return;
  $("msgs").innerHTML=e.items.length?e.items.map(it=>{
    let when=new Date(it.created).toLocaleString("ru-RU");
    if(it.type==="audio")return `<div class="msg"><small>${when}</small><br><b>Голосовое сообщение</b><audio controls src="${it.data}"></audio></div>`;
    if(it.type==="text")return `<div class="msg"><small>${when}</small><br><b>Комментарий</b><p>${esc(it.text)}</p></div>`;
    return `<div class="msg"><small>${when}</small><br><b>Фото события</b><img src="${it.data}"></div>`
  }).join(""):"<div class='msg'><small>Пока нет сообщений</small><br>Нажмите микрофон, добавьте фото или комментарий.</div>"
}
function fileData(f,cb){let r=new FileReader();r.onloadend=()=>cb(r.result);r.readAsDataURL(f)}
async function record(){
  if(rec&&rec.state==="recording"){rec.stop();return}
  try{
    let stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];rec=new MediaRecorder(stream);
    rec.ondataavailable=e=>chunks.push(e.data);
    rec.onstop=()=>{let r=new FileReader();r.onloadend=()=>{s.events.find(e=>e.id===active).items.push({type:"audio",data:r.result,created:new Date().toISOString()});save();msgs()};r.readAsDataURL(new Blob(chunks,{type:"audio/webm"}));stream.getTracks().forEach(t=>t.stop());$("rec").classList.remove("recording")};
    rec.start();$("rec").classList.add("recording")
  }catch(e){alert("Разрешите доступ к микрофону")}
}
function addEventText(){
  let input=$("eventText"),text=input?.value.trim();if(!text||!active)return;
  s.events.find(e=>e.id===active).items.push({type:"text",text,created:new Date().toISOString()});input.value="";save();msgs();list()
}
function addTaskFromInputs(){
  let quick=$("taskQuickText"),text=(quick?.value||$("taskText")?.value||"").trim(),f=$("taskQuickPhoto")?.files?.[0]||$("taskPhoto")?.files?.[0];if(!text)return;
  let add=photo=>{s.tasks.unshift({text,photo});if($("taskText"))$("taskText").value="";if(quick)quick.value="";if($("taskPhoto"))$("taskPhoto").value="";if($("taskQuickPhoto"))$("taskQuickPhoto").value="";save();render()};
  f?fileData(f,add):add("")
}
function openDateFilter(){if($("fdOnly"))$("fdOnly").value=s.filter.date||"";$("dateSheet")?.classList.remove("hidden")}
function openStatusFilter(){syncFilterUi();$("statusSheet")?.classList.remove("hidden")}
function closeFilterSheets(){["dateSheet","statusSheet","sheet"].forEach(id=>$(id)?.classList.add("hidden"))}
function render(){
  list();
  if($("taskList"))$("taskList").innerHTML=s.tasks.map(t=>`<div class="task"><b>${esc(t.text)}</b>${t.photo?`<img src="${t.photo}">`:""}</div>`).join("");
  if($("chatList"))$("chatList").innerHTML=s.chat.map(m=>`<div class="bubble ${m.from==="me"?"me":""}">${esc(m.text)}</div>`).join("");
  if($("docList"))$("docList").innerHTML=s.docs.map(d=>`<div class="doc"><b>${esc(d.name)}</b>${d.data.startsWith("data:image")?`<img src="${d.data}">`:"<p>Файл</p>"}</div>`).join("");
  apply()
}

$("back").onclick=closeEv;
$("mapGlobe").onclick=e=>{e.stopPropagation();$("profile").classList.remove("open");go("map")};
$("avatar").onclick=e=>{e.stopPropagation();$("profile").classList.toggle("open")};
document.onclick=e=>{if(!$('profile').contains(e.target)&&e.target!==$('avatar'))$('profile').classList.remove('open')};
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>{$("profile").classList.remove("open");go(b.dataset.go)});
$("dateBtn").onclick=openDateFilter;
$("filterBtn").onclick=openStatusFilter;
$("dateX").onclick=closeFilterSheets;
$("statusX").onclick=closeFilterSheets;
$("dateApply").onclick=()=>{s.filter.date=$("fdOnly").value;save();closeFilterSheets();list()};
$("dateReset").onclick=()=>{s.filter.date="";save();closeFilterSheets();list()};
document.querySelectorAll(".status-choice").forEach(b=>b.onclick=()=>{s.filter.status=b.dataset.status;save();closeFilterSheets();list()});
if($("x"))$("x").onclick=closeFilterSheets;
if($("apply"))$("apply").onclick=()=>{s.filter={date:$("fd").value,status:$("fs").value};save();closeFilterSheets();list()};
if($("reset"))$("reset").onclick=()=>{s.filter={date:"",status:"all"};save();closeFilterSheets();list()};
$("rec").onclick=record;
$("eventText").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();addEventText()}};
$("photo").onchange=e=>e.target.files[0]&&fileData(e.target.files[0],data=>{s.events.find(x=>x.id===active).items.push({type:"photo",data,created:new Date().toISOString()});save();msgs();list()});
$("taskMic").onclick=()=>{$("taskQuickText").value=$("taskQuickText").value||"Голосовая заметка: ";$("taskQuickText").focus()};
$("taskQuickAdd").onclick=addTaskFromInputs;
$("taskQuickText").onkeydown=e=>{if(e.key==="Enter"){e.preventDefault();addTaskFromInputs()}};
$("addTask").onclick=addTaskFromInputs;
$("send").onclick=()=>{let t=$("chatText").value.trim();if(!t)return;s.chat.push({from:"me",text:t});$("chatText").value="";save();render()};
$("docIn").onchange=e=>[...e.target.files].forEach(f=>fileData(f,data=>{s.docs.unshift({name:f.name,data});save();render()}));
document.querySelectorAll(".theme").forEach(b=>b.onclick=()=>{s.settings.theme=b.dataset.theme;save();apply()});
["ip","hh","mm","notify"].forEach(id=>$(id).onchange=()=>{s.settings.ip=$("ip").value;s.settings.interval=(+$("hh").value*60)+ +$("mm").value ||60;s.settings.notify=$("notify").checked;save();list()});
apply();go("events");setInterval(list,60000);if("serviceWorker"in navigator)navigator.serviceWorker.register("service-worker.js");