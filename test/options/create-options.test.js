import test from 'tape'

import createOptions from '../../src/create-options'

test('default options are set when none are defined', assert => {
  // given
  const inputs = [
    {},
    null,
    undefined,
    { streams: [] },
    { dataChannelConfig: {}, isInitiator: false }
  ]
  const expectedOptions = {
    dataChannelConfig: {},
    isInitiator: false,
    isTrickleIceEnabled: true,
    peerConnectionConfig: {
      iceServers: []
    },
    streams: []
  }

  inputs.forEach(function (userOptions) {
    // when
    const result = createOptions(userOptions)

    // exclude functions from equality check.
    assert.is(typeof result.sdpTransformer, 'function')
    delete result.sdpTransformer

    assert.deepEqual(result, expectedOptions)
  })
  assert.end()
})

test('default options are overriden', assert => {
  // given
  const sdpTransformer = sdp => sdp
  const inputOptions = {
    dataChannelConfig: {
      ordered: true
    },
    isInitiator: true,
    isTrickleIceEnabled: false,
    peerConnectionConfig: {
      iceServers: [{ urls: 'stun:astunserverurl.com:2018' }],
      peerIdentity: 'a peer identifier'
    },
    sdpTransformer: sdpTransformer,
    streams: []
  }

  // when
  const result = createOptions(inputOptions)

  // then
  const expectedOptions = {
    dataChannelConfig: {
      ordered: true
    },
    isInitiator: true,
    isTrickleIceEnabled: false,
    peerConnectionConfig: {
      iceServers: [{ urls: 'stun:astunserverurl.com:2018' }],
      peerIdentity: 'a peer identifier'
    },
    sdpTransformer: sdpTransformer,
    streams: []
  }
  assert.deepEqual(result, expectedOptions)
  assert.end()
})
