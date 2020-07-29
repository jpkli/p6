export default async function () {

  /*
    This example uses two different dimension reduction methods to project a dataset on two different scatter plots.
    A parallel coordinates plot is used to show the original data items with color encoding the K-Means cluster result.
    User interactions are provided in all three charts for selecting and correlating data items.
  */

  const initColumns = [
    'BabyWeight', 'MotherWeight', 'MotherAge',
    'MotherHeight', 'MotherWgtGain', 'FatherAge'
  ]

  let app = p6()
    .data({url: 'data/babies.csv'})
    .analyze({ 
      ProjLeft:  {
        algorithm: 'SpectralEmbedding', n_components: 2, features: initColumns
      },
      ProjRight:  {
        algorithm: 'PCA', n_components: 2, features: initColumns
      },
      Clusters: {
        algorithm: 'KMeans', n_clusters: 3, features: initColumns
      }
    })

  app.layout({
      container: "app",
      viewport: [800, 650],
      padding: {left: 100, right: 30, top: 20, bottom: 50},
    })
    .view({
      ChartLeft: {width: 400, height: 350, offset: [0, 0], gridlines: {x: true, y: true}},
      ChartRight: {width: 400, height: 350, offset: [400, 0], gridlines: {x: true, y: true}},
      ChartBottom: {width: 800, height: 300, offset: [0, 350], padding: {left: 100, right: 30, top: 50, bottom: 20}}
    })
    .visualize({
      ChartLeft: {
        mark: 'circle', x: 'ProjLeft0', y: 'ProjLeft1', size: 10, color: 'Clusters', opacity: 0.5
      },
      ChartRight: {
        mark: 'circle', x: 'ProjRight0', y: 'ProjRight1', size: 10, color: 'Clusters', opacity: 0.5,
      },
      ChartBottom: {
        mark: 'line', y: initColumns, color: 'Clusters', opacity: 0.25,
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