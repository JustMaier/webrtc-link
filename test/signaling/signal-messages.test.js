const test = require('tape')

const WebRTCPeer = require('../../src/')

test('signal accepts stringified signal data', assert => {
  // given
  assert.plan(2)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()

  // when
  peerOne.on('signal', signalData => {
    peerTwo.signal(JSON.stringify(signalData))
  })
  peerTwo.on('signal', signalData => {
    peerOne.signal(JSON.stringify(signalData))
  })

  // then
  peerOne.on('connect', () => peerOne.send('ping'))
  peerOne.on('data', data => {
    assert.is(data, 'pong')
    peerOne.destroy()
    peerTwo.destroy()
  })
  peerTwo.on('data', data => {
    assert.is(data, 'ping')
    peerTwo.send('pong')
  })
})

test('first signal message from initiator peer is an offer', assert => {
  // given
  assert.plan(2)
  const peer = new WebRTCPeer({ isInitiator: true })

  // then
  peer.on('signal', signalData => {
    assert.is(signalData.type, 'offer')
    assert.is(typeof signalData.sdp, 'string')
    peer.destroy()
  })
})

test('first signal message from non-initiator peer is an answer', assert => {
  // given
  assert.plan(2)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()

  peerOne.on('signal', signalData => peerTwo.signal(signalData))

  // then
  peerTwo.on('signal', signalData => {
    assert.is(signalData.type, 'answer')
    assert.is(typeof signalData.sdp, 'string')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('sdpTransformer function is called when the offer is created', assert => {
  // given
  assert.plan(1)
  const peer = new WebRTCPeer({
    isInitiator: true,
    sdpTransformer: sdpTransformer
  })

  // then
  function sdpTransformer (sdp) {
    assert.is(typeof sdp, 'string')
    setTimeout(() => peer.destroy(), 0)
    return sdp
  }
})

test('sdpTransformer function is called when the answer is created', assert => {
  // given
  assert.plan(3)
  let peerOneSdpTransformerCalled = false

  const peerOne = new WebRTCPeer({
    isInitiator: true,
    sdpTransformer: peerOneSdpTransformer
  })
  const peerTwo = new WebRTCPeer({ sdpTransformer: peerTwoSdpTransformer })

  peerOne.on('signal', signalData => peerTwo.signal(signalData))

  // then
  function peerOneSdpTransformer (sdp) {
    assert.equal(typeof sdp, 'string')
    peerOneSdpTransformerCalled = true
    return sdp
  }

  function peerTwoSdpTransformer (sdp) {
    assert.equal(typeof sdp, 'string')
    assert.true(peerOneSdpTransformerCalled)
    setTimeout(function () {
      peerOne.destroy()
      peerTwo.destroy()
    }, 0)
    return sdp
  }
})

test('signal messages have offer, answer and ice candidates', assert => {
  // given
  assert.plan(8)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  const peerOneSignalData = []
  const peerTwoSignalData = []

  // when
  peerOne.on('signal', signalData => {
    peerOneSignalData.push(signalData)
    peerTwo.signal(signalData)
  })

  peerTwo.on('signal', signalData => {
    peerTwoSignalData.push(signalData)
    peerOne.signal(signalData)
  })

  // then
  const testData = {
    peerOneSignalData: peerOneSignalData,
    peerTwoSignalData: peerTwoSignalData,
    peerOne: peerOne,
    peerTwo: peerTwo
  }
  peerOne.on('connect', () => verifySignalData(assert, testData))
  peerTwo.on('connect', () => verifySignalData(assert, testData))
})

function verifySignalData (assert, testData) {
  const peerOne = testData.peerOne
  const peerTwo = testData.peerTwo
  const peerOneSignalData = testData.peerOneSignalData
  const peerTwoSignalData = testData.peerTwoSignalData

  if (!peerOne.isConnected() || !peerTwo.isConnected()) return

  verifySignalCount(assert, peerOneSignalData, peerTwoSignalData)
  verifyOffer(assert, peerOneSignalData[0])
  verifyAnswer(assert, peerTwoSignalData[0])
  verifyIceData(assert, peerOneSignalData.slice(1))
  verifyIceData(assert, peerTwoSignalData.slice(1))

  peerOne.destroy()
  peerTwo.destroy()
}

function verifySignalCount (assert, peerOneSignalData, peerTwoSignalData) {
  assert.true(peerOneSignalData.length >= 2, 'multiple signal events for peer one')
  assert.true(peerTwoSignalData.length >= 2, 'multiple signal events for peer two')
}

function verifyOffer (assert, signalData) {
  assert.is(signalData.type, 'offer')
  assert.is(typeof signalData.sdp, 'string')
}

function verifyAnswer (assert, signalData) {
  assert.is(signalData.type, 'answer')
  assert.is(typeof signalData.sdp, 'string')
}

function verifyIceData (assert, iceData) {
  const isValidIceData = iceData.every(isIceCandidate)
  assert.true(isValidIceData, 'all candidates are valid')
}

function isIceCandidate (signalData) {
  return (typeof signalData.candidate === 'object') &&
    (typeof signalData.candidate.candidate === 'string') &&
    (typeof signalData.candidate.sdpMid === 'string') &&
    (typeof signalData.candidate.sdpMLineIndex, 'number')
}
