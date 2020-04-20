export default function () {
  let app = p6({
    container: "app",
    viewport: [700, 600],
    padding: {left: 70, right: 30, top: 20, bottom: 50},
  })
  app
    .data({url: '../p4/data/Nat2015result-200k.csv', nrows: 10000})
    .view([
      {
        id: 'c1', width: 600, height: 360,
        padding: {left: 70, right: 30, top: 50, bottom: 50},
        gridlines: {x: true, y: true}
      },
      // {
      //   id: 'c1', width: 600, height: 360, offset: [600, 0],
      //   padding: {left: 70, right: 30, top: 50, bottom: 50},
      //   gridlines: {x: true, y: true}
      // }
    ])

  app.analyze([
      {
        AgglomerativeClustering: {
          distance_threshold: 2000,
          n_clusters: null,
          linkage: 'ward', out: 'clusters'
        }
      },
    ])
    .visualize({
      repeat: {$value: ['MotherAge', 'FatherAge']},
      transform: {
        aggregate: {
          $group: ['$value', 'clusters'],
          $collect: { AvgBabyWeight: {$avg: 'BabyWeight'}},
        },
        match: {
          $value: [18, 40],
          AvgBabyWeight: [6, 9]
        },
      },
      mark: 'spline',
      x: '$value', y: 'AvgBabyWeight',
      color: 'clusters', opacity: 1, size: 2
    })
    .execute()
}