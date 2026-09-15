import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/parent/repositories/parent_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/features/parent/screens/child_journey_screen.dart';
import 'package:digital_student/features/parent/screens/parent_dashboard_screen.dart';
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
  dio.httpClientAdapter = _Adapter((options) async {
    if (options.path.contains('/notifications')) {
      return _json(200, {
        'data': <dynamic>[],
        'meta': {'page': 1, 'limit': 20, 'total': 0, 'unreadCount': 0},
      });
    }
    return fetch(options);
  });
  return dio;
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

Map<String, dynamic> _childJson({
  String id = 'stu-1',
  String firstName = 'Emma',
  String lastName = 'Smith',
  String studentNumber = 'STU-00124',
  String classroomName = 'Nursery A',
}) {
  return {
    'id': id,
    'firstName': firstName,
    'lastName': lastName,
    'studentNumber': studentNumber,
    'status': 'ACTIVE',
    'classroom': {'id': 'class-1', 'name': classroomName},
  };
}

Map<String, dynamic> _dashboardJson({
  String id = 'stu-1',
  String firstName = 'Emma',
  String attendanceStatus = 'PRESENT',
  String? attendanceAt = '2026-09-14T07:42:00.000Z',
  String? currentState = 'CLASS_STARTED',
  String? lastEventAt = '2026-09-14T08:35:00.000Z',
}) {
  return {
    'student': {
      'id': id,
      'firstName': firstName,
      'lastName': 'Smith',
      'classroom': {'id': 'class-1', 'name': 'Nursery A'},
    },
    'attendance': {'status': attendanceStatus, 'recordedAt': attendanceAt},
    'journey': {'currentState': currentState, 'lastEventAt': lastEventAt},
  };
}

Map<String, dynamic> _journeyJson({
  String id = 'stu-1',
  String firstName = 'Emma',
  String? currentState = 'CLASS_STARTED',
  List<Map<String, dynamic>>? events,
}) {
  return {
    'student': {'id': id, 'firstName': firstName, 'lastName': 'Smith'},
    'currentState': currentState,
    'events':
        events ??
        [
          {
            'id': 'ev-1',
            'eventType': 'ATTENDANCE_PRESENT',
            'occurredAt': '2026-09-14T07:42:00.000Z',
            'source': 'QR',
          },
          {
            'id': 'ev-2',
            'eventType': 'SCHOOL_ARRIVAL',
            'occurredAt': '2026-09-14T08:27:00.000Z',
            'source': 'MANUAL',
          },
          {
            'id': 'ev-3',
            'eventType': 'CLASS_STARTED',
            'occurredAt': '2026-09-14T08:35:00.000Z',
            'source': 'MANUAL',
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

  List<Override> overrides(Dio dio) {
    final repo = AuthRepository(AuthApi(dio), tokens);
    return [
      tokenStoreProvider.overrideWithValue(tokens),
      authRepositoryProvider.overrideWithValue(repo),
      apiClientProvider.overrideWithValue(dio),
      parentRepositoryProvider.overrideWithValue(ParentRepository(dio)),
      authProvider.overrideWith((ref) => _SeededAuth(repo, _guardian())),
    ];
  }

  Future<void> pumpParent(WidgetTester tester, Dio dio) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: localizedApp(home: const ParentDashboardScreen()),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();
    await tester.idle();
    await tester.pump();
    await tester.idle();
  }

  test('maps parent-friendly labels and greetings', () {
    final l10n = lookupAppLocalizations(const Locale('en'));
    expect(parentEventLabel(l10n, 'CLASS_STARTED'), 'Class started');
    expect(parentEventLabel(l10n, 'BUS_BOARDING'), 'On the bus');
    expect(parentCurrentStatusLabel(l10n, 'CLASS_STARTED'), 'Currently in class');
    expect(
      parentCurrentStatusLabel(l10n, null),
      "Today's journey hasn't started yet.",
    );
    expect(
      parentGreeting(l10n, 'Sarah', DateTime(2026, 9, 14, 8)),
      'Good morning, Sarah 👋',
    );
  });

  testWidgets('loads children and the selected child dashboard', (
    tester,
  ) async {
    final paths = <String>[];
    final dio = _dio((options) async {
      paths.add('${options.method} ${options.path}');
      expect(options.queryParameters.containsKey('guardianUserId'), isFalse);
      if (options.path.endsWith('/parent/children')) {
        return _json(200, {
          'items': [_childJson()],
        });
      }
      if (options.path.contains('/dashboard')) {
        return _json(200, _dashboardJson());
      }
      if (options.path.contains('/journey/today')) {
        return _json(200, _journeyJson());
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });

    await pumpParent(tester, dio);

    expect(find.byKey(const Key('parentGreeting')), findsOneWidget);
    expect(find.text('Emma Smith'), findsWidgets);
    expect(find.text('Nursery A'), findsOneWidget);
    expect(find.byKey(const Key('currentStatusCard')), findsOneWidget);
    expect(find.text('Currently in class'), findsOneWidget);
    expect(find.byKey(const Key('attendanceCard')), findsOneWidget);
    expect(find.text('Present'), findsOneWidget);
    expect(find.text('Not recorded yet'), findsNothing);
    expect(
      paths.any(
        (path) => path.contains('GET') && path.contains('/parent/children'),
      ),
      isTrue,
    );
    expect(
      paths.any((path) => path.contains('/parent/children/stu-1/dashboard')),
      isTrue,
    );
  });

  testWidgets('shows empty children and no-attendance states', (tester) async {
    final dio = _dio((options) async {
      if (options.path.endsWith('/parent/children')) {
        return _json(200, {'items': <dynamic>[]});
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });

    await pumpParent(tester, dio);
    expect(find.text('No children available'), findsOneWidget);
    expect(
      find.textContaining('has not linked any active students'),
      findsOneWidget,
    );

    final presentDio = _dio((options) async {
      if (options.path.endsWith('/parent/children')) {
        return _json(200, {
          'items': [_childJson()],
        });
      }
      return _json(
        200,
        _dashboardJson(
          attendanceStatus: 'NOT_RECORDED',
          attendanceAt: null,
          currentState: null,
        ),
      );
    });

    await pumpParent(tester, presentDio);
    expect(find.text('Not recorded yet'), findsOneWidget);
    expect(find.text("Today's journey hasn't started yet."), findsOneWidget);
  });

  testWidgets(
    'supports multiple children without showing stale dashboard data',
    (tester) async {
      final dashboardIds = <String>[];
      final dio = _dio((options) async {
        if (options.path.endsWith('/parent/children')) {
          return _json(200, {
            'items': [
              _childJson(),
              _childJson(
                id: 'stu-2',
                firstName: 'Noah',
                studentNumber: 'STU-00125',
              ),
            ],
          });
        }
        if (options.path.contains('/stu-1/dashboard')) {
          dashboardIds.add('stu-1');
          return _json(200, _dashboardJson());
        }
        if (options.path.contains('/stu-2/dashboard')) {
          dashboardIds.add('stu-2');
          return _json(
            200,
            _dashboardJson(
              id: 'stu-2',
              firstName: 'Noah',
              currentState: 'BUS_BOARDING',
            ),
          );
        }
        if (options.path.contains('/journey/today')) {
          return _json(200, _journeyJson());
        }
        if (options.path.contains('/media')) {
          return _json(200, {'items': <dynamic>[]});
        }
        return _json(404, {
          'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
        });
      });

      await pumpParent(tester, dio);
      expect(find.byKey(const Key('childSelector')), findsOneWidget);
      expect(find.text('Currently in class'), findsOneWidget);
      expect(find.text('On the bus'), findsNothing);

      await tester.tap(find.byKey(const Key('childSelector-stu-2')));
      await tester.pump();
      await tester.idle();
      await tester.pump();
      await tester.idle();

      expect(find.text('On the bus'), findsOneWidget);
      expect(find.text('Currently in class'), findsNothing);
      expect(dashboardIds, ['stu-1', 'stu-2']);
    },
  );

  testWidgets('opens the journey timeline in chronological order', (
    tester,
  ) async {
    final dio = _dio((options) async {
      if (options.path.endsWith('/parent/children')) {
        return _json(200, {
          'items': [_childJson()],
        });
      }
      if (options.path.contains('/dashboard')) {
        return _json(200, _dashboardJson());
      }
      if (options.path.contains('/journey/today')) {
        expect(
          options.path.contains('/parent/children/stu-1/journey/today'),
          isTrue,
        );
        return _json(200, _journeyJson());
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });

    await pumpParent(tester, dio);
    await tester.tap(find.byKey(const Key('viewJourneyButton')));
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.text("Emma's Day"), findsOneWidget);
    expect(find.text('Present'), findsWidgets);
    expect(find.text('Arrived at school'), findsOneWidget);
    expect(find.text('Class started'), findsOneWidget);
    expect(find.text('ATTENDANCE_PRESENT'), findsNothing);

    final present = tester.getTopLeft(find.text('Present').last);
    final arrival = tester.getTopLeft(find.text('Arrived at school'));
    final started = tester.getTopLeft(find.text('Class started'));
    expect(present.dy < arrival.dy, isTrue);
    expect(arrival.dy < started.dy, isTrue);
  });

  testWidgets('shows empty journey, errors, unauthorized child, and retry', (
    tester,
  ) async {
    final dio = _dio((options) async {
      if (options.path.contains('/journey/today')) {
        return _json(200, _journeyJson(currentState: null, events: []));
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      return _json(404, {
        'error': {
          'code': 'NOT_FOUND',
          'message': 'student-B belongs to guardian B',
        },
      });
    });

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: localizedApp(home: const ChildJourneyScreen(studentId: 'stu-1')),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.text('No activity has been recorded yet.'), findsOneWidget);

    await tester.pumpWidget(
      ProviderScope(
        overrides: overrides(dio),
        child: localizedApp(home: const ParentDashboardScreen()),
      ),
    );
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.text('This child is no longer available.'), findsOneWidget);
    expect(find.text('student-B belongs to guardian B'), findsNothing);
    expect(find.byKey(const Key('parentChildrenRetry')), findsOneWidget);
  });

  testWidgets('pull-to-refresh reloads dashboard and journey', (tester) async {
    var dashboardLoads = 0;
    var journeyLoads = 0;
    final dio = _dio((options) async {
      if (options.path.endsWith('/parent/children')) {
        return _json(200, {
          'items': [_childJson()],
        });
      }
      if (options.path.contains('/dashboard')) {
        dashboardLoads += 1;
        return _json(200, _dashboardJson());
      }
      if (options.path.contains('/journey/today')) {
        journeyLoads += 1;
        return _json(200, _journeyJson());
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      return _json(404, {
        'error': {'code': 'NOT_FOUND', 'message': 'Not Found'},
      });
    });

    await pumpParent(tester, dio);
    expect(dashboardLoads, 1);

    final refresh = tester
        .widget<RefreshIndicator>(find.byKey(const Key('parentRefresh')))
        .onRefresh();
    await tester.pump();
    await tester.idle();
    await tester.pump();
    await refresh;

    expect(dashboardLoads, greaterThan(1));
    expect(journeyLoads, greaterThan(0));
  });

  testWidgets('shows a dashboard API error with try again', (tester) async {
    var fail = true;
    final dio = _dio((options) async {
      if (options.path.endsWith('/parent/children')) {
        return _json(200, {
          'items': [_childJson()],
        });
      }
      if (options.path.contains('/notifications')) {
        return _json(200, {
          'data': <dynamic>[],
          'meta': {'page': 1, 'limit': 20, 'total': 0, 'unreadCount': 0},
        });
      }
      if (options.path.contains('/media')) {
        return _json(200, {'items': <dynamic>[]});
      }
      if (fail) {
        fail = false;
        return _json(500, {
          'error': {'code': 'INTERNAL_ERROR', 'message': 'boom'},
        });
      }
      return _json(200, _dashboardJson());
    });

    await pumpParent(tester, dio);
    expect(find.text('Unable to load child information.'), findsOneWidget);
    expect(find.text('boom'), findsNothing);

    await tester.tap(find.byKey(const Key('childDashboardRetry')));
    await tester.pump();
    await tester.idle();
    await tester.pump();
    await tester.idle();

    expect(find.text('Currently in class'), findsOneWidget);
  });
}
