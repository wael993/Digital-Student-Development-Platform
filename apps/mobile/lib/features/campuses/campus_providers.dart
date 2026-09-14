import 'package:digital_student/features/campuses/campus.dart';
import 'package:digital_student/features/campuses/campus_repository.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final campusesProvider = FutureProvider.autoDispose<PageResult<Campus>>((ref) {
  return ref.watch(campusRepositoryProvider).list();
});
