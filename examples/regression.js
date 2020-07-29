export default async function () {
  /*
    This example shows how to use P6 to train a RandomForest regression model for prediction.
    The model is named "$BabyWeightRegressor", which uses the RandomForest method with parameters "{max_depth: 3, random_state: 0}".
    The RandomForest model can be used as an "analysis" operation. 
  */

  let app = p6()

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
    .match({
      BabyWeight: [6, 20]
    })

  app.layout({
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
    .visualize({
      c1: [
        { // show all predictions in a scatter plot
          mark: 'circle', size: 8,
          x: 'MotherWeight', y: 'PredictedWeight',
          color: 'steelblue', opacity: 'auto',
        },
        { // Use a red line to show the average predicted value over Mother Weight
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