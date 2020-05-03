export default function () {
  let app = p6({
    container: "app",
    viewport: [600, 600],
    padding: {left: 80, right: 30, top: 30, bottom: 50},
  })

  app.train({
    // $BabyWeightRegressor1: {
    //   module: 'linear_model',
    //   method: 'LinearRegression',
    //   data: './Nat1k.csv',
    //   features: ['MotherWeight', 'MotherHeight', 'MotherWgtGain', 'MotherAge', 'MotherEdu', 'MotherRace'],
    //   target: 'BabyWeight'
    // },
    $BabyWeightRegressor1: {
      module: 'ensemble',
      method: 'RandomForestRegressor',
      data: './Nat1k.csv',
      parameters: {max_depth: 3, random_state: 0},
      target: 'BabyWeight'
    }
  }).then(res => {
    console.log(res)
    app
      .data({url: '../p4/data/Nat2015result-200k.csv', nrows: 20000})
      .view({
        c1: { width: 560, height: 560, gridlines: {x: true, y: true},  padding: {left: 60, right: 20, top: 30, bottom: 50},},
      })
    
    app.analyze({
      Predicted_Weight: '$BabyWeightRegressor',
    })
    .visualize({
      c1: [
        {
          mark: 'circle',
          x: 'MotherWeight', y: 'PredictedWeight',
          size: 8,
          color: 'steelblue', opacity: 'auto',
        },
        {
          $transform: {
            $aggregate: {
              $bin: 'MotherWeight',
              $collect: {
                Predicted_Weight: {$avg: 'PredictedWeight'}
              }
            }
          },
          mark: 'spline',
          append: 'true',
          x: 'MotherWeight', y: 'PredictedWeight',
          size: 3, color: 'red', opacity: 1
        }
      ]
    })
    .execute()
  })
}