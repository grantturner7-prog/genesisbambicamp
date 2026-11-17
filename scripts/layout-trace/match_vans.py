import numpy as np, cv2, json, glob
from PIL import Image
p=glob.glob('bambi-site/photos/35_*202507.jpg')[0]
pil=Image.open(p).convert('RGB'); im=np.array(pil).astype(int)
R,G,B=im[...,0],im[...,1],im[...,2]; mx=im.max(2)
bright=((mx>190)&(R-B>35)&(R>=G-25)).astype(np.float32)
clean=json.load(open('vans_raw.json'))
# average template from clean, isolated detections
T=np.zeros((21,27),np.float32); k=0
for (x,y,w,h,a) in clean:
    xi,yi=int(round(x)),int(round(y))
    patch=bright[yi-10:yi+11,xi-13:xi+14]
    if patch.shape==T.shape: T+=patch; k+=1
T/=k; Tb=(T>0.5).astype(np.float32)
print('template from',k,'icons; template px',int(Tb.sum()))
res=cv2.matchTemplate(bright,Tb,cv2.TM_CCOEFF_NORMED)
th=0.55
ys,xs=np.where(res>th); scores=res[ys,xs]
order=np.argsort(-scores); picks=[]
for i in order:
    cx=xs[i]+Tb.shape[1]/2-0.5; cy=ys[i]+Tb.shape[0]/2-0.5
    if all((cx-px)**2+(cy-py)**2>9**2 for px,py,_ in picks): picks.append((float(cx),float(cy),float(scores[i])))
# drop hits inside label / UI regions
def bad(x,y):
    for (x0,y0,x1,y1) in [(520,545,640,610),(850,535,945,585),(760,545,850,640),(480,545,540,590),(30,30,440,150),(640,405,760,470),(570,330,650,410),(340,540,470,610),(690,550,760,585)]:
        if x0<=x<=x1 and y0<=y<=y1: return True
    return False
picks=[q for q in picks if not bad(q[0],q[1])]
picks.sort(key=lambda q:-q[2])
print('matches >',th,':',len(picks)); print('lowest scores',[round(q[2],2) for q in picks[-8:]])
json.dump(picks,open('vans_matched.json','w'))
vis=cv2.cvtColor(np.array(pil),cv2.COLOR_RGB2BGR)
for (x,y,s) in picks: cv2.circle(vis,(int(x),int(y)),11,(0,0,255),1)
cv2.imwrite('vans_matched.png',cv2.resize(vis,None,fx=1.6,fy=1.6,interpolation=cv2.INTER_CUBIC))
