import 'package:digital_student/features/attendance/attendance.dart';
import 'package:digital_student/features/attendance/attendance_providers.dart';
import 'package:digital_student/features/attendance/presentation/attendance_scan_page.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AttendancePage extends ConsumerWidget {
  const AttendancePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendance = ref.watch(todaysAttendanceProvider);

    return SchoolScaffold(
      title: 'Attendance',
      showAttendanceShortcut: false,
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                key: const Key('scanStudentQrButton'),
                onPressed: () async {
                  await Navigator.of(context).push<void>(
                    MaterialPageRoute<void>(builder: (_) => const AttendanceScanPage()),
                  );
                  ref.invalidate(todaysAttendanceProvider);
                },
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('Scan Student QR'),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text("Today's Attendance", style: Theme.of(context).textTheme.titleMedium),
            ),
          ),
          Expanded(
            child: AsyncRefreshBody(
              value: attendance,
              onRefresh: () async {
                ref.invalidate(todaysAttendanceProvider);
                await ref.read(todaysAttendanceProvider.future);
              },
              isEmpty: (page) => page.data.isEmpty,
              emptyMessage: 'No attendance recorded yet',
              builder: (page) => ListView.builder(
                physics: const AlwaysScrollableScrollPhysics(),
                itemCount: page.data.length,
                itemBuilder: (context, index) {
                  final row = page.data[index];
                  return ListTile(
                    leading: const Icon(Icons.check_circle, color: Colors.green),
                    title: Text(row.student.displayName),
                    subtitle: Text(row.student.studentNumber),
                    trailing: Text(formatAttendanceTime(row.scannedAt)),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}
