import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ParentRepository {
  ParentRepository(this._dio);

  final Dio _dio;

  Future<List<ParentChild>> children() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/parent/children');
      final items = requireData(response.data)['items'] as List<dynamic>? ?? [];
      return items
          .map((row) => ParentChild.fromJson(row as Map<String, dynamic>))
          .toList();
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<ChildDashboard> dashboard(String studentId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/parent/children/$studentId/dashboard',
      );
      return ChildDashboard.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<ChildJourney> journeyToday(String studentId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/parent/children/$studentId/journey/today',
      );
      return ChildJourney.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final parentRepositoryProvider = Provider<ParentRepository>(
  (ref) => ParentRepository(ref.watch(apiClientProvider)),
);
