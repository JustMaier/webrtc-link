"use strict";

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

module.exports = createError;