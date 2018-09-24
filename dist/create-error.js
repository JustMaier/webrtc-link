"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

var _default = createError;
exports.default = _default;
module.exports = exports.default;