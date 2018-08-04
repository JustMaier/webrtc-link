import test from 'tape'

import testUtil from './test-util'
import WebRTCPeer from '../src/'

test('isConnected() is false when instantiated', assert => {
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  assert.false(peerOne.isConnected())
  assert.false(peerTwo.isConnected())
  peerOne.destroy()
  peerTwo.destroy()
  assert.end()
})

test('isDestroyed() is true after destroy()', assert => {
  // given
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()

  assert.false(peerOne.isDestroyed())
  assert.false(peerTwo.isDestroyed())

  // when
  peerOne.destroy()
  peerTwo.destroy()

  // then
  assert.true(peerOne.isDestroyed())
  assert.true(peerTwo.isDestroyed())
  assert.end()
})

test('isConnected() is true after connect event', assert => {
  // given
  assert.plan(5)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)

  // then
  let peerOneConnectEvent = false
  peerOne.on('connect', () => {
    peerOneConnectEvent = true
    tryFinishTest()
  })

  let peerTwoConnectEvent = false
  peerTwo.on('connect', () => {
    peerTwoConnectEvent = true
    tryFinishTest()
  })

  function tryFinishTest () {
    if (peerOneConnectEvent && peerTwoConnectEvent) {
      assert.pass('both connect events fired')

      assert.true(peerOne.isConnected())
      assert.true(peerTwo.isConnected())

      peerOne.destroy()
      peerTwo.destroy()

      assert.false(peerOne.isConnected())
      assert.false(peerTwo.isConnected())
    }
  }
})

test('when destroy is invoked the close event is emitted', assert => {
  assert.plan(1)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)
  peerOne.on('connect', () => {
    peerOne.destroy()
    peerTwo.destroy()
  })

  let peerOneCloseFired = false
  peerOne.on('close', function () {
    if (peerOneCloseFired) {
      assert.fail('peer one close event fired more than once')
    }
    peerOneCloseFired = true
    tryFinishTest()
  })

  let peerTwoCloseFired = false
  peerTwo.on('close', function () {
    if (peerTwoCloseFired) {
      assert.fail('peer two close event fired more than once')
    }
    peerTwoCloseFired = true
    tryFinishTest()
  })

  function tryFinishTest () {
    if (peerOneCloseFired && peerTwoCloseFired) {
      assert.pass()
    }
  }
})

test('invoking destroy multiple times does not cause multiple close events', assert => {
  // given
  assert.plan(1)
  const peer = new WebRTCPeer({ isInitiator: true })
  peer.on('signal', () => {
    peer.destroy()
    peer.destroy()
    peer.destroy()
  })

  // when
  let closeFiredCount = 0
  peer.on('close', () => ++closeFiredCount)

  // then
  setTimeout(() => assert.is(closeFiredCount, 1, 'close event was fired once'), 1000)
})
