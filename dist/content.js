export const MISSION_OBJECTIVE='Conoce la recepción, averigua tu habitación y consigue lo necesario para instalarte. Si quieres entender qué pasa con la maleta, tendrás que mirar bastante más allá del mostrador.';

export const MISSION={
 signs:['board','comercia','rulesNotice','residentsNotice','directory','shield'],
 uses:['plant','pedro','stairs','sofa','phone','phoneBooths','prim','elevator'],
 dialogues:['welcome','key','place','rules','weather','canal','nickname','suitcase','comercia','prim','colegiala','bye'],
 objects:['bag','key','tobacco','empiLetter','rulesBook','correo','mundo','abc','marca','comerciaNote','umbrella']
};

// The lift only needs the four story items. Exploration is deliberately separate
// and its reward is forgiving enough that one tiny optional interaction is not a wall.
export const LIFT_REQUIREMENTS=['key','tobacco','empiLetter','rulesBook'];
export const EXPLORATION_REWARD_PERCENT=96;

export const PAPER_INFO={
 mundo:{image:'newspaper-mundo-v2.png',name:'EL MUNDO',title:'EL CASO ROLDÁN ESTRECHA EL CERCO SOBRE INTERIOR',subtitle:'Nuevas revelaciones aumentan la presión sobre el Gobierno'},
 correo:{image:'newspaper-correo-v2.png',name:'EL CORREO ESPAÑOL – EL PUEBLO VASCO',title:'BILBAO MIRA AL NUEVO CURSO',subtitle:'Edición Vizcaya · Bilbao, Euskadi, industria y Athletic Club'},
 abc:{image:'newspaper-abc-v2.png',name:'ABC',title:'ESPAÑA CELEBRA SU FIESTA NACIONAL',subtitle:'Los Reyes presiden el homenaje a los que dieron su vida por España'},
 marca:{image:'newspaper-marca-v2.png',name:'MARCA',title:'EL MADRID VUELVE A MIRAR A LA CANTERA',subtitle:'Un delantero de 17 años llama con fuerza a la puerta del primer equipo'}
};

export const isAnthemLine=text=>/(soy un hincha|riojano de cepa|las riojanas)/i.test(text);
export function singingText(who,text){
 if(who!=='Julito'||!isAnthemLine(text)||/[♪♫]/.test(text))return text;
 // Keep the spoken aside after a quoted verse outside the musical marks.
 if(text.includes('«')&&text.includes('»'))return text.replace(/«([^»]+)»/g,'♪ «$1» ♪');
 return `♪ ${text} ♪`;
}

export const MASTER_KEY_DIALOGUE=[
 ['Pedro','[MOTE], he visto gente tardar cuatro años en enterarse de menos cosas que tú en una tarde.'],
 ['Julito','¿Eso es un cumplido?'],['Pedro','No te acostumbres.'],
 ['Pedro','Toma. Es la llave maestra del Colegio Mayor.'],
 ['Julito','¿La que abre todas las habitaciones?'],['Pedro','Todas. Y precisamente por eso no se la doy a cualquiera.'],
 ['Julito','¿Y a mí sí?'],
 ['Pedro','Has conseguido enterarte de todo lo que pasa en esta recepción. Ahora intenta no enterarte de demasiado.']
];
