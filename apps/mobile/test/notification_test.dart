import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/repositories/notification_repository.dart';
import 'package:digital_student/features/notifications/screens/notification_list_screen.dart';
import 'package:digital_student/features/notifications/screens/notification_settings_screen.dart';
import 'package:digital_student/features/notifications/services/push_client.dart';
import 'package:digital_student/features/notifications/widgets/notification_host.dart';
import 'package:digital_student/features/notifications/widgets/notification_tile.dart';
import 'package:digital_student/features/parent/screens/parent_dashboard_screen.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

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
  _SeededAuth(super.repository, User user, {super.notifications}) {
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

ResponseBody _emptyInbox() {
  return _json(200, {
    'data': <dynamic>[],
    'meta': {'page': 1, 'limit': 20, 'total': 0, 'unreadCount': 0},
  });
}

Future<void> _pumpQuiet(WidgetTester tester) async {
  await tester.pump();
  await tester.idle();
  await tester.pump();
  await tester.idle();
  await tester.pump();
}

Future<void> _clearTree(WidgetTester tester) async {
  await tester.pump();
  await tester.idle();
  await tester.pump();
  await tester.pumpWidget(const SizedBox.shrink());
  await tester.pump();
}

User _guardian() {
  return const User(
    id: 'user-1',
    organizationId: 'org-1',
    firstName: 'Sarah',
    lastName: 'Smith',
    email: 'sarah@example.com',
    role: 'GUARDIAN',
  );
}

Map<String, dynamic> _notificationJson({
  String id = 'n-1',
  String type = 'STUDENT_ARRIVAL',
  String studentId = 'stu-1',
  String title = 'Emma has arrived',
  String body = 'Emma has arrived at nursery.',
  String? readAt,
}) {
  return {
    'id': id,
    'studentId': studentId,
    'type': type,
    'title': title,
    'body': body,
    'data': {'type': type, 'studentId': studentId, 'eventId': 'ev-1'},
    'status': readAt == null ? 'SENT' : 'READ',
    'sentAt': '2026-09-14T08:27:05.000Z',
    'readAt': readAt,
    'createdAt': '2026-09-14T08:27:05.000Z',
  };
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TokenStore tokens;
  late FakePushClient push;

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
    FlutterSecureStorage.setMockInitialValues({});
    tokens = TokenStore(const FlutterSecureStorage());
    push = FakePushClient();
  });

  tearDown(() {
    push.dispose();
  });

  List<Override> overrides(Dio dio, {NotificationRepository? repo}) {
    final notifications =
        repo ?? NotificationRepository(dio, const FlutterSecureStorage());
    final authRepo = AuthRepository(AuthApi(dio), tokens);
    return [
      tokenStoreProvider.overrideWithValue(tokens),
      authRepositoryProvider.overrideWithValue(authRepo),
      apiClientProvider.overrideWithValue(dio),
      notificationRepositoryProvider.overrideWithValue(notifications),
      pushClientProvider.overrideWithValue(push),
      authProvider.overrideWith(
        (ref) => _SeededAuth(authRepo, _guardian(), notifications: notifications),
      ),
    ];
  }

  test('groups notification days and parses payloads without extra fields', () {
    expect(
      notificationDayLabel(DateTime(2026, 9, 14, 8), DateTime(2026, 9, 14, 12)),
      'Today',
    );
    expect(
      notificationDayLabel(DateTime(2026, 9, 13, 8), DateTime(2026, 9, 14, 12)),
      'Yesterday',
    );
    final payload = PushPayload.fromData({
      'type': 'STUDENT_ARRIVAL',
      'studentId': 'stu-1',
      'eventId': 'ev-1',
      'qrToken': 'secret',
    });
    expect(payload.studentId, 'stu-1');
    expect(payload.type, 'STUDENT_ARRIVAL');
  });

  testWidgets('shows notification history, badge, and marks read', (tester) async {
    final paths = <String>[];
    var readAt = false;
    final dio = _dio((options) async {
      paths.add('${options.method} ${options.path}');
      if (options.path == '/notifications' && options.method == 'GET') {
        return _json(200, {
          'data': [
            _notificationJson(readAt: readAt ? '2026-09-14T09:00:00.000Z' : null),
          ],
          'meta': {
            'page': 1,
            'limit': 20,
            'total': 1,
            'unreadCount': readAt ? 0 : 1,
          },
        });
      }
      if (options.path.endsWith('/read')) {
        readAt = true;
        return _json(200, _notificationJson(readAt: '2026-09-14T09:00:00.000Z'));
      }
      if (options.path.endsWith('/parent/children')) {
        return _json(200, {
          'items': [
            {
              'id': 'stu-1',
              'firstName': 'Emma',
              'lastName': 'Smith',
              'studentNumber': 'STU-00124',
              'status': 'ACTIVE',
              'classroom': {'id': 'class-1', 'name': 'Nursery A'},
            },
          ],
        });
      }
      if (options.path.contains('/dashboard')) {
        return _json(200, {
          'student': {
            'id': 'stu-1',
            'firstName': 'Emma',
            'lastName': 'Smith',
            'classroom': {'id': 'c1', 'name': 'Nursery A'},
          },
          'attendance': {
            'status': 'PRESENT',
            'recordedAt': '2026-09-14T07:42:00.000Z',
          },
          'journey': {
            'currentState': 'SCHOOL_ARRIVAL',
            'lastEventAt': '2026-09-14T08:27:00.000Z',
          },
        });
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: const MaterialApp(home: ParentDashboardScreen()),
      ),
    );
    await _pumpQuiet(tester);

    expect(find.byKey(const Key('notificationsButton')), findsOneWidget);

    await tester.tap(find.byKey(const Key('notificationsButton')));
    await _pumpQuiet(tester);
    expect(find.text('Emma has arrived'), findsOneWidget);
    expect(find.text('Today'), findsOneWidget);

    await tester.tap(find.byKey(const Key('notificationTile-n-1')));
    await _pumpQuiet(tester);
    expect(paths.any((path) => path.contains('PATCH') && path.contains('/read')), isTrue);
    await _clearTree(tester);
  });

  testWidgets('empty notification list and preference toggles', (tester) async {
    var arrival = true;
    final dio = _dio((options) async {
      if (options.path == '/notifications' && options.method == 'GET') {
        return _json(200, {
          'data': <dynamic>[],
          'meta': {'page': 1, 'limit': 20, 'total': 0, 'unreadCount': 0},
        });
      }
      if (options.path.endsWith('/preferences') && options.method == 'GET') {
        return _json(200, {
          'journeyUpdates': true,
          'studentArrival': arrival,
          'studentDeparture': true,
          'homeDropoff': true,
          'mediaAvailable': true,
        });
      }
      if (options.path.endsWith('/preferences') && options.method == 'PATCH') {
        arrival = (options.data as Map)['studentArrival'] as bool;
        return _json(200, {
          'journeyUpdates': true,
          'studentArrival': arrival,
          'studentDeparture': true,
          'homeDropoff': true,
          'mediaAvailable': true,
        });
      }
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: const MaterialApp(home: NotificationListScreen()),
      ),
    );
    await _pumpQuiet(tester);
    expect(find.text('No notifications yet'), findsOneWidget);

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: const MaterialApp(home: NotificationSettingsScreen()),
      ),
    );
    await _pumpQuiet(tester);
    expect(find.text('Child arrived at nursery'), findsOneWidget);
    await tester.tap(find.byKey(const Key('prefStudentArrival')));
    await _pumpQuiet(tester);
    expect(arrival, isFalse);
    await _clearTree(tester);
  });

  testWidgets('registers and refreshes an FCM token when OS permission is granted', (
    tester,
  ) async {
    final paths = <String>[];
    final tokens = <String>[];
    final dio = _dio((options) async {
      paths.add('${options.method} ${options.path}');
      if (options.path.contains('/notifications/devices') &&
          options.method == 'POST') {
        final raw = options.data;
        final body = raw is Map<String, dynamic>
            ? raw
            : raw is Map
            ? Map<String, dynamic>.from(raw)
            : <String, dynamic>{};
        tokens.add('${body['token']}');
        expect(body.containsKey('userId'), isFalse);
        return _json(201, {
          'id': 'd1',
          'token': body['token'],
          'platform': 'ANDROID',
          'deviceId': 'dev',
          'status': 'ACTIVE',
          'lastUsedAt': '2026-09-14T08:00:00.000Z',
        });
      }
      return _emptyInbox();
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: const MaterialApp(home: NotificationHost(child: SizedBox.expand())),
      ),
    );
    await _pumpQuiet(tester);
    expect(push.initialized, isTrue);
    expect(push.permissionRequests, 1);
    expect(tokens, ['fake-fcm-token']);

    push.emitTokenRefresh('rotated-token');
    await _pumpQuiet(tester);
    expect(tokens, ['fake-fcm-token', 'rotated-token']);
    await _clearTree(tester);
  });

  testWidgets('does not register a device token when OS permission is denied', (
    tester,
  ) async {
    final paths = <String>[];
    push = FakePushClient(permission: OsNotificationPermission.denied);
    final dio = _dio((options) async {
      paths.add('${options.method} ${options.path}');
      return _emptyInbox();
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: const MaterialApp(home: NotificationHost(child: SizedBox.expand())),
      ),
    );
    await _pumpQuiet(tester);
    expect(push.permissionRequests, 1);
    expect(
      paths.any((path) => path.contains('POST') && path.contains('/devices')),
      isFalse,
    );
    await _clearTree(tester);
  });

  testWidgets('foreground banner and terminated-app payload navigate', (tester) async {
    final payload = PushPayload(
      type: 'STUDENT_ARRIVAL',
      studentId: 'stu-1',
      title: 'Emma has arrived',
      body: 'Emma has arrived at nursery.',
    );
    push = FakePushClient(initial: payload);
    final dio = _dio((options) async {
      if (options.path.contains('/read')) {
        return _json(200, _notificationJson(readAt: '2026-09-14T09:00:00.000Z'));
      }
      if (options.path.contains('/parent/children/stu-1/dashboard')) {
        return _json(200, {
          'student': {
            'id': 'stu-1',
            'firstName': 'Emma',
            'lastName': 'Smith',
            'classroom': {'id': 'c1', 'name': 'Nursery A'},
          },
          'attendance': {'status': 'PRESENT', 'recordedAt': '2026-09-14T07:42:00.000Z'},
          'journey': {'currentState': 'SCHOOL_ARRIVAL', 'lastEventAt': '2026-09-14T08:27:00.000Z'},
        });
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      return _emptyInbox();
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: const MaterialApp(home: NotificationHost(child: SizedBox.expand())),
      ),
    );
    await _pumpQuiet(tester);
    await tester.pump();
    expect(find.text('Child'), findsOneWidget);

    await tester.pageBack();
    await _pumpQuiet(tester);

    push.emitForeground(
      const PushPayload(
        type: 'STUDENT_DEPARTURE',
        studentId: 'stu-1',
        title: 'Emma has left',
        body: 'Emma has left nursery.',
      ),
    );
    await tester.pump();
    await tester.pump();
    expect(find.byKey(const Key('foregroundNotificationBanner')), findsOneWidget);
    expect(find.text('Emma has left'), findsOneWidget);
    await _clearTree(tester);
  });

  test('logout unregisters the device token', () async {
    final paths = <String>[];
    FlutterSecureStorage.setMockInitialValues({
      NotificationRepository.deviceIdKey: 'iphone-1',
      TokenStore.accessKey: 'access',
      TokenStore.refreshKey: 'refresh',
    });
    tokens = TokenStore(const FlutterSecureStorage());
    final dio = _dio((options) async {
      paths.add('${options.method} ${options.path}');
      if (options.path.contains('/auth/logout')) {
        return _json(204, {});
      }
      return _json(204, {});
    });
    final notifications = NotificationRepository(dio, const FlutterSecureStorage());
    final authRepo = AuthRepository(AuthApi(dio), tokens);
    final controller = _SeededAuth(authRepo, _guardian(), notifications: notifications);

    await controller.logout();
    expect(
      paths.any((path) => path.contains('DELETE') && path.contains('/devices/iphone-1')),
      isTrue,
    );
    expect(paths.any((path) => path.contains('/auth/logout')), isTrue);
  });
}
