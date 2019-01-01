import { isSafari } from './test-util'

if (isSafari()) {
  console.log('Safari :: requesting access to media device')
  navigator.mediaDevices.getUserMedia({ audio: true })
}
