import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/users/presentation/add_user_page.dart';
import 'package:digital_student/features/users/presentation/user_list_page.dart';
import 'package:digital_student/features/users/staff_user.dart';
import 'package:digital_student/features/users/user_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

const _admin = User(
  id: 'admin1',
  organizationId: 'org1',
  firstName: 'Ada',
  lastName: 'Admin',
  email: 'admin@school.example',
  role: 'ADMIN',
);

const _supervisor = User(
  id: 'super1',
  organizationId: 'org1',
  firstName: 'Sam',
  lastName: 'Super',
  email: 'super@school.example',
  role: 'SUPERVISOR',
);

const _teacher = User(
  id: 'teacher1',
  organizationId: 'org1',
  firstName: 'Tess',
  lastName: 'Teach',
  email: 'teacher@school.example',
  role: 'TEACHER',
);

Map<String, dynamic> _staffJson({
  String id = 'u1',
  String role = 'TEACHER',
  String status = 'ACTIVE',
}) {
  return {
    'id': id,
    'organizationId': 'org1',
    'firstName': 'John',
    'lastName': 'Smith',
    'email': 'john@school.example',
    'role': role,
    'status': status,
    'campusIds': <String>[],
    'classroomIds': <String>[],
    'routeIds': <String>[],
    'createdAt': '2026-01-01T00:00:00.000Z',
    'updatedAt': '2026-01-01T00:00:00.000Z',
  };
}

Dio _dioThat(Map<String, Response<dynamic> Function(RequestOptions)> routes) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test'));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final key = '${options.method} ${options.path}';
        final build = routes[key];
        if (build == null) {
          // empty lists for assignment dropdowns
          if (options.method == 'GET') {
            handler.resolve(
              Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'data': <Map<String, dynamic>>[],
                  'meta': {'page': 1, 'limit': 20, 'total': 0},
                },
              ),
            );
            return;
          }
          handler.reject(
            DioException(requestOptions: options, type: DioExceptionType.badResponse),
          );
          return;
        }
        final response = build(options);
        if ((response.statusCode ?? 500) >= 400) {
          handler.reject(
            DioException(
              requestOptions: options,
              response: response,
              type: DioExceptionType.badResponse,
            ),
          );
          return;
        }
        handler.resolve(response);
      },
    ),
  );
  return dio;
}

class _FixedAuth extends AuthController {
  _FixedAuth(User user)
      : super(
          AuthRepository(
            AuthApi(Dio(BaseOptions(baseUrl: 'http://test'))),
            TokenStore(const FlutterSecureStorage()),
          ),
        ) {
    state = AuthState(status: AuthStatus.authenticated, user: user);
  }

  @override
  Future<void> restore() async {}
}

Widget _wrap({
  required User user,
  required Widget home,
  Dio? dio,
  Locale? locale,
}) {
  return ProviderScope(
    overrides: [
      authProvider.overrideWith((ref) => _FixedAuth(user)),
      if (dio != null) apiClientProvider.overrideWithValue(dio),
    ],
    child: MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: home,
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
    FlutterSecureStorage.setMockInitialValues({});
  });

  test('StaffUser parses assignments without exposing secrets', () {
    final user = StaffUser.fromJson({
      ..._staffJson(),
      'passwordHash': 'secret',
      'classroomIds': ['c1'],
    });
    expect(user.role, 'TEACHER');
    expect(user.classroomIds, ['c1']);
    expect(user.toString().contains('secret'), isFalse);
  });

  test('repository list/create/disable hit /users', () async {
    Map<String, dynamic>? createBody;
    final repo = UserRepository(
      _dioThat({
        'GET /users': (options) {
          expect(options.queryParameters['role'], 'TEACHER');
          expect(options.queryParameters['q'], 'john');
          return Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'data': [_staffJson()],
              'meta': {'page': 1, 'limit': 20, 'total': 1},
            },
          );
        },
        'POST /users': (options) {
          createBody = Map<String, dynamic>.from(options.data as Map);
          return Response(
            requestOptions: options,
            statusCode: 201,
            data: _staffJson(id: 'new1', role: 'DRIVER'),
          );
        },
        'POST /users/u1/disable': (options) => Response(
              requestOptions: options,
              statusCode: 200,
              data: _staffJson(status: 'INACTIVE'),
            ),
      }),
    );

    final page = await repo.list(q: 'john', role: 'TEACHER');
    expect(page.data, hasLength(1));

    final created = await repo.create(
      email: 'driver@school.example',
      firstName: 'D',
      lastName: 'River',
      role: 'DRIVER',
      invite: false,
      password: 'DriverPass1!',
      routeIds: ['r1'],
    );
    expect(created.user?.role, 'DRIVER');
    expect(createBody?['role'], 'DRIVER');
    expect(createBody?['routeIds'], ['r1']);
    expect(createBody?['invite'], isFalse);

    expect((await repo.disable('u1')).status, 'INACTIVE');
  });

  test('ADMIN can create all tenant roles; SUPERVISOR cannot create Admin/Supervisor', () {
    expect(
      _admin.creatableStaffRoles,
      containsAll(['ADMIN', 'SUPERVISOR', 'TEACHER', 'DRIVER', 'GUARDIAN']),
    );
    expect(_supervisor.creatableStaffRoles, ['TEACHER', 'DRIVER', 'GUARDIAN']);
    expect(_supervisor.canManageUserWithRole('ADMIN'), isFalse);
    expect(_teacher.canManageStaffUsers, isFalse);
  });

  testWidgets('ADMIN sees Users nav, list, and Admin role on Add User', (tester) async {
    final dio = _dioThat({
      'GET /users': (options) => Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'data': [_staffJson()],
              'meta': {'page': 1, 'limit': 20, 'total': 1},
            },
          ),
    });

    await tester.pumpWidget(
      _wrap(
        user: _admin,
        dio: dio,
        home: const SchoolScaffold(title: 'Home', body: SizedBox.shrink()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('usersNavButton')), findsOneWidget);

    await tester.tap(find.byKey(const Key('usersNavButton')));
    await tester.pumpAndSettle();
    expect(find.byType(UserListPage), findsOneWidget);
    expect(find.byKey(const Key('addUserButton')), findsOneWidget);
    expect(find.text('John Smith'), findsOneWidget);

    await tester.tap(find.byKey(const Key('addUserButton')));
    await tester.pumpAndSettle();
    expect(find.byType(AddUserPage), findsOneWidget);

    await tester.tap(find.byKey(const Key('addUserRoleField')));
    await tester.pumpAndSettle();
    expect(find.text('Admin').hitTestable(), findsWidgets);
    expect(find.text('Supervisor').hitTestable(), findsWidgets);
    expect(find.text('Teacher').hitTestable(), findsWidgets);
  });

  testWidgets('SUPERVISOR Add User omits Admin and Supervisor', (tester) async {
    await tester.pumpWidget(
      _wrap(
        user: _supervisor,
        dio: _dioThat({}),
        home: const AddUserPage(),
      ),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.byKey(const Key('addUserRoleField')));
    await tester.pumpAndSettle();

    expect(find.text('Teacher').hitTestable(), findsWidgets);
    expect(find.text('Driver').hitTestable(), findsWidgets);
    expect(find.text('Guardian').hitTestable(), findsWidgets);
    expect(find.text('Admin').hitTestable(), findsNothing);
    expect(find.text('Supervisor').hitTestable(), findsNothing);
  });

  testWidgets('TEACHER does not see Users nav', (tester) async {
    await tester.pumpWidget(
      _wrap(
        user: _teacher,
        home: const SchoolScaffold(title: 'Home', body: SizedBox.shrink()),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.byKey(const Key('usersNavButton')), findsNothing);
  });

  testWidgets('Users screen supports Arabic RTL', (tester) async {
    await tester.pumpWidget(
      _wrap(
        user: _admin,
        dio: _dioThat({
          'GET /users': (options) => Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'data': <Map<String, dynamic>>[],
                  'meta': {'page': 1, 'limit': 20, 'total': 0},
                },
              ),
        }),
        locale: const Locale('ar'),
        home: const UserListPage(),
      ),
    );
    await tester.pumpAndSettle();
    expect(find.text('المستخدمون'), findsOneWidget);
    expect(
      Directionality.of(tester.element(find.text('المستخدمون'))),
      TextDirection.rtl,
    );
  });
}
