"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function createOptions(inputOptions) {
  var userOptions = inputOptions || {};
  return {
    dataChannelConfig: userOptions.dataChannelConfig || {},
    isInitiator: userOptions.isInitiator === true,
    isTrickleIceEnabled: !(userOptions.isTrickleIceEnabled === false),
    peerConnectionConfig: getPeerConnectionConfig(userOptions),
    sdpTransformer: getSdpTransformer(userOptions),
    streams: getStreams(userOptions)
  };
}

function getPeerConnectionConfig(userOptions) {
  var peerConnectionConfig = userOptions.peerConnectionConfig || {};

  if (!Array.isArray(peerConnectionConfig.iceServers)) {
    peerConnectionConfig.iceServers = [];
  }

  return peerConnectionConfig;
}

function getSdpTransformer(userOptions) {
  return typeof userOptions.sdpTransformer === 'function' ? userOptions.sdpTransformer : function (sdp) {
    return sdp;
  };
}

function getStreams(userOptions) {
  return Array.isArray(userOptions.streams) ? userOptions.streams : [];
}

var _default = createOptions;
exports.default = _default;
module.exports = exports.default;