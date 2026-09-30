import path from 'node:path'
import { fileURLToPath } from 'node:url'
import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import { connectDb } from './db.js'
import { requireAuth } from './middleware/auth.js'
import authRoutes from './routes/auth.js'
import settingsRoutes from './routes/settings.js'
import ridersRoutes from './routes/riders.js'
import remittancesRoutes from './routes/remittances.js'
import payoutsRoutes from './routes/payouts.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const app = express()
const port = Number(process.env.PORT) || 4000

if (!process.env.MONGODB_URI) {
  console.error('Missing MONGODB_URI in .env')
  process.exit(1)
}
if (!process.env.JWT_SECRET) {
  console.error('Missing JWT_SECRET in .env')
  process.exit(1)
}

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.use('/api/auth', authRoutes)
app.use('/api/settings', requireAuth, settingsRoutes)
app.use('/api/riders', requireAuth, ridersRoutes)
app.use('/api/remittances', requireAuth, remittancesRoutes)
app.use('/api/payouts', requireAuth, payoutsRoutes)

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Server error' })
})

await connectDb(process.env.MONGODB_URI)
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})
