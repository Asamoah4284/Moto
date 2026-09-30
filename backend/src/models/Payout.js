import mongoose from 'mongoose'

const payoutLineSchema = new mongoose.Schema(
  {
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
    riderName: { type: String, required: true },
    remitted: { type: Number, required: true, min: 0 },
    riderPay: { type: Number, required: true, min: 0 },
    ownerShare: { type: Number, required: true, min: 0 },
    asarionShare: { type: Number, required: true, min: 0 },
  },
  { _id: false },
)

const payoutSchema = new mongoose.Schema(
  {
    weekStart: { type: String, required: true, unique: true, index: true },
    weekEnd: { type: String, required: true },
    riderSharePct: { type: Number, required: true },
    ownerSharePct: { type: Number, required: true },
    asarionSharePct: { type: Number, required: true },
    asarionName: { type: String, required: true },
    currency: { type: String, required: true, default: 'GHS' },
    totalRemitted: { type: Number, required: true, min: 0 },
    totalRiderPay: { type: Number, required: true, min: 0 },
    totalOwnerShare: { type: Number, required: true, min: 0 },
    totalAsarionShare: { type: Number, required: true, min: 0 },
    lines: { type: [payoutLineSchema], default: [] },
    note: { type: String, default: '' },
    issuedBy: { type: String, enum: ['owner', 'manager'], default: 'owner' },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
)

export const Payout = mongoose.model('Payout', payoutSchema)
