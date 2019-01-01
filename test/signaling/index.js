import { isSafari } from '../test-util'

import './signal-messages.test'

if (isSafari()) {
  console.log('Safari :: skipping trickle-ice-candidates.test.js')
} else {
  require('./trickle-ice-candidates.test')
}
