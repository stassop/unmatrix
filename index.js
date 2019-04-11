import Unmatrix from './src/Unmatrix.js';

const el1 = document.querySelector('#el1');
const t1 = Unmatrix.getTransform(el1);
const t2 =
  `translate(${t1.translateX}px,${t1.translateY}px)
  rotate(${t1.rotate}deg)
  scale(${t1.scaleX},${t1.scaleY})
  skew(${t1.skew}deg)`
const el2 = document.querySelector('#el2');
// Apply #el1 transform to #el2
el2.style.transform = t2;
