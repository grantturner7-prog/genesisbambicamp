import numpy as np, cv2, glob, json, pickle
from PIL import Image
p=glob.glob('bambi-site/photos/35_*202507.jpg')[0]
rgb=np.array(Image.open(p).convert('RGB')); im=rgb.astype(int); H,W=rgb.shape[:2]
R,G,B=im[...,0],im[...,1],im[...,2]
g=pickle.load(open('geom.pkl','rb'))
land=np.zeros((H,W),np.uint8); cv2.drawContours(land,[g['land']],-1,1,-1)
tan=((R>=125)&(R<=205)&(G>=125)&(G<=190)&(B>=55)&(B<=125)&(R-B>=50)&(R-G>=-8)&(R-G<=28)).astype(np.uint8)
tan&=land
# remove unit icons, labels and UI art
for x,y,_ in json.load(open('vans_matched.json')): cv2.circle(tan,(int(x),int(y)),13,0,-1)
for (x0,y0,x1,y1) in [(520,545,640,610),(850,535,945,585),(760,545,850,640),(480,548,540,590),(30,30,440,150),(640,405,760,470),(570,330,650,410),(340,562,470,610),(690,552,760,585),(930,290,1030,330),(540,495,640,525),(940,395,1000,420),(555,445,600,470),(500,300,620,360),(540,395,650,420)]:
    tan[y0:y1,x0:x1]=0
tan=cv2.morphologyEx(tan,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
n,lab,st,_=cv2.connectedComponentsWithStats(tan,8)
keep=np.zeros_like(tan)
for i in range(1,n):
    x,y,w,h,a=st[i]
    if a>=260 and max(w,h)>=26: keep[lab==i]=1
keep=cv2.morphologyEx(keep,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(23,23)))
keep=cv2.morphologyEx(keep,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
np.save('roadmask2.npy',keep)
cv2.imwrite('mask_road2.png',keep*255)
print('road px',int(keep.sum()))
