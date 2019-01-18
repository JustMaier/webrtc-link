const test = require('tape')

const testUtil = require('../test-util')
const WebRTCPeer = require('../../src/')

test('remove tracks initiator only - single media stream', assert => {
  assert.plan(2)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testRemoveTrackSingleStream(assert, peerOne, peerTwo)
})

test('remove tracks non-initiator only - single media stream', assert => {
  assert.plan(2)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testRemoveTrackSingleStream(assert, peerTwo, peerOne)
})

test('remove tracks initiator only - multiple media streams', assert => {
  assert.plan(1)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testRemoveTrackMultipleStreams(assert, peerOne, peerTwo)
})

test('remove tracks non-initiator only - multiple media streams', assert => {
  assert.plan(1)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  testRemoveTrackMultipleStreams(assert, peerTwo, peerOne)
})

function testRemoveTrackSingleStream (assert, sendingPeer, nonSendingPeer) {
  const mediaStream = testUtil.getMediaStream()
  sendingPeer.on('connect', () => sendingPeer.addStream(mediaStream))
  nonSendingPeer.on('stream', function () {
    mediaStream.getTracks().forEach(track => sendingPeer.removeTrack(track))
  })

  sendingPeer.on('removetrack', track => assert.fail('sending peer should not emit removetrack event'))
  nonSendingPeer.on('removetrack', function (track, stream) {
    assert.true(track instanceof window.MediaStreamTrack, 'is a MediaStreamTrack')
    assert.true(stream instanceof window.MediaStream, 'is a MediaStream')

    sendingPeer.destroy()
    nonSendingPeer.destroy()
  })
}

function testRemoveTrackMultipleStreams (assert, sendingPeer, nonSendingPeer) {
  const mediaStreams = testUtil.getMediaStreams(10)
  const allTracks = getAllTracks(mediaStreams)

  sendingPeer.on('connect', () => {
    mediaStreams.forEach(mediaStream => sendingPeer.addStream(mediaStream))
  })

  let receivedStreamEventCount = 0
  nonSendingPeer.on('stream', () => {
    receivedStreamEventCount++

    if (receivedStreamEventCount === mediaStreams.length) {
      allTracks.forEach(track => sendingPeer.removeTrack(track))
    }
  })

  sendingPeer.on('removetrack', () => assert.fail('sending peer should not emit removetrack event'))

  let removeTrackEventCount = 0
  nonSendingPeer.on('removetrack', function (track, stream) {
    removeTrackEventCount++

    if (removeTrackEventCount === allTracks.length) {
      assert.pass('all tracks were successfully removed')
      sendingPeer.destroy()
      nonSendingPeer.destroy()
    }
  })
}

function getAllTracks (mediaStreams) {
  return mediaStreams.map(mediaStream => mediaStream.getTracks())
    .reduce((result, next) => result.concat(next), [])
}
