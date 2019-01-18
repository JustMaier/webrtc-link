const test = require('tape')

const testUtil = require('../test-util/')
const WebRTCPeer = require('../../src/')

test('send and receive string', assert => {
  // given
  assert.plan(6)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)

  // when
  peerOne.on('data', function (data) {
    assert.is(typeof data, 'string')
    assert.is(data, 'Hello from Peer Two.')

    peerOne.on('close', () => assert.pass('peer one destroyed'))
    peerTwo.on('close', () => assert.pass('peer two destroyed'))
    peerOne.destroy()
    peerTwo.destroy()
  })

  peerTwo.on('data', function (data) {
    assert.is(typeof data, 'string')
    assert.is(data, 'Hello from Peer One.')

    const responseMessage = 'Hello from Peer Two.'
    peerTwo.send(responseMessage)
  })
  peerOne.on('connect', tryTest)
  peerTwo.on('connect', tryTest)

  // then
  function tryTest () {
    if (!peerOne.isConnected() || !peerTwo.isConnected()) return
    const message = 'Hello from Peer One.'
    peerOne.send(message)
  }
})

test('send and receive Uint8Array', assert => {
  // given
  assert.plan(6)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)

  // when
  peerOne.on('connect', tryTest)
  peerTwo.on('connect', tryTest)

  // then
  peerOne.on('data', function (data) {
    assert.true(data instanceof ArrayBuffer, 'data is an ArrayBuffer')

    const actualData = new Uint8Array(data)
    const expectedData = new Uint8Array([3, 4, 5])
    assert.deepEqual(actualData, expectedData)

    peerOne.on('close', () => assert.pass('peerOne destroyed'))
    peerTwo.on('close', () => assert.pass('peerTwo destroyed'))
    peerOne.destroy()
    peerTwo.destroy()
  })

  peerTwo.on('data', function (data) {
    assert.true(data instanceof ArrayBuffer, 'data is an ArrayBuffer')

    const actualData = new Uint8Array(data)
    const expectedData = new Uint8Array([0, 1, 2])
    assert.deepEqual(actualData, expectedData)

    const responseMessage = new Uint8Array([3, 4, 5])
    peerTwo.send(responseMessage)
  })

  function tryTest () {
    if (!peerOne.isConnected() || !peerTwo.isConnected()) {
      return
    }
    const message = new Uint8Array([0, 1, 2])
    peerOne.send(message)
  }
})

test('send and receive ArrayBuffer', assert => {
  assert.plan(6)

  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()

  peerOne.on('connect', tryTest)
  peerTwo.on('connect', tryTest)

  peerOne.on('signal', signalData => peerTwo.signal(signalData))
  peerTwo.on('signal', signalData => peerOne.signal(signalData))

  peerOne.on('data', function (data) {
    assert.true(data instanceof ArrayBuffer, 'data is an ArrayBuffer')

    const actualData = new Uint8Array(data)
    const expectedData = new Uint8Array([3, 4, 5])
    assert.deepEqual(actualData, expectedData)

    peerOne.on('close', () => assert.pass('peerOne destroyed'))
    peerTwo.on('close', () => assert.pass('peerTwo destroyed'))
    peerOne.destroy()
    peerTwo.destroy()
  })

  peerTwo.on('data', function (data) {
    assert.true(data instanceof ArrayBuffer, 'data is an ArrayBuffer')

    const actualData = new Uint8Array(data)
    const expectedData = new Uint8Array([0, 1, 2])
    assert.deepEqual(actualData, expectedData)

    const responseMessage = new Uint8Array([3, 4, 5]).buffer
    peerTwo.send(responseMessage)
  })

  function tryTest () {
    if (!peerOne.isConnected() || !peerTwo.isConnected()) {
      return
    }
    const message = new Uint8Array([0, 1, 2]).buffer
    peerOne.send(message)
  }
})
