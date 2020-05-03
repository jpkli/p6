import covid19 from './covid19/main'
import eva from './eva/main'

export default {eva, covid19}

var root = typeof self == 'object' && self.self === self && self ||
           typeof global == 'object' && global.global === global && global ||
           this

root.p6Apps = {eva, covid19}