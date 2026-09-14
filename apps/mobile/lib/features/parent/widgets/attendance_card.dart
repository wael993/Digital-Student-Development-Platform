import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:flutter/material.dart';

class AttendanceCard extends StatelessWidget {
  const AttendanceCard({super.key, required this.attendance});

  final ParentAttendance attendance;

  @override
  Widget build(BuildContext context) {
    final recorded = attendance.isRecorded;
    return Card(
      key: const Key('attendanceCard'),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              "Today's Attendance",
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(recorded ? 'Present' : 'Not recorded yet'),
            if (recorded) ...[
              const SizedBox(height: 4),
              Text(
                'Recorded at ${formatParentTime(attendance.recordedAt!)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
