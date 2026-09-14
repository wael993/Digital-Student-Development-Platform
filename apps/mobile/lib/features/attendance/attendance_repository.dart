import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/attendance/attendance.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AttendanceRepository {
  AttendanceRepository(this._dio);

  final Dio _dio;

  Future<AttendanceScanResult> scan(String qrToken) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/attendance/scan',
        data: {'qrToken': qrToken},
      );
      return AttendanceScanResult.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PageResult<AttendanceRecord>> list({String? classroomId, String? date}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/attendance',
        queryParameters: {
          'classroomId': ?classroomId,
          'date': ?date,
        },
      );
      return PageResult.fromJson(requireData(response.data), AttendanceRecord.fromJson);
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final attendanceRepositoryProvider = Provider<AttendanceRepository>(
  (ref) => AttendanceRepository(ref.watch(apiClientProvider)),
);
