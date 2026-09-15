import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/repositories/notification_repository.dart';
import 'package:digital_student/features/notifications/services/notification_navigation.dart';
import 'package:digital_student/features/notifications/widgets/notification_tile.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationListScreen extends ConsumerWidget {
  const NotificationListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final list = ref.watch(notificationsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: list.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Unable to load notifications.'),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => ref.invalidate(notificationsProvider),
                  child: const Text('Try Again'),
                ),
              ],
            ),
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const Center(child: Text('No notifications yet'));
          }
          final groups = _group(items);
          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(notificationsProvider);
              await ref.read(notificationsProvider.future);
            },
            child: ListView.builder(
              itemCount: groups.length,
              itemBuilder: (context, index) {
                final group = groups[index];
                if (group is String) {
                  return Padding(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                    child: Text(
                      group,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                  );
                }
                final notification = group as AppNotification;
                return NotificationTile(
                  notification: notification,
                  onTap: () async {
                    if (notification.isUnread) {
                      await ref
                          .read(notificationRepositoryProvider)
                          .markRead(notification.id);
                      ref.invalidate(notificationsProvider);
                    }
                    if (!context.mounted) {
                      return;
                    }
                    await openNotificationTarget(
                      context,
                      PushPayload(
                        type: notification.type,
                        studentId: notification.studentId,
                        notificationId: notification.id,
                        eventId: notification.data['eventId'],
                        mediaId: notification.data['mediaId'],
                        title: notification.title,
                        body: notification.body,
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

List<Object> _group(List<AppNotification> items) {
  final out = <Object>[];
  String? last;
  for (final item in items) {
    final label = notificationDayLabel(item.createdAt);
    if (label != last) {
      out.add(label);
      last = label;
    }
    out.add(item);
  }
  return out;
}
