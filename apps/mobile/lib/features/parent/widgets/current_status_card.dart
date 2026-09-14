import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:flutter/material.dart';

class CurrentStatusCard extends StatelessWidget {
  const CurrentStatusCard({super.key, required this.journey});

  final ParentJourneySummary journey;

  @override
  Widget build(BuildContext context) {
    final color = parentStatusColor(journey.currentState);
    return Card(
      key: const Key('currentStatusCard'),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Current status',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.circle, size: 12, color: color),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    parentCurrentStatusLabel(journey.currentState),
                    key: const Key('currentStatusLabel'),
                  ),
                ),
              ],
            ),
            if (journey.lastEventAt != null) ...[
              const SizedBox(height: 8),
              Text(
                'Last update ${formatParentTime(journey.lastEventAt!)}',
                style: Theme.of(context).textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
