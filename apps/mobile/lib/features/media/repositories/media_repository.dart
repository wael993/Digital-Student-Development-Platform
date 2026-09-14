import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/media/models/student_media.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class MediaRepository {
  MediaRepository(this._dio);

  final Dio _dio;

  Future<List<StudentMedia>> list({
    required String studentId,
    required MediaAudience audience,
  }) async {
    final path = audience == MediaAudience.parent
        ? '/parent/children/$studentId/media'
        : '/students/$studentId/media';
    try {
      final response = await _dio.get<Map<String, dynamic>>(path);
      final body = requireData(response.data);
      final items = body['items'] as List<dynamic>? ?? [];
      return items
          .map(
            (row) =>
                _reachable(StudentMedia.fromJson(row as Map<String, dynamic>)),
          )
          .toList();
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<StudentMedia> upload({
    required String studentId,
    required List<int> bytes,
    required String filename,
    DateTime? capturedAt,
    void Function(int sent, int total)? onProgress,
    CancelToken? cancelToken,
  }) async {
    try {
      final form = FormData.fromMap({
        'mediaType': 'PHOTO',
        'capturedAt': (capturedAt ?? DateTime.now().toUtc()).toIso8601String(),
        'file': MultipartFile.fromBytes(bytes, filename: filename),
      });
      final response = await _dio.post<Map<String, dynamic>>(
        '/students/$studentId/media',
        data: form,
        cancelToken: cancelToken,
        onSendProgress: onProgress,
        options: Options(
          contentType: Headers.multipartFormDataContentType,
          sendTimeout: const Duration(seconds: 60),
          receiveTimeout: const Duration(seconds: 60),
        ),
      );
      final media = requireData(response.data)['media'] as Map<String, dynamic>;
      return StudentMedia.fromJson(media);
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  StudentMedia _reachable(StudentMedia media) {
    return StudentMedia(
      id: media.id,
      mediaType: media.mediaType,
      contentType: media.contentType,
      capturedAt: media.capturedAt,
      width: media.width,
      height: media.height,
      createdAt: media.createdAt,
      thumbnailUrl: _reachableUrl(media.thumbnailUrl),
      url: _reachableUrl(media.url),
    );
  }

  String? _reachableUrl(String? url) {
    if (url == null || url.isEmpty) {
      return url;
    }
    final signed = Uri.tryParse(url);
    final base = Uri.tryParse(_dio.options.baseUrl);
    if (signed == null ||
        base == null ||
        !signed.hasScheme ||
        (signed.host != 'localhost' && signed.host != '127.0.0.1')) {
      return url;
    }
    return signed
        .replace(host: base.host, port: base.hasPort ? base.port : signed.port)
        .toString();
  }
}

final mediaRepositoryProvider = Provider<MediaRepository>(
  (ref) => MediaRepository(ref.watch(apiClientProvider)),
);
