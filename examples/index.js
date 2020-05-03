import clustering from './clustering.js'
import regression from './regression.js'
import multiview from './multiview.js'

import hljs from 'highlight.js/lib/highlight'
import javascript from 'highlight.js/lib/languages/javascript'

hljs.registerLanguage('javascript', javascript);


let app = window.location.hash.slice(1)

if (app === 'regression') {
  regression()
} else if (app === 'multiview') {
  multiview()

} else {
  clustering()
  console.log(clustering.toString())
}