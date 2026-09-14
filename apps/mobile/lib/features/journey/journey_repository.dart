import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/journey/journey.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class JourneyRepository {
  JourneyRepository(this._dio);

  final Dio _dio;

  Future<StudentJourney> today(String studentId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/students/$studentId/journey/today',
      );
      return StudentJourney.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<JourneyEvent> createEvent({
    required String studentId,
    required String eventType,
    DateTime? occurredAt,
    Map<String, dynamic> metadata = const {},
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/students/$studentId/events',
        data: {
          'eventType': eventType,
          if (occurredAt != null) 'occurredAt': occurredAt.toUtc().toIso8601String(),
          'metadata': metadata,
        },
      );
      return JourneyEvent.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final journeyRepositoryProvider = Provider<JourneyRepository>(
  (ref) => JourneyRepository(ref.watch(apiClientProvider)),
);
