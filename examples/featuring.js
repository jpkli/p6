export default async function () {
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
    .layout({
      container: "app",
      viewport: [1200, 400],    
      padding: {left: 90, right: 20, top: 30, bottom: 50}
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
}
