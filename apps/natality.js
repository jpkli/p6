export default function () {
  let app = p6({
    container: "app",
    viewport: [1000, 800],
    padding: {left: 70, right: 30, top: 50, bottom: 50},
  })
  app
    .data({url: '../p4/data/Nat2015result-200k.csv', nrows: 50000})
    .view([
      {
        id: 'c1', width: 360, height: 360,
        padding: {left: 70, right: 30, top: 50, bottom: 50},
        gridlines: {x: true, y: true}
      },
      {
        id: 'c2', width: 360, height: 360, offset: [360, 0],
        padding: {left: 70, right: 30, top: 50, bottom: 50},
        gridlines: {y: true}
      },
    ])

  app
    .analyze([
      { KMeans: {n_clusters: 4,  out: 'kmeans'} },
      {
        PCA: {
          n_components: 2,
          in: ['BabyWeight', 'MotherWeight', 'MotherHeight', 'MotherWgtGain'],
          out: 'PCA'
        }
      },
    ])
    .visualize({
      id: 'c1', mark: 'circle',
      y: 'BabyWeight', x: 'MotherAge',
      size: 8, color: 'steelblue',
      opacity: 'auto',
    })

  app
    .match({
      MotherAge: [20, 40]
    })
    .aggregate({
      $group: ['MotherAge', 'kmeans'],
      $collect: { BabyWeight: {$var: 'BabyWeight'}, count: {$count: '*'} },
    })
    .visualize({
      id: 'c2', mark: 'spline',
      // append: true,
      x: 'MotherAge', y: 'count',
      color: 'kmeans', opacity: 1,
      zero: true
    })
    .interact({
      event: 'click',
      from: 'c2',
      response: {
        c1: { unselected: {color: 'gray'} },
        c2: { unselected: {opacity: 0.25} }
      }
    })
  
  app.execute()
}