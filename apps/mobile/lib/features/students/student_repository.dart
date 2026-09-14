import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/students/student.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class StudentListArgs {
  const StudentListArgs({this.classroomId, this.search});

  final String? classroomId;
  final String? search;

  @override
  bool operator ==(Object other) {
    return other is StudentListArgs &&
        other.classroomId == classroomId &&
        other.search == search;
  }

  @override
  int get hashCode => Object.hash(classroomId, search);
}

class StudentRepository {
  StudentRepository(this._dio);

  final Dio _dio;

  Future<PageResult<Student>> list({
    String? classroomId,
    String? search,
    int page = 1,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/students',
        queryParameters: {
          'page': page,
          'classroomId': ?classroomId,
          if (search != null && search.trim().isNotEmpty) 'search': search.trim(),
        },
      );
      return PageResult.fromJson(requireData(response.data), Student.fromJson);
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<Student> getById(String id) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/students/$id');
      return Student.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<Student> create({
    required String firstName,
    required String lastName,
    required DateTime dateOfBirth,
    required String gender,
    required String studentNumber,
    required String classroomId,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/students',
        data: {
          'firstName': firstName,
          'lastName': lastName,
          'dateOfBirth': dateOfBirth.toIso8601String(),
          'gender': gender,
          'studentNumber': studentNumber,
          'classroomId': classroomId,
        },
      );
      return Student.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<StudentGuardian> addGuardian({
    required String studentId,
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String relationship,
    bool isPrimary = false,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/students/$studentId/guardians',
        data: {
          'email': email,
          'password': password,
          'firstName': firstName,
          'lastName': lastName,
          'relationship': relationship,
          'isPrimary': isPrimary,
        },
      );
      return StudentGuardian.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> removeGuardian({required String studentId, required String userId}) async {
    try {
      await _dio.delete<void>('/students/$studentId/guardians/$userId');
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final studentRepositoryProvider = Provider<StudentRepository>(
  (ref) => StudentRepository(ref.watch(apiClientProvider)),
);
