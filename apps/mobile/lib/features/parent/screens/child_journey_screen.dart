import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/providers/parent_providers.dart';
import 'package:digital_student/features/parent/widgets/journey_timeline.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChildJourneyScreen extends ConsumerWidget {
  const ChildJourneyScreen({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final journey = ref.watch(childJourneyProvider(studentId));
    return Scaffold(
      appBar: AppBar(
        title: Text(
          journey.maybeWhen(
            data: (data) => l10n.childDay(data.firstName),
            orElse: () => l10n.todaysJourney,
          ),
        ),
      ),
      body: journey.when(
        skipLoadingOnReload: true,
        loading: () => Center(child: Text(l10n.loadingTodaysJourney)),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  parentLoadErrorMessage(
                    l10n,
                    error,
                    fallback: l10n.unableToLoadJourney,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  key: const Key('childJourneyRetry'),
                  onPressed: () =>
                      ref.invalidate(childJourneyProvider(studentId)),
                  child: Text(l10n.tryAgain),
                ),
              ],
            ),
          ),
        ),
        data: (data) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(childJourneyProvider(studentId));
            await ref.read(childJourneyProvider(studentId).future);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                l10n.todaysJourney,
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 16),
              JourneyTimeline(
                events: data.events,
                currentState: data.currentState,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
