import p4 from 'p4.js';
import p3 from 'p3.js'
import axios from 'axios';
import {fetchFromUrl} from './numpyArrayLoader';
import {csvParse, autoType} from 'd3-dsv'

const analysisMethods = {
  clustering: ['KMeans', 'DBSCAN', 'AgglomerativeClustering'],
  decomposition: ['PCA', 'ICA', 'KernelPCA'],
  manifold: ['MDS', 'LocallyLinearEmbedding', 'Isomap', 'SpectralEmbedding', 'TSNE']
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
  p6.pipeline = []
  p6.dataProps = null
  p6.jsonData = null
  p6.dataSchema = null
  p6.metadata = null
  p6.analyses = []
  p6.vis = []
  p6.client = null
  p6.dataFrame = null
  p6.operations = {}
  p6.spec = {
    analyses: {},
    vis: {}
  }
  p6.width = arg.viewport[0]
  p6.height = arg.viewport[1]
  p6.padding = arg.padding || {left: 0, right: 0, top: 0, bottom: 0}
  
  const reactiveAnalysisHandler = {
    get: function(target, property) {
      return target[property];
    },
    set: function(target, property, value) {
      console.log(target, property, value)
      p6.spec.analyses[target.id][property] = value
      // let analysis = {}
      // analysis[target.id] = p6.spec.analyses[target.id]
      console.log(p6.spec.analyses)
      p6.execute()
      target[property] = value
      return true
    }
  };

  const reactiveVisHandler = {
    get: function(target, property) {
      return target[property]
    },
    set: function(target, property, value) {
      p6.spec.vis[target.id][property] = value
      let vis = {}
      vis[target.id] = p6.spec.vis[target.id]
      let pipeline = setupVis(vis)
      pipeline.forEach(p => {
        p6.client[p.ops](p.params)
      })
      target[property] = value
      return true
    }
  };

  p4x.operations.forEach(ops => {
    p6[ops] = (spec) => {
      let params = Object.assign({}, spec)
      if (ops === 'visualize') {
        p6.spec.vis = spec
        if (typeof params === 'object' && !params.id && !params.repeat) {
          Object.keys(params).map(viewId => {
            // console.log(viewId)
            p6.vis[viewId] = new Proxy(
              {id: viewId, ...params[viewId]},
              reactiveVisHandler
            )
          })

          params = Object.keys(params).map(k => {
            if (Array.isArray(params[k])) {
              return params[k].map(param => {
                return {id: k, ...param}
              })
            }
            return {id: k, ...params[k]}
          })
          
        }
      } else {
        p6.pipeline.push({ops, params: spec})
      }
      return p6
    }
  })

  p6.interact = (spec) => {
    p4x.ctx.interactions = []
    p4x.interact(spec)
    return p6
  }

  p6.view = (viewSpec) => {
    let views = Object.keys(viewSpec).map(k => { return {id: k, ...viewSpec[k]}})
    p4x.view(views)
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
    if (props.url && props.url.slice(0,4) !== 'http') {
      p6.dataProps = props
    }
    if (props.json) {
      p6.jsonData = props.json
    }
    if (props.schema) {
      p6.dataSchema = props.schema
    }
    // if (props.format && props.url) {
    //   let rawData = await fetch(props.url)
    //   if (props.format === 'csv') {
    //     let csvTexts = await rawData.text()
    //     p6.jsonData = csvParse(csvTexts, autoType)
    //   } else {
    //     p6.jsonData = await rawData.json()
    //   }
    // }
    if (props.schema) {
      p6.dataSchema = props.schema
    }
    
    return p6
  }

  p6.preprocess = (opts) => {
    if (typeof opts === 'function') {
      const {schema, data} = opts(p6.jsonData)
      p6.jsonData = data
      p6.dataSchema = schema
    } else if (typeof opts === 'object') {
      let job = p3.pipeline(p6.jsonData)
      for (let opt of opts) {
        job[opt.slice(1)]
      }
      p6.jsonData = job.execute()
    }
    return p6
  }

  p6.requestData = async (dataProps) => {
    let response = await axios.post('/data/request', dataProps)
    p6.metadata = response.data
    return p6.metadata
  }

  p6.download = async (format) => {
    await p6.requestData()
    let response = await axios.get('/data/' + format)
    return response.data
  }

  p6.upload = (data) => {
    return axios.post('/data/upload', {data})
  }

  p6.train = (specs) => {
    let trainSpec = Object.keys(specs).map(k => {
      return {id: k, ...specs[k]}
    })
    // console.log(trainSpec)
    let jobs = trainSpec.map(spec => axios.post('/analysis/train', spec))
    return Promise.all(jobs)
  }

  p6.analyze = (specs) => {
    p6.spec.analyses = specs
    Object.keys(specs).map(outputKey => {
      p6.analyses[outputKey] = new Proxy(
        {id: outputKey, ...specs[outputKey]},
        reactiveAnalysisHandler
      )
    })
    return p6
  }

  p6.plot = (spec) => {
    p4x.visualize(spec)
    return p6
  }

  const setupAnalytics = (specs) => {
    return Object.keys(specs).map(outputKey => {
      let analysis = {}
      if (typeof specs[outputKey] === 'string') {
        // console.log(specs[outputKey])
        analysis[specs[outputKey]] = {out: outputKey}
      } else {
        let spec = Object.assign({}, specs[outputKey])
        let methodName = spec.technique || spec.algorithm
        let methodType = getMethodType(methodName)
        if (methodType === null) {
          methodType = methodName
          analysis[methodType] = spec
        } else {
          analysis[methodType] = {methodName}
          analysis[methodType].parameters = spec

        }
        if (spec.features) {
          analysis[methodType].columns = spec.features
          delete spec.features
        }
        delete spec.technique
        delete spec.algorithm
        analysis[methodType].out = outputKey
      }
      return analysis
    })
  }

  const setupVis = (specs) => {
    let pipeline = []
    let ops = 'visualize'
    Object.keys(specs).forEach(viewId => {      
      let params = Array.isArray(specs[viewId]) ? specs[viewId] : [specs[viewId]]
      params.forEach(param => {
        if (viewId === '$forEach' && Array.isArray(param.$value)) {
          let repeatedOpts = []
          p6.generateViews({
            count: param.$value.length,
            layout: param.layout,
            padding: p6.padding,
            gridlines: {y: true}
          })

          param.$value.forEach((value, vi) => {
            let opt = JSON.parse(
              JSON.stringify({ops, params: Object.assign({}, param)})
              .replace(/\$value/g, value)
            )
            delete opt.repeat
            opt.params.id = 'p6-view-' + vi
            if (opt.params.$transform) {
              let extraOpts = Object.keys(opt.params.$transform).map(ops => {
                let optName = ops[0] === '$' ? ops.slice(1) : ops
                return {ops: optName, params: opt.params.$transform[ops]}
              })
              repeatedOpts = repeatedOpts.concat(extraOpts)
            }
            repeatedOpts.push(opt)
          })
          pipeline = pipeline.concat(repeatedOpts)
          
        } else if (param.$transform) {
          let extraOpts = Object.keys(param.$transform).map(ops => {
            let optName = ops[0] === '$' ? ops.slice(1) : ops
            return {ops: optName, params: param.$transform[ops]}
          })
          pipeline = pipeline.concat(extraOpts)
          let props = {id: viewId, ...param}
          pipeline.push({ops, params: props})

        } else {
          let props = {id: viewId, ...param}
          pipeline.push({ops, params: props})
        }
      })
      
    })
    return pipeline
  }

  p6.execute = async (spec) => {
    if (p6.dataProps) {
      await p6.requestData(p6.dataProps)
    } else if (p6.jsonData) {
      await p6.upload(p6.jsonData)
    }
    let analysisSpec = spec || p6.spec.analyses
    let analyses = setupAnalytics(analysisSpec)
    // console.log(analyses)
    let url = '/analysis/result?spec=' + JSON.stringify(analyses)
    let analysisResults = await fetchFromUrl(url)
    let metadata = await axios.get('/analysis/metadata')
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
 
    let GpuDataFrame = cData.data()
    // console.log(GpuDataFrame)
    if (p6.dataSchema) {
      GpuDataFrame.schema = p6.dataSchema
    }
    if (p6.dataFrame === null) {
      p6.client = p4x.data(GpuDataFrame)
    } else {
      p6.client = p4x.replaceData(GpuDataFrame)
    }
    p6.dataFrame = GpuDataFrame
    let pipeline = setupVis(p6.spec.vis).concat(p6.pipeline)
    // console.log(pipeline)
    pipeline.forEach(p => {
      p6.client[p.ops](p.params)
    })
    // pipeline = []
  }
  return p6
}