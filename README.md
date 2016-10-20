##Unmatrix

###About

Unmatrix is a jQuery plugin that decomposes a CSS transform matrix into 
intelligible values.

###Usage

```javascript
$(function() {
    var transforms = $(".transformed").unmatrix();
});
```

The plugin returns an array of objects if the browser supports transforms, or 
```false``` if it doesn't. Each item in the array can be either an empty 
object if the element has no transforms, or an object with the following 
properties: 
```rotate```, ```rotateX```, ```rotateY```, ```rotateZ```, ```scaleX```, 
```scaleY```, ```scaleZ```, ```skew```, ```skewX```, ```skewY```, 
```translateX```, ```translateY```, ```translateZ```. 

###Note

The plugin uses James Coglan's awesome library 
[Sylvester](http://sylvester.jcoglan.com/) with a few minor modifications, hence 
it's included with the rest of the code.

When interpolating between two matrices, each is decomposed into the corresponding 
translation, rotation, scale, skew and perspective values. Not all matrices can 
be accurately described by these values. Those that can't are decomposed into 
the most accurate representation possible. This technique works on a 4x4 
homogeneous matrix. For more information see 
[here](http://dev.w3.org/csswg/css3-transforms/).
