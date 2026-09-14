import 'package:digital_student/features/journey/journey.dart';
import 'package:digital_student/features/journey/journey_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final todaysJourneyProvider =
    FutureProvider.autoDispose.family<StudentJourney, String>((ref, studentId) {
  return ref.watch(journeyRepositoryProvider).today(studentId);
});
