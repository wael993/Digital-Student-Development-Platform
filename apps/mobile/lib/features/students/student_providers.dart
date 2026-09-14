import 'package:digital_student/features/students/student.dart';
import 'package:digital_student/features/students/student_repository.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final studentsProvider =
    FutureProvider.autoDispose.family<PageResult<Student>, StudentListArgs>((ref, args) {
  return ref.watch(studentRepositoryProvider).list(
        classroomId: args.classroomId,
        search: args.search,
      );
});

final studentDetailsProvider = FutureProvider.autoDispose.family<Student, String>((ref, id) {
  return ref.watch(studentRepositoryProvider).getById(id);
});
