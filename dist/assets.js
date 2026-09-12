export const ASSET_FILES={
 exterior:'exterior.png',passat:'passat-arrival-v2.png',reception:'reception.png',receptionV2:'reception-v2.png',
 walk:'julito-walk.png',walkSmooth:'julito-walk-v3.png',isoWalk:'julito-walk_isometric.png',isoIdle:'julito-idle_isometric.png',
 isoPickup:'julito-interact_pickup.png',isoTalk:'julito-interact_talk.png',actions:'julito-actions.png',
 pedro:'pedro-actions.png',pedroIdle:'pedro-idle-v2.png',prim:'prim.png',primIdle:'prim-idle-v2.png',colegiala:'colegiala-sofa-v1.png',
 umbrella:'umbrella-stand-deusto-v1.png',paperMundo:'newspaper-mundo-v2.png',paperCorreo:'newspaper-correo-v2.png',
 paperAbc:'newspaper-abc-v2.png',paperMarca:'newspaper-marca-v2.png'
};

export async function loadImages(files=ASSET_FILES){
 const loaded={};
 await Promise.all(Object.entries(files).map(([key,file])=>new Promise((resolve,reject)=>{
  const image=new Image();
  image.onload=()=>{loaded[key]=image;resolve();};
  image.onerror=()=>reject(new Error('No se pudo cargar '+file));
  image.src='assets/'+file;
 })));
 return loaded;
}
