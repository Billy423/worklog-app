import app from './app'
import logger from './logger'

const port = parseInt(process.env.PORT ?? '3000', 10)

app.listen(port, () => {
  logger.info({ port }, 'WorkLog API server started')
})
