const hex=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16))
const lin=c=>{c/=255;return c<=0.03928?c/12.92:((c+0.055)/1.055)**2.4}
const L=([r,g,b])=>0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b)
const mix=(fg,a,bg)=>fg.map((c,i)=>c*a+bg[i]*(1-a))
const cr=(a,b)=>{const[x,y]=[L(a),L(b)].sort((p,q)=>q-p);return (x+0.05)/(y+0.05)}
const W=[255,255,255],K=[10,10,15]
const ctx={
 dark:{fg:W,bgs:{page:"#000000",surface:"#0a0a0a","surface-hi":"#131313",dropdown:"#0f0f0f"},t:{lo:.46,"copy-md":.55,"copy-faint":.46,"text-md(HEAD)":.55,"text-faint(HEAD)":.20}},
 "force-dark":{fg:W,bgs:{page:"#0a0a0a",dropdown:"#0f0f0f"},t:{lo:.4,"copy-md":.62,"copy-faint":.4}},
 light:{fg:K,bgs:{page:"#f3f2ee",surface:"#fbfaf7","surface-hi":"#e9e7e1"},t:{lo:.58,"copy-md":.66,"copy-faint":.58,"text-md(HEAD)":.55,"text-faint(HEAD)":.22}},
}
for(const[n,c]of Object.entries(ctx))for(const[t,a]of Object.entries(c.t))console.log(n.padEnd(10),t.padEnd(17),a,Object.entries(c.bgs).map(([b,h])=>`${b}=${cr(mix(c.fg,a,hex(h)),hex(h)).toFixed(2)}`).join(" "))
