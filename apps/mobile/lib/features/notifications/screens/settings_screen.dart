import 'package:digital_student/core/localization/locale_provider.dart';
import 'package:digital_student/features/notifications/screens/notification_settings_screen.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final locale = ref.watch(localeProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.settings)),
      body: ListView(
        children: [
          ListTile(
            key: const Key('settingsNotifications'),
            leading: const Icon(Icons.notifications),
            title: Text(l10n.notifications),
            onTap: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const NotificationSettingsScreen(),
              ),
            ),
          ),
          const Divider(),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(l10n.language, style: Theme.of(context).textTheme.titleMedium),
          ),
          ListTile(
            key: const Key('languageEnglish'),
            title: Text(l10n.english),
            trailing: locale.languageCode == 'en' ? const Icon(Icons.check) : null,
            onTap: () => ref.read(localeProvider.notifier).setLocale(const Locale('en')),
          ),
          ListTile(
            key: const Key('languageArabic'),
            title: Text(l10n.arabic),
            trailing: locale.languageCode == 'ar' ? const Icon(Icons.check) : null,
            onTap: () => ref.read(localeProvider.notifier).setLocale(const Locale('ar')),
          ),
        ],
      ),
    );
  }
}
