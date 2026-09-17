import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/campuses/campus.dart';
import 'package:digital_student/features/campuses/campus_providers.dart';
import 'package:digital_student/features/home/presentation/home_page.dart';
import 'package:digital_student/features/platform/data/models/platform_dashboard.dart';
import 'package:digital_student/features/platform/data/models/platform_organization.dart';
import 'package:digital_student/features/platform/data/platform_api.dart';
import 'package:digital_student/features/platform/data/platform_repository.dart';
import 'package:digital_student/features/platform/presentation/dashboard/platform_dashboard_page.dart';
import 'package:digital_student/features/platform/presentation/organizations/organizations_page.dart';
import 'package:digital_student/features/platform/presentation/platform_shell.dart';
import 'package:digital_student/features/platform/providers/platform_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

const _platformUser = User(
  id: 'p1',
  organizationId: null,
  firstName: 'Wael',
  lastName: 'Zobani',
  email: 'wael@rivo.com',
  role: 'PLATFORM_ADMIN',
);

const _tenantAdmin = User(
  id: 'a1',
  organizationId: 'o1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@school.example',
  role: 'ADMIN',
);

Dio _dioThat(Map<String, Response<dynamic> Function(RequestOptions)> routes) {
  final dio = Dio(BaseOptions(baseUrl: 'http://test'));
  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final key = '${options.method} ${options.path}';
        final build = routes[key];
        if (build == null) {
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

Map<String, dynamic> _orgJson({
  String id = 'org1',
  String name = 'Al Noor',
  String status = 'TRIAL',
}) {
  return {
    'id': id,
    'name': name,
    'slug': 'al-noor',
    'status': status,
    'country': 'SA',
    'timezone': 'Asia/Riyadh',
    'defaultLanguage': 'ar',
    'contactEmail': 'contact@alnoor.example',
    'contactPhone': null,
    'planCode': 'STARTER',
    'subscriptionStatus': 'TRIAL',
    'createdAt': '2026-01-01T00:00:00.000Z',
    'updatedAt': '2026-01-01T00:00:00.000Z',
    'usage': {
      'campusCount': 1,
      'studentCount': 10,
      'userCount': 3,
    },
  };
}

Widget _localized({
  required Widget home,
  Locale locale = const Locale('en'),
  List<Override> overrides = const [],
}) {
  return ProviderScope(
    overrides: overrides,
    child: MaterialApp(
      locale: locale,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      supportedLocales: AppLocalizations.supportedLocales,
      home: home,
    ),
  );
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
    FlutterSecureStorage.setMockInitialValues({});
  });

  group('routing', () {
    testWidgets('PLATFORM_ADMIN routes to Platform Dashboard', (tester) async {
      await tester.pumpWidget(
        _localized(
          home: const HomePage(),
          overrides: [
            authProvider.overrideWith((ref) => _FixedAuth(_platformUser)),
            platformRepositoryProvider.overrideWithValue(
              PlatformRepository(
                PlatformApi(
                  _dioThat({
                    'GET /platform/dashboard': (options) => Response(
                          requestOptions: options,
                          statusCode: 200,
                          data: {
                            'organizations': {
                              'total': 0,
                              'active': 0,
                              'trial': 0,
                              'suspended': 0,
                              'inactive': 0,
                              'cancelled': 0,
                            },
                            'students': 0,
                            'teachers': 0,
                            'buses': 0,
                          },
                        ),
                    'GET /platform/organizations': (options) => Response(
                          requestOptions: options,
                          statusCode: 200,
                          data: {
                            'data': <dynamic>[],
                            'meta': {'page': 1, 'limit': 20, 'total': 0},
                          },
                        ),
                  }),
                ),
              ),
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(PlatformShell), findsOneWidget);
      expect(find.text('Dashboard'), findsWidgets);
      expect(find.text('Campuses'), findsNothing);
    });

    testWidgets('tenant ADMIN does not route to Platform Dashboard', (tester) async {
      await tester.pumpWidget(
        _localized(
          home: const HomePage(),
          overrides: [
            authProvider.overrideWith((ref) => _FixedAuth(_tenantAdmin)),
            campusesProvider.overrideWith(
              (ref) async => const PageResult<Campus>(
                data: [],
                page: 1,
                limit: 20,
                total: 0,
              ),
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.byType(PlatformShell), findsNothing);
      expect(find.text('Campuses'), findsOneWidget);
    });

    test('non-platform users are not platform admin', () {
      expect(_tenantAdmin.isPlatformAdmin, isFalse);
      expect(_platformUser.isPlatformAdmin, isTrue);
    });
  });

  group('dashboard', () {
    testWidgets('loads aggregate metrics', (tester) async {
      final repo = PlatformRepository(
        PlatformApi(
          _dioThat({
            'GET /platform/dashboard': (options) => Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: {
                    'organizations': {
                      'total': 5,
                      'active': 2,
                      'trial': 1,
                      'suspended': 1,
                      'inactive': 1,
                      'cancelled': 0,
                    },
                    'students': 40,
                    'teachers': 8,
                    'buses': 3,
                  },
                ),
          }),
        ),
      );

      await tester.pumpWidget(
        _localized(
          home: const PlatformDashboardPage(),
          overrides: [platformRepositoryProvider.overrideWithValue(repo)],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('Total organizations'), findsOneWidget);
      expect(find.text('5'), findsOneWidget);
      expect(find.text('Active organizations'), findsOneWidget);
      expect(find.text('2'), findsWidgets);
    });

    testWidgets('shows loading then error with retry', (tester) async {
      final repo = PlatformRepository(
        PlatformApi(
          _dioThat({
            'GET /platform/dashboard': (options) => Response(
                  requestOptions: options,
                  statusCode: 500,
                  data: {
                    'error': {'code': 'INTERNAL_ERROR', 'message': 'boom'},
                  },
                ),
          }),
        ),
      );

      await tester.pumpWidget(
        _localized(
          home: const PlatformDashboardPage(),
          overrides: [platformRepositoryProvider.overrideWithValue(repo)],
        ),
      );
      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      await tester.pumpAndSettle();
      expect(find.text('Retry'), findsOneWidget);
    });
  });

  group('organizations', () {
    testWidgets('lists organizations and supports empty state', (tester) async {
      final emptyRepo = PlatformRepository(
        PlatformApi(
          _dioThat({
            'GET /platform/organizations': (options) => Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: {
                    'data': <dynamic>[],
                    'meta': {'page': 1, 'limit': 20, 'total': 0},
                  },
                ),
          }),
        ),
      );

      await tester.pumpWidget(
        _localized(
          home: const OrganizationsPage(),
          overrides: [platformRepositoryProvider.overrideWithValue(emptyRepo)],
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('No organizations yet'), findsOneWidget);
    });

    testWidgets('search and status filter call repository query params', (tester) async {
      String? lastQ;
      String? lastStatus;
      final repo = PlatformRepository(
        PlatformApi(
          _dioThat({
            'GET /platform/organizations': (options) {
              lastQ = options.queryParameters['q'] as String?;
              lastStatus = options.queryParameters['status'] as String?;
              return Response(
                requestOptions: options,
                statusCode: 200,
                data: {
                  'data': [_orgJson()],
                  'meta': {'page': 1, 'limit': 20, 'total': 1},
                },
              );
            },
          }),
        ),
      );

      await tester.pumpWidget(
        _localized(
          home: const OrganizationsPage(),
          overrides: [platformRepositoryProvider.overrideWithValue(repo)],
        ),
      );
      await tester.pumpAndSettle();
      expect(find.text('Al Noor'), findsOneWidget);

      await tester.enterText(find.byKey(const Key('organizationSearchField')), 'noor');
      await tester.pump(const Duration(milliseconds: 450));
      await tester.pumpAndSettle();
      expect(lastQ, 'noor');

      await tester.tap(find.text('Active'));
      await tester.pumpAndSettle();
      expect(lastStatus, 'ACTIVE');
    });

    test('create organization and invite strip invitation tokens', () async {
      final repo = PlatformRepository(
        PlatformApi(
          _dioThat({
            'POST /platform/organizations': (options) => Response(
                  requestOptions: options,
                  statusCode: 201,
                  data: {
                    'organization': _orgJson(),
                    'invitation': {
                      'invitationId': 'inv1',
                      'email': 'admin@alnoor.example',
                      'expiresAt': '2026-02-01T00:00:00.000Z',
                      'token': 'raw-secret-token',
                    },
                  },
                ),
            'POST /platform/organizations/org1/admin-invitation': (options) =>
                Response(
                  requestOptions: options,
                  statusCode: 201,
                  data: {
                    'invitationId': 'inv2',
                    'email': 'admin2@alnoor.example',
                    'expiresAt': '2026-02-01T00:00:00.000Z',
                    'token': 'another-secret',
                  },
                ),
            'POST /platform/organizations/org1/activate': (options) => Response(
                  requestOptions: options,
                  statusCode: 200,
                  data: _orgJson(status: 'ACTIVE'),
                ),
            'POST /platform/organizations/org1/suspend': (options) => Response(
                  requestOptions: options,
                  statusCode: 422,
                  data: {
                    'error': {
                      'code': 'VALIDATION_ERROR',
                      'message': 'Cannot transition',
                    },
                  },
                ),
          }),
        ),
      );

      final created = await repo.createOrganization(
        const CreateOrganizationRequest(
          name: 'Al Noor',
          country: 'SA',
          timezone: 'Asia/Riyadh',
          defaultLanguage: 'ar',
          contactEmail: 'contact@alnoor.example',
          planCode: 'STARTER',
          adminEmail: 'admin@alnoor.example',
          adminFirstName: 'Ahmed',
          adminLastName: 'Ali',
        ),
      );
      expect(created.organization.name, 'Al Noor');
      expect(created.invitation?.email, 'admin@alnoor.example');
      expect(created.invitation?.toString().contains('raw-secret-token'), isFalse);

      final invite = await repo.inviteAdmin(
        organizationId: 'org1',
        email: 'admin2@alnoor.example',
        firstName: 'Omar',
        lastName: 'Hassan',
      );
      expect(invite.email, 'admin2@alnoor.example');
      expect(invite.toString().contains('another-secret'), isFalse);

      final activated = await repo.activateOrganization('org1');
      expect(activated.status, 'ACTIVE');

      await expectLater(
        repo.suspendOrganization('org1'),
        throwsA(isA<ApiException>()),
      );
    });

    test('organization details parse usage and lifecycle flags', () {
      final org = PlatformOrganization.fromJson(_orgJson(status: 'ACTIVE'));
      expect(org.canSuspend, isTrue);
      expect(org.canActivate, isFalse);
      expect(org.canDeactivate, isTrue);
      expect(org.usage?.studentCount, 10);

      final trial = PlatformOrganization.fromJson(_orgJson());
      expect(trial.canActivate, isTrue);
      expect(trial.canSuspend, isFalse);
    });

    test('parses legacy organizations missing slug and contactEmail', () {
      final org = PlatformOrganization.fromJson({
        'id': 'legacy1',
        'name': 'Nursery A',
        'status': 'ACTIVE',
        'country': 'SA',
        'timezone': 'Europe/Berlin',
        'defaultLanguage': 'ar',
        'planCode': 'STARTER',
        'subscriptionStatus': 'TRIAL',
        'createdAt': '2026-09-14T17:59:15.551Z',
        'usage': {'campusCount': 1, 'studentCount': 5, 'userCount': 0},
      });
      expect(org.name, 'Nursery A');
      expect(org.slug, '');
      expect(org.contactEmail, '');
      expect(org.status, 'ACTIVE');
    });

    test('dashboard model maps backend aggregates', () {
      final dash = PlatformDashboard.fromJson({
        'organizations': {
          'total': 2,
          'active': 1,
          'trial': 1,
          'suspended': 0,
          'inactive': 0,
          'cancelled': 0,
        },
        'students': 9,
        'teachers': 2,
        'buses': 1,
      });
      expect(dash.organizations.total, 2);
      expect(dash.students, 9);
      expect(dash.isEmpty, isFalse);
    });
  });

  group('localization', () {
    testWidgets('platform shell renders Arabic labels and RTL', (tester) async {
      await tester.pumpWidget(
        _localized(
          locale: const Locale('ar'),
          home: PlatformShell(user: _platformUser),
          overrides: [
            platformRepositoryProvider.overrideWithValue(
              PlatformRepository(
                PlatformApi(
                  _dioThat({
                    'GET /platform/dashboard': (options) => Response(
                          requestOptions: options,
                          statusCode: 200,
                          data: {
                            'organizations': {
                              'total': 0,
                              'active': 0,
                              'trial': 0,
                              'suspended': 0,
                              'inactive': 0,
                              'cancelled': 0,
                            },
                            'students': 0,
                            'teachers': 0,
                            'buses': 0,
                          },
                        ),
                    'GET /platform/organizations': (options) => Response(
                          requestOptions: options,
                          statusCode: 200,
                          data: {
                            'data': <dynamic>[],
                            'meta': {'page': 1, 'limit': 20, 'total': 0},
                          },
                        ),
                  }),
                ),
              ),
            ),
          ],
        ),
      );
      await tester.pumpAndSettle();

      expect(find.text('لوحة التحكم'), findsWidgets);
      expect(find.text('المؤسسات'), findsOneWidget);
      expect(
        Directionality.of(tester.element(find.byType(PlatformShell))),
        TextDirection.rtl,
      );
    });
  });
}
