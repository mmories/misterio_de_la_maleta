export const cleanNickname=value=>typeof value==='string'?value.trim().replace(/\s+/g,' ').replace(/[<>\u0000-\u001f]/g,'').slice(0,18):'';

// The conversation awaits this dialog; no page reload, synthetic keypress or polling.
export function openNicknameEditor(current){
 return new Promise(resolve=>{
  const dialog=document.createElement('dialog');
  dialog.id='nickname-dialog';
  dialog.setAttribute('aria-labelledby','nickname-title');
  dialog.innerHTML='<form method="dialog" class="nickname-screen"><small>FICHA DEL RESIDENTE · OCTUBRE DE 1994</small><h2 id="nickname-title">Tu mote en el Colegio Mayor</h2><p>Pedro puede equivocarse con una llave, pero no debería equivocarse con tu mote.</p><div class="nickname-presets"></div><label for="nickname-input">OTRO MOTE</label><div class="nickname-custom"><input id="nickname-input" maxlength="18" autocomplete="off" aria-label="Nuevo mote"><button id="nickname-accept" type="button">GUARDAR</button></div><p class="nickname-note">El cambio se aplica inmediatamente y se conserva en esta partida.</p><button id="nickname-cancel" type="button">CANCELAR</button></form>';
  const input=dialog.querySelector('#nickname-input');
  input.value=cleanNickname(current)||'Julito';
  let done=false;
  const finish=value=>{if(done)return;done=true;dialog.close();dialog.remove();resolve(value);};
  const apply=value=>{const name=cleanNickname(value);if(!name){input.focus();return;}finish(name);};
  for(const name of ['Julito','Topo','El Riojano']){
   const button=document.createElement('button');button.type='button';button.textContent=name.toUpperCase();button.onclick=()=>apply(name);dialog.querySelector('.nickname-presets').append(button);
  }
  dialog.querySelector('#nickname-accept').onclick=()=>apply(input.value);
  dialog.querySelector('#nickname-cancel').onclick=()=>finish(null);
  dialog.querySelector('form').onsubmit=event=>{event.preventDefault();apply(input.value);};
  dialog.oncancel=event=>{event.preventDefault();finish(null);};
  dialog.onclose=()=>finish(null);
  document.body.append(dialog);dialog.showModal();input.select();
 });
}
