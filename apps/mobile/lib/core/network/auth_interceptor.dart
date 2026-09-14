import 'package:dio/dio.dart';
import 'package:digital_student/core/storage/token_store.dart';

class AuthInterceptor extends QueuedInterceptor {
  AuthInterceptor({
    required this.dio,
    required this.tokenStore,
    required this.refreshDio,
    required this.onRefreshFailed,
  });

  final Dio dio;
  final TokenStore tokenStore;
  final Dio refreshDio;
  final Future<void> Function() onRefreshFailed;

  static bool isAuthPath(String path) {
    return path.contains('/auth/login') ||
        path.contains('/auth/refresh') ||
        path.contains('/auth/logout');
  }

  static bool isAuthFailure(Object error) {
    return error is DioException &&
        (error.response?.statusCode == 401 || error.response?.statusCode == 403);
  }

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!isAuthPath(options.path)) {
      final access = await tokenStore.readAccessToken();
      if (access != null && access.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $access';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final alreadyRetried = err.requestOptions.extra['retried'] == true;
    if (err.response?.statusCode != 401 ||
        alreadyRetried ||
        isAuthPath(err.requestOptions.path)) {
      handler.next(err);
      return;
    }

    try {
      final refreshToken = await tokenStore.readRefreshToken();
      if (refreshToken == null || refreshToken.isEmpty) {
        await onRefreshFailed();
        handler.next(err);
        return;
      }

      final refreshResponse = await refreshDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final accessToken = refreshResponse.data?['accessToken'] as String?;
      if (accessToken == null || accessToken.isEmpty) {
        await onRefreshFailed();
        handler.next(err);
        return;
      }

      await tokenStore.saveAccessToken(accessToken);
      final request = err.requestOptions;
      request.extra['retried'] = true;
      request.headers['Authorization'] = 'Bearer $accessToken';
      final retryDio = Dio(dio.options)..httpClientAdapter = dio.httpClientAdapter;
      handler.resolve(await retryDio.fetch<dynamic>(request));
    } catch (error) {
      if (isAuthFailure(error)) {
        await onRefreshFailed();
      }
      handler.next(err);
    }
  }
}
