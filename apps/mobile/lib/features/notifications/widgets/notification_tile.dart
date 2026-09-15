import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class NotificationTile extends StatelessWidget {
  const NotificationTile({
    super.key,
    required this.notification,
    required this.onTap,
  });

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toString();
    return ListTile(
      key: Key('notificationTile-${notification.id}'),
      leading: Icon(_iconFor(notification.type)),
      title: Text(
        notificationTypeLabel(l10n, notification.type),
        style: TextStyle(
          fontWeight: notification.isUnread ? FontWeight.w700 : FontWeight.w400,
        ),
      ),
      trailing: Text(formatAppTime(notification.createdAt, locale)),
      onTap: onTap,
    );
  }
}

IconData _iconFor(String type) {
  switch (type) {
    case 'STUDENT_ARRIVAL':
      return Icons.school;
    case 'STUDENT_DEPARTURE':
      return Icons.directions_bus;
    case 'STUDENT_HOME_DROPOFF':
      return Icons.home;
    case 'MEDIA_AVAILABLE':
      return Icons.photo;
    default:
      return Icons.notifications;
  }
}
