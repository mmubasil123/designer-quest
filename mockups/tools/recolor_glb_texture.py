# One-off: re-colour the baked texture of mockups/assets/ST655_1.glb (version in git history before this change) so its colours follow the
# MoMu garment cutout photo, by matching the luminance rank of the texture to the photo colour ramp. f scales the light (0.15 used).
# Run from mockups/: python3 -I tools/recolor_glb_texture.py 0.15 out.glb original.glb  (original must be the pre-change GLB)
import struct,json,io,sys,numpy as np
from PIL import Image
f=float(sys.argv[1]);dst=sys.argv[2]
b=open('assets/ST655_1.glb','rb').read() if len(sys.argv)<4 else open(sys.argv[3],'rb').read()
n=struct.unpack('<I',b[12:16])[0];j=json.loads(b[20:20+n]);binoff=20+n+8
binlen=struct.unpack('<I',b[20+n:24+n])[0];binb=b[binoff:binoff+binlen]
ii=j['images'][0]['bufferView'];bv=j['bufferViews'][ii]
t=np.asarray(Image.open(io.BytesIO(binb[bv['byteOffset']:bv['byteOffset']+bv['byteLength']])).convert('RGB')).astype(float)
ph=np.asarray(Image.open('assets/src/ST655_1_garment.png').convert('RGBA')).astype(float)
ph=ph[ph[...,3]>200][:,:3];lp=ph@[.2126,.7152,.0722];ph=ph[np.argsort(lp)]
bins=256;ramp=np.array([ph[int(i*len(ph)/bins):int((i+1)*len(ph)/bins)].mean(0) for i in range(bins)])
lt=t@[.2126,.7152,.0722];rank=np.argsort(np.argsort(lt.ravel())).reshape(lt.shape)/(lt.size-1)
out=ramp[np.minimum((rank*bins).astype(int),bins-1)]
lin=(out/255)**2.2*f;out=np.clip(lin,0,1)**(1/2.2)*255   # f scales light, not sRGB value
buf=io.BytesIO();Image.fromarray(out.astype(np.uint8)).save(buf,'PNG',optimize=True);new=buf.getvalue()
parts=[];pos=0
for k in sorted(range(len(j['bufferViews'])),key=lambda k:j['bufferViews'][k].get('byteOffset',0)):
    v=j['bufferViews'][k];data=new if k==ii else binb[v.get('byteOffset',0):v.get('byteOffset',0)+v['byteLength']]
    pad=(-pos)%4;parts.append(b'\0'*pad);pos+=pad;v['byteOffset']=pos;v['byteLength']=len(data);parts.append(data);pos+=len(data)
nb=b''.join(parts);nb+=b'\0'*((-len(nb))%4);j['buffers'][0]['byteLength']=len(nb)
js=json.dumps(j,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
open(dst,'wb').write(b'glTF'+struct.pack('<II',2,12+8+len(js)+8+len(nb))+struct.pack('<I',len(js))+b'JSON'+js+struct.pack('<I',len(nb))+b'BIN\0'+nb)
