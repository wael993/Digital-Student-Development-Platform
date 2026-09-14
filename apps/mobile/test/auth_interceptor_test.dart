import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:digital_student/core/network/auth_interceptor.dart';
import 'package:digital_student/core/storage/token_store.dart';
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

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TokenStore tokens;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    tokens = TokenStore(const FlutterSecureStorage());
  });

  test('retries with a new access token after 401', () async {
    await tokens.save(accessToken: 'old', refreshToken: 'refresh-ok');

    final refreshDio = Dio(BaseOptions(baseUrl: 'http://test'));
    refreshDio.httpClientAdapter = _Adapter(
      (options) async => _json(200, {'accessToken': 'new'}),
    );

    final dio = Dio(BaseOptions(baseUrl: 'http://test'));
    var refreshFailed = false;
    dio.interceptors.add(
      AuthInterceptor(
        dio: dio,
        tokenStore: tokens,
        refreshDio: refreshDio,
        onRefreshFailed: () async {
          refreshFailed = true;
        },
      ),
    );
    dio.httpClientAdapter = _Adapter((options) async {
      final auth = options.headers['Authorization'];
      if (auth == 'Bearer old') {
        return ResponseBody.fromString('', 401);
      }
      return _json(200, {'ok': true});
    });

    final response = await dio.get<Map<String, dynamic>>('/auth/me');
    expect(response.statusCode, 200);
    expect(response.data?['ok'], true);
    expect(await tokens.readAccessToken(), 'new');
    expect(refreshFailed, isFalse);
  });

  test('failed refresh clears the session callback', () async {
    await tokens.save(accessToken: 'old', refreshToken: 'bad');

    final refreshDio = Dio(BaseOptions(baseUrl: 'http://test'));
    refreshDio.httpClientAdapter = _Adapter(
      (options) async => _json(401, {
        'error': {'code': 'INVALID_REFRESH_TOKEN', 'message': 'Invalid refresh token'},
      }),
    );

    final dio = Dio(BaseOptions(baseUrl: 'http://test'));
    var refreshFailed = false;
    dio.interceptors.add(
      AuthInterceptor(
        dio: dio,
        tokenStore: tokens,
        refreshDio: refreshDio,
        onRefreshFailed: () async {
          refreshFailed = true;
          await tokens.clear();
        },
      ),
    );
    dio.httpClientAdapter = _Adapter(
      (options) async => ResponseBody.fromString('', 401),
    );

    await expectLater(dio.get<void>('/auth/me'), throwsA(isA<DioException>()));
    expect(refreshFailed, isTrue);
    expect(await tokens.readAccessToken(), isNull);
  });

  test('refresh transport errors do not clear tokens', () async {
    await tokens.save(accessToken: 'old', refreshToken: 'refresh-ok');

    final refreshDio = Dio(BaseOptions(baseUrl: 'http://test'));
    refreshDio.httpClientAdapter = _Adapter(
      (options) async => _json(500, {
        'error': {'code': 'INTERNAL_ERROR', 'message': 'Internal Server Error'},
      }),
    );

    final dio = Dio(BaseOptions(baseUrl: 'http://test'));
    var refreshFailed = false;
    dio.interceptors.add(
      AuthInterceptor(
        dio: dio,
        tokenStore: tokens,
        refreshDio: refreshDio,
        onRefreshFailed: () async {
          refreshFailed = true;
          await tokens.clear();
        },
      ),
    );
    dio.httpClientAdapter = _Adapter(
      (options) async => ResponseBody.fromString('', 401),
    );

    await expectLater(dio.get<void>('/auth/me'), throwsA(isA<DioException>()));
    expect(refreshFailed, isFalse);
    expect(await tokens.readAccessToken(), 'old');
  });
}
