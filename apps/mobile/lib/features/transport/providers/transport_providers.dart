import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/features/transport/repositories/transport_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final busesProvider = FutureProvider.family<List<BusRecord>, String?>((ref, campusId) async {
  final page = await ref.watch(transportRepositoryProvider).buses(campusId: campusId);
  return page.data;
});

final routesProvider = FutureProvider.family<List<BusRouteRecord>, String?>((ref, campusId) async {
  final page = await ref.watch(transportRepositoryProvider).routes(campusId: campusId);
  return page.data;
});

final routeProgressProvider = FutureProvider.family<RouteProgress, String>((ref, routeId) {
  return ref.watch(transportRepositoryProvider).progressToday(routeId);
});

final routeStudentsProvider = FutureProvider.family<RouteStudents, String>((ref, routeId) {
  return ref.watch(transportRepositoryProvider).routeStudents(routeId);
});

final routeStopsProvider = FutureProvider.family<List<RouteStop>, String>((ref, routeId) {
  return ref.watch(transportRepositoryProvider).stops(routeId);
});

final routeSegmentsProvider = FutureProvider.family<List<RouteSegment>, String>((ref, routeId) {
  return ref.watch(transportRepositoryProvider).segments(routeId);
});

final classroomTransportProvider =
    FutureProvider.family<ClassroomTransportToday, String>((ref, classroomId) {
  return ref.watch(transportRepositoryProvider).classroomToday(classroomId);
});

final parentTransportProvider =
    FutureProvider.family<ParentTransportToday, String>((ref, studentId) {
  return ref.watch(transportRepositoryProvider).parentToday(studentId);
});
