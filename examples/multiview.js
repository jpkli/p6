export default function () {
  let app = p6({
    container: "app",
    viewport: [600, 600],
    padding: {left: 80, right: 30, top: 30, bottom: 50},
  })

  app.data({url: '../p4/data/Nat2015result-200k.csv', nrows: 10000})

  app.analyze({
      clusters: {
        algorithm: 'AgglomerativeClustering',
        distance_threshold: 2000,
        n_clusters: null,
        linkage: 'ward'
      }
    })
    .visualize({
      $rows: {
        $select: ['MotherAge', 'FatherAge'],
        $transform: {
          $aggregate: {
            $group: ['$select', 'clusters'],
            $collect: { AvgBabyWeight: {$avg: 'BabyWeight'}},
          },
          $match: {
            $select: [18, 40],
            AvgBabyWeight: [6, 9]
          },
        },
        mark: 'spline',
        x: '$select', y: 'AvgBabyWeight',
        color: 'clusters', opacity: 1, size: 2
      }
    })
    .execute()
}