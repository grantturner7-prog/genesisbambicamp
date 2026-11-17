import numpy as np, cv2, json, glob, pickle
from scipy.ndimage import gaussian_filter1d
from PIL import Image
p=glob.glob('bambi-site/photos/35_*202507.jpg')[0]
rgb=np.array(Image.open(p).convert('RGB')); im=rgb.astype(int); H,W=rgb.shape[:2]
R,G,B=im[...,0],im[...,1],im[...,2]
g=pickle.load(open('geom.pkl','rb'))
def smooth(c,sig=5,eps=1.0):
    pts=c[:,0,:].astype(float)
    if len(pts)>12:
        pts=np.stack([gaussian_filter1d(pts[:,0],sig,mode='wrap'),gaussian_filter1d(pts[:,1],sig,mode='wrap')],1)
    a=cv2.approxPolyDP(pts.astype(np.float32).reshape(-1,1,2),eps,True)[:,0,:]
    return [[round(float(x),1),round(float(y),1)] for x,y in a]
land=smooth(g['land'],sig=7,eps=1.2)
# ---- lakes: wild lake, kayak lake (merge two lobes), pool
wild=kayak=pool=None
kay_masks=np.zeros((H,W),np.uint8)
def vclose(c,k=(5,75)):
    m=np.zeros((H,W),np.uint8); cv2.drawContours(m,[c],-1,1,-1)
    m=cv2.morphologyEx(m,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_RECT,k))
    cc,_=cv2.findContours(m,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); return max(cc,key=cv2.contourArea)
for (cx,cy,a,c) in g['water']:
    if a>20000: wild=smooth(vclose(c),sig=4,eps=0.9)
    elif cx>800: cv2.drawContours(kay_masks,[c],-1,1,-1)
    else: pool=smooth(c,sig=2,eps=0.7)
kay_masks=cv2.morphologyEx(kay_masks,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_RECT,(5,85)))
cc,_=cv2.findContours(kay_masks,cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_NONE); kayak=smooth(max(cc,key=cv2.contourArea),sig=4,eps=0.9)
# ---- roads: close gaps under labels, polygons with holes
road=np.load('roadmask2.npy').astype(np.uint8)
# bridge the short gaps where map artwork covers the road (centre-lines read from the map)
bridges=[[(270,395),(284,412),(294,426)],[(358,468),(372,472),(384,472)],[(466,480),(480,488),(487,500)],[(530,300),(536,350),(530,398)],
         [(636,526),(660,528),(690,531)],[(800,488),(812,504),(832,520),(860,526)],[(1000,291),(1018,312),(1032,340)],[(1040,390),(1052,420)]]
for pl in bridges: cv2.polylines(road,[np.array(pl,np.int32)],False,1,13)
road=cv2.morphologyEx(road,cv2.MORPH_CLOSE,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(11,11)))
cs,hier=cv2.findContours(road,cv2.RETR_CCOMP,cv2.CHAIN_APPROX_NONE)
roads=[]
for i,c in enumerate(cs):
    if hier[0][i][3]==-1 and cv2.contourArea(c)>600:
        holes=[smooth(cs[j],sig=3,eps=1.0) for j in range(len(cs)) if hier[0][j][3]==i and cv2.contourArea(cs[j])>400]
        roads.append({'outer':smooth(c,sig=3,eps=1.0),'holes':holes})
print('road polys',len(roads),'holes',sum(len(r['holes']) for r in roads))
# ---- vans
vans=json.load(open('vans_matched.json')); V=[(x,y) for x,y,_ in vans]
def zone(x,y):
    if x<400:
        if y<348 and x>220: return 'G'
        if 255<x<335 and 350<y<435: return 'F'
        if x>=220 and y>445 and x<330: return 'E'
        return 'D'
    if y<340 and (x<830 and (x<840 or y<300)):
        # B: top row + second diagonal row; A: the long line along the kayak ring
        pass
    return None
# east assignment: A line = points close to the kayak-ring west side; B = rest
east=[(x,y) for x,y in V if x>=600]
# A line: fit by ordering along the ring: use points with x+0.9*y... simply: B if y<300 and x<830 or point lies on the 2nd row
def is_B(x,y):
    if y<300 and x<830: return True
    # second row of B: (819,295),(805,307),(785,319),(775,332) -> within this band
    return any(abs(x-bx)<6 and abs(y-by)<6 for bx,by in [(819,295),(805,307),(785,319),(775,332)])
out=[]; cnt={}
for (x,y) in sorted(V,key=lambda t:(t[0]>=600,t[1])):
    z=zone(x,y) if x<400 else ('B' if is_B(x,y) else 'A')
    out.append((x,y,z))
from collections import Counter
print('zones',Counter(z for _,_,z in out))
# facing: toward water if close else away from road
roadd=cv2.distanceTransform((1-road).astype(np.uint8),cv2.DIST_L2,5)
wmask=np.zeros((H,W),np.uint8)
for poly in (wild,kayak,pool): cv2.fillPoly(wmask,[np.array(poly,np.int32)],1)
waterd=cv2.distanceTransform((1-wmask).astype(np.uint8),cv2.DIST_L2,5)
gx_r=cv2.Sobel(cv2.GaussianBlur(roadd,(0,0),3),cv2.CV_32F,1,0); gy_r=cv2.Sobel(cv2.GaussianBlur(roadd,(0,0),3),cv2.CV_32F,0,1)
gx_w=cv2.Sobel(cv2.GaussianBlur(waterd,(0,0),3),cv2.CV_32F,1,0); gy_w=cv2.Sobel(cv2.GaussianBlur(waterd,(0,0),3),cv2.CV_32F,0,1)
vl=[]
for k,(x,y,z) in enumerate(out):
    xi,yi=int(round(x)),int(round(y))
    wd=waterd[yi,xi]
    if wd<55: fx,fy=-gx_w[yi,xi],-gy_w[yi,xi]    # face water
    else: fx,fy=gx_r[yi,xi],gy_r[yi,xi]           # face away from road
    n=np.hypot(fx,fy) or 1; fx/=n; fy/=n
    vl.append({'zone':z,'x':round(x,1),'y':round(y,1),'faceX':round(float(fx),3),'faceY':round(float(fy),3),'waterDist':round(float(wd),1),'roadDist':round(float(roadd[yi,xi]),1)})
# ids per zone in reading order
byz={}
for v in vl: byz.setdefault(v['zone'],[]).append(v)
for z,l in byz.items():
    l.sort(key=lambda v:(v['y'],v['x']) if z in 'DG' else (v['x'],v['y']))
    for i,v in enumerate(l): v['id']=f'{z}{i+1:02d}'
# ---- trees: flat green crowns
hsv=cv2.cvtColor(rgb,cv2.COLOR_RGB2HSV).astype(int)
tree=((hsv[...,0]>=52)&(hsv[...,0]<=78)&(hsv[...,1]>=85)&(hsv[...,2]>=70)).astype(np.uint8)
tree=cv2.morphologyEx(tree,cv2.MORPH_OPEN,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(7,7)))
dt=cv2.distanceTransform(tree,cv2.DIST_L2,5)
dil=cv2.dilate(dt,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(13,13)))
pk=np.argwhere((dt==dil)&(dt>=5.0))
trees=[]; 
for (y,x) in pk:
    if all((x-t['x'])**2+(y-t['y'])**2>(0.8*(dt[y,x]+t['r']))**2 for t in trees):
        trees.append({'x':int(x),'y':int(y),'r':round(float(dt[y,x]),1)})
print('trees',len(trees),'r range',min(t['r'] for t in trees),max(t['r'] for t in trees))
pois={ 'dining':[406,580],'checkin':[712,568],'entrance':[895,558],'tramStop':[806,564],'tramLabel':[805,611],'restroom':[553,578],'aed':[611,576],'smoking':[504,566],
 'water':[578,510],'waterIcon':[626,511],'poolLabel':[684,487],'airstream':[666,423],'airstreamLabel':[695,449],'campfire':[629,381],'cinema':[603,353],'cinemaLabel':[561,311],'campfireLabel':[568,402],
 'wildLakeLabel':[439,367],'heron':[400,416],'kingfisher':[375,325],'kayakLabel':[938,408],'kayakBoat':[934,362],'boardingLabel':[977,309],
 'parking':[[810,164],[920,166],[691,209],[199,369],[217,586]],
 'zoneLabels':{'B':[766,242],'A':[911,262],'G':[231,289],'D':[138,414],'F':[262,411],'E':[291,473]} }
layout={'source':'斑比跳跳營地圖202507 (official map), traced; px coordinates, 1200x800, y down','size':[W,H],'land':land,'lakes':{'wild':wild,'kayak':kayak,'pool':pool},'roads':roads,'vans':vl,'trees':trees,'pois':pois}
json.dump(layout,open('layout.json','w'),ensure_ascii=False)
print('van total',len(vl),'bytes',len(json.dumps(layout)))
# verification render (flat) -----------------------------------------------------------------
vis=np.full((H,W,3),(107,174,153),np.uint8)  # BGR bg
cv2.fillPoly(vis,[np.array(land,np.int32)],(48,117,84))
for r in roads:
    cv2.fillPoly(vis,[np.array(r['outer'],np.int32)],(97,170,174))
    for h in r['holes']: cv2.fillPoly(vis,[np.array(h,np.int32)],(48,117,84))
for poly,col in ((wild,(228,179,111)),(kayak,(228,179,111)),(pool,(231,224,131))): cv2.fillPoly(vis,[np.array(poly,np.int32)],col)
for t in trees: cv2.circle(vis,(t['x'],t['y']),int(t['r']),(75,150,60),-1)
for v in vl:
    cv2.rectangle(vis,(int(v['x']-9),int(v['y']-6)),(int(v['x']+9),int(v['y']+6)),(179,222,255),-1)
    cv2.arrowedLine(vis,(int(v['x']),int(v['y'])),(int(v['x']+v['faceX']*16),int(v['y']+v['faceY']*16)),(0,0,200),1,tipLength=.4)
    cv2.putText(vis,v['id'],(int(v['x'])-9,int(v['y'])-9),cv2.FONT_HERSHEY_SIMPLEX,0.3,(255,255,255),1)
cv2.imwrite('layout_check.png',vis)
