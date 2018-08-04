const util = require('util')
const exec = util.promisify(require('child_process').exec)
const test = require('tape')

test('distribution version should use CommonJS module.exports syntax', async assert => {
  await exec('npm run build')

  const WebRTCPeer = require('../dist/')
  assert.is(WebRTCPeer.default, undefined, '.default is not added')
  assert.end()
})

test('WebRTC is not supported error is thrown when environment is Node.js', async assert => {
  await exec('npm run build')

  const WebRTCPeer = require('../dist/')

  try {
    const peer = new WebRTCPeer({ isInitiator: true }) // eslint-disable-line no-unused-vars
    assert.fail('WebRTCPeer constructor should throw an error when used in Node.js')
  } catch (err) {
    assert.is(err.message, 'WebRTC is not supported in this environment')
    assert.is(err.code, 'ERR_WEBRTC_SUPPORT')
    assert.end()
  }
})
