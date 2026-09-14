import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/campuses/campus.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CampusRepository {
  CampusRepository(this._dio);

  final Dio _dio;

  Future<PageResult<Campus>> list({int page = 1}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/campuses',
        queryParameters: {'page': page},
      );
      return PageResult.fromJson(requireData(response.data), Campus.fromJson);
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<Campus> create({required String name}) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/campuses',
        data: {'name': name},
      );
      return Campus.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final campusRepositoryProvider = Provider<CampusRepository>(
  (ref) => CampusRepository(ref.watch(apiClientProvider)),
);
