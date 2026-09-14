import mongoose, { Schema } from 'mongoose';

export const MEDIA_TYPES = ['PHOTO'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

export interface Media {
  organizationId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  mediaType: MediaType;
  storageKey: string;
  thumbnailStorageKey: string;
  contentType: string;
  size: number;
  width: number;
  height: number;
  capturedAt: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<Media>(
  {
    organizationId: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: Schema.Types.ObjectId, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, required: true },
    mediaType: { type: String, required: true, enum: MEDIA_TYPES },
    storageKey: { type: String, required: true },
    thumbnailStorageKey: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    capturedAt: { type: Date, required: true },
    deletedAt: { type: Date },
  },
  { timestamps: true, collection: 'media' },
);

// note: org-level retention, parent consent/revocation, and automatic deletion are later tickets. Soft-delete keeps an audit row until then.

mediaSchema.index({ organizationId: 1, studentId: 1, createdAt: -1 });
mediaSchema.index({ organizationId: 1, studentId: 1, capturedAt: -1 });
mediaSchema.index({ organizationId: 1, _id: 1 });

export const MediaModel = mongoose.models.Media ?? mongoose.model<Media>('Media', mediaSchema);
