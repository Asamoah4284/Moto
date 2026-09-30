import { Router } from 'express'
import { getSettings, serializeSettings } from '../models/Settings.js'
import { requireOwner } from '../middleware/auth.js'

const router = Router()

function toPct(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

function sharesSumOk(rider, owner, asarion) {
  const sum = Math.round((rider + owner + asarion) * 100) / 100
  return Math.abs(sum - 100) < 0.01
}

router.get('/', async (_req, res) => {
  try {
    const settings = await getSettings()
    res.json(serializeSettings(settings))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load settings' })
  }
})

router.patch('/', requireOwner, async (req, res) => {
  try {
    const settings = await getSettings()
    const {
      businessName,
      currency,
      ownerPin,
      managerPin,
      riderSharePct,
      ownerSharePct,
      asarionSharePct,
      asarionName,
    } = req.body || {}

    if (typeof businessName === 'string' && businessName.trim()) {
      settings.businessName = businessName.trim()
    }
    if (typeof currency === 'string' && currency.trim()) {
      settings.currency = currency.trim().toUpperCase()
    }
    if (typeof ownerPin === 'string' && ownerPin.trim()) {
      settings.ownerPin = ownerPin.trim()
    }
    if (typeof managerPin === 'string' && managerPin.trim()) {
      settings.managerPin = managerPin.trim()
    }
    if (typeof asarionName === 'string' && asarionName.trim()) {
      settings.asarionName = asarionName.trim()
    }

    const nextRider = toPct(riderSharePct, settings.riderSharePct ?? 20)
    const nextOwner = toPct(ownerSharePct, settings.ownerSharePct ?? 30)
    const nextAsarion = toPct(asarionSharePct, settings.asarionSharePct ?? 50)

    if (nextRider < 0 || nextOwner < 0 || nextAsarion < 0) {
      return res.status(400).json({ error: 'Share percentages cannot be negative' })
    }
    if (!sharesSumOk(nextRider, nextOwner, nextAsarion)) {
      return res
        .status(400)
        .json({ error: 'Rider, moto owner, and Asarion shares must add up to 100%' })
    }

    settings.riderSharePct = nextRider
    settings.ownerSharePct = nextOwner
    settings.asarionSharePct = nextAsarion

    await settings.save()
    res.json(serializeSettings(settings))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not update settings' })
  }
})

export default router
