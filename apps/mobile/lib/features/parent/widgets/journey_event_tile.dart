import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:flutter/material.dart';

class JourneyEventTile extends StatelessWidget {
  const JourneyEventTile({
    super.key,
    required this.event,
    required this.isCurrent,
    this.isLast = false,
  });

  final ParentJourneyEvent event;
  final bool isCurrent;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 72,
            child: Text(
              formatParentTime(event.occurredAt),
              style: theme.textTheme.bodyMedium,
            ),
          ),
          Column(
            children: [
              Icon(
                parentEventIcon(event.eventType),
                color: isCurrent
                    ? theme.colorScheme.primary
                    : theme.colorScheme.outline,
                size: isCurrent ? 28 : 22,
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: theme.colorScheme.outlineVariant,
                  ),
                ),
            ],
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 24),
              child: Text(
                parentEventLabel(event.eventType),
                style: isCurrent
                    ? theme.textTheme.titleMedium
                    : theme.textTheme.bodyLarge,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
