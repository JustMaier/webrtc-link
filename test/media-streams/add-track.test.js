const test = require('tape')

const testUtil = require('../test-util')
const WebRTCPeer = require('../../src/')

test('add track initiator only - track event is emitted', assert => {
  assert.plan(5)

  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  addSignalEventHandlers(peerOne, peerTwo)

  testAddTrack(assert, peerOne, peerTwo)
})

test('add track non-initiator only - track event is emitted', assert => {
  assert.plan(5)

  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  addSignalEventHandlers(peerOne, peerTwo)

  testAddTrack(assert, peerTwo, peerOne)
})

function testAddTrack (assert, sendingPeer, otherPeer) {
  const inputStream = testUtil.getMediaStream()
  const receivedAudioTracks = []
  const receivedVideoTracks = []

  addConnectEventHandler(sendingPeer, inputStream)

  sendingPeer.on('track', () => assert.fail('track event should not fire for sending peer'))

  otherPeer.on('track', function (receivedTrack, receivedStream) {
    assert.true(receivedStream instanceof window.MediaStream, 'is a MediaStream')
    assert.is(receivedStream.id, inputStream.id, 'stream ids match')

    if (receivedTrack.kind === 'video') {
      receivedVideoTracks.push(receivedTrack)
    } else if (receivedTrack.kind === 'audio') {
      receivedAudioTracks.push(receivedTrack)
    } else {
      assert.fail('unknown track kind')
    }

    if (receivedAudioTracks.length === 1 && receivedVideoTracks.length === 1) {
      assert.pass('received single audio track and single video track')
      sendingPeer.destroy()
      otherPeer.destroy()
    }
  })
}

function addSignalEventHandlers (peerOne, peerTwo) {
  peerOne.on('signal', signalData => peerTwo.signal(signalData))
  peerTwo.on('signal', signalData => peerOne.signal(signalData))
}

function addConnectEventHandler (peer, inputStream) {
  peer.on('connect', function () {
    inputStream.getTracks().forEach(function (track) {
      peer.addTrack(track, inputStream)
    })
  })
}
