import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/repositories/media_repository.dart';
import 'package:digital_student/features/media/screens/photo_capture_screen.dart';
import 'package:digital_student/features/media/screens/photo_gallery_screen.dart';
import 'package:digital_student/features/media/screens/photo_viewer_screen.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

import 'support/localized_app.dart';

class _Adapter implements HttpClientAdapter {
  _Adapter(this._fetch);

  final Future<ResponseBody> Function(RequestOptions options) _fetch;

  @override
  void close({bool force = false}) {}

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) {
    return _fetch(options);
  }
}

class _SeededAuth extends AuthController {
  _SeededAuth(super.repository, User user) {
    state = AuthState(status: AuthStatus.authenticated, user: user);
  }
}

ResponseBody _json(int status, Map<String, dynamic> data) {
  return ResponseBody.fromString(
    jsonEncode(data),
    status,
    headers: {
      Headers.contentTypeHeader: [Headers.jsonContentType],
    },
  );
}

Dio _dio(Future<ResponseBody> Function(RequestOptions options) fetch) {
  final dio = Dio(
    BaseOptions(
      baseUrl: 'http://test',
      connectTimeout: const Duration(milliseconds: 200),
      receiveTimeout: const Duration(seconds: 2),
    ),
  );
  dio.httpClientAdapter = _Adapter(fetch);
  return dio;
}

User _teacher() {
  return const User(
    id: 'user-1',
    organizationId: 'org-1',
    firstName: 'Ada',
    lastName: 'Admin',
    email: 'ada@example.com',
    role: 'TEACHER',
  );
}

User _guardian() {
  return const User(
    id: 'user-2',
    organizationId: 'org-1',
    firstName: 'Sarah',
    lastName: 'Smith',
    email: 'sarah@example.com',
    role: 'GUARDIAN',
  );
}

final Uint8List _png = Uint8List.fromList(
  base64Decode(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  ),
);

Map<String, dynamic> _mediaJson({
  String id = 'media-1',
  String url = 'http://test/signed/original',
  String thumb = 'http://test/signed/thumb',
}) {
  return {
    'id': id,
    'mediaType': 'PHOTO',
    'contentType': 'image/jpeg',
    'width': 16,
    'height': 10,
    'capturedAt': '2026-09-14T10:45:00.000Z',
    'createdAt': '2026-09-14T10:45:03.000Z',
    'thumbnailUrl': thumb,
    'url': url,
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TokenStore tokens;

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
    FlutterSecureStorage.setMockInitialValues({});
    tokens = TokenStore(const FlutterSecureStorage());
  });

  List<Override> overrides(Dio dio, User user) {
    final repo = AuthRepository(AuthApi(dio), tokens);
    return [
      tokenStoreProvider.overrideWithValue(tokens),
      authRepositoryProvider.overrideWithValue(repo),
      apiClientProvider.overrideWithValue(dio),
      mediaRepositoryProvider.overrideWithValue(MediaRepository(dio)),
      authProvider.overrideWith((ref) => _SeededAuth(repo, user)),
    ];
  }

  testWidgets('shows camera permission denied and open settings', (
    tester,
  ) async {
    var openedSettings = false;
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(_dio((_) async => _json(404, {})), _teacher()),
        child: localizedApp(
          home: PhotoCaptureScreen(
            studentId: 'stu-1',
            requestCameraPermission: () async => CameraPermissionResult.denied,
            openSettings: () async {
              openedSettings = true;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('takePhotoButton')));
    await tester.pump();
    expect(
      find.text('Camera access is required to take a photo.'),
      findsOneWidget,
    );
    await tester.tap(find.byKey(const Key('openSettingsButton')));
    await tester.pump();
    expect(openedSettings, isTrue);
  });

  testWidgets('previews, retakes, uploads with progress, and reloads gallery', (
    tester,
  ) async {
    var captures = 0;
    var uploads = 0;
    final dio = _dio((options) async {
      if (options.method == 'POST' &&
          options.path.contains('/students/stu-1/media')) {
        uploads += 1;
        expect(options.data, isA<FormData>());
        await Future<void>.delayed(const Duration(milliseconds: 40));
        return _json(201, {
          'media': {
            'id': 'media-1',
            'mediaType': 'PHOTO',
            'contentType': 'image/jpeg',
            'width': 16,
            'height': 10,
            'capturedAt': '2026-09-14T10:45:00.000Z',
            'createdAt': '2026-09-14T10:45:03.000Z',
          },
        });
      }
      if (options.path.contains('/students/stu-1/media')) {
        return _json(200, {
          'items': uploads == 0 ? <dynamic>[] : [_mediaJson()],
        });
      }
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio, _teacher()),
        child: localizedApp(
          home: PhotoCaptureScreen(
            studentId: 'stu-1',
            requestCameraPermission: () async => CameraPermissionResult.granted,
            capturePhoto: () async {
              captures += 1;
              return CapturedPhoto(bytes: _png, filename: 'photo.jpg');
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('takePhotoButton')));
    await tester.pump();
    expect(find.byKey(const Key('photoPreview')), findsOneWidget);

    await tester.tap(find.byKey(const Key('retakePhotoButton')));
    await tester.pump();
    expect(captures, 2);

    await tester.tap(find.byKey(const Key('usePhotoButton')));
    await tester.pump();
    expect(find.byKey(const Key('photoUploadProgress')), findsOneWidget);
    await tester.pump(const Duration(milliseconds: 50));
    await tester.idle();
    await tester.pump();
    expect(find.text('Photo uploaded'), findsOneWidget);
    expect(uploads, 1);
    expect(find.byKey(const Key('usePhotoButton')), findsNothing);
  });

  testWidgets('chooses a gallery photo and shows upload failure', (
    tester,
  ) async {
    final dio = _dio((options) async {
      if (options.method == 'POST') {
        return _json(500, {
          'error': {'code': 'INTERNAL_ERROR', 'message': 'Upload failed'},
        });
      }
      return _json(200, {'items': <dynamic>[]});
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio, _teacher()),
        child: localizedApp(
          home: PhotoCaptureScreen(
            studentId: 'stu-1',
            pickGallery: () async =>
                CapturedPhoto(bytes: _png, filename: 'gallery.jpg'),
          ),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('chooseGalleryButton')));
    await tester.pump();
    expect(find.byKey(const Key('photoPreview')), findsOneWidget);
    await tester.tap(find.byKey(const Key('usePhotoButton')));
    await tester.pump();
    await tester.idle();
    await tester.pump();
    expect(find.text('Upload failed'), findsOneWidget);
  });

  testWidgets('parent gallery shows photos, empty, viewer, and auth errors', (
    tester,
  ) async {
    final emptyDio = _dio((options) async {
      expect(options.path.contains('/parent/children/stu-1/media'), isTrue);
      return _json(200, {'items': <dynamic>[]});
    });
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(emptyDio, _guardian()),
        child: localizedApp(
          home: PhotoGalleryScreen(
            studentId: 'stu-1',
            audience: MediaAudience.parent,
            title: "Emma's Photos",
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();
    expect(find.text("Emma's Photos"), findsOneWidget);
    expect(find.text('No photos yet'), findsOneWidget);

    final loadedDio = _dio((options) async {
      return _json(200, {
        'items': [_mediaJson(thumb: '', url: '')],
      });
    });
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(loadedDio, _guardian()),
        child: localizedApp(
          home: PhotoGalleryScreen(
            studentId: 'stu-1',
            audience: MediaAudience.parent,
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();
    expect(find.byKey(const Key('photoGrid')), findsOneWidget);
    await tester.tap(find.byKey(const Key('photoTile-media-1')));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));
    expect(find.byType(PhotoViewerScreen), findsOneWidget);

    final deniedDio = _dio((options) async {
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(deniedDio, _guardian()),
        child: localizedApp(
          home: PhotoGalleryScreen(
            studentId: 'stu-2',
            audience: MediaAudience.parent,
          ),
        ),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();
    expect(
      find.text('You do not have access to these photos.'),
      findsOneWidget,
    );
  });
}
