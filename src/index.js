'use strict'

const { EventEmitter } = require('events')

const { isChromium } = require('./utils')
const createError = require('./create-error')
const parseOptions = require('./parse-options')
const errorCodes = require('./error-codes')

class WebRTCPeer extends EventEmitter {
  constructor (options) {
    super()

    const self = this

    self._checkWebRTCSupport()

    self._options = parseOptions(options)

    self._isConnected = false
    self._isDestroyed = false
    self._isIceComplete = false
    self._isNegotiating = false
    self._shouldRenegotiate = false

    self._peerConnection = null
    self._dataChannel = null

    self._remoteStreamIds = new Set()
    self._mediaTracksMap = new Map()

    self._setUpPeerConnection()
  }

  addStream (stream) {
    stream.getTracks().forEach(track => this.addTrack(track, stream))
  }

  addTrack (track, stream) {
    const rtcRtpSender = this._peerConnection.addTrack(track, stream)
    this._mediaTracksMap.set(track, rtcRtpSender)
  }

  destroy (err) {
    const self = this
    if (self._isDestroyed) return

    self._isConnected = false
    self._isDestroyed = true

    self._removeDataChannelHandlers()
    self._removePeerConnectionHandlers()

    self._dataChannel = null
    self._peerConnection = null
    self._mediaTracksMap = null
    self._remoteStreamIds = null

    if (err) {
      self.emit('error', err)
    }

    self.emit('close')
  }

  getStats () {
    if (this._isDestroyed) {
      throw createError('cannot getStats after peer is destroyed', errorCodes.PEER_IS_DESTROYED)
    }
    return this._peerConnection.getStats()
  }

  isConnected () {
    return this._isConnected
  }

  isDestroyed () {
    return this._isDestroyed
  }

  removeStream (stream) {
    stream.getTracks().forEach(track => this.removeTrack(track))
  }

  removeTrack (track) {
    if (!this._mediaTracksMap.has(track)) {
      throw createError('cannot remove track that was never added or has already been removed', errorCodes.REMOVE_TRACK)
    }
    const rtcRtpSender = this._mediaTracksMap.get(track)
    this._peerConnection.removeTrack(rtcRtpSender)
  }

  send (data) {
    if (this._isDestroyed) {
      throw createError('cannot call send after peer is destroyed', errorCodes.PEER_IS_DESTROYED)
    }
    this._dataChannel.send(data)
  }

  signal (data) {
    const self = this
    if (self._isDestroyed) {
      throw createError('cannot signal after peer is destroyed', errorCodes.SIGNALING)
    }

    let signalData = data

    if (typeof data === 'string') {
      try {
        signalData = JSON.parse(data)
      } catch (err) {
        signalData = {}
      }
    }

    if (signalData.candidate) {
      self._peerConnection.addIceCandidate(signalData.candidate).catch(onAddIceCandidateError)
    } else if (signalData.sdp) {
      self._setRemoteDescription(signalData)
    } else if (signalData.renegotiate) {
      self._onNegotiationNeeded()
    } else {
      const destroyError = createError('signal called with invalid signal data', errorCodes.SIGNALING)
      self.destroy(destroyError)
    }

    function onAddIceCandidateError (err) {
      const destroyError = createError(err, errorCodes.ADD_ICE_CANDIDATE)
      self.destroy(destroyError)
    }
  }

  _setRemoteDescription (signalData) {
    const self = this

    self._peerConnection.setRemoteDescription(signalData)
      .catch(onSetRemoteDescriptionError)
      .then(onSetRemoteDescriptionSuccess)

    function onSetRemoteDescriptionSuccess () {
      if (self._isDestroyed) return

      if (signalData.type === 'offer') {
        self._createAnswer()
      }
    }

    function onSetRemoteDescriptionError (err) {
      const destroyError = createError(err, errorCodes.SET_REMOTE_DESCRIPTION)
      self.destroy(destroyError)
    }
  }

  _setUpPeerConnection () {
    this._peerConnection = new window.RTCPeerConnection(this._options.peerConnectionConfig)
    this._addPeerConnectionHandlers()
    this._setUpDefaultDataChannel()
    this._options.streams.forEach(stream => this.addStream(stream))
  }

  _addPeerConnectionHandlers () {
    const self = this

    self._peerConnection.onicecandidate = function (event) {
      self._onIceCandidate(event)
    }

    self._peerConnection.oniceconnectionstatechange = function () {
      self._onIceConnectionStateChange()
    }

    self._peerConnection.onicegatheringstatechange = function () {
      self._onIceGatheringStateChange()
    }

    self._peerConnection.onnegotiationneeded = function () {
      self._onNegotiationNeeded()
    }

    self._peerConnection.onsignalingstatechange = function () {
      self._onSignalingStateChange()
    }

    self._peerConnection.ontrack = function (event) {
      self._onTrack(event)
    }
  }

  _setUpDefaultDataChannel () {
    const self = this
    if (self._options.isInitiator) {
      const label = null
      const dataChannel = self._peerConnection.createDataChannel(
        label,
        self._options.dataChannelConfig)

      self._assignDataChannel({ channel: dataChannel })
    } else {
      self._peerConnection.ondatachannel = function (event) {
        self._assignDataChannel(event)
      }
    }
  }

  _onNegotiationNeeded () {
    if (this._options.isInitiator) {
      if (this._isNegotiating) {
        this._shouldRenegotiate = true
      } else {
        this._createOffer()
      }
    } else {
      this.emit('signal', { renegotiate: true })
    }
    this._isNegotiating = true
  }

  _createAnswer () {
    const self = this
    if (self._isDestroyed) return

    self._peerConnection.createAnswer()
      .catch(onCreateAnswerError)
      .then(onCreateAnswerSuccess)
      .catch(onSetLocalDescriptionError)
      .then(onSetLocalDescriptionSuccess)

    function onCreateAnswerSuccess (answer) {
      if (self._isDestroyed) return
      answer.sdp = self._options.sdpTransformer(answer.sdp)
      return self._peerConnection.setLocalDescription(answer)
    }

    function onSetLocalDescriptionSuccess (offer) {
      if (self._isDestroyed) return

      if (self._options.isTrickleIceEnabled || self._isIceComplete) {
        emitAnswer()
      } else {
        self.once('_iceComplete', emitAnswer)
      }
    }

    function onCreateAnswerError (err) {
      const destroyError = createError(err, errorCodes.CREATE_ANSWER)
      self.destroy(destroyError)
    }

    function onSetLocalDescriptionError (err) {
      const destroyError = createError(err, errorCodes.SET_LOCAL_DESCRIPTION)
      self.destroy(destroyError)
    }

    function emitAnswer () {
      self.emit('signal', self._peerConnection.localDescription)
    }
  }

  _onSignalingStateChange () {
    if (this._isDestroyed) return

    if (this._peerConnection.signalingState === 'stable') {
      this._isNegotiating = false

      if (this._shouldRenegotiate) {
        this._shouldRenegotiate = false
        this._onNegotiationNeeded()
      }
    }
  }

  _onTrack (event) {
    const self = this
    if (self._isDestroyed) return

    event.streams.forEach(function (eventStream) {
      eventStream.onremovetrack = function (trackEvent) {
        if (self._isDestroyed) return

        if (!eventStream.active && self._remoteStreamIds.has(eventStream.id)) {
          self._remoteStreamIds.delete(eventStream.id)

          setTimeout(() => {
            self.emit('removestream', eventStream)
          }, 0)
        }

        self.emit('removetrack', trackEvent.track, trackEvent.target)
      }

      setTimeout(function () {
        self.emit('track', event.track, eventStream)
      }, 0)

      const eventHasBeenFired = self._remoteStreamIds.has(eventStream.id)
      if (eventHasBeenFired) return

      self._remoteStreamIds.add(eventStream.id)

      setTimeout(function () {
        self.emit('stream', eventStream)
      }, 0)
    })
  }

  _onIceCandidate (event) {
    if (this._isDestroyed) return

    if (event.candidate && this._options.isTrickleIceEnabled) {
      const iceData = { candidate: event.candidate }
      this.emit('signal', iceData)
    }
  }

  _onIceGatheringStateChange () {
    if (this._isDestroyed) return

    const iceGatheringState = this._peerConnection.iceGatheringState

    if (iceGatheringState === 'complete') {
      this._isIceComplete = true
      this.emit('_iceComplete')
    } else {
      this._isIceComplete = false
    }
  }

  _onIceConnectionStateChange () {
    const self = this
    if (self._isDestroyed) return

    const iceConnectionState = self._peerConnection.iceConnectionState

    if (iceConnectionState === 'failed') {
      self.destroy(createError('Ice connection failed.', errorCodes.ICE_CONNECTION_FAILURE))
    } else if (iceConnectionState === 'closed') {
      self.destroy(createError('ice connection closed', errorCodes.ICE_CONNECTION_CLOSED))
    }
  }

  _createOffer () {
    const self = this
    if (self._isDestroyed) return

    if (!isChromium) {
      self._acceptIncomingVideoAndAudio()
    }

    // Google Chrome requires offerOptions - see issues.md for further information.
    const offerOptions = !isChromium ? {} : {
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    }

    self._peerConnection.createOffer(offerOptions)
      .catch(onCreateOfferError)
      .then(onCreateOfferSuccess)
      .catch(onSetLocalDescriptionError)
      .then(onSetLocalDescriptionSuccess)

    function onCreateOfferSuccess (offer) {
      if (self._isDestroyed) return
      offer.sdp = self._options.sdpTransformer(offer.sdp)
      return self._peerConnection.setLocalDescription(offer)
    }

    function onSetLocalDescriptionSuccess (offer) {
      if (self._isDestroyed) return

      if (self._options.isTrickleIceEnabled || self._isIceComplete) {
        sendOffer()
      } else {
        self.once('_iceComplete', sendOffer)
      }
    }

    function onCreateOfferError (err) {
      self.destroy(createError(err, errorCodes.CREATE_OFFER))
    }

    function onSetLocalDescriptionError (err) {
      self.destroy(createError(err, errorCodes.SET_LOCAL_DESCRIPTION))
    }

    function sendOffer () {
      self.emit('signal', self._peerConnection.localDescription)
    }
  }

  _acceptIncomingVideoAndAudio () {
    const audioTransceiver = this._peerConnection.getTransceivers()
      .find(transceiver => transceiver.sender.track && transceiver.sender.track.kind === 'audio')

    const videoTransceiver = this._peerConnection.getTransceivers()
      .find(transceiver => transceiver.sender.track && transceiver.sender.track.kind === 'video')

    if (audioTransceiver == null) {
      this._peerConnection.addTransceiver('audio')
    }

    if (videoTransceiver == null) {
      this._peerConnection.addTransceiver('video')
    }
  }

  _assignDataChannel (event) {
    const self = this
    self._dataChannel = event.channel
    self._dataChannel.binaryType = 'arraybuffer'

    self._dataChannel.onclose = function () {
      self._onChannelClose()
    }

    self._dataChannel.onerror = function (errorEvent) {
      const errorMessage = errorEvent.message
      const errorCode = errorCodes.DATA_CHANNEL
      const destroyError = createError(errorMessage, errorCode)
      self.destroy(destroyError)
    }

    self._dataChannel.onmessage = function (event) {
      self._onChannelMessage(event)
    }

    self._dataChannel.onopen = function () {
      self._onChannelOpen()
    }
  }

  _onChannelOpen () {
    if (this._isConnected || this._isDestroyed) return
    this._isConnected = true
    this.emit('connect')
  }

  _onChannelMessage (event) {
    if (!this._isDestroyed) {
      this.emit('data', event.data)
    }
  }

  _onChannelClose () {
    if (!this._isDestroyed) {
      this.destroy()
    }
  }

  _removeDataChannelHandlers () {
    if (this._dataChannel) {
      try {
        this._dataChannel.close()
      } catch (err) {}

      this._dataChannel.onclose = null
      this._dataChannel.onerror = null
      this._dataChannel.onmessage = null
      this._dataChannel.onopen = null
    }
  }

  _removePeerConnectionHandlers () {
    if (this._peerConnection) {
      try {
        this._peerConnection.close()
      } catch (err) {}

      this._peerConnection.onicecandidate = null
      this._peerConnection.oniceconnectionstatechange = null
      this._peerConnection.onicegatheringstatechange = null
      this._peerConnection.onnegotiationneeded = null
      this._peerConnection.onsignalingstatechange = null
      this._peerConnection.ontrack = null

      this._peerConnection.ondatachannel = null
    }
  }

  _checkWebRTCSupport () {
    if (typeof window === 'undefined') {
      throw createError('WebRTC is not supported in this environment', errorCodes.WEBRTC_SUPPORT)
    }

    if (window.RTCPeerConnection == null) {
      throw createError('WebRTC is not supported in this browser', errorCodes.WEBRTC_SUPPORT)
    }

    if (!('createDataChannel' in window.RTCPeerConnection.prototype)) {
      console.log('webrtc-link :: data channel is not supported in this browser')
    }
  }
}

module.exports = WebRTCPeer
