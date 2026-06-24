(()=>{
  const $=id=>document.getElementById(id);
  const statusLabels={all:'Показать все',filled:'Заполнено',wait:'Ожидает',warning:'Внимание',danger:'Просрочено'};
  function state(){return window.voiceEvents?.getState?.()}
  function applyHidden(date,status){
    const s=state();
    if(s){s.filter={date:date ?? (s.filter?.date||''),status:status ?? (s.filter?.status||'all')};window.voiceEvents.save?.()}
    if($('fd'))$('fd').value=date ?? (s?.filter?.date||'');
    if($('fs'))$('fs').value=status ?? (s?.filter?.status||'all');
    $('apply')?.click();
    setTimeout(sync,60);
  }
  function ensureControls(){
    if(!$('v16DatePicker')){
      const input=document.createElement('input');input.id='v16DatePicker';input.className='v16-date-input';input.type='date';document.body.appendChild(input);
      input.addEventListener('change',()=>{applyHidden(input.value,state()?.filter?.status||'all')});
    }
    if(!$('v16StatusMenu')){
      const menu=document.createElement('div');menu.id='v16StatusMenu';menu.className='status-menu hidden';
      menu.innerHTML='<div class="status-menu-title">Состояние карточки</div>'+Object.entries(statusLabels).map(([value,label])=>`<button type="button" data-status="${value}">${label}</button>`).join('');
      document.body.appendChild(menu);
      menu.addEventListener('click',e=>{const b=e.target.closest('button[data-status]');if(!b)return;applyHidden(state()?.filter?.date||'',b.dataset.status);menu.classList.add('hidden')});
      document.addEventListener('click',e=>{if(!menu.contains(e.target)&&e.target!==$('filterBtn'))menu.classList.add('hidden')});
    }
  }
  function sync(){
    ensureControls();
    const s=state();
    const dateBtn=$('dateBtn'), statusBtn=$('filterBtn');
    if(dateBtn){
      const text=dateBtn.querySelector('#today')?.textContent||dateBtn.textContent.replace('▽','').trim();
      dateBtn.innerHTML='<span class="filter-icon">▽</span><span id="today">'+text+'</span>';
      dateBtn.classList.add('date-filter-button');
    }
    if(statusBtn){
      const status=s?.filter?.status||'all';
      statusBtn.innerHTML='<span class="filter-icon">▽</span><span>'+(statusLabels[status]||'Показать все')+'</span><span id="badge"></span>';
      statusBtn.classList.add('status-filter-button');
    }
    document.querySelectorAll('#v16StatusMenu button[data-status]').forEach(b=>b.classList.toggle('active',b.dataset.status===(s?.filter?.status||'all')));
  }
  function patchClicks(){
    const dateBtn=$('dateBtn'), statusBtn=$('filterBtn');
    if(dateBtn&&!dateBtn.dataset.v16){dateBtn.dataset.v16='1';dateBtn.addEventListener('click',e=>{if(document.body.classList.contains('theme-water'))return;e.preventDefault();e.stopImmediatePropagation();const input=$('v16DatePicker');input.value=state()?.filter?.date||'';if(input.showPicker)input.showPicker();else input.click()},true)}
    if(statusBtn&&!statusBtn.dataset.v16){statusBtn.dataset.v16='1';statusBtn.addEventListener('click',e=>{if(document.body.classList.contains('theme-water'))return;e.preventDefault();e.stopImmediatePropagation();const menu=$('v16StatusMenu');menu.classList.toggle('hidden');sync()},true)}
  }
  function wrapHero(){
    const hero=document.querySelector('.hero');if(!hero||hero.dataset.v16)return;hero.dataset.v16='1';
    const dateBtn=$('dateBtn'), filterBtn=$('filterBtn');if(dateBtn&&filterBtn){const actions=document.createElement('div');actions.className='hero-actions';dateBtn.parentNode.insertBefore(actions,dateBtn);actions.appendChild(dateBtn);actions.appendChild(filterBtn)}
  }
  function init(){wrapHero();ensureControls();sync();patchClicks()}
  document.addEventListener('DOMContentLoaded',init);setTimeout(init,400);setTimeout(init,1200);
  new MutationObserver(()=>setTimeout(sync,0)).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
})();
