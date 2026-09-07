export const MISSION_OBJECTIVE='Conoce la recepción, averigua qué habitación te han asignado y qué necesitas para poder subir. Aprovecha para obtener toda la información que puedas del recepcionista.';

export const MISSION={
 signs:['board','comercia','rulesNotice','residentsNotice','directory','shield'],
 uses:['plant','pedro','stairs','sofa','phone','phoneBooths','prim','elevator'],
 dialogues:['welcome','key','place','rules','weather','canal','nickname','suitcase','comercia','prim','bye'],
 objects:['bag','key','tobacco','empiLetter','rulesBook','correo','mundo','abc','marca','comerciaNote']
};

export const PAPER_INFO={
 mundo:{image:'newspaper-mundo-v2.png',name:'EL MUNDO',title:'EL CASO ROLDÁN ESTRECHA EL CERCO SOBRE INTERIOR',subtitle:'Nuevas revelaciones aumentan la presión sobre el Gobierno'},
 correo:{image:'newspaper-correo-v2.png',name:'EL CORREO ESPAÑOL – EL PUEBLO VASCO',title:'BILBAO MIRA AL NUEVO CURSO',subtitle:'Edición Vizcaya · Bilbao, Euskadi, industria y Athletic Club'},
 abc:{image:'newspaper-abc-v2.png',name:'ABC',title:'ESPAÑA CELEBRA SU FIESTA NACIONAL',subtitle:'Los Reyes presiden el homenaje a los que dieron su vida por España'},
 marca:{image:'newspaper-marca-v2.png',name:'MARCA',title:'EL MADRID VUELVE A MIRAR A LA CANTERA',subtitle:'Un delantero de 17 años llama con fuerza a la puerta del primer equipo'}
};

export const isAnthemLine=text=>/(soy un hincha|himno del Logroñés|riojano de cepa|las riojanas)/i.test(text);
