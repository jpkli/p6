export const analysisMethods = {
  clustering: ['KMeans', 'DBSCAN', 'AgglomerativeClustering'],
  decomposition: ['PCA', 'ICA', 'KernelPCA'],
  manifold: ['MDS', 'LocallyLinearEmbedding', 'Isomap', 'SpectralEmbedding', 'TSNE']
}

export function getMethodType (methodName) {
  let methodType = null
  Object.keys(analysisMethods).forEach(mt => {
    let methodIdx = analysisMethods[mt].indexOf(methodName)
    if (methodIdx !== -1) {
      methodType = mt
    }
  })
  return methodType
}

export default function interpretAnalytics (specs) {
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
