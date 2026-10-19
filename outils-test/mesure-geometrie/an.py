# usage : python3 an.py <planches.json> — sortie de g2.mjs ; par planche : traits à < 2 mm d'un point, chevauchements, points hors cadre
import json,sys,math
boards=json.load(open(sys.argv[1]))
def segrect(a,b,c,m):
    # distance segment a-b to rectangle c (half w,h) ; sample
    best=1e9
    for k in range(201):
        t=k/200; x=a['x']+t*(b['x']-a['x']); y=a['y']+t*(b['y']-a['y'])
        dx=max(abs(x-c['x'])-c['w']/2,0); dy=max(abs(y-c['y'])-c['h']/2,0)
        best=min(best,math.hypot(dx,dy))
    return best
for bi,bd in enumerate(boards):
    d=bd['dots']; viol=[]; ov=[]; hors=[]
    for i in range(len(d)-1):
        for k,c in enumerate(d):
            if k in (i,i+1): continue
            g=segrect(d[i],d[i+1],c,0)
            if g<2: viol.append((i+1,i+2,k+1,round(g,2)))
    for i in range(len(d)):
        for j in range(i+1,len(d)):
            a,b=d[i],d[j]
            if abs(a['x']-b['x'])<(a['w']+b['w'])/2 and abs(a['y']-b['y'])<(a['h']+b['h'])/2: ov.append((i+1,j+1))
        a=d[i]
        if a['x']-a['w']/2< -0.5 or a['x']+a['w']/2>bd['w']+0.5 or a['y']-a['h']/2<-0.5 or a['y']+a['h']/2>bd['h']+0.5: hors.append(i+1)
    print(f"planche {bi+1} {bd['w']:.1f}x{bd['h']:.1f} n={len(d)} trait<2mm(rect)={len(viol)} {viol[:6]} chevauch={ov[:8]} n_chev={len(ov)} hors={hors}")
