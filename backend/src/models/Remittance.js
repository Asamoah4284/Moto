import mongoose from 'mongoose'

const remittanceSchema = new mongoose.Schema(
  {
    riderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Rider',
      required: true,
      index: true,
    },
    date: { type: String, required: true, index: true },
    actual: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true, default: '' },
    recordedBy: { type: String, enum: ['owner', 'manager'], required: true },
  },
  { timestamps: true },
)

export const Remittance = mongoose.model('Remittance', remittanceSchema)
