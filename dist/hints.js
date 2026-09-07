import {MISSION} from './content.js';
const clues={
 key:['Tu habitación se decide en recepción.','Pedro guarda las llaves y también las respuestas.','Habla con Pedro y pide la llave de tu habitación.'],
 tobacco:['El viaje ha sido largo. Un descanso puede venirte bien.','Los cojines del sofá están sospechosamente abultados.','Selecciona USAR y pulsa el sofá para encontrar el paquete.'],
 letter:['Prim parece interesado en algo más que tu equipaje.','Acarícialo y fíjate hacia dónde mira. Empi escondía sus recados cerca de la entrada.','Usa o coge el felpudo de entrada: debajo está la carta de Empi.'],
 rules:['Pedro tiene una manera muy particular de explicar la convivencia.','El reglamento está a su alcance. Una provocación puede hacer que lo suelte.','EMPUJAR a Pedro hace que lance el reglamento. Después COGE el libro del suelo.'],
 invitation:['Algún objeto de tu mochila guarda una segunda sorpresa.','El envoltorio del tabaco tiene más grosor del normal.','MIRA el paquete de tabaco dos veces desde la mochila.'],
 signs:['Todavía queda algo que leer en las paredes.','Revisa también los avisos junto a la conserjería y el directorio.','MIRA el cartel pendiente indicado abajo.'],
 uses:['Prueba para qué sirven los objetos, además de mirarlos.','También puedes USAR personajes y probar accesos.','Selecciona USAR sobre el destino pendiente indicado abajo.'],
 dialogues:['Alguien tiene todavía algo que contarte.','Pregunta a Pedro por todos sus temas y habla con la colegiala.','Completa el tema pendiente indicado abajo.'],
 objects:['Aún hay pertenencias que puedes añadir a tu mochila.','Puedes coger cada periódico aunque ya hayas leído su portada.','COGE el objeto pendiente indicado abajo.'],
 complete:['Ya has descubierto toda la recepción.','Pedro tiene una confidencia reservada para quien se fija en todo.','Usa el ascensor para escuchar la confidencia del 100%.']
};
const labels={key:'La llave',tobacco:'Un descanso',letter:'El olfato de Prim',rules:'Las normas',invitation:'Un doble fondo',signs:'Carteles pendientes',uses:'Algo por probar',dialogues:'Conversaciones pendientes',objects:'Objetos pendientes',complete:'Todo descubierto'};
const names={board:'cartelera',comercia:'La Comercial',rulesNotice:'aviso de normas',residentsNotice:'aviso de residentes',directory:'directorio',shield:'escudo',plant:'planta',pedro:'Pedro',stairs:'escaleras',sofa:'sofá',phone:'teléfono',phoneBooths:'pasillo de las cabinas',prim:'Prim',elevator:'ascensor',welcome:'bienvenida de Pedro',key:'llave de la habitación',place:'dónde estás',rules:'normas de convivencia',weather:'tiempo de Bilbao',canal:'Canal+',nickname:'mote',suitcase:'maleta',comercia:'La Comercial (lee su cartel para abrir el tema)',colegiala:'colegiala mayor',bye:'despedirte de Pedro',bag:'maleta',tobacco:'tabaco',empiLetter:'carta de Empi',rulesBook:'reglamento',correo:'El Correo',mundo:'El Mundo',abc:'ABC',marca:'Marca',comerciaNote:'invitación de La Comercial'};
export function nextHint(state){
 let id=!state.hasKey310?'key':!state.hasTobacco?'tobacco':!state.hasEmpiLetter?'letter':!state.hasRulesBook?'rules':!state.hasComerciaNote?'invitation':null,pending;
 if(!id)for(const [group,field] of [['signs','inspectedSigns'],['uses','usedTargets'],['dialogues','readTopics'],['objects','collectedItems']]){
  pending=MISSION[group].find(x=>!state[field].includes(x));if(pending){id=group;break;}
 }
 id??='complete';
 const level=Math.min(3,(state.hintLevels[id]||0)+1);state.hintLevels[id]=level;
 return {id,level,title:labels[id],text:clues[id][level-1]+(level===3&&pending?' Pendiente: '+(names[pending]||pending)+'.':'')};
}
