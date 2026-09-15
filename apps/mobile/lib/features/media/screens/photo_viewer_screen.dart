import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class PhotoViewerScreen extends StatelessWidget {
  const PhotoViewerScreen({super.key, required this.media});

  final StudentMedia media;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final url = media.url ?? media.thumbnailUrl;
    return Scaffold(
      appBar: AppBar(title: Text(l10n.photo)),
      body: Center(
        child: url == null || url.isEmpty
            ? Text(l10n.photoUnavailable)
            : InteractiveViewer(
                child: Image.network(
                  url,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stack) =>
                      Text(l10n.photoUnavailable),
                ),
              ),
      ),
    );
  }
}
