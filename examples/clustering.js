export default function () {
  let app = p6({
    container: "app",
    viewport: [800, 400],
    padding: {left: 80, right: 30, top: 30, bottom: 50},
  })

  app.data({url: 'data/babies.csv'})
    .view({
      c1: {
        width: 400, height: 400, 
        gridlines: {x: true, y: true}, 
        padding: {left: 70, right: 30, top: 50, bottom: 50}
      },
      c2: {
        width: 400, height: 400,
        offset: [400, 0], 
        gridlines: {x: true}}
    })

  app.analyze({
    clusters: {
      algorithm: 'KMeans',
      n_clusters: 4,
      features: ['BabyWeight', 'MotherWeight', 'MotherHeight', 'MotherWgtGain', 'MotherAge']
    },
    PC: {
      algorithm: 'PCA',
      n_components: 2,
      features: ['BabyWeight', 'MotherWeight', 'MotherHeight', 'MotherWgtGain', 'MotherAge'] 
    }
  })
  .visualize({
    c1: {
      mark: 'circle', size: 8,
      x: 'PC1', y: 'PC0',
      color: 'clusters', opacity: 0.5,
    },
    c2: {
      mark: 'bar',
      $transform: {
        $aggregate: {
          $group: 'clusters',
          $collect: { count: {$count: '*'} }
        }
      },
      y: 'clusters', width: 'count',
      color: 'clusters', opacity: 1,
    }
  })
  .interact({
      event: 'click',
      from: 'c2',
      response: {
        c1: { unselected: {color: 'gray'} },
        c2: { unselected: {opacity: 0.25} }
      }
    })
  .execute()
}