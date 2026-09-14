import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/guardians/presentation/add_guardian_page.dart';
import 'package:digital_student/features/journey/presentation/journey_page.dart';
import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/providers/media_providers.dart';
import 'package:digital_student/features/media/screens/photo_capture_screen.dart';
import 'package:digital_student/features/media/screens/photo_gallery_screen.dart';
import 'package:digital_student/features/media/screens/photo_viewer_screen.dart';
import 'package:digital_student/features/media/widgets/photo_grid.dart';
import 'package:digital_student/features/students/student_providers.dart';
import 'package:digital_student/features/students/student_repository.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

class StudentDetailsPage extends ConsumerWidget {
  const StudentDetailsPage({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final student = ref.watch(studentDetailsProvider(studentId));
    final canManage = user?.canManageSchool ?? false;

    return Scaffold(
      appBar: AppBar(title: const Text('Student')),
      body: student.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(error.toString(), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () =>
                      ref.invalidate(studentDetailsProvider(studentId)),
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
        data: (data) {
          final localizations = MaterialLocalizations.of(context);
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                data.displayName,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              ListTile(
                key: const Key('studentJourneyButton'),
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.timeline),
                title: const Text("Today's Journey"),
                trailing: const Icon(Icons.chevron_right),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => JourneyPage(studentId: studentId),
                  ),
                ),
              ),
              if (user?.canUploadStudentPhoto ?? false) ...[
                const SizedBox(height: 8),
                FilledButton(
                  key: const Key('studentTakePhotoButton'),
                  onPressed: () async {
                    final uploaded = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(
                        builder: (_) =>
                            PhotoCaptureScreen(studentId: studentId),
                      ),
                    );
                    if (uploaded == true) {
                      ref.invalidate(
                        studentMediaProvider(
                          MediaListArgs(
                            studentId: studentId,
                            audience: MediaAudience.staff,
                          ),
                        ),
                      );
                    }
                  },
                  child: const Text('Take Photo'),
                ),
              ],
              const SizedBox(height: 16),
              _StudentPhotos(studentId: studentId),
              const SizedBox(height: 8),
              _row('Class', data.classroomName ?? data.classroomId),
              _row(
                'Date of Birth',
                localizations.formatFullDate(data.dateOfBirth.toLocal()),
              ),
              _row('Status', data.status),
              if (data.qrToken != null) ...[
                const SizedBox(height: 16),
                Text(
                  'Attendance QR',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 8),
                Center(
                  child: QrImageView(
                    data: data.qrToken!,
                    size: 180,
                    padding: EdgeInsets.zero,
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Row(
                children: [
                  Text(
                    'Guardians',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const Spacer(),
                  if (canManage)
                    TextButton(
                      onPressed: () async {
                        final added = await Navigator.of(context).push<bool>(
                          MaterialPageRoute(
                            builder: (_) =>
                                AddGuardianPage(studentId: studentId),
                          ),
                        );
                        if (added == true) {
                          ref.invalidate(studentDetailsProvider(studentId));
                        }
                      },
                      child: const Text('Add Guardian'),
                    ),
                ],
              ),
              if (data.guardians.isEmpty)
                const ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text('No guardians yet'),
                ),
              for (final guardian in data.guardians)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(guardian.displayName),
                  subtitle: Text(guardian.relationship.replaceAll('_', ' ')),
                  trailing: canManage
                      ? IconButton(
                          icon: const Icon(Icons.link_off),
                          onPressed: () async {
                            try {
                              await ref
                                  .read(studentRepositoryProvider)
                                  .removeGuardian(
                                    studentId: studentId,
                                    userId: guardian.userId,
                                  );
                              ref.invalidate(studentDetailsProvider(studentId));
                            } catch (error) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text(error.toString())),
                                );
                              }
                            }
                          },
                        )
                      : null,
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          Text(value),
        ],
      ),
    );
  }
}

class _StudentPhotos extends ConsumerWidget {
  const _StudentPhotos({required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final args = MediaListArgs(
      studentId: studentId,
      audience: MediaAudience.staff,
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
              key: const Key('studentViewAllPhotosButton'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => PhotoGalleryScreen(
                    studentId: studentId,
                    audience: MediaAudience.staff,
                    title: 'Photos',
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
          error: (error, _) => Text(error.toString()),
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
