import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { pinoHttp } from 'pino-http'
import logger from './logger'
import healthRouter from './routes/health'

const app = express()

app.use(helmet())

app.use(pinoHttp({ logger }))

// CORS: localhost Vite dev server in development, configured origin in production
const allowedOrigin =
  process.env.NODE_ENV === 'production'
    ? process.env.CORS_ORIGIN
    : 'http://localhost:5173'

app.use(cors({ origin: allowedOrigin, credentials: true }))

app.use(express.json())

// Rate limiting on all API routes — Nginx is the primary limiter; this is a fallback
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests', status: 429 },
})
app.use('/api', apiLimiter)

app.use('/api', healthRouter)

app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found', status: 404 })
})

// Global error handler — must be last and have 4 params for Express to treat it as an error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, 'Unhandled error')
  res.status(500).json({ error: 'Internal server error', status: 500 })
})

export default app
