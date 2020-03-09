(function () {
  console.log('start')
  let app = p6({
    container: "app",
    viewport: [1500, 600]
  })
  app.analyze(
  [
    { KernelPCA:  {n_components: 2, out: 'pca'} },
    { select: {columns: ['pca0', 'pca1']}},
    { KMeans: {n_clusters: 2, out: '3means'} },
    { KMeans: {n_clusters: 3, out: '4means'} },
  ])
  .view([
    {
      id: 'c1', width: 500, height: 500, 
      gridlines: {y: true},
      padding: {left: 100, right: 10, top: 50, bottom: 70},
    },
    {
      id: 'c2', width: 500, height: 500, 
      gridlines: {y: true},
      padding: {left: 100, right: 10, top: 50, bottom: 70},
      offset: [500, 0]
    }
  ])
  .visualize([
    {
      id: 'c1',
      mark: 'circle',
      x: 'pca0',
      y: 'pca1',
      size: 5,
      color: '3means',
      opacity: 0.5,
    },
    {
      id: 'c2',
      mark: 'circle',
      x: 'pca0',
      y: 'pca1',
      size: 5,
      color: '4means',
      opacity: 0.5,
    }
  ])
  .execute()
})()