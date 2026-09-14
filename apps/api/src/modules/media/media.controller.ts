import type { Request, Response } from 'express';
import { DEFAULT_TIMEZONE } from '../organizations/organization.model';
import { requireAuth } from '../../utils/requireAuth';
import * as mediaService from './media.service';
import {
  parseMediaIdParam,
  parseMediaListQuery,
  parseSignedFileQuery,
  parseStudentIdParam,
  parseUploadFields,
} from './media.validation';

function tenantTimezone(req: Request): string {
  return req.tenantTimezone || DEFAULT_TIMEZONE;
}

export async function postStudentMedia(req: Request, res: Response): Promise<void> {
  const result = await mediaService.uploadStudentPhoto(
    requireAuth(req),
    parseStudentIdParam(req.params.studentId),
    { ...parseUploadFields(req.body ?? {}), file: req.file },
  );
  res.status(201).json(result);
}

export async function getStudentMedia(req: Request, res: Response): Promise<void> {
  const result = await mediaService.listStudentPhotos(
    requireAuth(req),
    parseStudentIdParam(req.params.studentId),
    parseMediaListQuery(req.query),
    tenantTimezone(req),
  );
  res.status(200).json(result);
}

export async function getMediaById(req: Request, res: Response): Promise<void> {
  const result = await mediaService.getMedia(
    requireAuth(req),
    parseMediaIdParam(req.params.mediaId),
  );
  res.status(200).json(result);
}

export async function deleteMediaById(req: Request, res: Response): Promise<void> {
  await mediaService.deleteMedia(requireAuth(req), parseMediaIdParam(req.params.mediaId));
  res.status(204).send();
}

export async function getSignedFile(req: Request, res: Response): Promise<void> {
  const result = await mediaService.readSignedFile(parseSignedFileQuery(req.query));
  res.setHeader('Content-Type', result.contentType);
  res.setHeader('Cache-Control', 'private, max-age=0, no-store');
  res.status(200).send(result.body);
}
