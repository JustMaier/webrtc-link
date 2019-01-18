const BrowserDetector = require('bowser')

function addSignalEvents (peerOne, peerTwo) {
  peerOne.on('signal', signalData => peerTwo.signal(signalData))
  peerTwo.on('signal', signalData => peerOne.signal(signalData))
}

let audioContext
function getAudioTrack () {
  if (audioContext == null) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }

  const oscillator = audioContext.createOscillator()
  const destination = audioContext.createMediaStreamDestination()
  oscillator.connect(destination)
  oscillator.start()

  const audioTrack = destination.stream.getAudioTracks()[0]
  audioTrack.enabled = true
  return audioTrack
}

function getVideoTrack () {
  const width = 720
  const height = 480

  const canvas = document.createElement('canvas')
  const canvasContext = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height
  canvasContext.fillRect(0, 0, width, height)

  const stream = canvas.captureStream()
  const videoTrack = stream.getVideoTracks()[0]
  videoTrack.enabled = true
  return videoTrack
}

function getMediaStream () {
  const audioTrack = getAudioTrack()
  const videoTrack = getVideoTrack()
  return new window.MediaStream([audioTrack, videoTrack])
}

function getMediaStreams (count) {
  validateCount(count)
  const mediaStreams = []
  for (let i = 0; i < count; i++) {
    const mediaStream = getMediaStream()
    mediaStreams.push(mediaStream)
  }
  return mediaStreams
}

function isSafari () {
  const browserName = BrowserDetector.getParser(window.navigator.userAgent).getBrowserName()
  return browserName.toUpperCase() === 'SAFARI'
}

function validateCount (count) {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error('count must be a positive integer')
  }
}

function wait (milliseconds) {
  if (!Number.isInteger(milliseconds) || milliseconds < 0) {
    throw new Error('illegal argument: milliseconds')
  }
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

module.exports = {
  addSignalEvents,
  getAudioTrack,
  getMediaStream,
  getMediaStreams,
  isSafari,
  wait
}
