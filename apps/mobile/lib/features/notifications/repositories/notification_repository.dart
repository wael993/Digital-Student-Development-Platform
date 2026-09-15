import 'dart:math';

import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/core/storage/secure_storage.dart';
import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class NotificationRepository {
  NotificationRepository(this._dio, this._storage);

  static const deviceIdKey = 'fcm_device_id';

  final Dio _dio;
  final FlutterSecureStorage _storage;

  Future<List<AppNotification>> list() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/notifications');
      final body = requireData(response.data);
      final rows = body['data'] as List<dynamic>? ?? [];
      return rows
          .map((row) => AppNotification.fromJson(row as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<int> unreadCount() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/notifications',
        queryParameters: {'page': 1, 'limit': 1},
      );
      final meta = requireData(response.data)['meta'] as Map<String, dynamic>?;
      return (meta?['unreadCount'] as num?)?.toInt() ?? 0;
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<AppNotification> markRead(String id) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/notifications/$id/read',
      );
      return AppNotification.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<NotificationPreferences> preferences() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/notifications/preferences',
      );
      return NotificationPreferences.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<NotificationPreferences> updatePreferences(
    NotificationPreferences prefs,
  ) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/notifications/preferences',
        data: prefs.toPatch(),
      );
      return NotificationPreferences.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> registerDevice({
    required String token,
    required String platform,
    String appVersion = '1.0.0',
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/notifications/devices',
        data: {
          'token': token,
          'platform': platform,
          'deviceId': await deviceId(),
          'appVersion': appVersion,
        },
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> unregisterCurrentDevice() async {
    final id = await _storage.read(key: deviceIdKey);
    if (id == null || id.isEmpty) {
      return;
    }
    try {
      await _dio.delete<void>('/notifications/devices/$id');
    } on DioException catch (error) {
      if (error.response?.statusCode == 401 || error.response?.statusCode == 404) {
        return;
      }
      throwApi(error);
    }
  }

  Future<String> deviceId() async {
    final existing = await _storage.read(key: deviceIdKey);
    if (existing != null && existing.isNotEmpty) {
      return existing;
    }
    final random = Random.secure();
    final id = List.generate(
      16,
      (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ).join();
    await _storage.write(key: deviceIdKey, value: id);
    return id;
  }
}

final notificationRepositoryProvider = Provider<NotificationRepository>(
  (ref) => NotificationRepository(
    ref.watch(apiClientProvider),
    ref.watch(secureStorageProvider),
  ),
);
