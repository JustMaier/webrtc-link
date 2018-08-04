import test from 'tape'

import createError from '../../src/create-error'
import * as errorCodes from '../../src/error-codes'

test('error object is created and returned', assert => {
  // given
  const errorMessage = 'the error message'
  const errorCode = 'ERR_THE_ERROR_CODE'

  // when
  const result = createError(errorMessage, errorCode)

  // then
  assert.true(result instanceof Error)
  assert.is(result.message, errorMessage)
  assert.is(result.code, errorCode)
  assert.end()
})

test('error codes use constants naming convention', assert => {
  // given
  const errorCodeRegex = /^(ERR_)[A-Z][A-Z]*(_[A-Z]+)*$/
  const errorCodesValues = Object.values(errorCodes)

  // then
  errorCodesValues.forEach(function (value) {
    const result = errorCodeRegex.test(value)
    assert.true(result)
  })
  assert.end()
})
