export default async function () {
  let app = p6({
    container: "app",
    viewport: [1200, 400],    
    padding: {left: 90, right: 20, top: 30, bottom: 50}
  })

  await app.train({
    $BabyWeightRegressor: {
      module: 'ensemble',
      method: 'RandomForestRegressor',
      data: './data/babies-train.csv',
      parameters: {max_depth: 3, random_state: 0},
      target: 'BabyWeight'
    }
  })
  
  app.data({url: './data/babies.csv'})
    .analyze({
      PredictedWeight: '$BabyWeightRegressor',
    })
    .visualize({
      $cols: {
        $select: {
          model: '$BabyWeightRegressor',
          attribute: 'feature_importances_',
          sort: 'desc',
          limit: 3
        },
        mark: 'circle', size: 6,
        x: '$select', y: 'PredictedWeight',
        color: 'steelblue', opacity: 0.33
      }
    })
    .execute()
    // app.visualize({
    //   $rows: {
    //     $select: {
    //       model: '$BabyWeightRegressor',
    //       attribute: 'feature_importances_',
    //       sort: 'desc',
    //       limit: 3
    //     },
    //     $transform: {
    //       $aggregate: {
    //         $bin: '$select',
    //         $collect: {
    //           PredictedWeight: {$avg: 'PredictedWeight'}
    //         }
    //       }
    //     },
    //     mark: 'bar', size: 6,
    //     x: '$select', height: 'PredictedWeight',
    //     color: 'steelblue', opacity: 0.33
    //   }
    // })
    // .execute()

}
