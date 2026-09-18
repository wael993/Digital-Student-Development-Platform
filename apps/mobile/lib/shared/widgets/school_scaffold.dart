import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/attendance/presentation/attendance_page.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/notifications/providers/notification_providers.dart';
import 'package:digital_student/features/notifications/screens/notification_list_screen.dart';
import 'package:digital_student/features/notifications/screens/settings_screen.dart';
import 'package:digital_student/features/users/presentation/user_list_page.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SchoolScaffold extends ConsumerWidget {
  const SchoolScaffold({
    super.key,
    required this.title,
    required this.body,
    this.floatingActionButton,
    this.bottom,
    this.showAttendanceShortcut = true,
  });

  final String title;
  final Widget body;
  final Widget? floatingActionButton;
  final Widget? bottom;
  final bool showAttendanceShortcut;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final unread = user?.role == 'GUARDIAN'
        ? ref.watch(unreadNotificationsCountProvider)
        : 0;
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          if (user?.canManageStaffUsers ?? false)
            IconButton(
              key: const Key('usersNavButton'),
              tooltip: l10n.users,
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const UserListPage()),
              ),
              icon: const Icon(Icons.group_outlined),
            ),
          if (user?.role == 'GUARDIAN')
            IconButton(
              key: const Key('notificationsButton'),
              tooltip: l10n.notifications,
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => const NotificationListScreen(),
                ),
              ),
              icon: Badge(
                isLabelVisible: unread > 0,
                label: Text('$unread'),
                child: const Icon(Icons.notifications_outlined),
              ),
            ),
          IconButton(
            key: const Key('settingsButton'),
            tooltip: l10n.settings,
            onPressed: () => Navigator.of(context).push(
              MaterialPageRoute<void>(
                builder: (_) => const SettingsScreen(),
              ),
            ),
            icon: const Icon(Icons.settings_outlined),
          ),
          if (showAttendanceShortcut && (user?.canRecordAttendance ?? false))
            IconButton(
              key: const Key('attendanceButton'),
              tooltip: l10n.attendance,
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const AttendancePage()),
              ),
              icon: const Icon(Icons.qr_code_scanner),
            ),
          TextButton(
            key: const Key('logoutButton'),
            onPressed: () => ref.read(authProvider.notifier).logout(),
            child: Text(l10n.logOut),
          ),
        ],
      ),
      floatingActionButton: floatingActionButton,
      body: Column(
        children: [
          ?bottom,
          Expanded(child: body),
        ],
      ),
    );
  }
}

class AsyncRefreshBody<T> extends StatelessWidget {
  const AsyncRefreshBody({
    super.key,
    required this.value,
    required this.onRefresh,
    required this.builder,
    required this.isEmpty,
    this.emptyMessage,
  });

  final AsyncValue<T> value;
  final Future<void> Function() onRefresh;
  final Widget Function(T data) builder;
  final bool Function(T data) isEmpty;
  final String? emptyMessage;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return value.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                localizedError(l10n, error),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRefresh, child: Text(l10n.retry)),
            ],
          ),
        ),
      ),
      data: (data) {
        if (isEmpty(data)) {
          return RefreshIndicator(
            onRefresh: onRefresh,
            child: ListView(
              physics: const AlwaysScrollableScrollPhysics(),
              children: [
                const SizedBox(height: 120),
                Center(child: Text(emptyMessage ?? l10n.nothingHereYet)),
              ],
            ),
          );
        }
        return RefreshIndicator(onRefresh: onRefresh, child: builder(data));
      },
    );
  }
}
