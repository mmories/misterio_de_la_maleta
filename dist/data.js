export const VERBS=['MIRAR','COGER','USAR','HABLAR CON','DAR','EMPUJAR'];
// Scene coordinates are in the 960 × 600 render space; only these data need changing with a new background.
export const HOTSPOTS=[
{id:'prim',name:'Prim',rect:[205,392,128,53],at:[355,474]},
{id:'pedro',name:'Pedro',rect:[116,194,68,101],at:[170,455],look:'Pedro. Parece llevar aquí desde antes de que pusieran el edificio.'},
{id:'phone',name:'teléfono',rect:[162,273,46,19],at:[355,445],look:'Un teléfono de los de quedarse quieto para hablar. El cable decide hasta dónde llega la conversación.'},
{id:'mailbox',name:'casillero del correo',rect:[65,181,58,85],at:[355,445],look:'Un casillero dentro de la conserjería. Las cartas tienen más intimidad que nosotros.',flag:'inspectedMailbox'},
{id:'reception',name:'recepción',rect:[10,296,284,130],at:[355,445],look:'Cristal, madera y un señor con todas las llaves. Aquí está el verdadero rectorado.'},
{id:'shield',name:'escudo de Deusto',rect:[353,107,100,151],at:[400,404],look:'Colegio Mayor Deusto. Amar y servir. Espero que el orden sea opcional.'},
{id:'plant',name:'planta',rect:[442,194,83,133],at:[530,360],look:'Una planta muy bien cuidada. ¿Será esta la famosa María? No, tiene demasiada maceta institucional y muy poco misterio.'},
{id:'rulesNotice',name:'aviso de normas',rect:[235,160,44,52],at:[355,445],look:'NORMAS DE CONVIVENCIA: silencio desde las 23:00, visitas anunciadas y nada de maletas en pasillos. Al pie: «Potele revisa los gráficos de llegada». Parece que no bromeaban.'},
{id:'residentsNotice',name:'aviso de residentes',rect:[235,210,44,58],at:[355,445],look:'AVISO A RESIDENTES: «Fran Novoa ha vuelto a tomarse todo el ColaCao. Se ruega que deje, por lo menos, una cucharada para el resto del colegio». Firmado: Merche.'},
{id:'board',name:'cartelera',rect:[744,155,100,102],at:[683,340]},
{id:'comercia',name:'cartel de La Comercial',rect:[838,66,122,195],at:[683,340],look:'«LA COMERCIAL · Círculo de Comercio y Negocios». El cartel es bilingüe; la modestia, internacional.'},
{id:'directory',name:'directorio',rect:[544,171,128,57],at:[570,334],look:'ASCENSORES, HABITACIONES, BIBLIOTECA. Una flecha hacia arriba y tres formas distintas de perderse.'},
{id:'sofa',name:'sofá',rect:[740,285,210,103],at:[686,367],look:'Skay marrón. El material oficial de todas las instituciones españolas. Los cojines están sospechosamente abultados; alguien ha escondido algo ahí o el sofá guarda rencor.'},
{id:'colegiala',name:'colegiala mayor',rect:[795,205,82,180],at:[714,382],face:[831,330],look:'Una colegiala mayor, rubia, guapa y con expresión de saber perfectamente lo que hace. Julito confirma que la calidad humana del CMD parece notable; la del sofá, bastante menos.'},
{id:'radiator',name:'radiador',rect:[736,263,62,44],at:[686,367],look:'Un radiador de hierro. En Bilbao esto no es mobiliario: es infraestructura crítica.'},
{id:'phoneBooths',name:'pasillo de las cabinas',rect:[707,205,34,57],at:[683,340],look:'Junto al radiador, el pasillo gira hacia la derecha. Se oye una conversación telefónica que parece haber empezado en septiembre.'},
{id:'correo',name:'El Correo',rect:[672,386,86,36],at:[642,458],look:'El periódico regional. Ideal para enterarme de dónde he venido a meterme.'},
{id:'mundo',name:'El Mundo',rect:[758,386,77,32],at:[642,458],look:'El Mundo. Cinco años y ya parece que lo sabe todo.'},
{id:'abc',name:'ABC',rect:[713,420,82,30],at:[642,458],look:'ABC. Tiene más letras que fotos. Y pesa como una asignatura.'},
{id:'marca',name:'Marca',rect:[796,413,83,29],at:[642,458]},
{id:'elevator',name:'ascensores',rect:[549,197,85,82],at:[606,287],look:'Tercera planta. El ascensor promete llevarme. La maleta exige que cumpla.'},
{id:'stairs',name:'escaleras',rect:[665,230,75,120],at:[683,340],look:'Las escaleras suben con una alegría que mi maleta no comparte.'},
{id:'entry',name:'puerta de entrada',rect:[5,493,181,101],at:[229,551],look:'Por ahí he entrado. Todavía podría decir que me he equivocado de edificio.'},
{id:'mat',name:'felpudo de entrada',rect:[185,500,245,96],at:[229,551],look:'Un felpudo enorme con el escudo del Colegio Mayor. Lleva aquí el tiempo suficiente para saber más que Pedro.'},
{id:'rulesBook',name:'reglamento de convivencia',rect:[348,405,58,35],at:[410,448],look:'El reglamento que me ha lanzado Pedro. La pedagogía de proyectil tiene algo difícil de olvidar.'}
];
export const TALK={
welcome:[['Pedro','Tú debes de ser Julio.'],['Julito','Julito.'],['Pedro','Aquí todavía estás a tiempo de cambiar de nombre. En este colegio los motes duran más que las carreras.']],
welcomeAfterNickname:[['Pedro','Muy bien, [MOTE]. Intentaré recordarlo.'],['Julito','Soy un hincha del equipo, el Logroñés…'],['Pedro','Eso ya veo que va a ser más difícil de olvidar.'],['Pedro','Bienvenido a Deusto. ¿Qué necesitas?']],
key:[['Julito','Vengo a por la llave de mi habitación.'],['Pedro','Te corresponde la habitación 310, en Tercero Central.'],['Pedro','Un momento. Las tengo ordenadas por un sistema infalible.'],['Julito','¿Por número?'],['Pedro','Por dónde las dejé ayer.'],['Pedro','Aquí tienes: 310, Tercero Central.']],
place:[['Julito','¿Dónde estoy exactamente?'],['Pedro','En el Colegio Mayor Deusto. Bilbao. Octubre del 94.'],['Julito','Lo de Bilbao lo sabía.'],['Pedro','Estupendo. Ya llevas una asignatura aprobada.'],['Julito','Riojano de cepa, ganar no se deja…'],['Pedro','La segunda asignatura será aprender cuándo no cantar.'],['Pedro','Comedor arriba, biblioteca al fondo. En el comedor hay puré naranja y puré verde: no preguntes cuál es cuál antes de probarlos.'],['Pedro','Y cuidado con el ColaCao: Fran Novoa se lo toma todo. Si queda una cucharada, considérala patrimonio histórico.']],
rules:[['Julito','¿Hay alguna norma que debería conocer?'],['Pedro','Hay muchas.'],['Pedro','El edificio se divide en izquierda, central y derecha. Izquierda y central son de chicos; derecha, de chicas.'],['Pedro','Aunque hay alguna propuesta de D’ para hacer una buena mezcla. De momento sigue siendo solo una propuesta.'],['Pedro','Está terminantemente prohibido acceder a la zona derecha.'],['Pedro','Y tú tienes exactamente la cara de quien pensaba preguntar cómo se llega.'],['Julito','Solo estaba intentando orientarme.'],['Pedro','Pues oriéntate hacia Tercero Central.'],['Pedro','Las demás normas importantes te las comentará Potele, el subdirector.'],['Pedro','Es experto en reglas y en gráficos de horas de llegada. Tiene uno para cada excusa.'],['Julito','¿Y cantar el himno del Logroñés?'],['Pedro','No está prohibido. Todavía. Procura no obligarnos a añadirlo a la lista.'],['Pedro','Las maletas no se dejan en los pasillos.'],['Julito','¿Eso último es muy importante?'],['Pedro','Digamos que ya hemos tenido suficiente equipaje por hoy.']],
weather:[['Julito','¿Siempre hace este tiempo en Bilbao?'],['Pedro','No, hombre. A veces llueve.'],['Julito','Está lloviendo.'],['Pedro','Esto es para que no se levante polvo.'],['Julito','Las riojanas nos ayudan a vencer… pero no sé si contra esto.'],['Pedro','Contra Bilbao no gana ni el Logroñés.'],['Julito','No he traído paraguas.'],['Pedro','Pues ya tienes tema de conversación para todo el curso.']],
canal:[['Julito','¿Sabes si los viernes por la noche sigue funcionando Canal+ o quitas la llave?'],['Pedro','Canal+ funciona. La llave la guardo yo.'],['Julito','Era una pregunta puramente técnica.'],['Pedro','Y esta es una respuesta puramente de recepción: el viernes, a dormir.'],['Julito','Aquí se censura hasta con llavero.']],
suitcase:[['Julito','¿Pasa algo con mi maleta?'],['Pedro','No lo sé. ¿Qué llevas en la maleta?'],['Julito','Ropa para cuatro años, una bandera de La Rioja y casetes de Sabina y Silvio.'],['Pedro','¿Seguro que es la bandera de La Rioja? Con tantos colores pensé que era la de algún país africano.'],['Julito','Rioja. Cuatro franjas, cuatro colores y ninguna duda. Lo africano sería el clima, y aquí no ayuda.'],['Pedro','Entonces no pesa por la ropa. Pesa por los cantautores.'],['Julito','La bandera no pesa. Ondeando incluso aligera.'],['Pedro','Me parece que vas a necesitar el ascensor. Está al fondo.']],
after:[['Julito','¿Alguna cosa más?'],['Pedro','Tercera planta, cuando estés preparado. Aunque tienes cara de necesitar sentarte un momento.']],
locked:[['Julito','El ascensor está listo. Yo no.'],['Julito','Averiguar mi habitación y conseguir la llave debo.'],['Julito','Me ha salido el Yoda que llevo dentro. La maleta, en cambio, sigue hablando en kilos.'],['Julito','Pedro parece saber dónde vive todo el mundo. Será mejor preguntarle.']]
};

export function newState(){return {hasMasterKey:false,rewardShown:false,primTrusted:false,primClueSeen:false,bonusSeen:false,hintLevels:{},introCompleted:false,talkedToPedro:false,talkedToSenior:false,nickname:null,pedroPushed:false,primPushed:false,triedPhoneBooths:false,rulesOnFloor:false,hasRulesBook:false,roomAssigned:false,hasKey310:false,hasMarca:false,hasComerciaNote:false,hasTobacco:false,inspectedTobacco:false,hasEmpiLetter:false,heardLogrones:false,inspectedMailbox:false,calledElevator:false,secondSceneCode:false,tookPapers:[],readPapers:[],readTopics:[],inspectedSigns:[],usedTargets:[],collectedItems:['bag']};}
export const WALK_POLYGON=[[0,493],[295,406],[541,324],[553,280],[552,275],[632,275],[634,311],[711,323],[713,360],[730,382],[725,389],[641,429],[781,599],[0,599]];
export const WALK_NODES=[[229,551],[355,445],[460,465],[510,400],[530,360],[570,334],[606,287],[683,340],[686,367],[642,458],[400,404]];
// Obstacles describe floor footprints, not clickable artwork. Keep HOTSPOTS intact.
export const WALK_OBSTACLES=[
 [[201,390],[341,390],[341,451],[201,451]], // Prim, including clearance for Julito's feet
 [[647,394],[903,410],[903,504],[739,513],[647,455]] // table and legs
];
function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
 const a=poly[i],b=poly[j];
 if(((a[1]>p[1])!==(b[1]>p[1]))&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;
}return yes;}
export function pointInPolygon(p,poly=WALK_POLYGON){return p.every(Number.isFinite)&&inside(p,poly)&&(poly!==WALK_POLYGON||!WALK_OBSTACLES.some(o=>inside(p,o)));}
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
// Split at every boundary crossing; midpoint checks cannot skip a thin obstacle.
export function visible(a,b){
 if(!pointInPolygon(a)||!pointInPolygon(b))return false;
 const v=[b[0]-a[0],b[1]-a[1]],cuts=[0,1];
 for(const poly of [WALK_POLYGON,...WALK_OBSTACLES])for(let i=0;i<poly.length;i++){
  const c=poly[i],d=poly[(i+1)%poly.length],w=[d[0]-c[0],d[1]-c[1]],den=cross(v,w);
  if(Math.abs(den)<1e-9)continue;
  const offset=[c[0]-a[0],c[1]-a[1]],t=cross(offset,w)/den,u=cross(offset,v)/den;
  if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);
 }
 cuts.sort((x,y)=>x-y);
 return cuts.slice(1).every((t,i)=>{const m=(t+cuts[i])/2;return pointInPolygon([a[0]+v[0]*m,a[1]+v[1]*m]);});
}
const navigationNodes=[...WALK_NODES];
for(const poly of [WALK_POLYGON,...WALK_OBSTACLES])for(const [x,y] of poly)for(const [dx,dy] of [[-5,-5],[5,-5],[5,5],[-5,5]]){
 const p=[x+dx,y+dy];if(pointInPolygon(p))navigationNodes.push(p);
}
const routeDistance=(a,b)=>Math.hypot(a[0]-b[0],(a[1]-b[1])/.65);
const navigationEdges=navigationNodes.map((a,i)=>navigationNodes.flatMap((b,j)=>i!==j&&visible(a,b)?[[j,routeDistance(a,b)]]:[]));
export function findPath(from,to){
 if(!pointInPolygon(from)||!pointInPolygon(to))return null;
 if(visible(from,to))return [[...to]];
 const nodes=[...navigationNodes,from,to],start=nodes.length-2,end=start+1;
 const edges=navigationEdges.map(e=>e.slice());edges.push([],[]);
 for(const index of [start,end])for(let i=0;i<start;i++)if(visible(nodes[index],nodes[i])){
  const cost=routeDistance(nodes[index],nodes[i]);edges[index].push([i,cost]);edges[i].push([index,cost]);
 }
 const dist=nodes.map(()=>Infinity),prev=[],done=new Set();dist[start]=0;
 for(let k=0;k<nodes.length;k++){
  let a=-1;for(let i=0;i<nodes.length;i++)if(!done.has(i)&&(a<0||dist[i]<dist[a]))a=i;
  if(a<0||!Number.isFinite(dist[a])||a===end)break;done.add(a);
  for(const [b,cost] of edges[a])if(dist[a]+cost<dist[b]){dist[b]=dist[a]+cost;prev[b]=a;}
 }
 if(!Number.isFinite(dist[end]))return null;
 const out=[];for(let p=end;p!==start;p=prev[p])out.unshift([...nodes[p]]);
 return out;
}
