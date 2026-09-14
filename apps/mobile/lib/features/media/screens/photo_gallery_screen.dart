import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/providers/media_providers.dart';
import 'package:digital_student/features/media/screens/photo_viewer_screen.dart';
import 'package:digital_student/features/media/widgets/photo_grid.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PhotoGalleryScreen extends ConsumerWidget {
  const PhotoGalleryScreen({
    super.key,
    required this.studentId,
    required this.audience,
    this.title = 'Photos',
  });

  final String studentId;
  final MediaAudience audience;
  final String title;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final args = MediaListArgs(studentId: studentId, audience: audience);
    final photos = ref.watch(studentMediaProvider(args));
    return Scaffold(
      appBar: AppBar(title: Text(title)),
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
              Text(_galleryError(error), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              Center(
                child: FilledButton(
                  key: const Key('photoGalleryRetry'),
                  onPressed: () => ref.invalidate(studentMediaProvider(args)),
                  child: const Text('Try Again'),
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
                emptyLabel: 'No photos yet',
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

String _galleryError(Object error) {
  if (error is ApiException &&
      (error.statusCode == 403 || error.statusCode == 404)) {
    return 'You do not have access to these photos.';
  }
  return 'Unable to load photos.';
}
