const initColumns = [
  'BabyWeight',
  'MotherWeight',
  'MotherAge',
  'MotherHeight',
  'MotherWgtGain',
  'FatherAge'
]

export default async function () {
  let app = p6({
    container: "app",
    viewport: [1000, 800],
    padding: {left: 100, right: 30, top: 20, bottom: 50},
  })

  app.data({url: 'data/babies.csv'})
  app.analyze({ 
    ProjLeft:  {
      algorithm: 'SpectralEmbedding',
      n_components: 2,
      features: initColumns
    },

    ProjRight:  {
      algorithm: 'PCA',
      n_components: 2,
      features: initColumns
    },
  
    Clusters: {
      algorithm: 'KMeans',
      n_clusters: 3,
      features: initColumns
    }
  })
  .view({
    ChartLeft: {width: 500, height: 400, offset: [0, 0], gridlines: {x: true, y: true}},
    ChartRight: {width: 500, height: 400, offset: [500, 0], gridlines: {x: true, y: true}},
    ChartBottom: {width: 1000, height: 350, offset: [0, 400], padding: {left: 100, right: 30, top: 50, bottom: 50}}
  })
  .visualize({
    ChartLeft: {
      mark: 'circle',
      x: 'ProjLeft0',
      y: 'ProjLeft1',
      size: 10,
      color: 'Clusters',
      opacity: 0.5,
    },
    ChartRight: {
      mark: 'circle',
      x: 'ProjRight0',
      y: 'ProjRight1',
      size: 10,
      color: 'Clusters',
      opacity: 0.5,
    },
    ChartBottom: {
      mark: 'line',
      y: initColumns,
      color: 'Clusters',
      opacity: 0.25,
    }
  })
  .interact({
    event: 'brush',
    from: ['ChartLeft', 'ChartRight', 'ChartBottom'],
    response: {
      ChartLeft: {
        unselected: {color: 'gray', opacity: 0.3}
      },
      ChartRight: {
        unselected: {color: 'gray', opacity: 0.3}
      },
      ChartBottom: {
        unselected: {opacity: 0}
      },
    }
  }).execute()
}