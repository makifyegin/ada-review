const formatValidationErrors = (error, pathPrefix, context) => {
  const transformed = error.errors.map((e) => {
    return {
      path: `${pathPrefix}${e.path}`,
      errorCode: e.validatorKey,
      message: e.message,
      location: 'body',
      context: context,
    }
  })

  return { errors: transformed }
}

module.exports = { formatValidationErrors }
