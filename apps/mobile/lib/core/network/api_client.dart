import 'package:dio/dio.dart';
import 'package:digital_student/core/config/env.dart';
import 'package:digital_student/core/network/auth_interceptor.dart';
import 'package:digital_student/core/network/auth_session.dart';
import 'package:digital_student/core/storage/token_store.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

Dio createApiClient() {
  return Dio(
    BaseOptions(
      baseUrl: AppEnv.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: const {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    ),
  );
}

final apiClientProvider = Provider<Dio>((ref) {
  final tokenStore = ref.watch(tokenStoreProvider);
  final dio = createApiClient();
  final refreshDio = createApiClient();
  dio.interceptors.add(
    AuthInterceptor(
      dio: dio,
      tokenStore: tokenStore,
      refreshDio: refreshDio,
      onRefreshFailed: () async {
        await tokenStore.clear();
        authSession.onRefreshFailed?.call();
      },
    ),
  );
  return dio;
});
