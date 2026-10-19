# usage : python3 sat.py <png>... — pixels « couleur » (max-min RGB > 40) par image
import sys
from PIL import Image
for p in sys.argv[1:]:
    im=Image.open(p).convert('RGB'); px=im.getdata()
    n=sum(1 for r,g,b in px if max(r,g,b)-min(r,g,b)>40)
    print(p, 'pix_couleur=%d'%n)
