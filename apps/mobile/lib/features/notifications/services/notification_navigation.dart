import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/features/media/screens/photo_gallery_screen.dart';
import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/parent/screens/child_dashboard_screen.dart';
import 'package:digital_student/features/parent/screens/child_journey_screen.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

Future<void> openNotificationTarget(
  BuildContext context,
  PushPayload payload,
) async {
  final studentId = payload.studentId;
  if (studentId.isEmpty || !context.mounted) {
    return;
  }
  final l10n = AppLocalizations.of(context);
  switch (payload.type) {
    case 'MEDIA_AVAILABLE':
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => PhotoGalleryScreen(
            studentId: studentId,
            audience: MediaAudience.parent,
            title: l10n.photos,
          ),
        ),
      );
    case 'STUDENT_ARRIVAL':
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => Scaffold(
            appBar: AppBar(title: Text(l10n.child)),
            body: ChildDashboardScreen(studentId: studentId),
          ),
        ),
      );
    default:
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => ChildJourneyScreen(studentId: studentId),
        ),
      );
  }
}
