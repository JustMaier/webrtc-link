import BrowserDetector from 'bowser'

if (BrowserDetector.safari) {
  console.log('Safari :: requesting access to media device')
  navigator.mediaDevices.getUserMedia({ audio: true })
}
