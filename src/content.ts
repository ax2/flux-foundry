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
type Tile={x:number;y:number;kind:Target['kind'];hp:number;size:number};
export type Level={name:string;chapter:string;hint:string;shots:number;par:number;tiles:Tile[];pegs:Peg[];air:AirZone[]};
const row=(y:number,xs:number[],hp=1,kind:Target['kind']='steel',size=52):Tile[]=>xs.map(x=>({x,y,hp,kind,size}));
const peg=(x:number,y:number,r=19):Peg=>({x,y,r});
const wind=(fx:number,x=40,y=300,w=340,h=100):AirZone=>({x,y,w,h,fx,fy:0});
export const LEVELS:readonly Level[]=[
 {name:'初次铸造',chapter:'01 / 精密车间',hint:'先用钢珠熟悉斜射，侧壁能让一球经过更多靶块。',shots:5,par:1,tiles:row(490,[138,210,282]),pegs:[],air:[]},
 {name:'折射练习',chapter:'01 / 精密车间',hint:'三角靶会按斜面改变球路；试试回弹更强的陶瓷。',shots:6,par:1,tiles:[...row(435,[138,282],1,'prism'),...row(555,[102,210,318],1,'capacitor')],pegs:[],air:[]},
 {name:'针眼通道',chapter:'01 / 精密车间',hint:'中央反射柱之间只有22单位空隙，小珠可以穿过。',shots:6,par:2,tiles:row(525,[110,210,310],2,'capacitor'),pegs:[peg(176,345,23),peg(244,345,23)],air:[]},
 {name:'铜墙回声',chapter:'01 / 精密车间',hint:'大珠接触范围更宽，但同一发射能量下速度更慢。',shots:7,par:2,tiles:[...row(450,[105,315],2),...row(560,[140,210,280],1,'prism')],pegs:[peg(210,350,25)],air:[]},
 {name:'东风试验',chapter:'02 / 风洞实验室',hint:'青色箭头是向右气流；重黄铜更稳，轻橡胶偏移更明显。',shots:6,par:2,tiles:[...row(475,[130,280],2,'capacitor'),...row(580,[90,210,330])],pegs:[],air:[wind(65)]},
 {name:'逆风航道',chapter:'02 / 风洞实验室',hint:'逆风区向左施力，尝试调整材质与发射角度。',shots:7,par:2,tiles:[...row(455,[105,210,315],1,'prism'),...row(580,[140,280],2)],pegs:[peg(320,325)],air:[wind(-65,40,330,255,100)]},
 {name:'双向涡室',chapter:'02 / 风洞实验室',hint:'上下气流方向相反，轻球转弯更明显。',shots:8,par:2,tiles:[...row(470,[100,210,320],2,'capacitor'),...row(600,[145,275])],pegs:[],air:[wind(50,35,280,350,85),wind(-55,35,520,350,70)]},
 {name:'磁场窗口',chapter:'02 / 风洞实验室',hint:'钢珠能被主动磁场吸引，其他材质不受磁场影响。',shots:8,par:3,tiles:[...row(440,[90,330],2),...row(555,[140,210,280],2,'capacitor')],pegs:[peg(155,330),peg(265,330)],air:[wind(40,60,470,300,55)]},
 {name:'三叉回廊',chapter:'03 / 核心试炼',hint:'反射柱不扣数字也不会被击碎，利用反射绕到靶阵两侧。',shots:8,par:2,tiles:[...row(470,[90,210,330],2,'prism'),...row(585,[140,280],2)],pegs:[peg(135,320),peg(285,320),peg(210,390,18)],air:[]},
 {name:'交错装配',chapter:'03 / 核心试炼',hint:'每次发射前都可重新选珠，用大小切换处理不同空隙。',shots:9,par:3,tiles:[...row(420,[100,250],2),...row(505,[170,320],2,'prism'),...row(590,[100,250],2,'capacitor')],pegs:[peg(210,305)],air:[wind(-35,40,340,340,55)]},
 {name:'风压核心',chapter:'03 / 核心试炼',hint:'气流只在标记区域生效；弹珠离开后恢复自由落体。',shots:9,par:3,tiles:[...row(450,[100,210,320],2),...row(570,[130,290],3,'capacitor')],pegs:[peg(155,320,21),peg(265,320,21)],air:[wind(70,35,360,350,60),wind(-50,35,495,350,45)]},
 {name:'最后的铸星',chapter:'03 / 核心试炼',hint:'综合运用尺寸、材质、边壁和气流；每次撞击始终只减1。',shots:10,par:3,tiles:[...row(430,[100,210,320],2,'prism'),...row(535,[100,210,320],2,'capacitor'),...row(620,[150,270],2)],pegs:[peg(155,310,20),peg(265,310,20)],air:[wind(45,40,350,340,50),wind(-40,40,465,340,40)]},
];
