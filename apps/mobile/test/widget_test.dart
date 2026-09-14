import 'dart:convert';
import 'dart:typed_data';

import 'package:digital_student/core/storage/token_store.dart';
import 'package:digital_student/features/auth/data/auth_api.dart';
import 'package:digital_student/features/auth/data/auth_repository.dart';
import 'package:digital_student/features/auth/presentation/auth_gate.dart';
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
      receiveTimeout: const Duration(milliseconds: 200),
    ),
  );
  dio.httpClientAdapter = _Adapter(fetch);
  return dio;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TokenStore tokens;

  setUp(() {
    dotenv.testLoad(fileInput: 'API_BASE_URL=http://localhost:3000/api/v1');
    FlutterSecureStorage.setMockInitialValues({});
    tokens = TokenStore(const FlutterSecureStorage());
  });

  Future<void> pumpApp(WidgetTester tester, {Dio? dio}) async {
    final repo = AuthRepository(
      AuthApi(dio ?? _dio((_) async => ResponseBody.fromString('', 500))),
      tokens,
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          tokenStoreProvider.overrideWithValue(tokens),
          authRepositoryProvider.overrideWithValue(repo),
        ],
        child: const MaterialApp(home: AuthGate()),
      ),
    );
    await tester.pump();
    await tester.pump();
  }

  testWidgets('shows the login screen when there is no session', (tester) async {
    await pumpApp(tester);

    expect(find.text('Welcome'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text('Forgot password?'), findsOneWidget);
  });

  testWidgets('validates required login fields', (tester) async {
    await pumpApp(tester);
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pump();

    expect(find.text('Email is required'), findsOneWidget);
    expect(find.text('Password is required'), findsOneWidget);
  });

  testWidgets('shows API errors on the login screen', (tester) async {
    final dio = _dio(
      (_) async => _json(401, {
        'error': {
          'code': 'INVALID_CREDENTIALS',
          'message': 'Invalid email or password',
        },
      }),
    );

    await pumpApp(tester, dio: dio);
    await tester.enterText(find.byKey(const Key('emailField')), 'teacher@example.com');
    await tester.enterText(find.byKey(const Key('passwordField')), 'wrong');
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.byKey(const Key('loginError')), findsOneWidget);
    expect(find.text('Invalid email or password'), findsOneWidget);
  });

  testWidgets('navigates to home after a successful login', (tester) async {
    final dio = _dio(
      (_) async => _json(200, {
        'user': {
          'id': 'u1',
          'organizationId': 'o1',
          'firstName': 'John',
          'lastName': 'Smith',
          'email': 'teacher@example.com',
          'role': 'TEACHER',
        },
        'accessToken': 'access',
        'refreshToken': 'refresh',
      }),
    );

    await pumpApp(tester, dio: dio);
    await tester.enterText(find.byKey(const Key('emailField')), 'teacher@example.com');
    await tester.enterText(find.byKey(const Key('passwordField')), 'Password123!');
    await tester.tap(find.byKey(const Key('loginButton')));
    await tester.pump();
    await tester.idle();
    await tester.pump();

    expect(find.textContaining('Signed in as John Smith'), findsOneWidget);
    expect(find.byKey(const Key('logoutButton')), findsOneWidget);
  });
}
