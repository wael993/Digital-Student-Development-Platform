import 'package:dio/dio.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

const _userJson = {
  'id': 'u1',
  'organizationId': 'o1',
  'firstName': 'John',
  'lastName': 'Smith',
  'email': 'teacher@example.com',
  'role': 'TEACHER',
};

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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TokenStore tokens;
  late AuthController controller;

  AuthRepository repoWith(Dio dio) => AuthRepository(AuthApi(dio), tokens);

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    tokens = TokenStore(const FlutterSecureStorage());
  });

  test('login success stores tokens and authenticates', () async {
    final dio = _dioThat({
      'POST /auth/login': (options) => Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'user': _userJson,
              'accessToken': 'access',
              'refreshToken': 'refresh',
            },
          ),
    });
    controller = AuthController(repoWith(dio));

    await controller.login(email: 'teacher@example.com', password: 'Password123!');

    expect(controller.state.status, AuthStatus.authenticated);
    expect(controller.state.user?.email, 'teacher@example.com');
    expect(await tokens.readAccessToken(), 'access');
    expect(await tokens.readRefreshToken(), 'refresh');
  });

  test('platform admin login accepts null organizationId', () async {
    final dio = _dioThat({
      'POST /auth/login': (options) => Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'user': {
                'id': 'p1',
                'organizationId': null,
                'firstName': 'wael',
                'lastName': 'zobani',
                'email': 'wael@rivo.com',
                'role': 'PLATFORM_ADMIN',
              },
              'accessToken': 'access',
              'refreshToken': 'refresh',
            },
          ),
    });
    controller = AuthController(repoWith(dio));

    await controller.login(email: 'wael@rivo.com', password: 'Password123!');

    expect(controller.state.status, AuthStatus.authenticated);
    expect(controller.state.user?.role, 'PLATFORM_ADMIN');
    expect(controller.state.user?.organizationId, isNull);
  });

  test('login failure sets an authentication error', () async {
    final dio = _dioThat({
      'POST /auth/login': (options) => Response(
            requestOptions: options,
            statusCode: 401,
            data: {
              'error': {
                'code': 'INVALID_CREDENTIALS',
                'message': 'Invalid email or password',
              },
            },
          ),
    });
    controller = AuthController(repoWith(dio));

    await controller.login(email: 'teacher@example.com', password: 'wrong');

    expect(controller.state.status, AuthStatus.error);
    expect(controller.state.message, 'INVALID_CREDENTIALS');
    expect(await tokens.readAccessToken(), isNull);
  });

  test('restore session from stored tokens', () async {
    await tokens.save(accessToken: 'access', refreshToken: 'refresh');
    final dio = _dioThat({
      'GET /auth/me': (options) => Response(
            requestOptions: options,
            statusCode: 200,
            data: _userJson,
          ),
    });
    controller = AuthController(repoWith(dio));

    await controller.restore();

    expect(controller.state.status, AuthStatus.authenticated);
    expect(controller.state.user?.firstName, 'John');
  });

  test('restore without tokens is unauthenticated', () async {
    controller = AuthController(repoWith(_dioThat({})));
    await controller.restore();
    expect(controller.state.status, AuthStatus.unauthenticated);
  });

  test('restore keeps tokens when /auth/me fails with a server error', () async {
    await tokens.save(accessToken: 'access', refreshToken: 'refresh');
    final dio = _dioThat({
      'GET /auth/me': (options) => Response(
            requestOptions: options,
            statusCode: 500,
            data: {
              'error': {'code': 'INTERNAL_ERROR', 'message': 'Internal Server Error'},
            },
          ),
    });
    controller = AuthController(repoWith(dio));

    await controller.restore();

    expect(controller.state.status, AuthStatus.unauthenticated);
    expect(await tokens.readAccessToken(), 'access');
    expect(await tokens.readRefreshToken(), 'refresh');
  });

  test('logout clears tokens and state', () async {
    final dio = _dioThat({
      'POST /auth/login': (options) => Response(
            requestOptions: options,
            statusCode: 200,
            data: {
              'user': _userJson,
              'accessToken': 'access',
              'refreshToken': 'refresh',
            },
          ),
      'POST /auth/logout': (options) => Response(
            requestOptions: options,
            statusCode: 204,
            data: null,
          ),
    });
    controller = AuthController(repoWith(dio));
    await controller.login(email: 'teacher@example.com', password: 'Password123!');
    await controller.logout();

    expect(controller.state.status, AuthStatus.unauthenticated);
    expect(await tokens.readAccessToken(), isNull);
    expect(await tokens.readRefreshToken(), isNull);
  });
}
