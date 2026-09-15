import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/providers/media_providers.dart';
import 'package:digital_student/features/media/screens/photo_viewer_screen.dart';
import 'package:digital_student/features/media/widgets/photo_grid.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PhotoGalleryScreen extends ConsumerWidget {
  const PhotoGalleryScreen({
    super.key,
    required this.studentId,
    required this.audience,
    this.title,
  });

  final String studentId;
  final MediaAudience audience;
  final String? title;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final args = MediaListArgs(studentId: studentId, audience: audience);
    final photos = ref.watch(studentMediaProvider(args));
    return Scaffold(
      appBar: AppBar(title: Text(title ?? l10n.photos)),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(studentMediaProvider(args));
          await ref.read(studentMediaProvider(args).future);
        },
        child: photos.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (error, _) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            children: [
              const SizedBox(height: 80),
              Text(_galleryError(l10n, error), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Center(
                child: FilledButton(
                  key: const Key('photoGalleryRetry'),
                  onPressed: () => ref.invalidate(studentMediaProvider(args)),
                  child: Text(l10n.tryAgain),
                ),
              ),
            ],
          ),
          data: (items) => ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            children: [
              PhotoGrid(
                items: items,
                emptyLabel: l10n.noPhotosYet,
                onOpen: (media) => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => PhotoViewerScreen(media: media),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

String _galleryError(AppLocalizations l10n, Object error) {
  if (error is ApiException &&
      (error.statusCode == 403 || error.statusCode == 404)) {
    return l10n.photosAccessDenied;
  }
  return l10n.unableToLoadPhotos;
}
