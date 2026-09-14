import 'package:flutter/material.dart';

class PhotoUploadProgress extends StatelessWidget {
  const PhotoUploadProgress({super.key, required this.progress});

  final double progress;

  @override
  Widget build(BuildContext context) {
    final percent = (progress.clamp(0, 1) * 100).round();
    return Column(
      key: const Key('photoUploadProgress'),
      children: [
        const Text('Uploading photo...'),
        const SizedBox(height: 12),
        LinearProgressIndicator(value: progress <= 0 ? null : progress),
        const SizedBox(height: 8),
        Text('$percent%'),
      ],
    );
  }
}
