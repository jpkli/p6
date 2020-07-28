import generateViews from './view'

export default function (specs) {
  let pipeline = []
  let ops = 'visualize'

  Object.keys(specs).forEach(viewId => {      
    let params = Array.isArray(specs[viewId]) ? specs[viewId] : [specs[viewId]]
    params.forEach(param => {
      console.log(viewId)
      if (viewId === '$rows' || viewId === '$cols') {
        let repeatedOpts = []
        let forValues

        if (Array.isArray(param.$select)) {
          forValues = param.$select
        } else if (typeof param.$select === 'object') {
          let modelName = param.$select.model
          let attribute = param.$select.attribute
          let features =  this.metadata.models[modelName].features.map((name, index) => {
            let feature = {feature: name}
            feature[attribute] = this.metadata.models[modelName][attribute][index]
            return feature
          })
          
          if (param.$select.sort === 'asc') {
            features.sort((a, b) => a[attribute] - b[attribute])
          } else {
            features.sort((a, b) => b[attribute] - a[attribute])
          }

          let featureNames = features.map(f => f.feature)

          if (param.$select.limit) {
            featureNames = featureNames.slice(0, param.$select.limit)
          }
          forValues = featureNames
        }
        let views = generateViews({
          width: this.width,
          height: this.height,
          padding: this.padding,
          count: forValues.length,
          layout: viewId.slice(1),
          gridlines: {y: true}
        })
        console.log(views)
        this.view(views)

        forValues.forEach((value, vi) => {
          let optString = JSON.stringify({ops, params: Object.assign({}, param)})
            .replace(/\$select/g, value)

          let opt = JSON.parse(optString)

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
