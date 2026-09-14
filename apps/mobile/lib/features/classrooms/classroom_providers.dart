import 'package:digital_student/features/classrooms/classroom.dart';
import 'package:digital_student/features/classrooms/classroom_repository.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final classroomsProvider =
    FutureProvider.autoDispose.family<PageResult<Classroom>, String?>((ref, campusId) {
  return ref.watch(classroomRepositoryProvider).list(campusId: campusId);
});
