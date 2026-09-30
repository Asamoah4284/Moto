import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'app' },
    businessName: { type: String, default: 'Moto Remit' },
    managerPin: { type: String, default: '1234' },
    ownerPin: { type: String, default: '0000' },
    currency: { type: String, default: 'GHS' },
    riderSharePct: { type: Number, default: 20, min: 0 },
    ownerSharePct: { type: Number, default: 30, min: 0 },
    asarionSharePct: { type: Number, default: 50, min: 0 },
    asarionName: { type: String, default: 'Asarion' },
  },
  { timestamps: true },
)

export const Settings = mongoose.model('Settings', settingsSchema)

export function serializeSettings(settings) {
  return {
    businessName: settings.businessName,
    currency: settings.currency,
    riderSharePct: Number(settings.riderSharePct ?? 20),
    ownerSharePct: Number(settings.ownerSharePct ?? 30),
    asarionSharePct: Number(settings.asarionSharePct ?? 50),
    asarionName: settings.asarionName || 'Asarion',
  }
}

export async function getSettings() {
  let doc = await Settings.findOne({ key: 'app' })
  if (!doc) {
    doc = await Settings.create({ key: 'app' })
  }
  return doc
}
