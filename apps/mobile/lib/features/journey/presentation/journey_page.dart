import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/journey/journey.dart';
import 'package:digital_student/features/journey/journey_providers.dart';
import 'package:digital_student/features/journey/journey_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class JourneyPage extends ConsumerWidget {
  const JourneyPage({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toString();
    final user = ref.watch(authProvider).user;
    final journey = ref.watch(todaysJourneyProvider(studentId));
    final canAdd = user?.canRecordJourneyEvents ?? false;
    final isGuardian = user?.role == 'GUARDIAN';

    return SchoolScaffold(
      title: journey.maybeWhen(
        data: (data) => isGuardian ? l10n.childDay(data.firstName) : l10n.studentJourney,
        orElse: () => isGuardian ? l10n.today : l10n.studentJourney,
      ),
      floatingActionButton: canAdd
          ? FloatingActionButton(
              key: const Key('journeyAddEventButton'),
              onPressed: () => _addEvent(context, ref),
              child: const Icon(Icons.add),
            )
          : null,
      body: AsyncRefreshBody(
        value: journey,
        onRefresh: () async {
          ref.invalidate(todaysJourneyProvider(studentId));
          await ref.read(todaysJourneyProvider(studentId).future);
        },
        isEmpty: (data) => data.events.isEmpty,
        emptyMessage: l10n.noJourneyEventsYet,
        builder: (data) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(24),
          children: [
            Text(data.displayName, style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            Text(
              l10n.currentlyStatus(staffCurrentStateLabel(l10n, data.currentState)),
              key: const Key('journeyCurrentState'),
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 24),
            Text(l10n.todaysTimeline, style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            for (final event in data.events)
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Text(formatAppTime(event.occurredAt, locale)),
                title: Text(staffEventLabel(l10n, event.eventType)),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _addEvent(BuildContext context, WidgetRef ref) async {
    final l10n = AppLocalizations.of(context);
    final selected = await showModalBottomSheet<String>(
      context: context,
      builder: (context) {
        final sheetL10n = AppLocalizations.of(context);
        return SafeArea(
          child: ListView(
            shrinkWrap: true,
            children: [
              for (final type in staffJourneyEventTypes)
                ListTile(
                  key: Key('journeyEventType-$type'),
                  title: Text(staffEventLabel(sheetL10n, type)),
                  onTap: () => Navigator.pop(context, type),
                ),
            ],
          ),
        );
      },
    );
    if (selected == null) {
      return;
    }

    try {
      await ref.read(journeyRepositoryProvider).createEvent(
            studentId: studentId,
            eventType: selected,
          );
      ref.invalidate(todaysJourneyProvider(studentId));
      await ref.read(todaysJourneyProvider(studentId).future);
    } on ApiException catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    }
  }
}
