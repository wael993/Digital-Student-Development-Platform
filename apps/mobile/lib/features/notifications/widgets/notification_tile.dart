import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/parent/models/parent_labels.dart';
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
    return ListTile(
      key: Key('notificationTile-${notification.id}'),
      leading: Icon(_iconFor(notification.type)),
      title: Text(
        notification.title,
        style: TextStyle(
          fontWeight: notification.isUnread ? FontWeight.w700 : FontWeight.w400,
        ),
      ),
      subtitle: Text(notification.body),
      trailing: Text(formatParentTime(notification.createdAt)),
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

String notificationDayLabel(DateTime value, [DateTime? now]) {
  final local = value.toLocal();
  final today = now ?? DateTime.now();
  final startToday = DateTime(today.year, today.month, today.day);
  final startThat = DateTime(local.year, local.month, local.day);
  final days = startToday.difference(startThat).inDays;
  if (days == 0) {
    return 'Today';
  }
  if (days == 1) {
    return 'Yesterday';
  }
  const weekdays = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
  ];
  return weekdays[local.weekday - 1];
}
