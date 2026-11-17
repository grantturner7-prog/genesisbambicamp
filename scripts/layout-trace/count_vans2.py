import numpy as np, cv2, json, glob
from PIL import Image
p=glob.glob('bambi-site/photos/35_*202507.jpg')[0]
pil=Image.open(p).convert('RGB'); im=np.array(pil).astype(int)
R,G,B=im[...,0],im[...,1],im[...,2]
mx=im.max(2)
bright=((mx>190)&(R-B>35)&(R>=G-25)).astype(np.uint8)       # cream or yellow icon pixels
# label pills (brown) and other UI blobs -> exclusion
brown=((R>105)&(R<185)&(G>55)&(G<125)&(B>30)&(B<100)&(R-G>25)).astype(np.uint8)
brown=cv2.morphologyEx(brown,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
brown=cv2.dilate(brown,np.ones((15,15),np.uint8))
excl=np.zeros(bright.shape,np.uint8)
for (x0,y0,x1,y1) in [(520,545,640,610),(850,535,945,585),(760,545,850,640),(480,545,540,590),(30,30,440,150),(640,405,760,470),(570,330,650,410)]:
    excl[y0:y1,x0:x1]=1   # bathroom/AED panel, entrance badge, tram+label, smoking icon, logo, airstream, cinema/campfire art
bright=bright&(1-brown)&(1-excl)
bright=cv2.morphologyEx(bright,cv2.MORPH_CLOSE,np.ones((3,3),np.uint8))
n,lab,stats,cent=cv2.connectedComponentsWithStats(bright,8)
vans=[]; rej=[]
for i in range(1,n):
    x,y,w,h,a=stats[i]
    if 11<=w<=24 and 8<=h<=19 and 55<=a<=330 and 1.0<=w/h<=2.4: vans.append((round(float(cent[i][0]),1),round(float(cent[i][1]),1),int(w),int(h),int(a)))
    elif a>=30: rej.append((round(float(cent[i][0])),round(float(cent[i][1])),int(w),int(h),int(a)))
print('van icons:',len(vans)); print('rejected (>=30px):',rej)
json.dump(vans,open('vans_raw.json','w'))
vis=cv2.cvtColor(np.array(pil),cv2.COLOR_RGB2BGR)
for k,(x,y,w,h,a) in enumerate(vans): cv2.rectangle(vis,(int(x-w/2-2),int(y-h/2-2)),(int(x+w/2+2),int(y+h/2+2)),(0,0,255),1)
cv2.imwrite('vans_overlay2.png',cv2.resize(vis,None,fx=1.6,fy=1.6,interpolation=cv2.INTER_CUBIC))
