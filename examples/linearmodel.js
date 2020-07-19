export default async function () {
  let app = p6({
    container: "app",
    viewport: [400, 800],    
    padding: {left: 80, right: 20, top: 30, bottom: 60}
  })

  await app.train({
    $BabyWeightRegressor: {
      module: 'linear_model',
      method: 'LinearRegression',
      data: './data/babies-train.csv',
      // parameters: {max_depth: 3, random_state: 0},
      target: 'BabyWeight'
    }
  })
  
  // app2.data({url: './data/babies.csv'})
  app.data({url: '../p4/data/Nat2015result-200k.csv'})
    .analyze({
      PredictedWeight: '$BabyWeightRegressor',
    })
    .visualize({
      $rows: {
        $select: {
          model: '$BabyWeightRegressor',
          attribute: 'coef_',
          sort: 'desc',
          limit: 3
        },
        $transform: {
          $aggregate: {
            $group: '$select',
            $collect: {
              PredictedWeight: {$avg: 'PredictedWeight'},
              BabyWeight: {$avg: 'BabyWeight'}
            }
          }
        },
        mark: 'bar', markSpace: 0.2,
        x: '$select', height: 'BabyWeight',
        color: 'steelblue', opacity: 1
      }
    })
    .execute()
}
