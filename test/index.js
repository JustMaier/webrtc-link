// Required by Babel for async await syntax in tests.
import 'regenerator-runtime/runtime'

// Safari requires navigator.mediaDevices.getUserMedia to be called.
import './set-up-safari'

import './basic.test'
import './datachannel'
import './errors'
import './get-stats'
import './media-streams'
import './options'
import './signaling'