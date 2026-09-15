import 'package:digital_student/features/notifications/models/app_notification.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/repositories/notification_repository.dart';
import 'package:digital_student/features/notifications/services/push_client.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class NotificationSettingsScreen extends ConsumerWidget {
  const NotificationSettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final prefs = ref.watch(notificationPreferencesProvider);
    final osPermission = ref.watch(osNotificationPermissionProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.notifications)),
      body: prefs.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Text(l10n.unableToLoadNotificationSettings),
        ),
        data: (data) => ListView(
          children: [
            if (osPermission == OsNotificationPermission.denied)
              Padding(
                padding: const EdgeInsets.all(16),
                child: Text(l10n.notificationsDisabledHint),
              ),
            _SwitchTile(
              key: const Key('prefJourneyUpdates'),
              title: l10n.journeyUpdates,
              value: data.journeyUpdates,
              onChanged: (value) => _save(ref, data.copyWith(journeyUpdates: value)),
            ),
            _SwitchTile(
              key: const Key('prefStudentArrival'),
              title: l10n.prefChildArrivedNursery,
              value: data.studentArrival,
              onChanged: (value) => _save(ref, data.copyWith(studentArrival: value)),
            ),
            _SwitchTile(
              key: const Key('prefStudentDeparture'),
              title: l10n.prefChildLeftNursery,
              value: data.studentDeparture,
              onChanged: (value) => _save(ref, data.copyWith(studentDeparture: value)),
            ),
            _SwitchTile(
              key: const Key('prefHomeDropoff'),
              title: l10n.prefChildArrivedHome,
              value: data.homeDropoff,
              onChanged: (value) => _save(ref, data.copyWith(homeDropoff: value)),
            ),
            _SwitchTile(
              key: const Key('prefMediaAvailable'),
              title: l10n.prefNewPhotos,
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
