import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/providers/parent_providers.dart';
import 'package:digital_student/features/parent/screens/child_journey_screen.dart';
import 'package:digital_student/features/parent/screens/child_profile_screen.dart';
import 'package:digital_student/features/parent/widgets/attendance_card.dart';
import 'package:digital_student/features/parent/widgets/child_card.dart';
import 'package:digital_student/features/parent/widgets/current_status_card.dart';
import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/providers/media_providers.dart';
import 'package:digital_student/features/media/screens/photo_gallery_screen.dart';
import 'package:digital_student/features/media/screens/photo_viewer_screen.dart';
import 'package:digital_student/features/media/widgets/photo_grid.dart';
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
          const SizedBox(height: 24),
          _ChildPhotos(studentId: studentId, childName: data.student.firstName),
        ],
      ),
    );
  }
}

class _ChildPhotos extends ConsumerWidget {
  const _ChildPhotos({required this.studentId, required this.childName});

  final String studentId;
  final String childName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final args = MediaListArgs(
      studentId: studentId,
      audience: MediaAudience.parent,
    );
    final photos = ref.watch(studentMediaProvider(args));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text('Photos', style: Theme.of(context).textTheme.titleMedium),
            const Spacer(),
            TextButton(
              key: const Key('parentViewAllPhotosButton'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => PhotoGalleryScreen(
                    studentId: studentId,
                    audience: MediaAudience.parent,
                    title: "$childName's Photos",
                  ),
                ),
              ),
              child: const Text('View all'),
            ),
          ],
        ),
        photos.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, _) => Text(
            error is ApiException &&
                    (error.statusCode == 403 || error.statusCode == 404)
                ? 'You do not have access to these photos.'
                : 'Unable to load photos.',
          ),
          data: (items) => PhotoGrid(
            items: items.take(4).toList(),
            emptyLabel: 'No photos yet',
            onOpen: (media) => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => PhotoViewerScreen(media: media),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
