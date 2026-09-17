import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformAccountPage extends ConsumerWidget {
  const PlatformAccountPage({super.key, this.user});

  final User? user;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final current = user ?? ref.watch(authProvider).user;

    return SchoolScaffold(
      title: l10n.platformAccount,
      showAttendanceShortcut: false,
      body: current == null
          ? Center(child: Text(l10n.nothingHereYet))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                ListTile(
                  title: Text(l10n.name),
                  subtitle: Text(current.displayName),
                ),
                ListTile(
                  title: Text(l10n.email),
                  subtitle: Text(current.email),
                ),
                ListTile(
                  title: Text(l10n.role),
                  subtitle: Text(l10n.rolePlatformAdmin),
                ),
                ListTile(
                  title: Text(l10n.accountStatus),
                  // note: only ACTIVE users reach authenticated platform shell
                  subtitle: Text(l10n.statusActive),
                ),
                const SizedBox(height: 24),
                FilledButton(
                  key: const Key('platformLogoutButton'),
                  onPressed: () => ref.read(authProvider.notifier).logout(),
                  child: Text(l10n.logOut),
                ),
              ],
            ),
    );
  }
}
