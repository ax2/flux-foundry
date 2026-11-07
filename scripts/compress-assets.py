"""Rebuild runtime WebP textures from retained originals (requires Pillow with WebP)."""
from pathlib import Path
import json, hashlib
from PIL import Image
root=Path(__file__).resolve().parent.parent
out=root/'src/assets';out.mkdir(exist_ok=True)
report={}
for name in ['arena','targets']:
 source=root/'art/source'/f'{name}.png';im=Image.open(source)
 # Atlas cells remain over 3× the rendered sprite size at DPR2; keep exact normalized bounds.
 if name=='targets':im=im.resize((1536,512),Image.Resampling.LANCZOS)
 target=out/f'{name}.webp';im.save(target,'WEBP',quality=90,method=6,exact=True)
 report[name]={'sourceBytes':source.stat().st_size,'bytes':target.stat().st_size,'width':im.width,'height':im.height,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
(root/'src/asset-manifest.ts').write_text('export const TEXTURE_BYTES='+json.dumps({k:v['bytes'] for k,v in report.items()})+' as const;\n',encoding='utf-8')
print(json.dumps(report,indent=2))
