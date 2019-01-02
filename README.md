# WebRTC Link [![Build Status](https://travis-ci.org/shanebloomer/webrtc-link.svg?branch=master)](https://travis-ci.org/shanebloomer/webrtc-link)

A JavaScript module for working with WebRTC in the browser.

## Features

- Supports video and audio streams.
- Tested using the latest versions of Google Chrome, Mozilla Firefox, Opera and Safari.
- Ability to configure the internal data channel for ultra low latency.
- **19KB** bundle size.
- Written according to the latest version of the [WebRTC 1.0 specification](https://w3c.github.io/webrtc-pc/).

## Install

```sh
$ npm install webrtc-link
```

## Example

```javascript
const WebRTCPeer = require('webrtc-link')

const peerOne = new WebRTCPeer({
  isInitiator: true,
  streams: [stream] // media stream from navigator.mediaDevices.getUserMedia
})

const peerTwo = new WebRTCPeer()

peerOne.on('signal', signal => peerTwo.signal(signal))
peerTwo.on('signal', signal => peerOne.signal(signal))

peerOne.on('connect', () => peerOne.send('Hello!'))
peerTwo.on('data', data => console.log(data)) // 'Hello!'
```

## Events

### Event: 'signal'

```js
peer.on('signal', function (signal) {
  console.log('Transfer the signal data to the remote peer.')
})
```

Emitted when the peer wants to send the signal data to the remote peer.

The exact details of the signal object are unspecified.

Transporting the signal data to the remote peer is usually done over WebSockets.

A good WebSockets module is [one-websocket](https://github.com/shanebloomer/one-websocket).

### Event: 'connect'

```js
peer.on('connect', function () {
  console.log('Peer connection established.')
})
```

Emitted when the peer connection and data channel are ready to use.

### Event: 'data'

```js
peer.on('data', function (data) {
  console.log(`Received message: ${data}`)
})
```

Emitted when a message is received from the remote peer over the data channel.

Note that the data will be lost if there is no listener for the `'data'` event.

### Event: 'stream'

```js
peer.on('stream', function (stream) {
  const video = document.createElement('video')
  video.srcObject = stream
  document.body.appendChild(video)
  video.play()
})
```

Emitted when a media stream has been received from the remote peer.

### Event: 'track'

```js
peer.on('track', function (track, stream) {})
```

Emitted when a media track has been received from the remote peer.

### Event: 'removetrack'

```js
peer.on('removetrack', function (track, stream) {})
```

Emitted when a media track has been removed by the remote peer.

### Event: 'close'

```js
peer.on('close', function () {
  console.log('The connection has been closed.')
})
```

Emitted once the peer connection has fully closed. No new events will be emitted on this peer.

### Event: 'error'

```js
peer.on('error', function (err) {
  console.log(err)
})
```

Emitted when a fatal error occurs - a single `Error` object is passed to the event handler function.

## API

### Constructor parameter: `new WebRTCPeer(options)`

### `options`
If options are passed to the constructor then the default options (shown below) will be overridden.

```js
{
  dataChannelConfig: {},
  isInitiator: false,
  isTrickleIceEnabled: true,
  peerConnectionConfig: { iceServers: [] },
  sdpTransformer: sdp => sdp,
  streams: []
}
```

### `peer.addStream(stream)`

Send a `MediaStream` to the remote peer.

### `peer.addTrack(track, stream)`

Send a `MediaStreamTrack` to the remote peer.

### `peer.destroy(err) `

Destroy and cleanup this peer connection.

If `err` is specified, an 'error' event will be emitted and any listeners for that event will receive `err` as an argument.

### `peer.getStats()`

Returns a Promise which is fulfilled once the statistics are available. The promise's fulfillment handler receives as a parameter a `RTCStatsReport` object containing the collected statistics.

### `peer.isConnected()`

Returns a Boolean value indicating whether the peer is currently connected to the remote peer.

### `peer.isDestroyed()`

Returns a Boolean value that indicates if the peer is destroyed or not. Once destroyed no further data can be transferred using it. No further events will be emitted.

### `peer.removeStream(stream)`

Remove a `MediaStream` that is being sent to the remote peer.

### `peer.removeTrack(track)`

Remove a `MediaStreamTrack` that is being sent to the remote peer.

### `peer.send(data)`

Send the data to the remote peer.

Invoking send while the peer is not connected will throw an error. send will also throw an error if called after the peer has been destroyed.

### `peer.signal(data)`

Invoke the `signal` function with the data generated by the other peer.

```js
peerOne.on('signal', function (signal) {
  peer.signal(signal)
})
```

This is a required part of the handshake process to set up a connection with the remote peer.

## Error Codes

- `ERR_ADD_ICE_CANDIDATE`
- `ERR_CREATE_ANSWER`
- `ERR_CREATE_OFFER`
- `ERR_DATA_CHANNEL`
- `ERR_ICE_CONNECTION_CLOSED`
- `ERR_ICE_CONNECTION_FAILURE`
- `ERR_PEER_IS_DESTROYED`
- `ERR_REMOVE_TRACK`
- `ERR_SET_LOCAL_DESCRIPTION`
- `ERR_SET_REMOTE_DESCRIPTION`
- `ERR_SIGNALING`
- `ERR_WEBRTC_SUPPORT`

## STUN/TURN Servers

STUN/TURN servers can be specified via the WebRTC Peer constructor.

```js
const iceServers = [
  { urls: '<your stun/turn server url>' },
  { urls: '<another stun/turn server url>' }
]

const peerOne = new WebRTCPeer({
  isInitiator: true,
  iceServers: iceServers
})

const peerTwo = new WebRTCPeer({
  iceServers: iceServers
})
```

## Development

Run the browser tests locally.

```sh
$ npm run test-browser-local
```

Visit `http://localhost:8080/airtap` using Google Chrome, Mozilla Firefox, Opera or Safari.
Open the developer tools window and view the console window to see additional test output.


There are also tests for Node.js.

```sh
$ npm run test-node
```

## License

MIT. Copyright (c) [Shane Bloomer](https://shanebloomer.com).
