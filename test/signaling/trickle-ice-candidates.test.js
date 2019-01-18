const test = require('tape')

const WebRTCPeer = require('../../src/')

test('disable trickle ice candidates for initiator only', assert => {
  assert.plan(6)
  const isTrickleIceEnabled = { peerOne: false, peerTwo: true }
  testTrickleIce(assert, isTrickleIceEnabled)
})

test('disable trickle ice candidates for non-initiator only', assert => {
  assert.plan(6)
  const isTrickleIceEnabled = { peerOne: true, peerTwo: false }
  testTrickleIce(assert, isTrickleIceEnabled)
})

test('disable trickle ice candidates for initiator and non-initiator', assert => {
  assert.plan(6)
  const isTrickleIceEnabled = { peerOne: false, peerTwo: false }
  testTrickleIce(assert, isTrickleIceEnabled)
})

function testTrickleIce (assert, isTrickleIceEnabled) {
  const peerOne = new WebRTCPeer({
    isInitiator: true,
    isTrickleIceEnabled: isTrickleIceEnabled.peerOne
  })
  const peerTwo = new WebRTCPeer({
    isTrickleIceEnabled: isTrickleIceEnabled.peerTwo
  })

  let peerOneSignalCount = 0
  let peerTwoSignalCount = 0

  // when
  peerOne.on('signal', function (signalData) {
    peerOneSignalCount++
    peerTwo.signal(signalData)
  })

  peerTwo.on('signal', function (signalData) {
    peerTwoSignalCount++
    peerOne.signal(signalData)
  })

  // then
  const testData = {
    peerOne: peerOne,
    peerTwo: peerTwo,
    isTrickleIceEnabled: isTrickleIceEnabled
  }
  peerOne.on('connect', () => {
    testData.peerOneSignalCount = peerOneSignalCount
    testData.peerTwoSignalCount = peerTwoSignalCount
    tryFinishTest(assert, testData)
  })
  peerTwo.on('connect', () => {
    testData.peerOneSignalCount = peerOneSignalCount
    testData.peerTwoSignalCount = peerTwoSignalCount
    tryFinishTest(assert, testData)
  })
}

function tryFinishTest (assert, testData) {
  const peerOne = testData.peerOne
  const peerTwo = testData.peerTwo

  if (!peerOne.isConnected() || !peerTwo.isConnected()) return

  verifyPeerOneSignalData(
    assert,
    testData.peerOneSignalCount,
    testData.isTrickleIceEnabled)

  verifyPeerTwoSignalData(
    assert,
    testData.peerTwoSignalCount,
    testData.isTrickleIceEnabled)

  sendMessages(assert, peerOne, peerTwo)
}

function verifyPeerOneSignalData (assert, peerOneSignalCount, isTrickleIceEnabled) {
  if (isTrickleIceEnabled.peerOne) {
    assert.true(peerOneSignalCount >= 2, 'multiple signal events for peer one')
  } else {
    assert.is(peerOneSignalCount, 1, 'only one signal event for peer one')
  }
}

function verifyPeerTwoSignalData (assert, peerTwoSignalCount, isTrickleIceEnabled) {
  if (isTrickleIceEnabled.peerTwo) {
    assert.true(peerTwoSignalCount >= 2, 'multiple signal events for peer two')
  } else {
    assert.is(peerTwoSignalCount, 1, 'only one signal event for peer two')
  }
}

function sendMessages (assert, peerOne, peerTwo) {
  peerOne.send('ping')

  peerOne.on('data', function (data) {
    assert.is(data, 'pong')

    peerOne.on('close', function () { assert.pass('peer one destroyed') })
    peerOne.destroy()
    peerTwo.on('close', function () { assert.pass('peer two destroyed') })
    peerTwo.destroy()
  })

  peerTwo.on('data', function (data) {
    assert.is(data, 'ping')
    peerTwo.send('pong')
  })
}
