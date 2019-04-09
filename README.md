# Unmatrix

Unmatrix is a JS module that decomposes a transform matrix to the original values.

`Unmatrix.getTransform()`
returns `null` if no transform is found, or an object with properties
`rotateX`, `rotateY`, `rotateZ`, `scaleX`, `scaleY`, `scaleZ`,
`skewX`, `skewY`, `translateX`, `translateY`, `translateZ`.

### Example

```javascript
import Unmatrix from './src/Unmatrix.js';
const element = document.querySelector('#myElement');
const transform = Unmatrix.getTransform(element);
```

### Notes

Unmatrix uses James Coglan's awesome library
[Sylvester](http://sylvester.jcoglan.com/),
so it has to be available for the Unmatrix module to import.
This demo uses
[sylvester-es6](https://www.npmjs.com/package/sylvester-es6)
npm module.

When interpolating between two matrices, each is decomposed into the
corresponding translation, rotation, scale, skew and perspective values.
Not all matrices can be accurately described by these values.
Those that can't are decomposed into the most accurate representation possible.
This technique works on a 4x4 homogeneous matrix. For more information see
[here](https://drafts.csswg.org/css-transforms-1/#decomposing-a-2d-matrix) and
[here](https://drafts.csswg.org/css-transforms-2/#decomposing-a-3d-matrix)
