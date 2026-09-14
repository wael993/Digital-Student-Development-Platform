import 'package:dio/dio.dart';
import 'package:digital_student/core/config/env.dart';
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

final apiClientProvider = Provider<Dio>((ref) => createApiClient());
