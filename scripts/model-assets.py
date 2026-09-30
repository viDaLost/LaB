"""Reproducible original lab meshes, exported as glTF 2.0 binary assets.
Requires Python 3 + numpy. Units match the lab scene; visible graduations are
illustrative. This is not a manufacturer CAD file or instrument calibration.
"""
from pathlib import Path
import json, math, struct
import numpy as np

ROOT = Path(__file__).resolve().parent.parent / 'assets' / 'models'
ROOT.mkdir(parents=True, exist_ok=True)
GLASS = {'name':'Borosilicate', 'pbrMetallicRoughness':{'baseColorFactor':[.83,.94,1,.14], 'metallicFactor':0,'roughnessFactor':.035},'alphaMode':'BLEND','doubleSided':True}
TEAL = {'name':'Teal polymer','pbrMetallicRoughness':{'baseColorFactor':[.035,.32,.37,1],'metallicFactor':0,'roughnessFactor':.35}}
WHITE = {'name':'Ceramic markings','pbrMetallicRoughness':{'baseColorFactor':[.9,.95,.94,1],'metallicFactor':0,'roughnessFactor':.65}}
RUBBER = {'name':'Cap polymer','pbrMetallicRoughness':{'baseColorFactor':[.06,.1,.13,1],'metallicFactor':0,'roughnessFactor':.5}}

def lathe(profile,n=48,deform=None):
    p=[];uv=[]
    for j,(r,y) in enumerate(profile):
        for i in range(n+1):
            a=i/n*2*math.pi; xyz=[r*math.sin(a),y,r*math.cos(a)]
            if deform: xyz=deform(xyz,a,j)
            p.append(xyz);uv.append([i/n,j/(len(profile)-1)])
    ix=[]
    for j in range(len(profile)-1):
        for i in range(n):
            a=j*(n+1)+i;b=a+1;c=a+n+1;d=c+1
            ix.extend([a,b,c,b,d,c])
    return mesh(p,uv,ix)

def mesh(p,uv,ix):
    p=np.array(p,dtype='<f4'); uv=np.array(uv,dtype='<f4'); ix=np.array(ix,dtype='<u4')
    normals=np.zeros_like(p)
    for a,b,c in ix.reshape(-1,3):
        v=np.cross(p[b]-p[a],p[c]-p[a]);normals[a]+=v;normals[b]+=v;normals[c]+=v
    norms=np.linalg.norm(normals,axis=1);normals/=np.maximum(norms[:,None],1e-9)
    return p,normals.astype('<f4'),uv,ix

def torus(R,r,y,n=48,m=8):
    p=[];uv=[];ix=[]
    for j in range(m+1):
        b=j/m*2*math.pi
        for i in range(n+1):
            a=i/n*2*math.pi;rad=R+r*math.cos(b)
            p.append([rad*math.sin(a),y+r*math.sin(b),rad*math.cos(a)]);uv.append([i/n,j/m])
    for j in range(m):
        for i in range(n):
            a=j*(n+1)+i;b=a+1;c=a+n+1;d=c+1;ix.extend([a,c,b,b,c,d])
    return mesh(p,uv,ix)

def save(name,parts,materials):
    doc={'asset':{'version':'2.0','generator':'LaB original laboratory mesh exporter'},'scene':0,'scenes':[{'nodes':[]}],'nodes':[],'meshes':[],'materials':materials,'buffers':[{'byteLength':0}],'bufferViews':[],'accessors':[]}
    binary=bytearray()
    def accessor(arr,kind,ctype,target):
        while len(binary)%4:binary.append(0)
        start=len(binary);binary.extend(arr.tobytes());view=len(doc['bufferViews'])
        doc['bufferViews'].append({'buffer':0,'byteOffset':start,'byteLength':len(binary)-start,'target':target})
        a={'bufferView':view,'componentType':ctype,'count':len(arr),'type':kind}
        if kind=='VEC3':a.update(min=arr.min(axis=0).tolist(),max=arr.max(axis=0).tolist())
        doc['accessors'].append(a);return len(doc['accessors'])-1
    for part,geo,mat in parts:
        p,no,uv,ix=geo
        attrs={'POSITION':accessor(p,'VEC3',5126,34962),'NORMAL':accessor(no,'VEC3',5126,34962),'TEXCOORD_0':accessor(uv,'VEC2',5126,34962)}
        ind=accessor(ix,'SCALAR',5125,34963)
        doc['meshes'].append({'name':part,'primitives':[{'attributes':attrs,'indices':ind,'material':mat}]})
        doc['scenes'][0]['nodes'].append(len(doc['nodes']));doc['nodes'].append({'name':part,'mesh':len(doc['meshes'])-1})
    while len(binary)%4:binary.append(0)
    doc['buffers'][0]['byteLength']=len(binary)
    js=json.dumps(doc,separators=(',',':')).encode();js+=b' '*((-len(js))%4)
    data=struct.pack('<4sII',b'glTF',2,12+8+len(js)+8+len(binary))+struct.pack('<I4s',len(js),b'JSON')+js+struct.pack('<I4s',len(binary),b'BIN\0')+binary
    (ROOT/(name+'.glb')).write_bytes(data);print(name,len(data))

def rad(y):
    return 1.05-.1+math.sqrt(max(0,.01-(.1-y)**2)) if y<=.1 else 1.05+(.3-1.05)*(y-.1)/1.9 if y<=2 else .3
outer=[(rad(y),y) for y in np.linspace(0,2.85,62)]
flask=[(0,0)]+outer+[(.345,2.85),(.35,2.89),(.33,2.92),(.275,2.92),(.265,2.86)]+[(max(.01,r-.035),max(.045,y)) for r,y in reversed(outer[1:])]+[(0,.045)]
save('erlenmeyer',[('GlassShell',lathe(flask,64),0),('RolledLip',torus(.306,.025,2.89,64),0)], [GLASS,WHITE])
bottle=[(0,0),(.31,0),(.345,.015),(.35,.05),(.35,.7),(.346,.75),(.32,.8),(.27,.85),(.21,.9),(.15,.93),(.13,.96),(.13,1.09),(.153,1.10),(.153,1.13),(.117,1.15),(.105,1.11),(.105,.96),(.18,.91),(.25,.85),(.31,.77),(.323,.72),(.323,.04),(0,.04)]
cap=[(0,1.14),(.155,1.14),(.166,1.16),(.166,1.25),(.15,1.28),(0,1.28)]
parts=[('GlassShell',lathe(bottle,48),0),('Cap',lathe(cap,48),1)]
for i in range(4):parts.append(('CapRidge'+str(i),torus(.166,.006,1.17+i*.02,48,6),1))
save('reagent-bottle',parts,[GLASS,RUBBER])
jar=[(0,0),(.34,0),(.38,.025),(.38,.63),(.392,.64),(.392,.66),(.355,.66),(.352,.62),(.352,.03),(0,.03)]
save('sample-jar',[('GlassShell',lathe(jar,48),0),('Cap',lathe([(0,.66),(.4,.66),(.408,.68),(.408,.76),(.38,.78),(0,.78)],48),1)],[GLASS,RUBBER])
beaker=[(0,0),(.43,0),(.48,.035),(.48,.96),(.485,1.0),(.5,1.04),(.472,1.045),(.452,1.0),(.452,.04),(0,.04)]
def spout(p,a,j):
    if 3<=j<=7:
        w=max(0,math.cos(a))**24;p[2]+=.14*w;p[1]-=.04*w
    return p
save('beaker',[('GlassShell',lathe(beaker,64,spout),0),('BaseRing',torus(.459,.015,.026),0)],[GLASS])
body=[(0,.56),(.062,.56),(.078,.66),(.09,.88),(.135,.98),(.15,1.20),(.155,1.6),(.145,1.78),(.09,1.85),(.08,2.04),(0,2.04)]
tip=[(0,0),(.008,0),(.02,.15),(.043,.45),(.06,.58),(.04,.59),(.022,.44),(.006,.1),(0,.1)]
button=[(0,2.01),(.08,2.01),(.09,2.16),(.12,2.16),(.12,2.22),(0,2.22)]
parts=[('Body',lathe(body,40),0),('DisposableTip',lathe(tip,32),1),('Plunger',lathe(button,32),2),('GripRing',torus(.155,.018,1.58,40),2),('FingerRest',lathe([(.08,1.86),(.25,1.86),(.25,1.9),(.08,1.9)],40),2)]
save('micropipette',parts,[WHITE,GLASS,TEAL])
