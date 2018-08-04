import test from 'tape'

import * as testErrorCodes from './test-error-codes'
import testUtil from '../test-util'
import WebRTCPeer from '../../src/'

test('constructor throws an error when WebRTC is not supported', assert => {
  // given
  const RTCPeerConnectionReference = window.RTCPeerConnection
  window.RTCPeerConnection = undefined

  // when
  const err = tryCatch(() => new WebRTCPeer({ isInitiator: true }))

  // then
  assert.true(isError(err))
  assert.is(err.code, testErrorCodes.WEBRTC_SUPPORT)
  assert.is(err.message, 'WebRTC is not supported in this browser')
  window.RTCPeerConnection = RTCPeerConnectionReference
  assert.end()
})

test('signal throws an error when called after peer has been destroyed', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()

  peerOne.on('signal', function (signalData) {
    peerTwo.destroy()

    // when
    const err = tryCatch(() => peerTwo.signal(signalData))

    // then
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.SIGNALING)
    assert.is(err.message, 'cannot signal after peer is destroyed')
    peerOne.destroy()
  })
})

test('signal emits an error when called with invalid data', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true, isTrickleIceEnabled: false })
  const peerTwo = new WebRTCPeer()

  // when
  peerOne.on('signal', () => peerTwo.signal('{}'))

  // then
  peerOne.on('error', () => assert.fail('peer one should not emit an error event'))
  peerTwo.on('error', function (err) {
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.SIGNALING)
    assert.is(err.message, 'signal called with invalid signal data')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('signal emits an error when called with an invalid candidate', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true, isTrickleIceEnabled: false })
  const peerTwo = new WebRTCPeer()

  // when
  peerOne.on('signal', () => peerTwo.signal('{ "candidate": {} }'))

  // then
  peerOne.on('error', () => assert.fail('peer one should not emit an error event'))
  peerTwo.on('error', function (err) {
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.ADD_ICE_CANDIDATE)
    assert.is(typeof err.message, 'string')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('signal emits an error when called with invalid sdp data', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true, isTrickleIceEnabled: false })
  const peerTwo = new WebRTCPeer()
  const invalidSignalData = JSON.stringify({
    sdp: 'invalid data',
    type: 'offer'
  })

  // when
  peerOne.on('signal', () => peerTwo.signal(invalidSignalData))

  // then
  peerOne.on('error', () => assert.fail('peer one should not emit an error event'))
  peerTwo.on('error', function (err) {
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.SET_REMOTE_DESCRIPTION)
    assert.is(typeof err.message, 'string')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('getStats() throws an error when called after peer has been destroyed', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)

  peerOne.on('connect', () => peerOne.send('Hello, Peer Two!'))
  peerTwo.on('data', () => peerTwo.send('Hello, Peer One!'))

  // then
  peerOne.on('data', function () {
    peerOne.destroy()

    // when
    const err = tryCatch(() => peerOne.getStats())

    // then
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.PEER_IS_DESTROYED)
    assert.is(err.message, 'cannot getStats after peer is destroyed')

    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('create offer - set local description error code is emitted when sdpTransformer returns invalid data', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({
    isInitiator: true,
    sdpTransformer: () => 'invalid data'
  })
  const peerTwo = new WebRTCPeer()
  peerOne.on('signal', signalData => peerTwo.signal(signalData))

  // then
  peerOne.on('error', function (err) {
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.SET_LOCAL_DESCRIPTION)
    assert.is(typeof err.message, 'string')
    peerOne.destroy()
    peerTwo.destroy()
  })
  peerTwo.on('error', () => assert.fail('peer two should not emit an error event'))
})

test('create answer - set local description error code is emitted when sdpTransformer returns invalid data', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer({ sdpTransformer: () => 'invalid data' })
  peerOne.on('signal', signalData => peerTwo.signal(signalData))

  // then
  peerTwo.on('error', function (err) {
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.SET_LOCAL_DESCRIPTION)
    assert.is(typeof err.message, 'string')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('remove stream throws an error when called with a stream that was never added', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)

  peerOne.on('connect', function () {
    const mediaStream = testUtil.getMediaStream()
    peerOne.addStream(mediaStream)
  })

  // when
  peerTwo.on('stream', function () {
    const audioTrack = testUtil.getAudioTrack()
    const aDifferentMediaStream = new window.MediaStream([audioTrack])
    const err = tryCatch(() => peerOne.removeStream(aDifferentMediaStream))

    // then
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.REMOVE_TRACK)
    assert.is(err.message, 'cannot remove track that was never added')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('remove track throws an error when called with a track that was never added', assert => {
  // given
  assert.plan(3)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)

  peerOne.on('connect', function () {
    const mediaStream = testUtil.getMediaStream()
    peerOne.addStream(mediaStream)
  })

  // when
  peerTwo.on('stream', function () {
    const audioTrack = testUtil.getAudioTrack()
    const err = tryCatch(() => peerOne.removeTrack(audioTrack))

    // then
    assert.true(isError(err))
    assert.is(err.code, testErrorCodes.REMOVE_TRACK)
    assert.is(err.message, 'cannot remove track that was never added')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

function tryCatch (cb) {
  try {
    cb()
  } catch (err) {
    return err
  }
}

function isError (err) {
  return err instanceof Error
}
