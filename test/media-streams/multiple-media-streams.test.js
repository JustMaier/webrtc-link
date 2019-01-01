import test from 'tape'

import testUtil from '../test-util'
import WebRTCPeer from '../../src/'

test('multiple streams via constructor for both peers', async assert => {
  assert.plan(2)

  const peerOne = new WebRTCPeer({ isInitiator: true, streams: getMediaStreams() })
  const peerTwo = new WebRTCPeer({ streams: getMediaStreams() })
  addSignalEventHandlers(peerOne, peerTwo)

  const peerOneReceivedStreamIds = new Set()
  const peerTwoReceivedStreamIds = new Set()

  peerOne.on('stream', function (stream) {
    if (peerOneReceivedStreamIds.has(stream.id)) {
      assert.fail('received duplicate stream event')
    } else {
      peerOneReceivedStreamIds.add(stream.id)
    }
  })

  peerTwo.on('stream', function (stream) {
    if (peerTwoReceivedStreamIds.has(stream.id)) {
      assert.fail('received duplicate stream event')
    } else {
      peerTwoReceivedStreamIds.add(stream.id)
    }
  })

  await testUtil.wait(500)
  assert.is(peerOneReceivedStreamIds.size, 10, 'received ten stream events for peer one')
  assert.is(peerTwoReceivedStreamIds.size, 10, 'received ten stream events for peer two')
  peerOne.destroy()
  peerTwo.destroy()
})

test('incrementally add streams for both peers', assert => {
  if (testUtil.isSafari()) {
    console.log('Safari only :: skipping incrementally add streams for both peers')
    assert.end()
    return
  }

  assert.plan(12)

  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  addSignalEventHandlers(peerOne, peerTwo)

  const receivedStreamIds = new Set()

  peerOne.on('connect', function () {
    assert.pass('peer one connected')
    peerOne.addStream(testUtil.getMediaStream())
  })

  peerTwo.on('connect', function () {
    assert.pass('peer two connected')
    peerTwo.addStream(testUtil.getMediaStream())
  })

  let countOne = 0
  peerOne.on('stream', function (stream) {
    assert.pass('peer one got stream')
    if (receivedStreamIds.has(stream.id)) {
      assert.fail('received duplicate stream event')
    } else {
      receivedStreamIds.add(stream.id)
    }

    countOne++
    if (countOne < 5) {
      peerOne.addStream(testUtil.getMediaStream())
    }
  })

  let countTwo = 0
  peerTwo.on('stream', function (stream) {
    assert.pass('peer two got stream')
    if (receivedStreamIds.has(stream.id)) {
      assert.fail('received duplicate stream event')
    } else {
      receivedStreamIds.add(stream.id)
    }

    countTwo++
    if (countTwo < 5) {
      peerTwo.addStream(testUtil.getMediaStream())
    }
  })
})

function addSignalEventHandlers (peerOne, peerTwo) {
  peerOne.on('signal', signalData => peerTwo.signal(signalData))
  peerTwo.on('signal', signalData => peerOne.signal(signalData))
}

function getMediaStreams () {
  const mediaStreams = []
  for (let i = 0; i < 10; i++) {
    mediaStreams.push(testUtil.getMediaStream())
  }
  return mediaStreams
}
