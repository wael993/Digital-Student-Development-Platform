import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/users/staff_user.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserRepository {
  UserRepository(this._dio);

  final Dio _dio;

  Future<PageResult<StaffUser>> list({
    String? q,
    String? role,
    String? status,
    String? campusId,
    int page = 1,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/users',
        queryParameters: {
          'page': page,
          if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
          if (role != null && role.isNotEmpty) 'role': role,
          if (status != null && status.isNotEmpty) 'status': status,
          if (campusId != null && campusId.isNotEmpty) 'campusId': campusId,
        },
      );
      return PageResult.fromJson(requireData(response.data), StaffUser.fromJson);
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<StaffUser> getById(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/users/$id');
      return StaffUser.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<CreateStaffResult> create({
    required String email,
    required String firstName,
    required String lastName,
    required String role,
    String? password,
    bool invite = true,
    List<String> campusIds = const [],
    List<String> classroomIds = const [],
    List<String> routeIds = const [],
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/users',
        data: {
          'email': email.trim(),
          'firstName': firstName.trim(),
          'lastName': lastName.trim(),
          'role': role,
          'invite': invite || password == null || password.isEmpty,
          if (password != null && password.isNotEmpty) 'password': password,
          if (campusIds.isNotEmpty) 'campusIds': campusIds,
          if (classroomIds.isNotEmpty) 'classroomIds': classroomIds,
          if (routeIds.isNotEmpty) 'routeIds': routeIds,
        },
      );
      final data = requireData(response.data);
      if (data['invitation'] is Map) {
        return CreateStaffResult(
          invitation: StaffInvitationResult.fromJson(
            Map<String, dynamic>.from(data['invitation'] as Map),
          ),
        );
      }
      return CreateStaffResult(user: StaffUser.fromJson(data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<StaffUser> patch({
    required String id,
    String? firstName,
    String? lastName,
    String? role,
    List<String>? campusIds,
    List<String>? classroomIds,
    List<String>? routeIds,
  }) async {
    try {
      final response = await _dio.patch<Map<String, dynamic>>(
        '/users/$id',
        data: {
          if (firstName != null) 'firstName': firstName.trim(),
          if (lastName != null) 'lastName': lastName.trim(),
          'role': ?role,
          'campusIds': ?campusIds,
          'classroomIds': ?classroomIds,
          'routeIds': ?routeIds,
        },
      );
      return StaffUser.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<StaffUser> disable(String id) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>('/users/$id/disable');
      return StaffUser.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<StaffUser> enable(String id) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>('/users/$id/enable');
      return StaffUser.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final userRepositoryProvider = Provider<UserRepository>(
  (ref) => UserRepository(ref.watch(apiClientProvider)),
);
