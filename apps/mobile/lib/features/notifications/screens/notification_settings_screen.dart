import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/repositories/notification_repository.dart';
import 'package:digital_student/features/notifications/services/push_client.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final prefs = ref.watch(notificationPreferencesProvider);
    final osPermission = ref.watch(osNotificationPermissionProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Notifications')),
      body: prefs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => const Center(
          child: Text('Unable to load notification settings.'),
        ),
        data: (data) => ListView(
          children: [
            if (osPermission == OsNotificationPermission.denied)
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Notifications are turned off in system settings. Enable them to receive push alerts.',
                ),
              ),
            _SwitchTile(
              key: const Key('prefJourneyUpdates'),
              title: 'Journey Updates',
              value: data.journeyUpdates,
              onChanged: (value) => _save(ref, data.copyWith(journeyUpdates: value)),
            ),
            _SwitchTile(
              key: const Key('prefStudentArrival'),
              title: 'Child arrived at nursery',
              value: data.studentArrival,
              onChanged: (value) => _save(ref, data.copyWith(studentArrival: value)),
            ),
            _SwitchTile(
              key: const Key('prefStudentDeparture'),
              title: 'Child left nursery',
              value: data.studentDeparture,
              onChanged: (value) => _save(ref, data.copyWith(studentDeparture: value)),
            ),
            _SwitchTile(
              key: const Key('prefHomeDropoff'),
              title: 'Child arrived home',
              value: data.homeDropoff,
              onChanged: (value) => _save(ref, data.copyWith(homeDropoff: value)),
            ),
            _SwitchTile(
              key: const Key('prefMediaAvailable'),
              title: 'New photos',
              value: data.mediaAvailable,
              onChanged: (value) => _save(ref, data.copyWith(mediaAvailable: value)),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _save(WidgetRef ref, NotificationPreferences next) async {
    await ref.read(notificationRepositoryProvider).updatePreferences(next);
    ref.invalidate(notificationPreferencesProvider);
  }
}

class _SwitchTile extends StatelessWidget {
  const _SwitchTile({
    super.key,
    required this.title,
    required this.value,
    required this.onChanged,
  });

  final String title;
  final bool value;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      title: Text(title),
      value: value,
      onChanged: onChanged,
    );
  }
}
