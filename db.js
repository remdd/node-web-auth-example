const logger = require('tracer').colorConsole()
const mongoose = require('mongoose')

module.exports.start = () => {
  const MONGO_URL = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_URL}`

  mongoose.connect(MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })

  mongoose.connection.once('open', () => {
    logger.info('mongoose: connection opened')
  })

  mongoose.connection.on('connected', () => {
    logger.info('mongoose: connected')
  })

  mongoose.connection.on('disconnected', () => {
    logger.info('mongoose: disconnected')
  })

  mongoose.connection.on('reconnected', () => {
    logger.info('mongoose: reconnected')
  })

  mongoose.connection.on('error', (err) => {
    logger.info(`mongoose: error: ${err}`)
  })
}
