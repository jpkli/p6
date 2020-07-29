import clustering from './clustering.js'
import regression from './regression.js'

import featuring from './featuring.js'
import linearmodel from './linearmodel.js'
import triviewbrush from './triviewbrush.js'

import gridsearch from './gridsearch.js'

import hljs from 'highlight.js'
import javascript from 'highlight.js/lib/languages/javascript'
import 'highlight.js/styles/xcode.css';

hljs.registerLanguage('javascript', javascript);

const examples = [
  {id: 'clustering', module: clustering, name: 'Clustering'},
  {id: 'triviewbrush', module: triviewbrush, name: 'Comparing Dimension Reductions'},
  {id: 'regression', module: regression, name: 'Regression'},
  {id: 'linearmodel', module: linearmodel, name: 'Top Features'},
  {id: 'gridsearch', module: gridsearch, name: 'Grid Search'},
]

let exampleId = window.location.href.split('?').pop()

let example = clustering

if (exampleId) {
  let matchExample = examples.find(e => e.id === exampleId)
  if (matchExample) {
    example = matchExample.module
  }
}

console.log(exampleId)

example().then( () => {
  document.getElementById('page-loader').style.display = 'none'
})

let exampleList = document.getElementById('menu')
examples.forEach(ex => {
  let link = document.createElement('a')
  link.innerText = ex.name
  link.setAttribute('href', '?' + ex.id)
  if (exampleId === ex.id) {
    link.setAttribute('class', 'active')
  }
  exampleList.appendChild(link)
})

let codeDiv = document.getElementById('codes')
let codes = example.toString().split('\n')
codes.shift()
codes.pop()
codeDiv.innerHTML = codes.join('\n')
  .replace(/ /g, '&nbsp;')
  .replace(/\n/g, '<br />')

hljs.highlightBlock(codeDiv)
