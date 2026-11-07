export const SAVE_KEY='flux-save';
export const RULESET='paddle-natural-1';
export type RecordEntry={stars:number;shots:number};
export type Rank={score:number;wave:number;shots:number;mode:string;date:string};
type Records=Record<string,RecordEntry>;
type Legacy={records:Records;ranks:Rank[]};
export type Save={schema:1;rulesets:Record<string,{records:Records;ranks:Rank[]}>;legacy:Record<string,Legacy>;migrated:string[]};
type StorageReader=Pick<Storage,'getItem'>;
function object(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function records(v:unknown):Records{
 const out:Records={};if(!object(v))return out;
 for(const [key,r] of Object.entries(v))if((/^(0|[1-9]\d{0,2})$/.test(key)||/^daily:\d{4}-\d{2}-\d{2}$/.test(key))&&object(r)&&Number.isInteger(r.stars)&&Number(r.stars)>=1&&Number(r.stars)<=3&&Number.isInteger(r.shots)&&Number(r.shots)>=1&&Number(r.shots)<=1000)out[key]={stars:Number(r.stars),shots:Number(r.shots)};
 return out;
}
function ranks(v:unknown,modes:string[]):Rank[]{
 if(!Array.isArray(v))return [];
 return v.filter((r):r is Rank=>object(r)&&Number.isFinite(r.score)&&Number(r.score)>=0&&Number.isInteger(r.wave)&&Number(r.wave)>=1&&Number.isInteger(r.shots)&&Number(r.shots)>=1&&typeof r.mode==='string'&&modes.includes(r.mode)&&typeof r.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(r.date)).slice(0,10).map(r=>({score:r.score,wave:r.wave,shots:r.shots,mode:r.mode,date:r.date}));
}
export function loadSave(storage:StorageReader,modes:string[]):Save{
 const read=(key:string):unknown=>{try{return JSON.parse(storage.getItem(key)||'null');}catch{return null;}};
 const raw=read(SAVE_KEY),save:Save={schema:1,rulesets:{},legacy:{},migrated:[]};
 if(object(raw)&&raw.schema===1){
  if(object(raw.rulesets))for(const [key,value] of Object.entries(raw.rulesets))if(/^[a-z0-9-]{1,64}$/.test(key)&&object(value))save.rulesets[key]={records:records(value.records),ranks:ranks(value.ranks,modes)};
  if(object(raw.legacy))for(const [key,value] of Object.entries(raw.legacy))if(/^v[3-8]$/.test(key)&&object(value))save.legacy[key]={records:records(value.records),ranks:ranks(value.ranks,modes)};
  if(Array.isArray(raw.migrated))save.migrated=raw.migrated.filter((k):k is string=>typeof k==='string'&&/^v[3-8]$/.test(k));
 }
 for(let version=3;version<=8;version++){
  const key=`v${version}`;if(save.migrated.includes(key))continue;
  const old={records:records(read(`flux-challenges-${key}`)),ranks:ranks(read(`flux-ranking-${key}`),modes)};
  if(Object.keys(old.records).length||old.ranks.length)save.legacy[key]=old;
  save.migrated.push(key);
 }
 save.rulesets[RULESET]??={records:{},ranks:[]};return save;
}
