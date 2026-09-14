import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/providers/parent_providers.dart';
import 'package:digital_student/features/parent/screens/child_journey_screen.dart';
import 'package:digital_student/features/parent/screens/child_profile_screen.dart';
import 'package:digital_student/features/parent/widgets/attendance_card.dart';
import 'package:digital_student/features/parent/widgets/child_card.dart';
import 'package:digital_student/features/parent/widgets/current_status_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChildDashboardScreen extends ConsumerWidget {
  const ChildDashboardScreen({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboard = ref.watch(childDashboardProvider(studentId));
    return dashboard.when(
      skipLoadingOnReload: true,
      loading: () => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        children: const [
          SizedBox(height: 120),
          Center(child: Text('Loading child information...')),
        ],
      ),
      error: (error, _) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          const SizedBox(height: 80),
          Text(
            parentLoadErrorMessage(
              error,
              fallback: 'Unable to load child information.',
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Center(
            child: FilledButton(
              key: const Key('childDashboardRetry'),
              onPressed: () =>
                  ref.invalidate(childDashboardProvider(studentId)),
              child: const Text('Try Again'),
            ),
          ),
        ],
      ),
      data: (data) => ListView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        children: [
          ChildCard(
            child: data.student,
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => ChildProfileScreen(studentId: studentId),
              ),
            ),
          ),
          const SizedBox(height: 8),
          CurrentStatusCard(journey: data.journey),
          const SizedBox(height: 8),
          AttendanceCard(attendance: data.attendance),
          const SizedBox(height: 16),
          FilledButton(
            key: const Key('viewJourneyButton'),
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => ChildJourneyScreen(studentId: studentId),
              ),
            ),
            child: const Text("View Today's Journey"),
          ),
        ],
      ),
    );
  }
}
