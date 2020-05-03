const initColumns = [
  'BabyWeight',
  'MotherWeight',
  'MotherAge',
  'MotherHeight',
  'MotherWgtGain',
  'FatherAge'
]

export default async function () {
  let app = p6({
    container: "app",
    viewport: [1000, 800],
    padding: {left: 100, right: 30, top: 20, bottom: 50},
  })

  app.data({url: 'data/babies.csv'})
  app.analyze({ 
    ProjLeft:  {
      algorithm: 'SpectralEmbedding',
      n_components: 2,
      features: initColumns
    },

    ProjRight:  {
      algorithm: 'PCA',
      n_components: 2,
      features: initColumns
    },
  
    Clusters: {
      algorithm: 'KMeans',
      n_clusters: 3,
      features: initColumns
    }
  })
  .view({
    ChartLeft: {width: 500, height: 400, offset: [0, 0], gridlines: {x: true, y: true}},
    ChartRight: {width: 500, height: 400, offset: [500, 0], gridlines: {x: true, y: true}},
    ChartBottom: {width: 1000, height: 350, offset: [0, 400], padding: {left: 100, right: 30, top: 50, bottom: 50}}
  })
  .visualize({
    ChartLeft: {
      mark: 'circle',
      x: 'ProjLeft0',
      y: 'ProjLeft1',
      size: 10,
      color: 'Clusters',
      opacity: 0.5,
    },
    ChartRight: {
      mark: 'circle',
      x: 'ProjRight0',
      y: 'ProjRight1',
      size: 10,
      color: 'Clusters',
      opacity: 0.5,
    },
    ChartBottom: {
      mark: 'line',
      y: initColumns,
      color: 'Clusters',
      opacity: 0.25,
    }
  })
  .interact({
    event: 'brush',
    from: ['ChartLeft', 'ChartRight', 'ChartBottom'],
    response: {
      ChartLeft: {
        unselected: {color: 'gray', opacity: 0.3}
      },
      ChartRight: {
        unselected: {color: 'gray', opacity: 0.3}
      },
      ChartBottom: {
        unselected: {opacity: 0}
      },
    }
  })
  
  await app.execute()

  $('#data-attributes').append(
    app.metadata.columns.map((col, i) => {
      if (initColumns.indexOf(col) !== -1) {
        return `<div><input type="checkbox" checked="checked" name="data-attributes" value="${col}" /> ${col}</div>`
      }
      return `<div><input type="checkbox"name="data-attributes" value="${col}" /> ${col}</div>`
    })
  )

  setupUI(app)
}

function setupUI (app) {
  const DimensionReductionMethod = ['PCA','KernelPCA', 'MDS', 'LocallyLinearEmbedding', 'Isomap', 'SpectralEmbedding', 'TSNE']
  const panels =  ['ProjLeft', 'ProjRight']
  panels.forEach(side => {
    $('#'+side).append(
      DimensionReductionMethod.map(m => '<a class="dropdown-item" href="#">' + m + '</a>')
    )
    $('#' + side + ' > .dropdown-item').click(function() {
      let method = $(this).text()
      $('#' + side + '-value').html(method)
      app.analyses[side].algorithm = method
    })
  })
  $('.dropdown-toggle').dropdown()

  $('#update-pipeline').click((evt) => {
    let features = []
    $('#data-attributes input[type="checkbox"]:checked').each(function() {
      features.push($(this).val())
    })
    app.analyses.ProjLeft.includes = features
    // app.analyses.ProjRight.includes = features
    app.vis.ChartBottom.y = features
  })

}