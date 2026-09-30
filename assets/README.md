# Laboratory assets

All assets are bundled locally; the app makes no runtime calls to an asset API.

## Original models

`models/*.glb`: original meshes authored for LaB, exported with
`scripts/model-assets.py` (Python + numpy). glTF 2.0, Y up, scene units.

- `erlenmeyer`: double wall, base thickness, rounded rolled lip.
- `reagent-bottle`: shoulder, inner wall, threaded neck and ridged removable cap.
- `sample-jar`: double wall, separate lid.
- `beaker`: double wall, pouring spout, base ring.
- `micropipette`: body, plunger, finger rest, grip ring and disposable tip.

These are educational visual models, not manufacturer CAD or calibrated glassware.
Original assets and exporter: MIT, see models/LICENSE.txt. Flask capacity is a virtual
100 mL; the bottom level is enlarged for visibility below about 5 mL. Graduations,
particle size, droplet count and liquid colors are illustrative.

## Photographic PBR maps

`textures/concrete-{color,roughness,normal}.jpg`: Poly Haven **Brushed Concrete**,
512 × 512 JPEG derivatives of the original 1K maps.

- Source: https://polyhaven.com/a/brushed_concrete
- Original maps: https://dl.polyhaven.org/file/ph-assets/Textures/jpg/1k/brushed_concrete/
- License: CC0 1.0, https://polyhaven.com/license
- CC0 deed: https://creativecommons.org/publicdomain/zero/1.0/
- Normal convention: OpenGL. Color map: sRGB; normal / roughness: linear.

Credit: Poly Haven. The maps are resized and compressed for browser use.

`vendor/GLTFLoader.js`: Three.js r128 official loader, MIT, same license as
`vendor/three.min.js` (see vendor/THREE-LICENSE.txt).
