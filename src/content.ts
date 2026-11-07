import type {Target} from './physics';

// Tuned game parameters, not laboratory measurements. Mass is relative to a 24 mm steel ball.
export const MATERIALS={
 steel:{name:'钢',subtitle:'均衡 · 可受磁场牵引',density:1,restitution:.94,magnetic:1,color:'#b8c8d1',dark:'#273944'},
 brass:{name:'黄铜',subtitle:'沉稳 · 气流偏移较小',density:1.08,restitution:.86,magnetic:0,color:'#e7b96d',dark:'#71401a'},
 ceramic:{name:'陶瓷',subtitle:'轻盈 · 高回弹',density:.49,restitution:.97,magnetic:0,color:'#e8f0ef',dark:'#638a91'},
 rubber:{name:'橡胶',subtitle:'极轻 · 强烈响应气流',density:.15,restitution:.80,magnetic:0,color:'#d78364',dark:'#512f29'},
} as const;
export const SIZES={small:{name:'小',radius:9},standard:{name:'中',radius:12},large:{name:'大',radius:16}} as const;
export type Material=keyof typeof MATERIALS;
export type BallSize=keyof typeof SIZES;
export function ballProperties(material:Material,size:BallSize){
 const m=MATERIALS[material],r=SIZES[size].radius,mass=m.density*(r/12)**3;
 return {...m,r,mass,speed:350/Math.sqrt(mass),windResponse:(r/12)**2/mass};
}
export type AirZone={x:number;y:number;w:number;h:number;fx:number;fy:number};
export type Peg={x:number;y:number;r:number};
export type Choice={material:Material;size:BallSize};
export type Gate={x:number;y:number;size:number;open:boolean};
type Tile={x:number;y:number;kind:Target['kind'];hp:number;size:number;power?:Target['power'];core?:boolean};
export type Level={name:string;chapter:string;hint:string;shots:number;par:number;goal:'clear'|'core';tiles:Tile[];pegs:Peg[];air:AirZone[];gates:Gate[]};
const tile=(x:number,y:number,hp:number,kind:Target['kind']='steel',power?:Target['power'],core=false):Tile=>({x,y,hp,kind,size:48,power,core});
const wind=(fx:number,y=400):AirZone=>({x:38,y,w:344,h:60,fx,fy:0});
const gate=(x=210,y=430):Gate=>({x,y,size:114,open:false});
const stages:Omit<Level,'chapter'>[]=[
 {name:'耐久阶梯',hint:'先打通数字1的入口，再利用弹簧积木补充动能。',shots:5,par:3,goal:'clear',tiles:[tile(135,410,1,'prism'),tile(270,490,3,'capacitor'),tile(210,590,6,'hexagon','spring')],pegs:[],air:[],gates:[]},
 {name:'六面回声',hint:'六边形与菱形有更多斜面；耐久高的积木可保留反射路线。',shots:6,par:3,goal:'clear',tiles:[tile(100,375,1,'diamond'),tile(310,375,2,'prism'),tile(145,485,4,'hexagon'),tile(285,530,7,'capacitor'),tile(200,615,5,'hexagon','spring')],pegs:[],air:[],gates:[]},
 {name:'薄板穿行',hint:'长条积木薄而宽，侧面和顶面的球路不同。',shots:6,par:3,goal:'clear',tiles:[tile(110,365,1,'bar'),tile(290,405,2,'diamond'),tile(160,485,5,'bar'),tile(305,545,8,'hexagon'),tile(95,590,3,'prism','spring')],pegs:[],air:[],gates:[]},
 {name:'蓄能支点',hint:'闪电标记代表弹簧供能，斜射可以多次经过支点。',shots:7,par:4,goal:'clear',tiles:[tile(105,365,2,'prism'),tile(285,415,4,'diamond'),tile(175,495,9,'hexagon'),tile(100,590,5,'capacitor','spring'),tile(315,590,7,'prism','spring')],pegs:[],air:[],gates:[]},
 {name:'第一道闸',hint:'击碎绿色开关积木，打开无数字闸门；开关仍逐次减1。',shots:7,par:4,goal:'clear',tiles:[tile(95,350,2,'diamond','switch'),tile(305,370,1,'prism'),tile(145,515,5,'steel'),tile(285,530,9,'hexagon'),tile(210,620,6,'capacitor','spring')],pegs:[],air:[],gates:[gate()]},
 {name:'核心入门',hint:'紫色描边是核心。本关只需击碎核心，其余积木可作反射支点。',shots:7,par:4,goal:'core',tiles:[tile(110,360,1,'prism'),tile(295,380,3,'diamond'),tile(210,490,10,'hexagon',undefined,true),tile(100,595,6,'capacitor','spring'),tile(310,595,8,'prism','spring')],pegs:[],air:[],gates:[]},
 {name:'顺风铸造',hint:'轻珠更受气流影响，重珠更稳；先打开低耐久入口。',shots:7,par:4,goal:'clear',tiles:[tile(85,360,1,'bar'),tile(245,360,2,'prism'),tile(150,475,5,'diamond'),tile(315,510,10,'hexagon'),tile(100,615,7,'capacitor','spring'),tile(260,615,4,'prism')],pegs:[],air:[wind(55,400)],gates:[]},
 {name:'逆流闸室',hint:'先击碎左侧开关，再借弹簧回弹穿过打开的闸门。',shots:8,par:5,goal:'clear',tiles:[tile(85,340,2,'hexagon','switch'),tile(325,350,3,'diamond'),tile(130,520,6,'prism'),tile(285,540,12,'capacitor'),tile(190,625,8,'hexagon','spring')],pegs:[],air:[wind(-45,370)],gates:[gate(210,440)]},
 {name:'双风核心',hint:'目标仅是核心；保留两侧高耐久支点可帮助持续反弹。',shots:8,par:5,goal:'core',tiles:[tile(100,350,1,'bar'),tile(300,360,3,'diamond'),tile(205,490,14,'capacitor',undefined,true),tile(90,575,7,'hexagon','spring'),tile(320,590,10,'prism','spring')],pegs:[],air:[wind(45,395),wind(-35,530)],gates:[]},
 {name:'针眼与弹簧',hint:'反射柱之间留有小珠通道，尺寸会改变可用路线。',shots:8,par:5,goal:'clear',tiles:[tile(85,425,2,'diamond'),tile(330,440,4,'bar'),tile(145,530,8,'hexagon'),tile(280,540,12,'capacitor'),tile(210,625,7,'prism','spring')],pegs:[{x:176,y:340,r:23},{x:244,y:340,r:23}],air:[],gates:[]},
 {name:'铜风回廊',hint:'黄铜可减小侧风偏移；下方两块弹簧让球重新进入积木区。',shots:9,par:5,goal:'clear',tiles:[tile(90,350,1,'bar'),tile(255,365,3,'prism'),tile(145,460,6,'diamond'),tile(310,500,14,'hexagon'),tile(90,585,8,'capacitor','spring'),tile(245,615,10,'prism','spring')],pegs:[],air:[wind(65,400),wind(-40,535)],gates:[]},
 {name:'双锁熔芯',hint:'两个开关都击碎后闸门才会打开；随后集中攻击核心。',shots:9,par:5,goal:'core',tiles:[tile(90,340,2,'diamond','switch'),tile(330,350,3,'hexagon','switch'),tile(210,525,16,'hexagon',undefined,true),tile(100,615,8,'capacitor','spring'),tile(310,615,11,'prism','spring'),tile(210,630,6,'bar','spring')],pegs:[],air:[wind(-35,460)],gates:[gate(210,425)]},
 {name:'交错阶梯',hint:'低数字开路，中数字导向，高数字留在后段；留意菱形的斜面。',shots:9,par:6,goal:'clear',tiles:[tile(90,340,1,'bar'),tile(255,360,3,'prism'),tile(160,440,5,'diamond'),tile(320,455,8,'hexagon'),tile(95,540,12,'capacitor'),tile(250,550,16,'steel'),tile(230,630,9,'hexagon','spring')],pegs:[],air:[],gates:[]},
 {name:'折面动力室',hint:'两处弹簧给不同方向补能；高耐久六边形是长期反射支点。',shots:10,par:7,goal:'clear',tiles:[tile(95,350,2,'prism'),tile(300,350,4,'diamond'),tile(155,455,7,'hexagon'),tile(305,500,15,'capacitor'),tile(85,575,10,'prism','spring'),tile(225,625,13,'hexagon','spring')],pegs:[{x:230,y:365,r:17}],air:[wind(30,520)],gates:[]},
 {name:'三相核心',hint:'击碎开关让道路打开；核心耐久更高，但普通积木不必清空。',shots:10,par:6,goal:'core',tiles:[tile(90,340,2,'hexagon','switch'),tile(315,350,4,'diamond'),tile(120,465,8,'prism'),tile(285,525,20,'hexagon',undefined,true),tile(100,615,10,'capacitor','spring'),tile(275,625,14,'prism','spring')],pegs:[],air:[wind(50,375)],gates:[gate(215,420)]},
 {name:'长廊反射',hint:'薄板与菱形构成斜向路线，尝试改变顶部待发弹珠的顺序。',shots:10,par:6,goal:'clear',tiles:[tile(100,345,2,'bar'),tile(290,375,4,'bar'),tile(150,450,7,'diamond'),tile(315,480,12,'steel'),tile(95,550,18,'capacitor'),tile(250,560,9,'prism'),tile(170,635,12,'hexagon','spring')],pegs:[],air:[wind(-40,400)],gates:[]},
 {name:'风压熔炉',hint:'多层气流、闸门与高耐久核心并存；每颗弹珠都很重要。',shots:11,par:7,goal:'core',tiles:[tile(85,340,3,'diamond','switch'),tile(325,350,5,'hexagon','switch'),tile(110,485,9,'prism'),tile(275,520,24,'capacitor',undefined,true),tile(95,615,12,'hexagon','spring'),tile(290,625,16,'prism','spring')],pegs:[],air:[wind(60,380),wind(-45,545)],gates:[gate(210,435)]},
 {name:'铸星终章',hint:'全清挑战：低耐久路径、高耐久锚点与弹簧补能共同决定球路。',shots:12,par:9,goal:'clear',tiles:[tile(85,335,2,'bar'),tile(245,345,4,'diamond'),tile(150,425,6,'prism'),tile(320,440,10,'hexagon'),tile(90,520,15,'capacitor'),tile(255,535,22,'diamond'),tile(125,625,12,'hexagon','spring'),tile(310,620,18,'prism','spring')],pegs:[],air:[wind(35,370),wind(-30,570)],gates:[]},
];
export const LEVELS:readonly Level[]=stages.map((l,i)=>({...l,chapter:['01 / 动力工坊','02 / 风洞与闸室','03 / 铸星核心'][Math.floor(i/6)]}));
export function dailyTrial(date=new Date()){
 const key=new Date(date.getTime()+8*3600000).toISOString().slice(0,10);let seed=2166136261;for(const c of key)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 return {key,index:seed%LEVELS.length,mirror:Boolean(seed&1)};
}
