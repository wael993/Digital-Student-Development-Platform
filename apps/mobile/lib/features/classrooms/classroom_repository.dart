import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/classrooms/classroom.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ClassroomRepository {
  ClassroomRepository(this._dio);

  final Dio _dio;

  Future<PageResult<Classroom>> list({String? campusId, int page = 1}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/classrooms',
        queryParameters: {
          'page': page,
          'campusId': ?campusId,
        },
      );
      return PageResult.fromJson(requireData(response.data), Classroom.fromJson);
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<Classroom> create({
    required String campusId,
    required String name,
    required String level,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/classrooms',
        data: {'campusId': campusId, 'name': name, 'level': level},
      );
      return Classroom.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final classroomRepositoryProvider = Provider<ClassroomRepository>(
  (ref) => ClassroomRepository(ref.watch(apiClientProvider)),
);
