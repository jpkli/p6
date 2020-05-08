import {csvParse, autoType} from 'd3-dsv'
import p3 from 'p3.js'
import {vis} from 'p3.js'
import countryAlias from './alias.json'
import countries from './countries.json'

const countryNames = countries.map(c => c.name)
let clean = row => countryNames.indexOf(row['country']) !== -1

const topCountries = ['China', 'Korea, South', 'Italy', 'Spain', 'Iran', 'US'];
const lineColors = ['red', 'purple', 'green', 'orange', 'teal', 'steelblue', 'black'];

export default async function () {
  let datafile = await fetch('https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_global.csv')
  let csvTexts = await datafile.text()
  let data = csvParse(csvTexts, autoType)

  let app = p6({
    container: "app",
    viewport: [1320, 1000]
  })
  .view({
    lineChart: {
      width: 1320, height: 320, 
      padding: {left: 125, right: 30, top: 30, bottom: 50},
      gridlines: {y: true}
    },
  })  

  app.data({json: data})
    .preprocess(rawData => {
      let data = rawData.map(d => {return {dtype: 'ts', ...d}})
      let columns = rawData.columns.slice(4)
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
      let schema = {}
      Object.keys(timeSeries).forEach(k => {
        schema[k] = 'float'
      })
    
      let sum = p3.pipeline(result.map(d => {return {type: 'ts', ...d}}))
        .aggregate({
          $group: 'type',
          $collect: {
            includes: columns,
          }
        })
        .execute()
      
      timeSeries['World'] = columns.map(c => sum[0][c])
      topCountries.push('World')
      schema.date = 'time'
      return {
        data: timeSeries,
        schema,
      }
    })
    .analyze({
      ChangePoints: {
        algorithm: 'CPD', attribute: 'World', 
        n: 4, method: 'Window', width: 5
      }
    })
    .visualize({
      lineChart: {
        mark: 'spline',
        size: 2,
        opacity: 1,
        color: 'steelblue',
        x: 'date',
        y: {columns: topCountries, colors: lineColors},
        exponent: 0.5
      }
    })
    .annotate({
      id: 'lineChart',
      mark: 'rule',
      size: 1,
      color: 'red',
      x: () => {
        return app.result('json').filter(d => d.ChangePoints !== 0).map(d => new Date(d.date))
      },
    })
    
    await app.execute()

    let dates = app.result('json').filter(d => d.ChangePoints !== 0).map(d => d.date)
    dates.forEach(date => {
      let columns = data.columns.slice(4)
      let current = columns.indexOf(date)
      let previous = columns[current - 1]
      let countryData = p3.pipeline(
        data.map(row => {
          if (countryAlias[row['Country/Region']]) {
            row['Country/Region'] = countryAlias[row['Country/Region']]
          }
          return {
            province: row['Province/State'],
            country: row['Country/Region'],
            lat: row.Lat,
            lng: row.Long,
            confirmed: row[date],
            change: row[date] - row[previous]
          }
        })
        .filter(clean)
        )
        .aggregate({
          $group: 'country',
          $collect: {
            confirmed: {$sum: 'confirmed'},
            change: {$sum: 'change'},
            lat: {$avg: 'lat'},
            lng: {$avg: 'lng'}
          }
        }).execute()

        let input = {
          json: countryData,
          join: {
            field: 'country',
            type: 'name'
          },
          vmap: { color: 'confirmed' }
        }
        let container = document.createElement('div')
        document.getElementById('plots').appendChild(container)
        let view = {
          container,
          width: 338,
          height: 220,
          scale: 60,
          projection: 'Mercator',
          colorMap: 'interpolateReds',
          defaultColor: '#ddd',
        }

        new vis.GeoMap(input, view).render()
      })
}