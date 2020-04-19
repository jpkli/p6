import {csvParse, autoType} from 'd3-dsv'
import p3 from 'p3.js'
export default async function () {
  let datafile = await fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')
  let csvTexts = await datafile.text()
  let data = csvParse(csvTexts, autoType)
  let columns = data.columns.slice(4)
  data = data.map(d => {return {dtype: 'ts', ...d}})
  
  const topCountries = ['China', 'Korea, South', 'Italy', 'Spain', 'Iran'];
  const lineColors = ['red', 'purple', 'green', 'yellow', 'steelblue', 'teal'];

  let result = p3.pipeline(data)
    .match({
      'Country/Region': {$in: topCountries}
    })
    .aggregate({
      $group: 'Country/Region',
      $collect: {
        includes: columns,
      }
    })
    .execute()

  // console.log(result)
  let timeSeries = {}
  topCountries.forEach(country => {

    let data = result.find(d => d['Country/Region'] === country)
    timeSeries[country] = columns.map(c => data[c])

  })
 
  // let timeSeries = columns.map(c => result[0][c])
  // let gradient = [0].concat(
  //     columns.slice(0, columns.length-1).map((c, i) => result[0][columns[i+1]] - result[0][c])
  // )

  timeSeries.date = columns
  console.log(timeSeries)
  let dtypes = {}
  Object.keys(timeSeries).forEach(k => {
    dtypes[k] = 'float'
  })

  dtypes.date = 'time'

  let app = p6({
    container: "app",
    viewport: [1000, 1000]
  })
  .view([{
      width: 1000, height: 400, 
      padding: {left: 100, right: 30, top: 50, bottom: 50},
      gridlines: {y: true}
    },
  ])

  app.data({
      json: timeSeries,
      schema: dtypes
    })
    .analyze([
      {CPD: {attribute: 'China', n: 3, method: 'Window', width: 5, gradient: false}}
    ])
    .visualize([
      {
        mark: 'spline',
        x: 'date',
        y: {columns: topCountries, colors: lineColors},
        size: 3,
        color: 'steelblue',
        opacity: 1
      }
    ])
    .annotate({
      mark: 'rule',
      size: 1,
      color: 'red',
      x: () => app.result('json').filter(d => d.CPD !== 0).map(d => new Date(d.date)),

    })
    .execute()
}