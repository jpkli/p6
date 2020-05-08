import clustering from './clustering.js'
import regression from './regression.js'
import multiview from './multiview.js'
import triviewbrush from './triviewbrush.js'

import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/xcode.css';

hljs.registerLanguage('javascript', javascript);

let app = window.location.hash.slice(1)
let example = clustering

if (app === 'regression') {
  example = regression
} else if (app === 'multiview') {
  example = multiview
} else if (app === 'triviewbrush') {
  example = triviewbrush
} 

example()

let codeDiv = document.getElementById('codes')
let codes = example.toString().split('\n')
codes.shift()
codes.pop()
codeDiv.innerHTML = codes.join('\n')
  .replace(/ /g, '&nbsp;')
  .replace(/\n/g, '<br />')

hljs.highlightBlock(codeDiv);