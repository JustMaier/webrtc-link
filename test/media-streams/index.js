import { isSafari } from '../test-util'

import './add-stream.test'
import './add-track.test'
import './multiple-media-streams.test'
import './constructor-media-stream.test'

if (isSafari()) {
  console.log('Safari :: skipping remove-stream.test.js and remove-track.test.js')
} else {
  require('./remove-stream.test')
  require('./remove-track.test')
}
