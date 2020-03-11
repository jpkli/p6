(function () {
  let app = p6({
    container: "app",
    viewport: [1000, 1000],
    padding: {left: 100, right: 30, top: 50, bottom: 50},
  })
  app.analyze([
    { LocallyLinearEmbedding:  {n_components: 2, method: 'modified', out: 'lle'} },
    { MDS:  {n_components: 2, max_iter: 50, out: 'MDS'} },
    // { select: {columns: ['mds0', 'mds1']}},
    { KMeans: {n_clusters: 3, in: ['lle0', 'lle1'], out: 'lle3means'} },
    { KMeans: {n_clusters: 3, in: ['MDS0', 'MDS1'], out: 'MDS3means'} },
  ])
  .view([
    {
      id: 'c1', width: 500, height: 500, 
    },
    {
      id: 'c2', width: 500, height: 500, 
      offset: [500, 0]
    },
    {
      id: 'c3', width: 1000, height: 500, 
      offset: [0, 500]
    },
  ])
  .visualize([
    {
      id: 'c1',
      mark: 'circle',
      x: 'lle0',
      y: 'lle1',
      size: 10,
      color: 'lle3means',
      opacity: 0.5,
    },
    {
      id: 'c2',
      mark: 'circle',
      x: 'MDS0',
      y: 'MDS1',
      size: 10,
      color: 'MDS3means',
      opacity: 0.5,
    },
    {
      id: 'c3',
      mark: 'line',
      y: ['BabyWeight', 'MotherWeight', 'MotherHeight', 'MotherWgtGain'],
      color: 'steelblue',
      opacity: '0.6',
    },
  ])
  .interact({
    "event": "brush",
    "from": ["c1", "c2", "c3"],
    "response": {
      "c1": {
        "unselected": {opacity: 0}
      },
      "c2": {
        "unselected": {opacity: 0}
      },
      "c3": {
        "unselected": {opacity: 0}
      },
    }
  })
  .execute()
})()