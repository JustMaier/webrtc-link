function createError (message, code) {
  const err = new Error(message)
  err.code = code
  return err
}

export default createError
