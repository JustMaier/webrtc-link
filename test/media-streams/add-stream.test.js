import test from 'tape'

import testUtil from '../test-util'
import WebRTCPeer from '../../src/'

test('add stream initiator only - stream event is emitted', assert => {
  assert.plan(2)

  const initiatorPeer = new WebRTCPeer({ isInitiator: true })
  const nonInitiatorPeer = new WebRTCPeer()
  addSignalEventHandlers(initiatorPeer, nonInitiatorPeer)

  testAddStream(assert, initiatorPeer, nonInitiatorPeer)
})

test('add stream non-initiator only - stream event is emitted', assert => {
  assert.plan(2)

  const initiatorPeer = new WebRTCPeer({ isInitiator: true })
  const nonInitiatorPeer = new WebRTCPeer()
  addSignalEventHandlers(initiatorPeer, nonInitiatorPeer)

  testAddStream(assert, nonInitiatorPeer, initiatorPeer)
})

function testAddStream (assert, sendingPeer, nonSendingPeer) {
  const mediaStream = testUtil.getMediaStream()
  sendingPeer.on('connect', () => sendingPeer.addStream(mediaStream))

  nonSendingPeer.on('stream', function (receivedStream) {
    assert.true(receivedStream instanceof window.MediaStream, 'is a MediaStream')
    assert.is(receivedStream.id, mediaStream.id, 'stream ids match')
    sendingPeer.destroy()
    nonSendingPeer.destroy()
  })
  sendingPeer.on('stream', () => assert.fail('stream event should not fire for sending peer'))
}

function addSignalEventHandlers (peerOne, peerTwo) {
  peerOne.on('signal', signalData => peerTwo.signal(signalData))
  peerTwo.on('signal', signalData => peerOne.signal(signalData))
}
