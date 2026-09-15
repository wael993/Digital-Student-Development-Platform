import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TransportRepository {
  TransportRepository(this._dio);

  final Dio _dio;

  Future<PageResult<BusRecord>> buses({String? campusId}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/buses',
        queryParameters: {'campusId': ?campusId},
      );
      return PageResult.fromJson(requireData(response.data), BusRecord.fromJson);
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<BusRecord> createBus({
    required String campusId,
    required String name,
    required String registrationNumber,
    required int capacity,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/buses',
        data: {
          'campusId': campusId,
          'name': name,
          'registrationNumber': registrationNumber,
          'capacity': capacity,
        },
      );
      return BusRecord.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PageResult<BusRouteRecord>> routes({String? campusId}) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/bus-routes',
        queryParameters: {'campusId': ?campusId},
      );
      return PageResult.fromJson(requireData(response.data), BusRouteRecord.fromJson);
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<BusRouteRecord> createRoute({
    required String busId,
    required String name,
    required String direction,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/bus-routes',
        data: {'busId': busId, 'name': name, 'direction': direction},
      );
      return BusRouteRecord.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<List<RouteStop>> stops(String routeId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/bus-routes/$routeId/stops');
      final data = requireData(response.data)['data'] as List<dynamic>? ?? [];
      return data.map((row) => RouteStop.fromJson(row as Map<String, dynamic>)).toList();
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> addStop(String routeId, {required String name}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/bus-routes/$routeId/stops',
        data: {'name': name},
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<List<RouteSegment>> segments(String routeId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/bus-routes/$routeId/segments');
      final data = requireData(response.data)['data'] as List<dynamic>? ?? [];
      return data.map((row) => RouteSegment.fromJson(row as Map<String, dynamic>)).toList();
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> patchSegment(String segmentId, {required int estimatedMinutes}) async {
    try {
      await _dio.patch<Map<String, dynamic>>(
        '/bus-route-segments/$segmentId',
        data: {'estimatedMinutes': estimatedMinutes},
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<RouteStudents> routeStudents(String routeId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/bus-routes/$routeId/students');
      return RouteStudents.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> assignStudent(String routeId, {required String studentId, required String stopId}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/bus-routes/$routeId/students',
        data: {'studentId': studentId, 'stopId': stopId},
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> removeStudent(String routeId, String studentId) async {
    try {
      await _dio.delete<void>('/bus-routes/$routeId/students/$studentId');
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<RouteProgress> progressToday(String routeId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/bus-routes/$routeId/progress/today',
      );
      return RouteProgress.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> recordProgress(String routeId, {required String stopId, required String status}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/bus-routes/$routeId/progress',
        data: {'stopId': stopId, 'status': status},
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<BoardingResult> scanBoarding(String qrToken) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/transport/boarding/scan',
        data: {'qrToken': qrToken},
      );
      return BoardingResult.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> registerArrivals(String routeId) async {
    try {
      await _dio.post<Map<String, dynamic>>('/transport/routes/$routeId/register-arrivals');
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<ClassroomTransportToday> classroomToday(String classroomId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/transport/classroom/$classroomId/today',
      );
      return ClassroomTransportToday.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> recordArrival(String studentId, {String? method, String? status}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/students/$studentId/transport/arrival',
        data: {
          'method': ?method,
          'status': ?status,
        },
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> recordPickup(String studentId, {required String type, String? pickupPersonId}) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/students/$studentId/transport/pickup',
        data: {
          'type': type,
          'pickupPersonId': ?pickupPersonId,
        },
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<ParentTransportToday> parentToday(String studentId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/parent/children/$studentId/transport/today',
      );
      return ParentTransportToday.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<void> cancelBus({
    required String studentId,
    required String direction,
    required String startDate,
    required String endDate,
  }) async {
    try {
      await _dio.post<Map<String, dynamic>>(
        '/parent/children/$studentId/transport/cancel',
        data: {
          'direction': direction,
          'startDate': startDate,
          'endDate': endDate,
        },
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}

final transportRepositoryProvider = Provider<TransportRepository>(
  (ref) => TransportRepository(ref.watch(apiClientProvider)),
);
