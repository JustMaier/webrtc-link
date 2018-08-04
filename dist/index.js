"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _events = require("events");

var _createError = _interopRequireDefault(require("./create-error"));

var _createOptions = _interopRequireDefault(require("./create-options"));

var errorCodes = _interopRequireWildcard(require("./error-codes"));

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = Object.defineProperty && Object.getOwnPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : {}; if (desc.get || desc.set) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

var WebRTCPeer =
/*#__PURE__*/
function (_EventEmitter) {
  _inherits(WebRTCPeer, _EventEmitter);

  function WebRTCPeer(options) {
    var _this;

    _classCallCheck(this, WebRTCPeer);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(WebRTCPeer).call(this));

    var self = _assertThisInitialized(_assertThisInitialized(_this));

    self._checkWebRTCSupport();

    self._options = (0, _createOptions.default)(options);
    self._isConnected = false;
    self._isDestroyed = false;
    self._isIceComplete = false;
    self._isNegotiating = false;
    self._shouldRenegotiate = false;
    self._peerConnection = null;
    self._dataChannel = null;
    self._remoteStreamIds = new Set();
    self._mediaTracksMap = new Map();

    self._setUpPeerConnection();

    return _this;
  }

  _createClass(WebRTCPeer, [{
    key: "addStream",
    value: function addStream(stream) {
      var _this2 = this;

      stream.getTracks().forEach(function (track) {
        return _this2.addTrack(track, stream);
      });
    }
  }, {
    key: "addTrack",
    value: function addTrack(track, stream) {
      var rtcRtpSender = this._peerConnection.addTrack(track, stream);

      this._mediaTracksMap.set(track, rtcRtpSender);
    }
  }, {
    key: "destroy",
    value: function destroy(err) {
      var self = this;
      if (self._isDestroyed) return;
      self._isConnected = false;
      self._isDestroyed = true;

      self._removeDataChannelHandlers();

      self._removePeerConnectionHandlers();

      self._dataChannel = null;
      self._peerConnection = null;
      self._mediaTracksMap = null;
      self._remoteStreamIds = null;

      if (err) {
        self.emit('error', err);
      }

      self.emit('close');
    }
  }, {
    key: "getStats",
    value: function getStats() {
      if (this._isDestroyed) {
        throw (0, _createError.default)('cannot getStats after peer is destroyed', errorCodes.PEER_IS_DESTROYED);
      }

      return this._peerConnection.getStats();
    }
  }, {
    key: "isConnected",
    value: function isConnected() {
      return this._isConnected;
    }
  }, {
    key: "isDestroyed",
    value: function isDestroyed() {
      return this._isDestroyed;
    }
  }, {
    key: "removeStream",
    value: function removeStream(stream) {
      var _this3 = this;

      stream.getTracks().forEach(function (track) {
        return _this3.removeTrack(track);
      });
    }
  }, {
    key: "removeTrack",
    value: function removeTrack(track) {
      if (!this._mediaTracksMap.has(track)) {
        throw (0, _createError.default)('cannot remove track that was never added', errorCodes.REMOVE_TRACK);
      }

      var rtcRtpSender = this._mediaTracksMap.get(track);

      this._peerConnection.removeTrack(rtcRtpSender);
    }
  }, {
    key: "send",
    value: function send(data) {
      if (this._isDestroyed) {
        throw (0, _createError.default)('cannot getStats after peer is destroyed', errorCodes.PEER_IS_DESTROYED);
      }

      this._dataChannel.send(data);
    }
  }, {
    key: "signal",
    value: function signal(data) {
      var self = this;

      if (self._isDestroyed) {
        throw (0, _createError.default)('cannot signal after peer is destroyed', errorCodes.SIGNALING);
      }

      var signalData = data;

      if (typeof data === 'string') {
        try {
          signalData = JSON.parse(data);
        } catch (err) {
          signalData = {};
        }
      }

      if (signalData.candidate) {
        self._peerConnection.addIceCandidate(signalData.candidate).catch(onAddIceCandidateError);
      } else if (signalData.sdp) {
        self._setRemoteDescription(signalData);
      } else if (signalData.renegotiate) {
        self._onNegotiationNeeded();
      } else {
        var destroyError = (0, _createError.default)('signal called with invalid signal data', errorCodes.SIGNALING);
        self.destroy(destroyError);
      }

      function onAddIceCandidateError(err) {
        var destroyError = (0, _createError.default)(err, errorCodes.ADD_ICE_CANDIDATE);
        self.destroy(destroyError);
      }
    }
  }, {
    key: "_setRemoteDescription",
    value: function _setRemoteDescription(signalData) {
      var self = this;

      self._peerConnection.setRemoteDescription(signalData).catch(onSetRemoteDescriptionError).then(onSetRemoteDescriptionSuccess);

      function onSetRemoteDescriptionSuccess() {
        if (self._isDestroyed) return;

        if (signalData.type === 'offer') {
          self._createAnswer();
        }
      }

      function onSetRemoteDescriptionError(err) {
        var destroyError = (0, _createError.default)(err, errorCodes.SET_REMOTE_DESCRIPTION);
        self.destroy(destroyError);
      }
    }
  }, {
    key: "_setUpPeerConnection",
    value: function _setUpPeerConnection() {
      var _this4 = this;

      this._peerConnection = new window.RTCPeerConnection(this._options.peerConnectionConfig);

      this._addPeerConnectionHandlers();

      this._setUpDefaultDataChannel();

      this._options.streams.forEach(function (stream) {
        return _this4.addStream(stream);
      });
    }
  }, {
    key: "_addPeerConnectionHandlers",
    value: function _addPeerConnectionHandlers() {
      var self = this;

      self._peerConnection.onicecandidate = function (event) {
        self._onIceCandidate(event);
      };

      self._peerConnection.oniceconnectionstatechange = function () {
        self._onIceConnectionStateChange();
      };

      self._peerConnection.onicegatheringstatechange = function () {
        self._onIceGatheringStateChange();
      };

      self._peerConnection.onnegotiationneeded = function () {
        self._onNegotiationNeeded();
      };

      self._peerConnection.onsignalingstatechange = function () {
        self._onSignalingStateChange();
      };

      self._peerConnection.ontrack = function (event) {
        self._onTrack(event);
      };
    }
  }, {
    key: "_setUpDefaultDataChannel",
    value: function _setUpDefaultDataChannel() {
      var self = this;

      if (self._options.isInitiator) {
        var dataChannel = self._peerConnection.createDataChannel(null, self._options.dataChannelConfig);

        self._assignDataChannel({
          channel: dataChannel
        });
      } else {
        self._peerConnection.ondatachannel = function (event) {
          self._assignDataChannel(event);
        };
      }
    }
  }, {
    key: "_onNegotiationNeeded",
    value: function _onNegotiationNeeded() {
      if (this._options.isInitiator) {
        if (this._isNegotiating) {
          this._shouldRenegotiate = true;
        } else {
          this._createOffer();
        }
      } else {
        this.emit('signal', {
          renegotiate: true
        });
      }

      this._isNegotiating = true;
    }
  }, {
    key: "_createAnswer",
    value: function _createAnswer() {
      var self = this;
      if (self._isDestroyed) return;

      self._peerConnection.createAnswer().catch(onCreateAnswerError).then(onCreateAnswerSuccess).catch(onSetLocalDescriptionError).then(onSetLocalDescriptionSuccess);

      function onCreateAnswerSuccess(answer) {
        if (self._isDestroyed) return;
        answer.sdp = self._options.sdpTransformer(answer.sdp);
        return self._peerConnection.setLocalDescription(answer);
      }

      function onSetLocalDescriptionSuccess(offer) {
        if (self._isDestroyed) return;

        if (self._options.isTrickleIceEnabled || self._isIceComplete) {
          emitAnswer();
        } else {
          self.once('_iceComplete', emitAnswer);
        }
      }

      function onCreateAnswerError(err) {
        var destroyError = (0, _createError.default)(err, errorCodes.CREATE_ANSWER);
        self.destroy(destroyError);
      }

      function onSetLocalDescriptionError(err) {
        var destroyError = (0, _createError.default)(err, errorCodes.SET_LOCAL_DESCRIPTION);
        self.destroy(destroyError);
      }

      function emitAnswer() {
        self.emit('signal', self._peerConnection.localDescription);
      }
    }
  }, {
    key: "_onSignalingStateChange",
    value: function _onSignalingStateChange() {
      if (this._isDestroyed) return;

      if (this._peerConnection.signalingState === 'stable') {
        this._isNegotiating = false;

        if (this._shouldRenegotiate) {
          this._shouldRenegotiate = false;

          this._onNegotiationNeeded();
        }
      }
    }
  }, {
    key: "_onTrack",
    value: function _onTrack(event) {
      var self = this;
      if (self._isDestroyed) return;
      event.streams.forEach(function (eventStream) {
        eventStream.onremovetrack = function (trackEvent) {
          if (self._isDestroyed) return;

          if (!eventStream.active && self._remoteStreamIds.has(eventStream.id)) {
            self._remoteStreamIds.delete(eventStream.id);

            setTimeout(function () {
              self.emit('removestream', eventStream);
            }, 0);
          }

          self.emit('removetrack', trackEvent.track, trackEvent.target);
        };

        setTimeout(function () {
          self.emit('track', event.track, eventStream);
        }, 0);

        var eventHasBeenFired = self._remoteStreamIds.has(eventStream.id);

        if (eventHasBeenFired) return;

        self._remoteStreamIds.add(eventStream.id);

        setTimeout(function () {
          self.emit('stream', eventStream);
        }, 0);
      });
    }
  }, {
    key: "_onIceCandidate",
    value: function _onIceCandidate(event) {
      if (this._isDestroyed) return;

      if (event.candidate && this._options.isTrickleIceEnabled) {
        var iceData = {
          candidate: event.candidate
        };
        this.emit('signal', iceData);
      }
    }
  }, {
    key: "_onIceGatheringStateChange",
    value: function _onIceGatheringStateChange() {
      if (this._isDestroyed) return;
      var iceGatheringState = this._peerConnection.iceGatheringState;

      if (iceGatheringState === 'complete') {
        this._isIceComplete = true;
        this.emit('_iceComplete');
      } else {
        this._isIceComplete = false;
      }
    }
  }, {
    key: "_onIceConnectionStateChange",
    value: function _onIceConnectionStateChange() {
      var self = this;
      if (self._isDestroyed) return;
      var iceConnectionState = self._peerConnection.iceConnectionState;

      if (iceConnectionState === 'failed') {
        self.destroy((0, _createError.default)('Ice connection failed.', errorCodes.ICE_CONNECTION_FAILURE));
      } else if (iceConnectionState === 'closed') {
        self.destroy((0, _createError.default)('ice connection closed', errorCodes.ICE_CONNECTION_CLOSED));
      }
    }
  }, {
    key: "_createOffer",
    value: function _createOffer() {
      var self = this;
      if (self._isDestroyed) return;

      self._acceptIncomingVideoAndAudio(); // Google Chrome requires offerOptions - see issues.md for further information.


      var isTransceiversSupported = 'getTransceivers' in window.RTCPeerConnection.prototype;
      var offerOptions = isTransceiversSupported ? {} : {
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      };

      self._peerConnection.createOffer(offerOptions).catch(onCreateOfferError).then(onCreateOfferSuccess).catch(onSetLocalDescriptionError).then(onSetLocalDescriptionSuccess);

      function onCreateOfferSuccess(offer) {
        if (self._isDestroyed) return;
        offer.sdp = self._options.sdpTransformer(offer.sdp);
        return self._peerConnection.setLocalDescription(offer);
      }

      function onSetLocalDescriptionSuccess(offer) {
        if (self._isDestroyed) return;

        if (self._options.isTrickleIceEnabled || self._isIceComplete) {
          sendOffer();
        } else {
          self.once('_iceComplete', sendOffer);
        }
      }

      function onCreateOfferError(err) {
        self.destroy((0, _createError.default)(err, errorCodes.CREATE_OFFER));
      }

      function onSetLocalDescriptionError(err) {
        self.destroy((0, _createError.default)(err, errorCodes.SET_LOCAL_DESCRIPTION));
      }

      function sendOffer() {
        self.emit('signal', self._peerConnection.localDescription);
      }
    }
  }, {
    key: "_acceptIncomingVideoAndAudio",
    value: function _acceptIncomingVideoAndAudio() {
      var isTransceiversSupported = 'getTransceivers' in window.RTCPeerConnection.prototype;
      if (!isTransceiversSupported) return;

      var audioTransceiver = this._peerConnection.getTransceivers().find(function (transceiver) {
        return transceiver.sender.track && transceiver.sender.track.kind === 'audio';
      });

      var videoTransceiver = this._peerConnection.getTransceivers().find(function (transceiver) {
        return transceiver.sender.track && transceiver.sender.track.kind === 'video';
      });

      if (audioTransceiver == null) {
        this._peerConnection.addTransceiver('audio');
      }

      if (videoTransceiver == null) {
        this._peerConnection.addTransceiver('video');
      }
    }
  }, {
    key: "_assignDataChannel",
    value: function _assignDataChannel(event) {
      var self = this;
      self._dataChannel = event.channel;
      self._dataChannel.binaryType = 'arraybuffer';

      self._dataChannel.onclose = function () {
        self._onChannelClose();
      };

      self._dataChannel.onerror = function (errorEvent) {
        var errorMessage = errorEvent.message;
        var errorCode = errorCodes.DATA_CHANNEL;
        var destroyError = (0, _createError.default)(errorMessage, errorCode);
        self.destroy(destroyError);
      };

      self._dataChannel.onmessage = function (event) {
        self._onChannelMessage(event);
      };

      self._dataChannel.onopen = function () {
        self._onChannelOpen();
      };
    }
  }, {
    key: "_onChannelOpen",
    value: function _onChannelOpen() {
      if (this._isConnected || this._isDestroyed) return;
      this._isConnected = true;
      this.emit('connect');
    }
  }, {
    key: "_onChannelMessage",
    value: function _onChannelMessage(event) {
      if (!this._isDestroyed) {
        this.emit('data', event.data);
      }
    }
  }, {
    key: "_onChannelClose",
    value: function _onChannelClose() {
      if (!this._isDestroyed) {
        this.destroy();
      }
    }
  }, {
    key: "_removeDataChannelHandlers",
    value: function _removeDataChannelHandlers() {
      if (this._dataChannel) {
        try {
          this._dataChannel.close();
        } catch (err) {}

        this._dataChannel.onclose = null;
        this._dataChannel.onerror = null;
        this._dataChannel.onmessage = null;
        this._dataChannel.onopen = null;
      }
    }
  }, {
    key: "_removePeerConnectionHandlers",
    value: function _removePeerConnectionHandlers() {
      if (this._peerConnection) {
        try {
          this._peerConnection.close();
        } catch (err) {}

        this._peerConnection.onicecandidate = null;
        this._peerConnection.oniceconnectionstatechange = null;
        this._peerConnection.onicegatheringstatechange = null;
        this._peerConnection.onnegotiationneeded = null;
        this._peerConnection.onsignalingstatechange = null;
        this._peerConnection.ontrack = null;
        this._peerConnection.ondatachannel = null;
      }
    }
  }, {
    key: "_checkWebRTCSupport",
    value: function _checkWebRTCSupport() {
      if (typeof window === 'undefined') {
        throw (0, _createError.default)('WebRTC is not supported in this environment', errorCodes.WEBRTC_SUPPORT);
      }

      if (window.RTCPeerConnection == null) {
        throw (0, _createError.default)('WebRTC is not supported in this browser', errorCodes.WEBRTC_SUPPORT);
      }

      if (!('createDataChannel' in window.RTCPeerConnection.prototype)) {
        console.log('webrtc-peer :: data channel is not supported in this browser');
      }
    }
  }]);

  return WebRTCPeer;
}(_events.EventEmitter);

var _default = WebRTCPeer;
exports.default = _default;
module.exports = exports.default;