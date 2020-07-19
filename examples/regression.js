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