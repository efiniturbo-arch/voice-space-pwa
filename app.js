const events=[["19:00","Ожидает времени","до дедлайна 2 ч. 44 мин.","wait","◷"],["18:00","Ожидает времени","до дедлайна 1 ч. 44 мин.","wait","◷"],["17:00","Ожидает времени","до дедлайна 44 мин.","wait","◷"],["16:00","Можно записать событие","до просрочки 45 мин.","warn","◉"],["15:00","Просрочено! Срочно отправьте событие.","просрочено на 15 мин.","danger","!"],["14:00","Просрочено! Срочно отправьте событие.","просрочено на 1 ч. 15 мин.","danger","!"],["13:00","Просрочено! Срочно отправьте событие.","просрочено на 2 ч. 15 мин.","danger","!"]];
const root=document.getElementById("events");
root.innerHTML=events.map(([time,title,desc,type,icon])=>`<div class="event ${type}"><div class="icon">${icon}</div><div><div class="time">${time}</div><div class="desc">${title}<br>${desc}</div></div><div class="arrow">›</div></div>`).join("");
const avatarButton=document.getElementById("avatarButton");
const settingsMenu=document.getElementById("settingsMenu");
avatarButton.addEventListener("click",(event)=>{event.stopPropagation();settingsMenu.classList.toggle("open")});
document.addEventListener("click",(event)=>{if(!settingsMenu.contains(event.target)&&event.target!==avatarButton){settingsMenu.classList.remove("open")}});
if("serviceWorker" in navigator){navigator.serviceWorker.register("./service-worker.js")}