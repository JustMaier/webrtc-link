import test from 'tape'

import util from '../test-util'
import WebRTCPeer from '../../src/'

test('single stream via constructor - initiator only', assert => {
  assert.plan(2)

  const inputStream = util.getMediaStream()
  const peerOne = new WebRTCPeer({
    isInitiator: true,
    streams: [inputStream]
  })
  const peerTwo = new WebRTCPeer()
  addSignalEventHandlers(peerOne, peerTwo)

  peerOne.on('stream', () => assert.fail('stream event should not fire for peer one'))
  peerTwo.on('stream', function (receivedStream) {
    assert.true(receivedStream instanceof window.MediaStream, 'is a MediaStream')
    assert.is(receivedStream.id, inputStream.id, 'stream ids match')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('single stream via constructor - non-initiator only', assert => {
  assert.plan(2)

  const inputStream = util.getMediaStream()
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer({ streams: [inputStream] })
  addSignalEventHandlers(peerOne, peerTwo)

  peerOne.on('stream', function (receivedStream) {
    assert.true(receivedStream instanceof window.MediaStream, 'is a MediaStream')
    assert.is(receivedStream.id, inputStream.id, 'stream ids match')
    peerOne.destroy()
    peerTwo.destroy()
  })
  peerTwo.on('stream', () => assert.fail('stream event should not fire for peer two'))
})

test('single stream via constructor - both peers', async assert => {
  assert.plan(4)

  const peerOneReceivedStreams = []
  const peerTwoReceivedStreams = []
  const peerOneStream = util.getMediaStream()
  const peerTwoStream = util.getMediaStream()

  const peerOne = new WebRTCPeer({ isInitiator: true, streams: [peerOneStream] })
  const peerTwo = new WebRTCPeer({ streams: [peerTwoStream] })

  addSignalEventHandlers(peerOne, peerTwo)

  // then
  peerOne.on('stream', function (receivedStream) {
    peerOneReceivedStreams.push(receivedStream)
    verifyStreams()
  })
  peerTwo.on('stream', function (receivedStream) {
    peerTwoReceivedStreams.push(receivedStream)
    verifyStreams()
  })

  function verifyStreams () {
    if (peerOneReceivedStreams.length !== 1 || peerTwoReceivedStreams.length !== 1) return
    assert.true(peerOneReceivedStreams[0] instanceof window.MediaStream, 'is a MediaStream')
    assert.is(peerOneReceivedStreams[0].id, peerTwoStream.id, 'peer one stream ids match')

    assert.true(peerTwoReceivedStreams[0] instanceof window.MediaStream, 'is a MediaStream')
    assert.is(peerTwoReceivedStreams[0].id, peerOneStream.id, 'stream ids match')
    peerOne.destroy()
    peerTwo.destroy()
  }
})

function addSignalEventHandlers (peerOne, peerTwo) {
  peerOne.on('signal', signalData => peerTwo.signal(signalData))
  peerTwo.on('signal', signalData => peerOne.signal(signalData))
}
