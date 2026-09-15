import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/repositories/media_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final studentMediaProvider = FutureProvider.autoDispose
    .family<List<StudentMedia>, MediaListArgs>((ref, args) {
      return ref
          .watch(mediaRepositoryProvider)
          .list(studentId: args.studentId, audience: args.audience);
    });

enum MediaUploadPhase { idle, uploading, success, error }

class MediaUploadState {
  const MediaUploadState({
    this.phase = MediaUploadPhase.idle,
    this.progress = 0,
    this.message,
  });

  final MediaUploadPhase phase;
  final double progress;
  final String? message;

  bool get isUploading => phase == MediaUploadPhase.uploading;
}

class MediaUploadController extends StateNotifier<MediaUploadState> {
  MediaUploadController(this._ref, this.studentId)
    : super(const MediaUploadState());

  final Ref _ref;
  final String studentId;
  CancelToken? _cancel;

  Future<void> upload(CapturedPhoto photo) async {
    if (state.isUploading) {
      return;
    }
    _cancel = CancelToken();
    state = const MediaUploadState(phase: MediaUploadPhase.uploading);
    try {
      await _ref
          .read(mediaRepositoryProvider)
          .upload(
            studentId: studentId,
            bytes: photo.bytes,
            filename: photo.filename,
            cancelToken: _cancel,
            onProgress: (sent, total) {
              if (total <= 0) {
                return;
              }
              state = MediaUploadState(
                phase: MediaUploadPhase.uploading,
                progress: sent / total,
              );
            },
          );
      state = const MediaUploadState(
        phase: MediaUploadPhase.success,
        progress: 1,
      );
      _ref.invalidate(studentMediaProvider);
    } catch (error) {
      if (_cancel?.isCancelled == true) {
        state = const MediaUploadState();
        return;
      }
      state = MediaUploadState(
        phase: MediaUploadPhase.error,
        message: error is ApiException ? error.code : 'INTERNAL_ERROR',
      );
    }
  }

  void cancel() {
    _cancel?.cancel();
    state = const MediaUploadState();
  }

  void reset() {
    state = const MediaUploadState();
  }
}

final mediaUploadControllerProvider = StateNotifierProvider.autoDispose
    .family<MediaUploadController, MediaUploadState, String>((ref, studentId) {
      return MediaUploadController(ref, studentId);
    });
