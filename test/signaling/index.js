const { isSafari } = require('../test-util')

require('./signal-messages.test')

if (isSafari()) {
  console.log('Safari :: skipping trickle-ice-candidates.test.js')
} else {
  require('./trickle-ice-candidates.test')
}
