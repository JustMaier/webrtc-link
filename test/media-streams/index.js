const { isSafari } = require('../test-util')

require('./add-stream.test')
require('./add-track.test')
require('./multiple-media-streams.test')
require('./constructor-media-stream.test')

if (isSafari()) {
  console.log('Safari :: skipping remove-stream.test.js and remove-track.test.js')
} else {
  require('./remove-stream.test')
  require('./remove-track.test')
}
