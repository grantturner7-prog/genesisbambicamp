import numpy as np, cv2, json, glob
from PIL import Image
p=glob.glob('bambi-site/photos/35_*202507.jpg')[0]
pil=Image.open(p).convert('RGB'); rgb=np.array(pil); im=rgb.astype(int)
R,G,B=im[...,0],im[...,1],im[...,2]
H,W=R.shape
hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV).astype(int)
# sample colours
for n,(x,y) in {'tree_a':(778,141),'tree_b':(922,109),'tree_c':(310,226),'tree_dark':(232,452-80),'road_inner':(420,545),'road_edge':(420,556),'bg_dark_crack':(300,720)}.items(): print(n,(x,y),im[y,x].tolist(),hsv[y,x].tolist())

# ---- land: dark region (grass+trees+labels) closed & filled
dark=((G<150)&(R<165)).astype(np.uint8)
dark=cv2.morphologyEx(dark,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(21,21)))
dark=cv2.morphologyEx(dark,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
cs,_=cv2.findContours(dark,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
land=max(cs,key=cv2.contourArea)
landmask=np.zeros((H,W),np.uint8); cv2.drawContours(landmask,[land],-1,1,-1)
print('land area',cv2.contourArea(land))

# ---- water
blue=((B>R+35)&(B>G-10)&(R<190)).astype(np.uint8)
blue=cv2.morphologyEx(blue,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(15,15)))
n,lab,st,ce=cv2.connectedComponentsWithStats(blue,8)
water=[]
for i in range(1,n):
    x,y,w,h,a=st[i]
    if a<1200: continue
    m=(lab==i).astype(np.uint8)
    cc,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE)
    c=max(cc,key=cv2.contourArea)
    water.append((float(ce[i][0]),float(ce[i][1]),int(a),c))
    print('water comp',[round(v) for v in (ce[i][0],ce[i][1],a)],'bbox',x,y,w,h)

# ---- roads (tan)
tan=((R>150)&(R<225)&(G>140)&(G<205)&(B>60)&(B<150)&(R-B>55)&(abs(R-G)<45)).astype(np.uint8)
for (x0,y0,x1,y1) in [(520,545,640,610),(850,535,945,585),(760,545,850,640),(480,545,540,590),(30,30,440,150),(640,405,760,470),(570,330,650,410),(340,550,470,610),(690,550,760,585),(930,290,1030,330),(540,495,640,525),(940,395,1000,420)]:
    tan[y0:y1,x0:x1]=0
tan=cv2.morphologyEx(tan,cv2.MORPH_OPEN,np.ones((5,5),np.uint8))
tan=cv2.morphologyEx(tan,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(9,9)))
tan=tan&landmask
n,lab,st,ce=cv2.connectedComponentsWithStats(tan,8)
roadmask=np.zeros_like(tan)
for i in range(1,n):
    if st[i][4]>1500: roadmask[lab==i]=1
print('road px',int(roadmask.sum()))
cv2.imwrite('mask_land.png',landmask*255); cv2.imwrite('mask_road.png',roadmask*255)
# overlay
vis=cv2.cvtColor(rgb,cv2.COLOR_RGB2BGR)
cv2.drawContours(vis,[land],-1,(0,0,255),2)
for (_,_,_,c) in water: cv2.drawContours(vis,[c],-1,(255,0,255),2)
cc,_=cv2.findContours(roadmask,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
cv2.drawContours(vis,cc,-1,(0,255,255),1)
cv2.imwrite('overlay_geom.png',vis)
np.save('roadmask.npy',roadmask); 
import pickle; pickle.dump({'land':land,'water':water},open('geom.pkl','wb'))
