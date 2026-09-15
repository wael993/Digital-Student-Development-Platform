import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class AttendanceCard extends StatelessWidget {
  const AttendanceCard({super.key, required this.attendance});

  final ParentAttendance attendance;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toString();
    final recorded = attendance.isRecorded;
    return Card(
      key: const Key('attendanceCard'),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              l10n.todaysAttendance,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(recorded ? l10n.present : l10n.notRecordedYet),
            if (recorded) ...[
              const SizedBox(height: 4),
              Text(
                l10n.recordedAt(formatAppTime(attendance.recordedAt!, locale)),
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
