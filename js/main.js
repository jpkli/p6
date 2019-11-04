import p4 from 'p4';
import axios from 'axios';
import numpyArray from './numpyArrayLoader';

export default function(arg = {}) {
  // let p4x = p4(arg);

  let p6 = {};
  let numpy =  numpyArray()
  p6.analyze = function (params) {
    console.log('analysis?spec=' + JSON.stringify(params))
    return numpy.get('analysis?spec=' + JSON.stringify(params))
  }

  return p6;
}