import { Router } from 'express'
import { Rider } from '../models/Rider.js'

const router = Router()

function serialize(rider) {
  return {
    id: rider._id.toString(),
    name: rider.name,
    phone: rider.phone || undefined,
    active: rider.active,
    createdAt: rider.createdAt?.toISOString?.() ?? new Date().toISOString(),
  }
}

router.get('/', async (_req, res) => {
  try {
    const riders = await Rider.find().sort({ name: 1 })
    res.json(riders.map(serialize))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load riders' })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, phone } = req.body || {}
    if (typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Rider name required' })
    }
    const rider = await Rider.create({
      name: name.trim(),
      phone: typeof phone === 'string' ? phone.trim() : '',
      active: true,
    })
    res.status(201).json(serialize(rider))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not create rider' })
  }
})

router.patch('/:id', async (req, res) => {
  try {
    const rider = await Rider.findById(req.params.id)
    if (!rider) return res.status(404).json({ error: 'Rider not found' })

    const { name, phone, active } = req.body || {}
    if (typeof name === 'string' && name.trim()) rider.name = name.trim()
    if (typeof phone === 'string') rider.phone = phone.trim()
    if (typeof active === 'boolean') rider.active = active

    await rider.save()
    res.json(serialize(rider))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not update rider' })
  }
})

export default router
