import p4 from 'p4';
import axios from 'axios';
import {fetchFromUrl} from './numpyArrayLoader';

const analysisMethods = {
  clustering: ['KMeans', 'DBSCAN'],
  decomposition: ['PCA', 'ICA', 'KernelPCA'],
  manifold: ['MDS', 'LocallyLinearEmbedding']
}

let getMethodType = (methodName) => {
  let methodType = null
  Object.keys(analysisMethods).forEach(mt => {
    let methodIdx = analysisMethods[mt].indexOf(methodName)
    if (methodIdx !== -1) {
      methodType = mt
    }
  })
  return methodType
}

export default function(arg = {}) {
  let p4x = p4(arg)
  let p6 = {}
  p6.analyses = []
  p6.analyze = (methods) => {

    p6.analyses = methods.map(method => {
      let analysis = {}
      let methodName = Object.keys(method)[0]
      let methodType = getMethodType(methodName)
      if (methodType === null) {
        return method
      }
      analysis[methodType] = {methodName}
      if (method[methodName].in) {
        analysis[methodType].columns = method[methodName].in
        delete method[methodName].in
      }
      if (method[methodName].out) {
        analysis[methodType].out = method[methodName].out
        delete method[methodName].out
      }

      analysis[methodType].parameters = method[methodName]

      return analysis
    })

    return p6
  }

  p6.view = (vp) => {
    p4x.view(vp)
    return p6
  }
  let pipeline = []

  p4x.operations.forEach(ops => {
    console.log(ops)
    p6[ops] = (params) => {
      pipeline.push({ops, params})
      return p6
    }
  })

  p6.interact = (spec) => {
    p4x.interact(spec)
    return p6
  }

  p6.execute = async () => {
    console.log(p6.analyses)
    let url = '/api/analysis/result?spec=' + JSON.stringify(p6.analyses)
    let analysisResults = await fetchFromUrl(url)
    let metadata = await axios.get('/api/analysis/metadata')
    let nColumns = analysisResults.shape[1]
    let nRows = analysisResults.shape[0]
    console.log(metadata)
    let categories = metadata.data.categories
    let categoryAttrs = Object.keys(categories)
    let strValues = {}
    Object.keys(categories).forEach(col => {
      strValues[col] = {}
      categories[col].forEach((val, i) => {
        strValues[col][val] = i
      })
    })
    console.log(categories, strValues)
    let cData = p4.cstore({strValues})
    for (let i = 0; i < nColumns; i++) {
      let rowData = analysisResults.data.slice(i * nRows, i * nRows + nRows)
      if (categoryAttrs.indexOf(metadata.data.columns[i]) !== -1) {
        console.log(metadata.data.columns[i])
        rowData = Uint16Array.from(rowData)
      }
      cData.addColumn({
        data: rowData,
        dtype: 'float',
        name: metadata.data.columns[i]
      })
    }
    console.log(cData.data())
    let execution = p4x.data(cData.data())
    pipeline.forEach(p => {
      // console.log(p)
      execution[p.ops](p.params)
    })

  }

  return p6
}