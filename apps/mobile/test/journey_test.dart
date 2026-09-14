import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/journey/journey_repository.dart';
import 'package:digital_student/features/journey/presentation/journey_page.dart';
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

User _user({String role = 'TEACHER'}) {
  return User(
    id: 'user-1',
    organizationId: 'org-1',
    firstName: 'Ada',
    lastName: 'Admin',
    email: 'ada@example.com',
    role: role,
  );
}

Map<String, dynamic> _journeyBody({
  String? currentState = 'CLASS_STARTED',
  List<Map<String, dynamic>>? events,
}) {
  return {
    'student': {
      'id': 'stu-1',
      'firstName': 'Emma',
      'lastName': 'Smith',
    },
    'currentState': currentState,
    'events': events ??
        [
          {
            'id': 'ev-1',
            'eventType': 'ATTENDANCE_PRESENT',
            'occurredAt': '2026-09-14T07:42:00.000Z',
            'recordedAt': '2026-09-14T07:42:04.000Z',
            'source': 'QR',
            'metadata': {'attendanceId': 'att-1'},
          },
          {
            'id': 'ev-2',
            'eventType': 'SCHOOL_ARRIVAL',
            'occurredAt': '2026-09-14T08:27:00.000Z',
            'recordedAt': '2026-09-14T08:27:04.000Z',
            'source': 'MANUAL',
            'metadata': <String, dynamic>{},
          },
          {
            'id': 'ev-3',
            'eventType': 'CLASS_STARTED',
            'occurredAt': '2026-09-14T08:35:00.000Z',
            'recordedAt': '2026-09-14T08:35:04.000Z',
            'source': 'MANUAL',
            'metadata': <String, dynamic>{},
          },
        ],
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
      journeyRepositoryProvider.overrideWithValue(JourneyRepository(dio)),
      authProvider.overrideWith((ref) => _SeededAuth(repo, user)),
    ];
  }

  Future<void> pumpJourney(
    WidgetTester tester, {
    required Dio dio,
    String role = 'TEACHER',
  }) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio, _user(role: role)),
        child: const MaterialApp(home: JourneyPage(studentId: 'stu-1')),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();
  }

  testWidgets("loads today's journey in chronological order", (tester) async {
    final dio = _dio((options) async {
      expect(options.path, contains('/students/stu-1/journey/today'));
      return _json(200, _journeyBody());
    });

    await pumpJourney(tester, dio: dio);

    expect(find.text('Emma Smith'), findsOneWidget);
    expect(find.byKey(const Key('journeyCurrentState')), findsOneWidget);
    expect(find.text('Currently in class'), findsOneWidget);
    expect(find.text('Present'), findsOneWidget);
    expect(find.text('School arrival'), findsOneWidget);
    expect(find.text('Class started'), findsOneWidget);

    final present = tester.getTopLeft(find.text('Present'));
    final arrival = tester.getTopLeft(find.text('School arrival'));
    final started = tester.getTopLeft(find.text('Class started'));
    expect(present.dy < arrival.dy, isTrue);
    expect(arrival.dy < started.dy, isTrue);
  });

  testWidgets('shows a loading state', (tester) async {
    final gate = Completer<ResponseBody>();
    final dio = _dio((_) => gate.future);

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio, _user()),
        child: const MaterialApp(home: JourneyPage(studentId: 'stu-1')),
      ),
    );
    await tester.pump();
    expect(find.byType(CircularProgressIndicator), findsOneWidget);

    gate.complete(_json(200, _journeyBody()));
    await tester.idle();
    await tester.pump();
    expect(find.text('Emma Smith'), findsOneWidget);
  });

  testWidgets('shows an empty state', (tester) async {
    final dio = _dio((_) async {
      return _json(
        200,
        _journeyBody(currentState: null, events: []),
      );
    });

    await pumpJourney(tester, dio: dio);
    expect(find.text('No journey events yet'), findsOneWidget);
    expect(find.text('Present'), findsNothing);
  });

  testWidgets('shows an error state', (tester) async {
    final dio = _dio((_) async {
      return _json(500, {
        'error': {'code': 'INTERNAL_ERROR', 'message': 'Internal Server Error'},
      });
    });

    await pumpJourney(tester, dio: dio);
    expect(find.text('Retry'), findsOneWidget);
  });

  testWidgets('hides event creation for a guardian', (tester) async {
    final dio = _dio((_) async => _json(200, _journeyBody()));
    await pumpJourney(tester, dio: dio, role: 'GUARDIAN');

    expect(find.text("Emma's Day"), findsOneWidget);
    expect(find.byKey(const Key('journeyAddEventButton')), findsNothing);
  });

  testWidgets('lets staff add an event and updates the timeline', (tester) async {
    var created = false;
    final dio = _dio((options) async {
      if (options.method == 'POST' && options.path.contains('/events')) {
        created = true;
        expect((options.data as Map)['eventType'], 'CLASS_STARTED');
        expect((options.data as Map).containsKey('organizationId'), isFalse);
        expect((options.data as Map).containsKey('recordedBy'), isFalse);
        return _json(201, {
          'id': 'ev-3',
          'eventType': 'CLASS_STARTED',
          'occurredAt': '2026-09-14T08:35:00.000Z',
          'recordedAt': '2026-09-14T08:35:04.000Z',
          'source': 'MANUAL',
          'metadata': <String, dynamic>{},
        });
      }
      return _json(
        200,
        _journeyBody(
          currentState: created ? 'CLASS_STARTED' : 'SCHOOL_ARRIVAL',
          events: [
            {
              'id': 'ev-2',
              'eventType': 'SCHOOL_ARRIVAL',
              'occurredAt': '2026-09-14T08:27:00.000Z',
              'recordedAt': '2026-09-14T08:27:04.000Z',
              'source': 'MANUAL',
              'metadata': <String, dynamic>{},
            },
            if (created)
              {
                'id': 'ev-3',
                'eventType': 'CLASS_STARTED',
                'occurredAt': '2026-09-14T08:35:00.000Z',
                'recordedAt': '2026-09-14T08:35:04.000Z',
                'source': 'MANUAL',
                'metadata': <String, dynamic>{},
              },
          ],
        ),
      );
    });

    await pumpJourney(tester, dio: dio);
    expect(find.text('Currently at school'), findsOneWidget);
    expect(find.text('Class started'), findsNothing);

    await tester.tap(find.byKey(const Key('journeyAddEventButton')));
    await tester.pumpAndSettle();
    await tester.tap(find.byKey(const Key('journeyEventType-CLASS_STARTED')));
    await tester.pump();
    await tester.idle();
    await tester.pumpAndSettle();

    expect(created, isTrue);
    expect(find.text('Class started'), findsOneWidget);
    expect(find.text('Currently in class'), findsOneWidget);
  });
}
