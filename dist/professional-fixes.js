const UMBRELLA_KEY='misterio-maleta:umbrella-v1';
const EXPLORER_KEY='misterio-maleta:explorer-95-v1';
const $=id=>document.getElementById(id);

function syncLobbyOnlyDecor(){
 const lobbyVisible=!$('mission-meter')?.hidden;
 const prop=$('umbrella-prop');
 const hotspot=$('hotspot-umbrella');
 if(prop)prop.hidden=!lobbyVisible;
 if(hotspot)hotspot.hidden=!lobbyVisible;
}

function clearEpisodeExtrasForNewGame(){
 try{
  localStorage.removeItem(UMBRELLA_KEY);
  localStorage.removeItem(EXPLORER_KEY);
 }catch{}
 const prop=$('umbrella-prop');
 if(prop)prop.classList.remove('empty');
}

document.addEventListener('click',event=>{
 if(event.target?.id==='new-game')clearEpisodeExtrasForNewGame();
 queueMicrotask(syncLobbyOnlyDecor);
},true);
window.addEventListener('load',syncLobbyOnlyDecor);
setInterval(syncLobbyOnlyDecor,500);
