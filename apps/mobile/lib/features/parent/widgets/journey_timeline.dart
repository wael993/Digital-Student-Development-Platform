import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:digital_student/features/parent/widgets/journey_event_tile.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class JourneyTimeline extends StatelessWidget {
  const JourneyTimeline({super.key, required this.events, this.currentState});

  final List<ParentJourneyEvent> events;
  final String? currentState;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    if (events.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Text(l10n.noActivityYet),
      );
    }

    final latestId = events.last.id;
    return Column(
      key: const Key('journeyTimeline'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (var i = 0; i < events.length; i++)
          JourneyEventTile(
            event: events[i],
            isCurrent:
                events[i].id == latestId || events[i].eventType == currentState,
            isLast: i == events.length - 1,
          ),
      ],
    );
  }
}
