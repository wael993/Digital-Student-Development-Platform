import 'package:digital_student/features/attendance/presentation/attendance_page.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
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
    final user = ref.watch(authProvider).user;
    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        actions: [
          if (showAttendanceShortcut && (user?.canRecordAttendance ?? false))
            IconButton(
              key: const Key('attendanceButton'),
              tooltip: 'Attendance',
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (_) => const AttendancePage()),
              ),
              icon: const Icon(Icons.qr_code_scanner),
            ),
          TextButton(
            key: const Key('logoutButton'),
            onPressed: () => ref.read(authProvider.notifier).logout(),
            child: const Text('Log out'),
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
    this.emptyMessage = 'Nothing here yet',
  });

  final AsyncValue<T> value;
  final Future<void> Function() onRefresh;
  final Widget Function(T data) builder;
  final bool Function(T data) isEmpty;
  final String emptyMessage;

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (error, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(error.toString(), textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRefresh, child: const Text('Retry')),
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
                Center(child: Text(emptyMessage)),
              ],
            ),
          );
        }
        return RefreshIndicator(onRefresh: onRefresh, child: builder(data));
      },
    );
  }
}
