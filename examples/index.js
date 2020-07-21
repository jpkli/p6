import clustering from './clustering.js'
import regression from './regression.js'
import multiview from './multiview.js'
import featuring from './featuring.js'
import linearmodel from './linearmodel.js'
import triviewbrush from './triviewbrush.js'

import gridsearch from './gridsearch.js'

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
} else if (app === 'featuring') {
  example = featuring
} else if (app === 'linearmodel') {
  example = linearmodel
} else if (app === 'gridsearch') {
  example = gridsearch
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