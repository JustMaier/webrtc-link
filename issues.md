# Issues

## Safari

- Safari behaves differently when only the data channel is used. It will fail to establish a connection unless TURN servers are specified or navigator.mediaDevices.getUserMedia is called.
- Disabling trickle ice candidates does not work in Safari. However disabling trickle ice candidates will work when TURN servers are specified.
- There isn't a reliable way to emit an event when a track is removed in Safari. (https://github.com/w3c/webrtc-pc/issues/1161)
- `remove-stream.test.js` and `remove-track.test.js` do not pass.
