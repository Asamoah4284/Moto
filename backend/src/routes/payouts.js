import { Router } from 'express'
import { Payout } from '../models/Payout.js'
import { Remittance } from '../models/Remittance.js'
import { Rider } from '../models/Rider.js'
import { getSettings } from '../models/Settings.js'
import { requireOwner } from '../middleware/auth.js'
import {
  endOfWeekFromStart,
  endOfWeekISO,
  isWeekComplete,
  previousWeekRange,
  splitAmount,
  startOfWeekISO,
  todayISO,
} from '../utils/week.js'

const router = Router()

function serialize(doc) {
  return {
    id: doc._id.toString(),
    weekStart: doc.weekStart,
    weekEnd: doc.weekEnd,
    riderSharePct: doc.riderSharePct,
    ownerSharePct: doc.ownerSharePct,
    asarionSharePct: doc.asarionSharePct,
    asarionName: doc.asarionName,
    currency: doc.currency,
    totalRemitted: doc.totalRemitted,
    totalRiderPay: doc.totalRiderPay,
    totalOwnerShare: doc.totalOwnerShare,
    totalAsarionShare: doc.totalAsarionShare,
    lines: (doc.lines || []).map((line) => ({
      riderId: line.riderId.toString(),
      riderName: line.riderName,
      remitted: line.remitted,
      riderPay: line.riderPay,
      ownerShare: line.ownerShare,
      asarionShare: line.asarionShare,
    })),
    note: doc.note || undefined,
    issuedBy: doc.issuedBy,
    issuedAt: doc.issuedAt?.toISOString?.() ?? new Date().toISOString(),
    createdAt: doc.createdAt?.toISOString?.(),
  }
}

async function buildWeekSnapshot(weekStart, weekEnd) {
  const settings = await getSettings()
  const shares = {
    rider: Number(settings.riderSharePct ?? 20),
    owner: Number(settings.ownerSharePct ?? 30),
    asarion: Number(settings.asarionSharePct ?? 50),
  }

  const remittances = await Remittance.find({
    date: { $gte: weekStart, $lte: weekEnd },
  })

  const riders = await Rider.find()
  const nameMap = new Map(riders.map((r) => [r._id.toString(), r.name]))

  const byRider = new Map()
  for (const row of remittances) {
    const id = row.riderId.toString()
    const existing = byRider.get(id) ?? {
      riderId: row.riderId,
      riderName: nameMap.get(id) ?? 'Unknown rider',
      remitted: 0,
    }
    existing.remitted += row.actual
    byRider.set(id, existing)
  }

  const lines = [...byRider.values()]
    .map((row) => {
      const split = splitAmount(row.remitted, shares)
      return {
        riderId: row.riderId,
        riderName: row.riderName,
        remitted: row.remitted,
        riderPay: split.rider,
        ownerShare: split.owner,
        asarionShare: split.asarion,
      }
    })
    .sort((a, b) => b.remitted - a.remitted)

  const totals = lines.reduce(
    (acc, line) => {
      acc.totalRemitted += line.remitted
      acc.totalRiderPay += line.riderPay
      acc.totalOwnerShare += line.ownerShare
      acc.totalAsarionShare += line.asarionShare
      return acc
    },
    {
      totalRemitted: 0,
      totalRiderPay: 0,
      totalOwnerShare: 0,
      totalAsarionShare: 0,
    },
  )

  return {
    weekStart,
    weekEnd,
    riderSharePct: shares.rider,
    ownerSharePct: shares.owner,
    asarionSharePct: shares.asarion,
    asarionName: settings.asarionName || 'Asarion',
    currency: settings.currency || 'GHS',
    ...totals,
    lines,
  }
}

function previewFromSnapshot(snapshot) {
  return {
    totalRemitted: snapshot.totalRemitted,
    totalRiderPay: snapshot.totalRiderPay,
    totalOwnerShare: snapshot.totalOwnerShare,
    totalAsarionShare: snapshot.totalAsarionShare,
    lineCount: snapshot.lines.length,
  }
}

router.get('/', async (_req, res) => {
  try {
    const rows = await Payout.find().sort({ weekStart: -1 })
    res.json(rows.map(serialize))
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load payouts' })
  }
})

router.get('/current', async (_req, res) => {
  try {
    const weekStart = startOfWeekISO()
    const weekEnd = endOfWeekISO()
    const today = todayISO()
    const weekComplete = isWeekComplete(weekEnd)
    const existing = await Payout.findOne({ weekStart })
    const preview = await buildWeekSnapshot(weekStart, weekEnd)

    const prev = previousWeekRange()
    const previousExisting = await Payout.findOne({ weekStart: prev.weekStart })
    const previousPreview = await buildWeekSnapshot(prev.weekStart, prev.weekEnd)
    const previousComplete = isWeekComplete(prev.weekEnd)
    const previousPayable =
      previousComplete &&
      !previousExisting &&
      previousPreview.totalRemitted > 0

    res.json({
      today,
      weekStart,
      weekEnd,
      weekComplete,
      canIssue: weekComplete && !existing && preview.totalRemitted > 0,
      issued: Boolean(existing),
      payout: existing ? serialize(existing) : null,
      preview: previewFromSnapshot(preview),
      previousWeek: {
        weekStart: prev.weekStart,
        weekEnd: prev.weekEnd,
        weekComplete: previousComplete,
        issued: Boolean(previousExisting),
        canIssue: previousPayable,
        payout: previousExisting ? serialize(previousExisting) : null,
        preview: previewFromSnapshot(previousPreview),
      },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Could not load current week payout status' })
  }
})

router.post('/issue', requireOwner, async (req, res) => {
  try {
    const today = todayISO()
    const currentStart = startOfWeekISO()
    const currentEnd = endOfWeekISO()
    const prev = previousWeekRange()

    let weekStart =
      typeof req.body?.weekStart === 'string' && req.body.weekStart
        ? req.body.weekStart
        : null

    if (!weekStart) {
      // Prefer previous unpaid completed week, else current if complete.
      const prevExisting = await Payout.findOne({ weekStart: prev.weekStart })
      if (isWeekComplete(prev.weekEnd) && !prevExisting) {
        weekStart = prev.weekStart
      } else if (isWeekComplete(currentEnd)) {
        weekStart = currentStart
      } else {
        return res.status(400).json({
          error:
            'Week is not over yet. Issue payout from Friday (week end) onward.',
        })
      }
    }

    const weekEnd = endOfWeekFromStart(weekStart)
    if (today < weekEnd) {
      return res.status(400).json({
        error:
          'Week is not over yet. Issue payout from Friday (week end) onward.',
      })
    }

    // Only allow issuing current or immediate previous week.
    if (weekStart !== currentStart && weekStart !== prev.weekStart) {
      return res.status(400).json({
        error: 'You can only issue payout for the current or previous week.',
      })
    }

    const existing = await Payout.findOne({ weekStart })
    if (existing) {
      return res.status(409).json({
        error: 'This week already has a payout. View it in Payouts history.',
        payout: serialize(existing),
      })
    }

    const snapshot = await buildWeekSnapshot(weekStart, weekEnd)
    if (snapshot.totalRemitted <= 0 || snapshot.lines.length === 0) {
      return res.status(400).json({
        error: 'No remittances this week to pay out.',
      })
    }

    const note =
      typeof req.body?.note === 'string' ? req.body.note.trim() : ''

    const payout = await Payout.create({
      ...snapshot,
      note,
      issuedBy: req.user.role,
      issuedAt: new Date(),
    })

    res.status(201).json(serialize(payout))
  } catch (err) {
    if (err?.code === 11000) {
      return res
        .status(409)
        .json({ error: 'This week already has a payout.' })
    }
    console.error(err)
    res.status(500).json({ error: 'Could not issue payout' })
  }
})

export default router
