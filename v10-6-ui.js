(()=>{
  const $=id=>document.getElementById(id);
  function notifyLabel(){
    const n=$('notify'), s=$('notifyState');
    if(!n||!s)return;
    s.textContent=n.checked?'Включены':'Выключены';
    s.classList.toggle('on',n.checked);
  }
  function bind(){
    notifyLabel();
    $('notify')?.addEventListener('change',notifyLabel);
    $('eventSend')?.addEventListener('click',()=>{
      const input=$('eventText');
      if(!input||!input.value.trim())return;
      input.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
    });
    $('chatMic')?.addEventListener('click',()=>{
      const input=$('chatText');
      if(input){input.value=input.value||'Голосовое сообщение: ';input.focus();}
    });
  }
  document.addEventListener('DOMContentLoaded',bind);
  setInterval(notifyLabel,1000);
})();