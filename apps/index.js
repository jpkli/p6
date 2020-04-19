import natality from './natality.js'
import covid19 from './covid19.js'

let app = window.location.hash.slice(1)

if (app === 'natality') {
  natality()
} else if (app === 'covid19') {
  covid19()
}