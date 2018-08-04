# Issues

## Google Chrome

- Chrome does not support the RTCRtpTransceiver API. As a result the options for createOffer must always be specified in order to accept incoming audio and video.

```js
const offerOptions = {
  offerToReceiveAudio: true,
  offerToReceiveVideo: true
}

peerConnection.createOffer(offerOptions)
```

- When the RTCRtpTransceiver API has been implemented remove the offerOptions from createOffer.

## Microsoft Edge

- Data channels are currently not supported.
- Data channels current status: https://developer.microsoft.com/en-us/microsoft-edge/platform/status/rtcdatachannels/
- Add Microsoft Edge to the list of browsers to test against once data channels are implemented.

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
