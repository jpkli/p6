import p4 from 'p4';
import p3 from 'p3'
import axios from 'axios';
import {fetchFromUrl} from './numpyArrayLoader';

const analysisMethods = {
  clustering: ['KMeans', 'DBSCAN', 'AgglomerativeClustering'],
  decomposition: ['PCA', 'ICA', 'KernelPCA'],
  manifold: ['MDS', 'LocallyLinearEmbedding', 'Isomap']
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
  p6.dataProps = null
  p6.jsonData = null
  p6.dataSchema = null
  p6.metadata = null
  p6.analyses = []
  p6.dataFrame = []
  let pipeline = []
  p6.width = arg.viewport[0]
  p6.height = arg.viewport[1]
  p6.padding = arg.padding || {left: 0, right: 0, top: 0, bottom: 0}
  
  p4x.operations.forEach(ops => {
    p6[ops] = (params) => {
      if (ops === 'visualize' && params.repeat && Array.isArray(params.repeat.$value)) {
        let repeatedOpts = []
        p6.generateViews({
          count: params.repeat.$value.length,
          layout: params.repeat.layout,
          padding: p6.padding,
          gridlines: {y: true}
        })
       
        params.repeat.$value.forEach((value, vi) => {
          let opt = JSON.parse(
            JSON.stringify({ops, params: Object.assign({}, params)})
              .replace(/\$value/g, value)
          )
          delete opt.repeat
          opt.params.id = 'p6-view-' + vi
          if (opt.params.transform) {
            let extraOpts = Object.keys(opt.params.transform).map(ops => {
              return {ops, params: opt.params.transform[ops]}
            })
            repeatedOpts = repeatedOpts.concat(extraOpts)
          }
          repeatedOpts.push(opt)
        })
        
        pipeline = pipeline.concat(repeatedOpts)
        
        return p6
      }
      if (params.transform) {
        let extraOpts = Object.keys(params.transform).map(ops => {
          return {ops, params: params.transform[ops]}
        })
        pipeline = pipeline.concat(extraOpts)
      }
      pipeline.push({ops, params})
      
      return p6
    }
  })

  p6.interact = (spec) => {
    p4x.interact(spec)
    return p6
  }

  p6.view = (vp) => {
    p4x.view(vp)
    return p6
  }

  p6.generateViews = ({
    layout = 'rows',
    count = 1,
    padding = {left: 0, right: 0, top: 0, bottom: 0},
    gridlines = {x: false, y: false}
  }) => {
      let views = new Array(count)
      let calcOffset
      let height = p6.height
      let width = p6.width
      if (layout == 'rows') {
          height = height / count
          calcOffset = (index) => [0, index * height]
      } else {
          width = width / count
          calcOffset = (index) => [index * width, 0]
      }
      for (let i = 0; i < count; i++) {
          let offset = calcOffset(i)
          views[i] = {width, height, padding, offset, gridlines, id: 'p6-view-'+i}
      }
  
      return p6.view(views)
  }

  p6.result = p4x.result

  p6.data = (props) => {
    if (props.url) {
      p6.dataProps = props
    }
    if (props.json) {
      p6.jsonData = props.json
    }
    if (props.schema) {
      p6.dataSchema = props.schema
    }
    return p6
  }

  p6.preprocess = (opts) => {
    if (typeof opts === 'function') {
      p6.jsonData = opts(p6.jsonData)
    } else if (typeof opts === 'object') {
      let job = p3.pipeline(p6.jsonData)
      for (let opt of opts) {
        job[opt.slice(1)]
      }
      p6.jsonData = job.execute()
    }
  }

  p6.requestData = async (dataProps) => {
    let response = await axios.post('/api/data/request', dataProps)
    p6.metadata = response.data
    return p6.metadata
  }

  p6.download = async (format) => {
    await p6.requestData()
    let response = await axios.get('/api/data/' + format)
    return response.data
  }

  p6.upload = (data) => {
    return axios.post('/api/data/upload', {data})
  }

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


  p6.execute = async () => {
    if (p6.dataProps) {
      await p6.requestData(p6.dataProps)
    } else if (p6.jsonData) {
      await p6.upload(p6.jsonData)
    }
    
    let url = '/api/analysis/result?spec=' + JSON.stringify(p6.analyses)
    let analysisResults = await fetchFromUrl(url)
    let metadata = await axios.get('/api/analysis/metadata')
    let nColumns = analysisResults.shape[1]
    let nRows = analysisResults.shape[0]
    // console.log(metadata)
    let categories = metadata.data.categories
    let categoryAttrs = Object.keys(categories)
    let strValues = {}
    Object.keys(categories).forEach(col => {
      strValues[col] = {}
      categories[col].forEach((val, i) => {
        strValues[col][val] = i
      })
    })
    // console.log(categories, strValues)
    let cData = p4.cstore({strValues})
    for (let i = 0; i < nColumns; i++) {
      let rowData = analysisResults.data.slice(i * nRows, i * nRows + nRows)
      if (categoryAttrs.indexOf(metadata.data.columns[i]) !== -1) {
        // console.log(metadata.data.columns[i])
        rowData = Uint16Array.from(rowData)
      }
      cData.addColumn({
        data: rowData,
        dtype: 'float',
        name: metadata.data.columns[i]
      })
    }
    p6.dataFrame = cData.data()
    if (p6.dataSchema) {
      p6.dataFrame.schema = p6.dataSchema
    }
    
    let execution = p4x.data(p6.dataFrame)
    pipeline.forEach(p => {
      execution[p.ops](p.params)
    })
    
  }
  return p6
}