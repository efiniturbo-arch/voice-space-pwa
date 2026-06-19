const STORAGE_KEY="voice-events-v3";
const ONE_HOUR=60*60*1000;
const now=()=>new Date();
let state=loadState();
let activeEventId=null;
let recorder=null;
let recordChunks=[];

function loadState(){
  const saved=localStorage.getItem(STORAGE_KEY);
  if(saved) return JSON.parse(saved);
  const current=new Date();
  current.setMinutes(0,0,0);
  const events=[];
  for(let i=0;i<8;i++){
    const d=new Date(current.getTime()-i*ONE_HOUR);
    events.push({id:String(d.getTime()),time:d.toISOString(),items:[]});
  }
  return {events};
}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
function ensureHourlyEvents(){
  const current=new Date(); current.setMinutes(0,0,0);
  const ids=new Set(state.events.map(e=>e.id));
  for(let t=current.getTime();t>=current.getTime()-7*ONE_HOUR;t-=ONE_HOUR){
    if(!ids.has(String(t))) state.events.push({id:String(t),time:new Date(t).toISOString(),items:[]});
  }
  state.events.sort((a,b)=>new Date(b.time)-new Date(a.time));
  saveState();
}
function ruDate(date){
  return date.toLocaleDateString("ru-RU",{day:"numeric",month:"long",year:"numeric"});
}
function hhmm(date){
  return date.toLocaleTimeString("ru-RU",{hour:"2-digit",minute:"2-digit"});
}
function ageHours(event){
  return Math.floor((Date.now()-new Date(event.time).getTime())/ONE_HOUR);
}
function statusOf(event){
  if(event.items.length>0) return {className:"filled",icon:"✓",title:"Заполнено",desc:`сообщений: ${event.items.length}`,pill:"Заполнено"};
  const h=ageHours(event);
  if(h>=5) return {className:"danger",icon:"!",title:"Критично! Заполните событие.",desc:`не заполнено ${h} ч.`,pill:"Просрочено 5+ ч."};
  if(h>=3) return {className:"warning",icon:"◉",title:"Внимание! Заполните событие.",desc:`не заполнено ${h} ч.`,pill:"Ожидает 3+ ч."};
  return {className:"wait",icon:"◷",title:"Ожидает заполнения",desc:h===0?"текущий час":`не заполнено ${h} ч.`,pill:"Ожидает"};
}
function renderList(){
  ensureHourlyEvents();
  document.getElementById("todayLabel").textContent=ruDate(now());
  const root=document.getElementById("events");
  root.innerHTML=state.events.map(event=>{
    const d=new Date(event.time); const s=statusOf(event);
    return `<div class="event ${s.className}" data-id="${event.id}">
      <div class="icon">${s.icon}</div>
      <div><div class="time">${hhmm(d)}</div><div class="desc">${s.title}<br>${s.desc}</div></div>
      <div class="arrow">›</div>
    </div>`;
  }).join("");
  root.querySelectorAll(".event").forEach(el=>el.addEventListener("click",()=>openEvent(el.dataset.id)));
}
function openEvent(id){
  activeEventId=id;
  const event=state.events.find(e=>e.id===id);
  const d=new Date(event.time); const s=statusOf(event);
  document.body.classList.add("detail-mode");
  document.getElementById("listScreen").classList.add("hidden");
  document.getElementById("detailScreen").classList.remove("hidden");
  document.getElementById("screenSubtitle").textContent="Карточка события";
  document.getElementById("detailTitle").textContent=`Событие ${hhmm(d)}`;
  document.getElementById("detailStatus").textContent=`${ruDate(d)} · ${s.title}`;
  document.getElementById("detailPill").textContent=s.pill;
  renderMessages();
}
function closeEvent(){
  if(recorder && recorder.state==="recording") recorder.stop();
  activeEventId=null;
  document.body.classList.remove("detail-mode");
  document.getElementById("detailScreen").classList.add("hidden");
  document.getElementById("listScreen").classList.remove("hidden");
  document.getElementById("screenSubtitle").textContent="Журнал событий";
  renderList();
}
function renderMessages(){
  const event=state.events.find(e=>e.id===activeEventId);
  const box=document.getElementById("messages");
  if(!event.items.length){
    box.innerHTML='<div class="message"><div class="message-meta">Пока нет сообщений</div>Нажмите микрофон или добавьте фото.</div>';
    return;
  }
  box.innerHTML=event.items.map(item=>{
    const meta=`<div class="message-meta">${new Date(item.createdAt).toLocaleString("ru-RU")}</div>`;
    if(item.type==="audio") return `<div class="message">${meta}<b>Голосовое сообщение</b><audio controls src="${item.data}"></audio></div>`;
    return `<div class="message">${meta}<b>Фото события</b><img src="${item.data}" alt="Фото события"></div>`;
  }).join("");
}
async function toggleRecording(){
  const btn=document.getElementById("recordButton");
  const hint=document.getElementById("recordHint");
  if(recorder && recorder.state==="recording"){
    recorder.stop();
    return;
  }
  try{
    const stream=await navigator.mediaDevices.getUserMedia({audio:true});
    recordChunks=[];
    recorder=new MediaRecorder(stream);
    recorder.ondataavailable=e=>recordChunks.push(e.data);
    recorder.onstop=()=>{
      const blob=new Blob(recordChunks,{type:"audio/webm"});
      const reader=new FileReader();
      reader.onloadend=()=>{
        const event=state.events.find(e=>e.id===activeEventId);
        event.items.push({type:"audio",data:reader.result,createdAt:new Date().toISOString()});
        saveState(); renderMessages();
      };
      reader.readAsDataURL(blob);
      stream.getTracks().forEach(track=>track.stop());
      btn.classList.remove("recording");
      hint.textContent="Нажмите микрофон для записи";
    };
    recorder.start();
    btn.classList.add("recording");
    hint.textContent="Идёт запись. Нажмите ещё раз, чтобы остановить";
  }catch(err){
    alert("Не удалось включить микрофон. Проверьте разрешения браузера.");
  }
}
function addPhoto(file){
  if(!file) return;
  const reader=new FileReader();
  reader.onloadend=()=>{
    const event=state.events.find(e=>e.id===activeEventId);
    event.items.push({type:"photo",data:reader.result,createdAt:new Date().toISOString()});
    saveState(); renderMessages();
  };
  reader.readAsDataURL(file);
}

document.getElementById("backButton").addEventListener("click",closeEvent);
document.getElementById("recordButton").addEventListener("click",toggleRecording);
document.getElementById("photoInput").addEventListener("change",e=>addPhoto(e.target.files[0]));
document.getElementById("addNowButton").addEventListener("click",()=>{ensureHourlyEvents();openEvent(state.events[0].id)});
const avatarButton=document.getElementById("avatarButton");
const settingsMenu=document.getElementById("settingsMenu");
avatarButton.addEventListener("click",(event)=>{event.stopPropagation();settingsMenu.classList.toggle("open")});
document.addEventListener("click",(event)=>{if(!settingsMenu.contains(event.target)&&event.target!==avatarButton){settingsMenu.classList.remove("open")}});
renderList();
setInterval(renderList,60*1000);
if("serviceWorker" in navigator){navigator.serviceWorker.register("./service-worker.js")}