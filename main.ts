import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

const W = 1024, H = 1024, margin = 36;
const paper = [246, 241, 229], ink = '#171410', red = '#9e2b25', blue = '#274156', gold = '#b98a1d';
const pixels = new Uint8Array(W * H * 3);
type Clip = {x:number;y:number;w:number;h:number};
let clip:Clip={x:0,y:0,w:W,h:H};
function withClip<T>(rect:Clip,fn:()=>T):T { const previous=clip;clip={x:Math.max(0,rect.x),y:Math.max(0,rect.y),w:Math.max(0,Math.min(W,rect.x+rect.w)-Math.max(0,rect.x)),h:Math.max(0,Math.min(H,rect.y+rect.h)-Math.max(0,rect.y))};try{return fn();}finally{clip=previous;} }
const colors: Record<string, [number, number, number]> = {
  '#f6f1e5':[246,241,229], '#171410':[23,20,16], '#9e2b25':[158,43,37], '#274156':[39,65,86], '#b98a1d':[185,138,29],
  '#10151f':[16,21,31], '#1d2f45':[29,47,69], '#fffaf0':[255,250,240], '#f08a38':[240,138,56], '#29313d':[41,49,61],
  '#253544':[37,53,68], '#355064':[53,80,100], '#d8d2c4':[216,210,196], '#546270':[84,98,112], '#c9b66c':[201,182,108],
  '#294c68':[41,76,104], '#e5ded0':[229,222,208], '#d8a23a':[216,162,58], '#dcdddd':[220,221,221], '#c63a30':[198,58,48],
  '#486271':[72,98,113], '#e4e0d6':[228,224,214], '#18212b':[24,33,43], '#a87d22':[168,125,34], '#f1e9d6':[241,233,214]
};
function rgb(c: string | [number,number,number]) { return typeof c === 'string' ? colors[c] ?? [255,255,255] : c; }
function setPx(x:number,y:number,c:string|[number,number,number]) { x=Math.round(x); y=Math.round(y); if(x<clip.x||y<clip.y||x>=clip.x+clip.w||y>=clip.y+clip.h||x<0||y<0||x>=W||y>=H)return; const i=(y*W+x)*3, q=rgb(c); pixels[i]=q[0]; pixels[i+1]=q[1]; pixels[i+2]=q[2]; }
function fillRect(x:number,y:number,w:number,h:number,c:string) { for(let yy=Math.max(0,Math.floor(y));yy<Math.min(H,Math.ceil(y+h));yy++) for(let xx=Math.max(0,Math.floor(x));xx<Math.min(W,Math.ceil(x+w));xx++) setPx(xx,yy,c); }
function line(x1:number,y1:number,x2:number,y2:number,width:number,c:string) { const r=width/2, minX=Math.floor(Math.min(x1,x2)-r), maxX=Math.ceil(Math.max(x1,x2)+r), minY=Math.floor(Math.min(y1,y2)-r), maxY=Math.ceil(Math.max(y1,y2)+r), dx=x2-x1,dy=y2-y1,den=dx*dx+dy*dy; for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const t=den?Math.max(0,Math.min(1,((x-x1)*dx+(y-y1)*dy)/den)):0; if(Math.hypot(x-(x1+t*dx),y-(y1+t*dy))<=r)setPx(x,y,c);} }
function disc(cx:number,cy:number,r:number,c:string) { for(let y=Math.floor(cy-r);y<=cy+r;y++)for(let x=Math.floor(cx-r);x<=cx+r;x++)if((x-cx)**2+(y-cy)**2<=r*r)setPx(x,y,c); }
function polygon(points:number[][],c:string) { const ys=points.map(p=>p[1]), min=Math.floor(Math.min(...ys)),max=Math.ceil(Math.max(...ys)); for(let y=min;y<=max;y++){const xs:number[]=[];for(let i=0,j=points.length-1;i<points.length;j=i++){const [xi,yi]=points[i],[xj,yj]=points[j];if((yi>y)!==(yj>y))xs.push((xj-xi)*(y-yi)/(yj-yi)+xi);}xs.sort((a,b)=>a-b);for(let k=0;k+1<xs.length;k+=2)for(let x=Math.ceil(xs[k]);x<=xs[k+1];x++)setPx(x,y,c);} }
function triangle(a:number[],b:number[],c:number[],fill:string){polygon([a,b,c],fill);}
const font:Record<string,string[]> = {
A:['01110','10001','10001','11111','10001','10001','10001'],B:['11110','10001','10001','11110','10001','10001','11110'],C:['01111','10000','10000','10000','10000','10000','01111'],D:['11110','10001','10001','10001','10001','10001','11110'],E:['11111','10000','10000','11110','10000','10000','11111'],F:['11111','10000','10000','11110','10000','10000','10000'],G:['01111','10000','10000','10111','10001','10001','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['11111','00100','00100','00100','00100','00100','11111'],J:['00111','00010','00010','00010','10010','10010','01100'],K:['10001','10010','10100','11000','10100','10010','10001'],L:['10000','10000','10000','10000','10000','10000','11111'],M:['10001','11011','10101','10101','10001','10001','10001'],N:['10001','11001','11001','10101','10011','10011','10001'],O:['01110','10001','10001','10001','10001','10001','01110'],P:['11110','10001','10001','11110','10000','10000','10000'],Q:['01110','10001','10001','10001','10101','10010','01101'],R:['11110','10001','10001','11110','10100','10010','10001'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],U:['10001','10001','10001','10001','10001','10001','01110'],V:['10001','10001','10001','10001','10001','01010','00100'],W:['10001','10001','10001','10101','10101','10101','01010'],X:['10001','10001','01010','00100','01010','10001','10001'],Y:['10001','10001','01010','00100','00100','00100','00100'],Z:['11111','00001','00010','00100','01000','10000','11111'],
'0':['01110','10001','10011','10101','11001','10001','01110'],'1':['00100','01100','00100','00100','00100','00100','01110'],'2':['01110','10001','00001','00010','00100','01000','11111'],'3':['11110','00001','00001','01110','00001','00001','11110'],'4':['00010','00110','01010','10010','11111','00010','00010'],'5':['11111','10000','10000','11110','00001','00001','11110'],'6':['01110','10000','10000','11110','10001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'8':['01110','10001','10001','01110','10001','10001','01110'],'9':['01110','10001','10001','01111','00001','00001','01110'],
'.':['00000','00000','00000','00000','00000','00110','00110'],',':['00000','00000','00000','00000','00110','00110','00100'],"'":['00100','00100','00010','00000','00000','00000','00000'],'"':['01010','01010','00100','00000','00000','00000','00000'],':':['00000','00110','00110','00000','00110','00110','00000'],';':['00000','00110','00110','00000','00110','00110','00100'],'!':['00100','00100','00100','00100','00100','00000','00100'],'?':['01110','10001','00001','00010','00100','00000','00100'],'-':['00000','00000','00000','11111','00000','00000','00000'],'–':['00000','00000','00000','11111','00000','00000','00000'],'—':['00000','00000','00000','11111','00000','00000','00000'],'·':['00000','00000','00100','00000','00000','00000','00000'],'$':['00100','01111','10100','01110','00101','11110','00100'],'%':['11001','11010','00100','01000','10110','00110','00000'],'(':['00010','00100','01000','01000','01000','00100','00010'],')':['01000','00100','00010','00010','00010','00100','01000'],'/':['00001','00010','00010','00100','01000','01000','10000'],'&':['01100','10010','10100','01000','10101','10010','01101'],' ':['00000','00000','00000','00000','00000','00000','00000']
};
function measure(s:string,scale:number,bold=false){const text=s.toUpperCase();let width=0;for(const ch of text){const g=font[ch]??font[' '];let last=-1;for(let y=0;y<7;y++)for(let x=0;x<5;x++)if(g[y][x]==='1')last=Math.max(last,x);width+=last<0?0:(last+1)*scale+(bold?1:0);width+=6*scale+(bold?1:0)-(bold?1:0);}
  return Math.max(0,width-(6*scale+(bold?1:0)));
}
function drawText(text:string,x:number,y:number,scale:number,color:string,bold=false){let cx=x; for(const ch of text.toUpperCase()){const g=font[ch]??font[' '];for(let gy=0;gy<7;gy++)for(let gx=0;gx<5;gx++)if(g[gy][gx]==='1'){fillRect(cx+gx*scale,y+gy*scale,scale,scale,color);if(bold)fillRect(cx+gx*scale+1,y+gy*scale,scale,scale,color);}cx+=6*scale+(bold?1:0);}}
function wrapText(text:string,maxWidth:number,scale:number,bold=false){const words=text.toUpperCase().split(/\s+/), lines:string[]=[];let lineText='';for(const word of words){const test=lineText?lineText+' '+word:word;if(measure(test,scale,bold)<=maxWidth)lineText=test;else{if(lineText)lines.push(lineText);lineText=word;if(measure(word,scale,bold)>maxWidth)throw Error('Word exceeds text width: '+word);}}if(lineText)lines.push(lineText);return lines;}
function pitch(scale:number){return Math.ceil(7*scale*1.28);}
function fitBlock(text:string,x:number,y:number,w:number,start:number,min:number,bold:boolean,color:string,maxLines=99){for(let s=start;s>=min;s--){const lines=wrapText(text,w,s,bold), lineH=pitch(s), height=lines.length*lineH;if(lines.length<=maxLines){lines.forEach((l,i)=>drawText(l,x,y+i*lineH,s,color,bold));return {scale:s,lines,lineH,height,bottom:y+height};}}throw Error('Text block does not fit: '+text);}
function center(text:string,y:number,scale:number,color:string,bold=false){drawText(text,(W-measure(text.toUpperCase(),scale,bold))/2,y,scale,color,bold);}
let seed=0x20_11_20;function rand(){seed=(seed+0x6D2B79F5)|0;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
for(let i=0;i<W*H;i++){const j=Math.floor(rand()*9)-4;pixels[i*3]=paper[0]+j;pixels[i*3+1]=paper[1]+j;pixels[i*3+2]=paper[2]+j;}

// Masthead
const contentW=W-margin*2; let cursor=18;
line(margin,cursor,W-margin,cursor,3,ink); cursor+=12;
const mast='THE DAY IN ONE PICTURE', mastScale=Math.min(8,Math.floor((contentW-72)/measure(mast,1,true)));
center(mast,cursor,mastScale,ink,true); cursor+=7*mastScale+12;
line(margin,cursor,W-margin,cursor,1,ink); cursor+=5; line(margin,cursor,W-margin,cursor,3,ink); cursor+=9;
const dateline="FRIDAY · 20 NOVEMBER 2026 · THE WORLD'S NEWS IN A SINGLE IMAGE";
const dateScale=Math.min(2,Math.floor(contentW/measure(dateline,1,false)));
const date=fitBlock(dateline,margin,cursor,contentW,dateScale,1,false,ink,1); cursor=date.bottom+14;

const leadTop=cursor;
drawText('KYIV · UKRAINE WAR',margin,leadTop,2,red,true); cursor+=pitch(2)+4;
const leadHeadline='HOURS AFTER A PEACE DECLARATION, RUSSIA UNLEASHES ONE OF ITS BIGGEST BOMBARDMENTS OF THE WAR';
const leadFit=fitBlock(leadHeadline,margin,cursor,contentW,5,3,true,ink,4); cursor=leadFit.bottom+5;
const subFit=fitBlock('Missiles and drones pound the power grid and three Kyiv bridges, killing eight, as Trump calls his talks with Putin "very good" — but no deal on guarantees.',margin,cursor,contentW,2,1,false,ink,2); cursor=subFit.bottom+10;
const artY=cursor, artH=220;
fillRect(margin,artY,contentW,artH,'#10151f'); fillRect(margin,artY+artH-28,contentW,28,'#1d2f45');
for(let i=0;i<55;i++){const x=margin+rand()*contentW,y=artY+rand()*(artH-30);disc(x,y,rand()*1.2+0.3,'#fffaf0');}
// Three suspension bridges across the night river.
for(let b=0;b<3;b++){const bx=210+b*300, deck=artY+artH-40, top=artY+32+(b%2)*12, span=160;line(bx-45,deck,bx+span+45,deck,4,'#29313d');for(const tx of [bx,bx+span]){fillRect(tx-5,top,10,deck-top,'#29313d');fillRect(tx-9,top,18,4,'#546270');}line(bx-45,deck-22,bx,top+8,2,'#546270');line(bx,top+8,bx+span,top+8,2,'#546270');line(bx+span,top+8,bx+span+45,deck-22,2,'#546270');for(let x=bx+12;x<bx+span;x+=18)line(x,top+8,x,deck-3,1,'#546270');for(let x=bx-30;x<bx+span+35;x+=18)fillRect(x,deck-11,5,3,'#b98a1d');}
// Left bank pylon.
const px=70, py=artY+35, base=artY+artH-30;line(px,py,px-22,base,3,'#29313d');line(px,py,px+23,base,3,'#29313d');line(px-22,base,px+23,base,3,'#29313d');line(px-16,py+25,px+16,py+25,2,'#29313d');line(px-20,py+55,px+20,py+55,2,'#29313d');for(const x of [px-16,px+16])line(x,py+25,px+20*(x<px?-1:1),py+55,1,'#29313d');
for(let i=0;i<4;i++){const x=250+i*140,y=artY+5+i%2*18;line(x,y,x+85,y+85,2,'#f08a38');disc(x+85,y+85,3,'#d8a23a');for(let a=0;a<8;a++){const an=a*Math.PI/4;line(x+85,y+85,x+85+5*Math.cos(an),y+85+5*Math.sin(an),1,'#f08a38');}}
drawText('KYIV, BEFORE DAWN',margin+8,artY+artH-20,2,'#fffaf0',true);

const panelsTop=artY+artH+12, gap=16, colW=(contentW-gap)/2, artCol=118;
type Story={k:string;h:string;s:string;c:string;draw:(x:number,y:number,w:number,h:number)=>void};
const drawCity=(x:number,y:number,w:number,h:number)=>{const base=y+h-2;for(const [i,bw,bh] of [[0,25,27],[1,30,42],[2,24,34]] as number[][]){const bx=x+2+i*36;fillRect(bx,base-bh,bw,bh,'#253544');for(let yy=base-bh+5;yy<base-3;yy+=7)for(let xx=bx+5;xx<bx+bw-3;xx+=8)fillRect(xx,yy,3,3,'#c9b66c');}line(x+3,y+17,x+w-4,y+29,1,'#d8a23a');for(let i=0;i<8;i++)disc(x+5+rand()*(w-12),y+3+rand()*14,1,'#546270');};
const drawFlags=(x:number,y:number,w:number,h:number)=>{const base=y+h-3;line(x+25,y+2,x+25,base,2,ink);line(x+99,y+2,x+99,base,2,ink);fillRect(x+27,y+4,37,21,'#294c68');for(let i=0;i<12;i++){const a=i*Math.PI/6;disc(x+45+7*Math.cos(a),y+14+7*Math.sin(a),1,'#d8a23a');}fillRect(x+101,y+4,35,7,'#c63a30');fillRect(x+101,y+11,35,7,'#e4e0d6');fillRect(x+101,y+18,35,7,'#294c68');line(x+9,base,x+147,base,3,'#546270');line(x+25,base-9,x+99,base-9,2,'#546270');};
const drawMarket=(x:number,y:number,w:number,h:number)=>{const left=x+4,right=x+w-4,top=y+4,bottom=y+h-4,dx=right-left,dy=bottom-top;line(left,bottom,left,top,2,ink);line(left,bottom,right,bottom,2,ink);const pts=[[0,.08],[.2,.2],[.39,.3],[.57,.43],[.76,.67],[1,.83]].map(([px,py])=>[left+px*dx,top+py*dy]);for(let i=0;i<pts.length-1;i++)line(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],3,red);triangle(pts[5],[right-dx*.08,bottom-dy*.12],[right-dx*.03,bottom-dy*.27],red);};
const drawClimate=(x:number,y:number,w:number,h:number)=>{disc(x+35,y+23,20,'#294c68');disc(x+35,y+23,17,'#486271');polygon([[x+23,y+12],[x+30,y+9],[x+34,y+17],[x+29,y+23],[x+22,y+20]],'#b98a1d');polygon([[x+39,y+22],[x+48,y+19],[x+50,y+29],[x+43,y+34],[x+38,y+29]],'#b98a1d');fillRect(x+89,y+4,10,39,'#e4e0d6');fillRect(x+93,y+14,3,25,'#c63a30');disc(x+94,y+43,7,'#c63a30');};
const drawBorder=(x:number,y:number,w:number,h:number)=>{fillRect(x,y,w,h,'#18212b');line(x,y+h-6,x+w,y+h-6,2,'#d8a23a');for(let p=x+12;p<x+w;p+=24){line(p,y+7,p,y+h-5,2,'#546270');line(p,y+12,p+24,y+25,1,'#546270');line(p+24,y+12,p,y+25,1,'#546270');}line(x+40,y+12,x+140,y+8,4,'#e4e0d6');line(x+40,y+16,x+140,y+12,4,'#c63a30');};
const stories:Story[]=[
{k:'RIYADH · MIDDLE EAST',h:"HOUTHI MISSILES STRIKE RIYADH'S FINANCIAL DISTRICT",s:'The PIF tower is damaged, Saudi jets hit back in Yemen and oil climbs as a tanker burns in the Strait of Hormuz.',c:red,draw:drawCity},
{k:'BRUSSELS · POST-BREXIT RESET',h:"UK AND EU SEAL 'RESET' DEAL ON TRADE, FOOD AND YOUTH TRAVEL",s:'Burnham, Costa and von der Leyen hail a new chapter, a decade after the Brexit vote.',c:blue,draw:drawFlags},
{k:'GLOBAL MARKETS',h:'AI SELL-OFF DEEPENS: NIKKEI CRASHES 5.1% TO A SEVEN-MONTH LOW',s:"A day after Anthropic's record debut, Asia heads for its worst week since 2020 as AI doubts spread.",c:red,draw:drawMarket},
{k:'ANTALYA · COP31',h:'CLIMATE TALKS STALL AS DRAFT DEAL DROPS FOSSIL-FUEL PHASE-OUT',s:'Activists chant "shame" as negotiators strip the pledge from the text in Turkey.',c:gold,draw:drawClimate},
{k:"TALLINN · NATO'S EASTERN BORDER",h:'ESTONIA SHUTS BORDER WITH RUSSIA AFTER SABOTAGE ATTACK',s:'Tallinn blames a GRU-linked attack; Moscow vows to answer the "new Iron Curtain".',c:blue,draw:drawBorder}
];
function panel(st:Story,x:number,y:number,w:number){line(x,y,x+w,y,1,ink);const textW=w-artCol-12, tx=x+8;let ty=y+7;drawText(st.k,tx,ty,2,st.c,true);ty+=pitch(2)+3;const hf=fitBlock(st.h,tx,ty,textW,2,1,true,ink,4);ty=hf.bottom+3;const sf=fitBlock(st.s,tx,ty,textW,1,1,false,ink,4);const h=Math.max(sf.bottom+7-y,64)+12;withClip({x:x+w-artCol+5,y:y+(h-64)/2,w:artCol-10,h:64},()=>st.draw(x+w-artCol+5,y+(h-64)/2,artCol-10,64));return {height:h,bottom:y+h};}
const r1a=panel(stories[0],margin,panelsTop,colW),r1b=panel(stories[1],margin+colW+gap,panelsTop,colW);let cursor2=Math.max(r1a.bottom,r1b.bottom)+10;
const r2a=panel(stories[2],margin,cursor2,colW),r2b=panel(stories[3],margin+colW+gap,cursor2,colW);cursor2=Math.max(r2a.bottom,r2b.bottom)+10;
const r3=panel(stories[4],margin,cursor2,contentW);const tickerY=r3.bottom+10;
const ticker="ALSO TODAY · WHITE HOUSE FIRES NATIONAL CYBER DIRECTOR AFTER WEEK OF TECH OUTAGES; ITALY'S WORKERS AND STUDENTS STAGE NATIONWIDE STRIKE OVER LIVING COSTS; ANGOLA PAYS $180M FOR 10% OF DE BEERS; MYANMAR SAYS IT IS \"DISAPPOINTED\" BY THE ICJ GENOCIDE RULING.";
const tickerLines=wrapText(ticker,contentW-20,1,true),tickerH=tickerLines.length*pitch(1)+16;
fillRect(margin,tickerY,contentW,tickerH,ink);
fitBlock(ticker,margin+10,tickerY+8,contentW-20,1,1,true,'#fffaf0',99);
drawText('ALSO TODAY',margin+10,tickerY+8,1,gold,true);
const tickerBottom=tickerY+tickerH;if(tickerBottom>H-margin)throw Error(`Ticker exceeds page: ${tickerBottom}`);

function crc32(buf:Uint8Array){const table=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;table[n]=c>>>0;}let c=0xffffffff;for(const b of buf)c=table[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function u32(n:number){return Uint8Array.from([(n>>>24)&255,(n>>>16)&255,(n>>>8)&255,n&255]);}
function chunk(type:string,data:Uint8Array){const t=new TextEncoder().encode(type), body=new Uint8Array(t.length+data.length);body.set(t);body.set(data,t.length);const out=new Uint8Array(12+data.length);out.set(u32(data.length),0);out.set(body,4);out.set(u32(crc32(body)),4+body.length);return out;}
const scan=new Uint8Array(H*(1+W*3));for(let y=0;y<H;y++)scan.set(pixels.subarray(y*W*3,(y+1)*W*3),y*(1+W*3)+1);
const ihdr=new Uint8Array(13);ihdr.set(u32(W),0);ihdr.set(u32(H),4);ihdr[8]=8;ihdr[9]=2;
const signature=Uint8Array.from([137,80,78,71,13,10,26,10]), parts=[signature,chunk('IHDR',ihdr),chunk('IDAT',new Uint8Array(deflateSync(scan))),chunk('IEND',new Uint8Array())];const png=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){png.set(p,offset);offset+=p.length;}
const outDir=process.env.MAKEFUN_OUTPUT_DIR||'/output';mkdirSync(outDir,{recursive:true});const out=join(outDir,'entry.png');writeFileSync(out,png);console.log(`${png.length}`);
