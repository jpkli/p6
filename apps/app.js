(function () {
  p6().analyze({
    $group: ['a', 'b']
  }).then(res => {
    console.log(res)
  })
})()