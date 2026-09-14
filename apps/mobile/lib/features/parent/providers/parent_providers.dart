import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:digital_student/features/parent/repositories/parent_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final parentChildrenProvider = FutureProvider<List<ParentChild>>((ref) {
  return ref.watch(parentRepositoryProvider).children();
});

final selectedChildIdProvider = StateProvider<String?>((ref) => null);

final resolvedChildIdProvider = Provider<String?>((ref) {
  final children =
      ref.watch(parentChildrenProvider).asData?.value ?? const <ParentChild>[];
  final selected = ref.watch(selectedChildIdProvider);
  if (children.isEmpty) {
    return null;
  }
  if (selected != null && children.any((child) => child.id == selected)) {
    return selected;
  }
  return children.first.id;
});

final childDashboardProvider = FutureProvider.family<ChildDashboard, String>((
  ref,
  studentId,
) {
  return ref.watch(parentRepositoryProvider).dashboard(studentId);
});

// note: invalidate childDashboardProvider and childJourneyProvider on student.journey.updated when Socket.IO lands.
final childJourneyProvider = FutureProvider.family<ChildJourney, String>((
  ref,
  studentId,
) {
  return ref.watch(parentRepositoryProvider).journeyToday(studentId);
});

Future<void> refreshParentChild(WidgetRef ref, String studentId) async {
  ref.invalidate(childDashboardProvider(studentId));
  ref.invalidate(childJourneyProvider(studentId));
  await Future.wait([
    ref.read(childDashboardProvider(studentId).future),
    ref.read(childJourneyProvider(studentId).future),
  ]);
}
