export default function generateViews({
  width,
  height,
  layout = 'rows',
  count = 1,
  padding = {left: 0, right: 0, top: 0, bottom: 0},
  gridlines = {x: false, y: false}
}) {
  let views = new Array(count)
  let calcOffset
  if (layout == 'rows') {
    height = height / count
    calcOffset = (index) => [0, index * height]
  } else {
    width = width / count
    calcOffset = (index) => [index * width, 0]
  }
  for (let i = 0; i < count; i++) {
    let offset = calcOffset(i)
    views[i] = {width, height, padding, offset, gridlines, id: 'p6-view-'+i}
  }
  return views
}
