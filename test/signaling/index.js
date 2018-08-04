import BrowserDetector from 'bowser'

import './signal-messages.test'

if (BrowserDetector.safari) {
  console.log('Safari :: skipping trickle-ice-candidates.test.js')
} else {
  require('./trickle-ice-candidates.test')
}
