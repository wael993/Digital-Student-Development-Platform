import 'package:digital_student/features/media/models/student_media.dart';
import 'package:flutter/material.dart';

class PhotoViewerScreen extends StatelessWidget {
  const PhotoViewerScreen({super.key, required this.media});

  final StudentMedia media;

  @override
  Widget build(BuildContext context) {
    final url = media.url ?? media.thumbnailUrl;
    return Scaffold(
      appBar: AppBar(title: const Text('Photo')),
      body: Center(
        child: url == null || url.isEmpty
            ? const Text('Photo is unavailable.')
            : InteractiveViewer(
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stack) =>
                      const Text('Photo is unavailable.'),
                ),
              ),
      ),
    );
  }
}
