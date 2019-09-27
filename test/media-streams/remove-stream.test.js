const test = require('tape')

const testUtil = require('../test-util')
const WebRTCPeer = require('../../src/')

test('removestream event is emitted initiator only - single media stream', assert => {
  assert.plan(2)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testSingleRemoveStream(assert, peerOne, peerTwo)
})

test('removestream event is emitted non-initiator only - single media stream', assert => {
  assert.plan(2)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testSingleRemoveStream(assert, peerTwo, peerOne)
})

test('removestream event is emitted initiator only - multiple media streams', assert => {
  assert.plan(1)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testMultipleRemoveStream(assert, peerOne, peerTwo)
})

test('removestream event is emitted non-initiator only - multiple media streams', assert => {
  assert.plan(1)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testMultipleRemoveStream(assert, peerTwo, peerOne)
})

function testSingleRemoveStream (assert, sendingPeer, nonSendingPeer) {
  const mediaStream = testUtil.getMediaStream()
  sendingPeer.on('connect', () => sendingPeer.addStream(mediaStream))
  nonSendingPeer.on('stream', () => sendingPeer.removeStream(mediaStream))

  sendingPeer.on('removestream', () => assert.fail('sending peer should not emit removestream event'))
  nonSendingPeer.on('removestream', function (removedStream) {
    assert.true(removedStream instanceof window.MediaStream, 'removedStream is a MediaStream')
    assert.is(removedStream.id, mediaStream.id, 'removed media stream id matches')
    sendingPeer.destroy()
    nonSendingPeer.destroy()
  })
}

function testMultipleRemoveStream (assert, sendingPeer, nonSendingPeer) {
  const mediaStreams = testUtil.getMediaStreams(10)
  sendingPeer.on('connect', () => {
    mediaStreams.forEach(mediaStream => sendingPeer.addStream(mediaStream))
  })

  let receivedStreamEventCount = 0
  nonSendingPeer.on('stream', () => {
    receivedStreamEventCount++

    if (receivedStreamEventCount === mediaStreams.length) {
      mediaStreams.forEach(mediaStream => sendingPeer.removeStream(mediaStream))
    }
  })

  sendingPeer.on('removestream', () => assert.fail('sending peer should not emit removestream event'))

  let removeStreamEventCount = 0
  nonSendingPeer.on('removestream', function (removedStream) {
    removeStreamEventCount++

    if (removeStreamEventCount === mediaStreams.length) {
      assert.pass('all media streams were successfully removed')
      sendingPeer.destroy()
      nonSendingPeer.destroy()
    }
  })
}
