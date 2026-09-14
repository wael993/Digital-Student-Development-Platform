import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/auth/models/auth_response.dart';
import 'package:digital_student/features/auth/models/user.dart';

class AuthApi {
  AuthApi(this._dio);

  final Dio _dio;

  Future<AuthResponse> login({required String email, required String password}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return AuthResponse.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromBody(error.response?.statusCode, error.response?.data);
    }
  }

  Future<void> logout(String? refreshToken) async {
    try {
      await _dio.post<void>(
        '/auth/logout',
        data: {'refreshToken': ?refreshToken},
      );
    } on DioException catch (error) {
      throw ApiException.fromBody(error.response?.statusCode, error.response?.data);
    }
  }

  Future<User> me() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/auth/me');
      return User.fromJson(response.data!);
    } on DioException catch (error) {
      throw ApiException.fromBody(error.response?.statusCode, error.response?.data);
    }
  }
}
