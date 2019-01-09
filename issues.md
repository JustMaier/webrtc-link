# Issues

## Google Chrome

- Google Chrome version 69 added support for the RTCRtpTransceiver API. It can be enabled by passing `{ sdpSemantics: 'unified-plan' }` to the RTCPeerConnection constructor.
- However Chrome continually crashes whenever peerConnection.addTransceiver is used.
- As a result the options for createOffer must always be specified in order to accept incoming audio and video.

```js
const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
}

peerConnection.createOffer(offerOptions)
```

- Work to fix this is ongoing on the following branch [google-chrome-rtcrtptransceiver](https://github.com/shanebloomer/webrtc-link/tree/google-chrome-rtcrtptransceiver).
- When the RTCRtpTransceiver API becomes stable in Chrome remove the offerOptions from createOffer.
- In the future `unified-plan` will become the default.

## Safari

- Safari behaves differently when only the data channel is used. It will fail to establish a connection unless TURN servers are specified or navigator.mediaDevices.getUserMedia is called.
- Disabling trickle ice candidates does not work in Safari. However disabling trickle ice candidates will work when TURN servers are specified.
- There isn't a reliable way to emit an event when a track is removed in Safari. (https://github.com/w3c/webrtc-pc/issues/1161)
- `remove-stream.test.js` and `remove-track.test.js` do not pass.

## Improve test coverage

- Run all tests with and without the use of STUN servers.
- Improve test coverage for adding and removing media streams.

Error codes that do not have tests:

- ERR_CREATE_ANSWER
- ERR_CREATE_OFFER
- ERR_DATA_CHANNEL
- ERR_ICE_CONNECTION_CLOSED
- ERR_ICE_CONNECTION_FAILURE
