
import p6 from './js/main';

var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this;

root.p6 = p6;

export default p6;

if(typeof module != 'undefined' && module.exports)
    module.exports = p6;
