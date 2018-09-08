function createOptions (inputOptions) {
  const userOptions = inputOptions || {}

  return {
    dataChannelConfig: userOptions.dataChannelConfig || {},
    isInitiator: userOptions.isInitiator === true,
    isTrickleIceEnabled: !(userOptions.isTrickleIceEnabled === false),
    peerConnectionConfig: getPeerConnectionConfig(userOptions),
    sdpTransformer: getSdpTransformer(userOptions),
    streams: getStreams(userOptions)
  }
}

function getPeerConnectionConfig (userOptions) {
  const peerConnectionConfig = userOptions.peerConnectionConfig || {}

  // Required by Google Chrome version 69.
  // This can be removed in the future when 'unified-plan'
  // becomes the default.
  peerConnectionConfig.sdpSemantics = 'unified-plan'

  if (!Array.isArray(peerConnectionConfig.iceServers)) {
    peerConnectionConfig.iceServers = []
  }
  return peerConnectionConfig
}

function getSdpTransformer (userOptions) {
  return typeof userOptions.sdpTransformer === 'function'
    ? userOptions.sdpTransformer
    : sdp => sdp
}

function getStreams (userOptions) {
  return Array.isArray(userOptions.streams) ? userOptions.streams : []
}

export default createOptions
