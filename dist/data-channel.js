'use strict'

Object.defineProperty(exports, '__esModule', {
  value: true
})
exports.default = void 0

var _events = require('events')

var _createError = _interopRequireDefault(require('./create-error'))

function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : { default: obj } }

function _typeof (obj) { if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') { _typeof = function _typeof (obj) { return typeof obj } } else { _typeof = function _typeof (obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj } } return _typeof(obj) }

function _classCallCheck (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function') } }

function _defineProperties (target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor) } }

function _createClass (Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor }

function _possibleConstructorReturn (self, call) { if (call && (_typeof(call) === 'object' || typeof call === 'function')) { return call } return _assertThisInitialized(self) }

function _assertThisInitialized (self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called") } return self }

function _getPrototypeOf (o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf (o) { return o.__proto__ || Object.getPrototypeOf(o) }; return _getPrototypeOf(o) }

function _inherits (subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function') } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass) }

function _setPrototypeOf (o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf (o, p) { o.__proto__ = p; return o }; return _setPrototypeOf(o, p) }

var DataChannelWrapper =
/* #__PURE__ */
(function (_EventEmitter) {
  _inherits(DataChannelWrapper, _EventEmitter)

  function DataChannelWrapper (dataChannel) {
    var _this

    _classCallCheck(this, DataChannelWrapper)

    _this = _possibleConstructorReturn(this, _getPrototypeOf(DataChannelWrapper).call(this))
    _this._dataChannel = _this._setUpDataChannel(dataChannel)
    _this._isDestroyed = false
    _this._isConnected = false
    return _this
  }

  _createClass(DataChannelWrapper, [{
    key: '_setUpDataChannel',
    value: function _setUpDataChannel (dataChannel) {
      var self = this
      dataChannel.binaryType = 'arraybuffer'

      dataChannel.onclose = function () {
        self._onChannelClose()
      }

      dataChannel.onerror = function (err) {
        self.destroy((0, _createError.default)(err, errorCodes.DATA_CHANNEL))
      }

      dataChannel.onmessage = function (event) {
        self._onChannelMessage(event)
      }

      dataChannel.onopen = function () {
        self._onChannelOpen()
      }

      return dataChannel
    }
  }, {
    key: 'configuration',
    value: function configuration () {
      return {}
    }
  }, {
    key: 'destroy',
    value: function destroy () {
      this._isDestroyed = true
      this._isConnected = false

      this._removeEventHandlers()
    }
  }, {
    key: 'isConnected',
    value: function isConnected () {
      return this._isConnected
    }
  }, {
    key: 'isDestroyed',
    value: function isDestroyed () {
      return this._isDestroyed
    }
  }, {
    key: 'label',
    value: function label () {
      return this._dataChannel.label
    }
  }, {
    key: 'send',
    value: function send (data) {
      this._dataChannel.send()
    }
  }, {
    key: 'toString',
    value: function toString () {
      return JSON.stringify({
        isConnected: this._isConnected,
        isDestroyed: this._isDestroyed,
        label: this._dataChannel.label
      }, null, 2)
    }
  }, {
    key: '_onChannelClose',
    value: function _onChannelClose () {}
  }, {
    key: '_onChannelOpen',
    value: function _onChannelOpen () {}
  }, {
    key: '_onChannelMessage',
    value: function _onChannelMessage (event) {
      if (self._isDestroyed) return
      self.emit('data', event.data)
    }
  }, {
    key: '_removeEventHandlers',
    value: function _removeEventHandlers () {}
  }])

  return DataChannelWrapper
}(_events.EventEmitter))

var _default = DataChannelWrapper
exports.default = _default
