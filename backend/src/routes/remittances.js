import { Router } from 'express'
import mongoose from 'mongoose'
import { Remittance } from '../models/Remittance.js'
import { Rider } from '../models/Rider.js'

const router = Router()

function serialize(doc) {
  return {
    id: doc._id.toString(),
    riderId: doc.riderId.toString(),
    date: doc.date,
    actual: doc.actual,
    note: doc.note || undefined,
    recordedBy: doc.recordedBy,
    createdAt: doc.createdAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

router.get('/', async (req, res) => {
  try {
    const filter = {}
    if (req.query.riderId) filter.riderId = req.query.riderId
    if (req.query.from || req.query.to) {
      filter.date = {}
      if (req.query.from) filter.date.$gte = String(req.query.from)
      if (req.query.to) filter.date.$lte = String(req.query.to)
    }
    const rows = await Remittance.find(filter).sort({ date: -1, createdAt: -1 })
    res.json(rows.map(serialize))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load remittances' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { riderId, date, actual, note } = req.body || {}
    if (!riderId || !mongoose.isValidObjectId(riderId)) {
      return res.status(400).json({ error: 'Valid rider required' })
    }
    if (typeof date !== 'string' || !date) {
      return res.status(400).json({ error: 'Date required' })
    }
    const rider = await Rider.findById(riderId)
    if (!rider) return res.status(404).json({ error: 'Rider not found' })

    const actualNum = Number(actual) || 0
    const doc = await Remittance.create({
      riderId,
      date,
      actual: actualNum,
      note: typeof note === 'string' ? note.trim() : '',
      recordedBy: req.user.role,
    })
    res.status(201).json(serialize(doc))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not save remittance' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const doc = await Remittance.findById(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Remittance not found' })

    const { riderId, date, actual, note } = req.body || {}
    if (riderId) {
      if (!mongoose.isValidObjectId(riderId)) {
        return res.status(400).json({ error: 'Valid rider required' })
      }
      const rider = await Rider.findById(riderId)
      if (!rider) return res.status(404).json({ error: 'Rider not found' })
      doc.riderId = riderId
    }
    if (typeof date === 'string' && date) doc.date = date
    if (actual !== undefined) doc.actual = Number(actual) || 0
    if (note !== undefined) doc.note = String(note).trim()

    await doc.save()
    res.json(serialize(doc))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not update remittance' })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Remittance.findByIdAndDelete(req.params.id)
    if (!doc) return res.status(404).json({ error: 'Remittance not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not delete remittance' })
  }
})

export default router
