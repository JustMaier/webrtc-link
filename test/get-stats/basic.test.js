import test from 'tape'

import testUtil from '../test-util/'
import WebRTCPeer from '../../src/'

test('getStats() returns a promise', assert => {
  // given
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()

  // then
  assert.true(peerOne.getStats() instanceof Promise, 'is instance of promise')
  assert.true(peerTwo.getStats() instanceof Promise, 'is instance of promise')
  peerOne.destroy()
  peerTwo.destroy()
  assert.end()
})

test('getStats() result size is greater than zero', async assert => {
  // given
  assert.plan(2)
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()
  testUtil.addSignalEvents(peerOne, peerTwo)

  peerOne.on('connect', () => peerOne.send('Hello, Peer Two!'))
  peerTwo.on('data', () => peerTwo.send('Hello, Peer One!'))

  // then
  peerOne.on('data', async function () {
    const peerOneStats = await peerOne.getStats()
    const peerTwoStats = await peerTwo.getStats()

    assert.true(peerOneStats.size > 0, 'peer one has stats records')
    assert.true(peerTwoStats.size > 0, 'peer two has stats records')
    peerOne.destroy()
    peerTwo.destroy()
  })
})

test('getStats() returns an RTCStatsReport', async assert => {
  // given
  const peerOne = new WebRTCPeer({ isInitiator: true })
  const peerTwo = new WebRTCPeer()

  // then
  assert.true(await peerOne.getStats() instanceof RTCStatsReport, 'is instance of RTCStatsReport')
  assert.true(await peerTwo.getStats() instanceof RTCStatsReport, 'is instance of RTCStatsReport')
  peerOne.destroy()
  peerTwo.destroy()
  assert.end()
})
