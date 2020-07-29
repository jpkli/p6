export default async function () {
  /*
    Train a linear regression model and use its coefficients to select the top three features. 
    Show the average prediction values over the top three features using three bar charts.
  */

  let app = p6()

  await app.train({
    $BabyWeightRegressor: {
      module: 'linear_model',
      method: 'LinearRegression',
      data: './data/babies-train.csv',
      scaling: 'StandardScaler',
      target: 'BabyWeight'
    }
  })

  app.data({url: './data/babies.csv'})
    .analyze({
      PredictedWeight: '$BabyWeightRegressor',
    })
    .layout({
      container: "app",
      viewport: [400, 600],    
      padding: {left: 80, right: 20, top: 30, bottom: 40}
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
        x: '$select', height: 'PredictedWeight',
        color: 'steelblue', opacity: 1
      }
    })
    .execute()
}
