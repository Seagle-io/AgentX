# usage : python3 lines.py <png> [dpi=110] — traits horizontaux > 60 px : y x0 x1 longueur mm
import sys
from PIL import Image
im=Image.open(sys.argv[1]).convert('L'); W,H=im.size; px=im.load()
mm=25.4/(int(sys.argv[2]) if len(sys.argv)>2 else 110)
for y in range(H):
    x=0; 
    while x<W:
        if px[x,y]<128:
            s=x
            while x<W and px[x,y]<128: x+=1
            if x-s>60 and (y+2>=H or px[(s+x)//2,y+2]>128) and px[(s+x)//2,y-2]>128:
                print(y, s, x, "%.1fmm"%((x-s)*mm))
        x+=1
