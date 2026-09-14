import type { NextFunction, Request, Response } from 'express';
import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middlewares/authenticate';
import { authorize } from '../../middlewares/authorize';
import { tenantContext } from '../../middlewares/tenantContext';
import { env } from '../../config/env';
import { asyncHandler } from '../../utils/asyncHandler';
import { validationError } from '../../utils/validate';
import {
  deleteMediaById,
  getMediaById,
  getSignedFile,
  getStudentMedia,
  postStudentMedia,
} from './media.controller';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.mediaMaxUploadBytes, files: 1 },
});

function uploadPhoto(req: Request, res: Response, next: NextFunction): void {
  upload.single('file')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      next(validationError('file', 'Exceeds the maximum size'));
      return;
    }
    if (err instanceof multer.MulterError) {
      next(validationError('file', 'Invalid upload'));
      return;
    }
    next(err as Error | undefined);
  });
}

export const mediaRouter = Router();

mediaRouter.get('/files', asyncHandler(getSignedFile));
mediaRouter.use(authenticate, tenantContext);
mediaRouter.get('/:mediaId', authorize('media.read'), asyncHandler(getMediaById));
mediaRouter.delete('/:mediaId', authorize('media.delete'), asyncHandler(deleteMediaById));

export const studentMediaRouter = Router();

studentMediaRouter.post(
  '/:studentId/media',
  authorize('media.create'),
  // note: per-user upload rate-limiting waits for shared middleware; size limit is the v1 brake.
  uploadPhoto,
  asyncHandler(postStudentMedia),
);
studentMediaRouter.get('/:studentId/media', authorize('media.read'), asyncHandler(getStudentMedia));
