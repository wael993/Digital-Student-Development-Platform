import 'package:digital_student/core/localization/l10n_format.dart';
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
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:qr_flutter/qr_flutter.dart';

class StudentDetailsPage extends ConsumerWidget {
  const StudentDetailsPage({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toString();
    final user = ref.watch(authProvider).user;
    final student = ref.watch(studentDetailsProvider(studentId));
    final canManage = user?.canManageSchool ?? false;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.student)),
      body: student.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(localizedError(l10n, error), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () =>
                      ref.invalidate(studentDetailsProvider(studentId)),
                  child: Text(l10n.retry),
                ),
              ],
            ),
          ),
        ),
        data: (data) {
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
                title: Text(l10n.todaysJourney),
                trailing: const Icon(Icons.arrow_forward),
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
                  child: Text(l10n.takePhoto),
                ),
              ],
              const SizedBox(height: 16),
              _StudentPhotos(studentId: studentId),
              const SizedBox(height: 8),
              _row(l10n.classLabel, data.classroomName ?? data.classroomId),
              _row(l10n.dateOfBirth, formatAppDate(data.dateOfBirth.toLocal(), locale)),
              _row(l10n.status, studentStatusLabel(l10n, data.status)),
              if (data.qrToken != null) ...[
                const SizedBox(height: 16),
                Text(
                  l10n.attendanceQr,
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
                    l10n.guardians,
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
                      child: Text(l10n.addGuardian),
                    ),
                ],
              ),
              if (data.guardians.isEmpty)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(l10n.noGuardiansYet),
                ),
              for (final guardian in data.guardians)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  title: Text(guardian.displayName),
                  subtitle: Text(relationshipLabel(l10n, guardian.relationship)),
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
                                  SnackBar(content: Text(localizedError(l10n, error))),
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
    final l10n = AppLocalizations.of(context);
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
            Text(l10n.photos, style: Theme.of(context).textTheme.titleMedium),
            const Spacer(),
            TextButton(
              key: const Key('studentViewAllPhotosButton'),
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => PhotoGalleryScreen(
                    studentId: studentId,
                    audience: MediaAudience.staff,
                    title: l10n.photos,
                  ),
                ),
              ),
              child: Text(l10n.viewAll),
            ),
          ],
        ),
        photos.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, _) => Text(localizedError(l10n, error, fallback: l10n.unableToLoadPhotos)),
          data: (items) => PhotoGrid(
            items: items.take(4).toList(),
            emptyLabel: l10n.noPhotosYet,
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
