export default async function () {
  let app = p6({
    container: "app",
    viewport: [500, 500]    
  })
  .view({
    c1: {
      width: 500, height: 500, 
      gridlines: {x: true, y: true},
      padding: {left: 60, right: 20, top: 30, bottom: 50}
    }
  })

  await app.gridSearch({
    $BabyWeightRegressor: {
      module: 'ensemble',
      method: 'RandomForestRegressor',
      data: './data/babies-train.csv',
      target: 'BabyWeight',
      parameters: {
        param_grid: {
          n_estimators: [10, 20, 40, 60],
          max_depth: [3, 4, 5, 6, 8]
        },
        cv: 5,
        scoring: 'r2'
      }
    }
  })
  
  // app.data({url: './data/babies.csv'})
  app.data({url: '../p4/data/Nat2015result-200k.csv'})
    .analyze({
      PredictedWeight: '$BabyWeightRegressor',
    })
    .visualize({
      c1: [
        {
          mark: 'circle', size: 8,
          x: 'MotherWeight', y: 'PredictedWeight',
          color: 'steelblue', opacity: 'auto',
        },
        {
          $transform: {
            $aggregate: {
              $bin: 'MotherWeight',
              $collect: {
                PredictedWeight: {$avg: 'PredictedWeight'}
              }
            }
          },
          append: 'true',
          mark: 'spline', size: 3,
          x: 'MotherWeight', y: 'PredictedWeight',
          color: 'red', opacity: 1
        }
      ]
    })
    .execute()
}