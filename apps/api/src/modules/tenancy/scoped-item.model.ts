import mongoose, { Schema } from 'mongoose';

export interface ScopedItem {
  organizationId: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const scopedItemSchema = new Schema<ScopedItem>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: 'scoped_items' },
);

scopedItemSchema.index({ organizationId: 1, createdAt: -1 });

export const ScopedItemModel =
  mongoose.models.ScopedItem ?? mongoose.model<ScopedItem>('ScopedItem', scopedItemSchema);
