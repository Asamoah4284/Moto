import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { getSettings, serializeSettings } from '../models/Settings.js'

const router = Router()

router.post('/login', async (req, res) => {
  try {
    const { role, pin } = req.body || {}
    if (role !== 'owner' && role !== 'manager') {
      return res.status(400).json({ error: 'Choose Owner or Manager' })
    }
    if (typeof pin !== 'string' || !pin.trim()) {
      return res.status(400).json({ error: 'PIN required' })
    }

    const settings = await getSettings()
    const expected = role === 'owner' ? settings.ownerPin : settings.managerPin
    if (pin.trim() !== expected) {
      return res.status(401).json({ error: 'Incorrect PIN' })
    }

    const token = jwt.sign({ role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    })

    res.json({
      token,
      role,
      settings: serializeSettings(settings),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Login failed' })
  }
})

export default router
