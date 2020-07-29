import p4 from 'p4.js'
import p3 from 'p3.js'
import axios from 'axios'

import vis from './vis'
import analytics from './analytics'
import numpy from './numpy'

export default function(arg = false) {
  let p4x = {}
  let p6 = {}
  p6.pipeline = []
  p6.analyses = []
  p6.vis = []
  p6.dataProps = null
  p6.jsonData = null
  p6.dataSchema = null
  p6.metadata = null
  p6.client = null
  p6.dataFrame = null
  p6.operations = {}
  p6.variables = {}
  p6.spec = {
    analyses: {},
    vis: {}
  }
  p6.layout = (arg) => {
    p6.width = arg.viewport[0]
    p6.height = arg.viewport[1]
    p6.padding = arg.padding || {left: 0, right: 0, top: 0, bottom: 0}
    p4x = p4(arg)
    return p6
  }

  if (arg) {
    p6.layout(arg)
  }

  const interpretVis = vis.bind(p6)

  const interpretAnalytics = analytics.bind(p6)

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
      let pipeline = interpretVis(vis)
      pipeline.forEach(p => {
        p6.client[p.ops](p.params)
      })
      target[property] = value
      return true
    }
  };

  p4.operations.forEach(ops => {
    p6[ops] = (spec) => {
      let params = Object.assign({}, spec)
      if (ops === 'visualize') {
        p6.spec.vis = spec
        if (typeof params === 'object' && !params.id && !params.repeat) {
          Object.keys(params).map(viewId => {
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
    let views = Object.keys(viewSpec)
      .filter(k => k !== '$layout')
      .map(k => { return {id: k, ...viewSpec[k]}})
    if (viewSpec.$layout) {
      p6.layout(viewSpec.$layout)
    }
    p4x.view(views)
    return p6
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
    console.log(p6.metadata)
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
    let jobs = trainSpec.map(spec => axios.post('/analysis/train', spec))
    return Promise.all(jobs)
  }

  p6.gridSearch = (specs) => {
    let trainSpec = Object.keys(specs).map(k => {
      return {id: k, ...specs[k]}
    })
    console.log(trainSpec)
    let jobs = trainSpec.map(spec => axios.post('/analysis/gridsearch', spec))
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

  p6.execute = async (spec) => {
    if (p6.dataProps) {
      await p6.requestData(p6.dataProps)
    } else if (p6.jsonData) {
      await p6.upload(p6.jsonData)
    }
    let analysisSpec = spec || p6.spec.analyses
    let analyses = interpretAnalytics(analysisSpec)

    let url = '/analysis/result?spec=' + JSON.stringify(analyses)
    let analysisResults = await numpy.fetchFromUrl(url)
    let metadata = await axios.get('/analysis/metadata')
    let nColumns = analysisResults.shape[1]
    let nRows = analysisResults.shape[0]

    let categories = metadata.data.categories
    let categoryAttrs = Object.keys(categories)
    let strValues = {}
    Object.keys(categories).forEach(col => {
      strValues[col] = {}
      categories[col].forEach((val, i) => {
        strValues[col][val] = i
      })
    })

    let cData = p4.cstore({strValues})
    for (let i = 0; i < nColumns; i++) {
      let rowData = analysisResults.data.slice(i * nRows, i * nRows + nRows)
      if (categoryAttrs.indexOf(metadata.data.columns[i]) !== -1) {
        rowData = Uint16Array.from(rowData)
      }
      cData.addColumn({
        data: rowData,
        dtype: 'float',
        name: metadata.data.columns[i]
      })
    }
 
    let GpuDataFrame = cData.data()
    if (p6.dataSchema) {
      GpuDataFrame.schema = p6.dataSchema
    }
    if (p6.dataFrame === null) {
      p6.client = p4x.data(GpuDataFrame)
    } else {
      p6.client = p4x.replaceData(GpuDataFrame)
    }
    p6.dataFrame = GpuDataFrame
    let pipeline = interpretVis(p6.spec.vis).concat(p6.pipeline)
    pipeline.forEach(p => {
      p6.client[p.ops](p.params)
    })
  }

  p6.parameters = function (variables) {
    Object.assign(p6.variables, variables)
    return p6
  }

  return p6
}
