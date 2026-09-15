import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/transport/screens/cancel_transport_screen.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ParentTransportScreen extends ConsumerWidget {
  const ParentTransportScreen({super.key, required this.studentId, required this.childName});

  final String studentId;
  final String childName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final today = ref.watch(parentTransportProvider(studentId));
    return Scaffold(
      appBar: AppBar(title: Text(l10n.transport)),
      body: today.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(localizedError(l10n, error))),
        data: (data) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(parentTransportProvider(studentId));
            await ref.read(parentTransportProvider(studentId).future);
          },
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Text(childName, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              for (final plan in data.directions) ...[
                _DirectionCard(studentId: studentId, plan: plan),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class ParentTransportCard extends ConsumerWidget {
  const ParentTransportCard({super.key, required this.studentId, required this.childName});

  final String studentId;
  final String childName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final today = ref.watch(parentTransportProvider(studentId));
    return today.maybeWhen(
      data: (data) => Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(l10n.todaysTransport, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              for (final plan in data.directions.take(2))
                Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Text(_summary(l10n, plan)),
                ),
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => ParentTransportScreen(
                        studentId: studentId,
                        childName: childName,
                      ),
                    ),
                  ),
                  child: Text(l10n.viewAll),
                ),
              ),
            ],
          ),
        ),
      ),
      orElse: () => const SizedBox.shrink(),
    );
  }

  String _summary(AppLocalizations l10n, TransportDirectionPlan plan) {
    final direction = plan.direction == 'SCHOOL_TO_HOME' ? l10n.schoolToHome : l10n.homeToSchool;
    if (plan.cancelled) {
      return '$direction — ${l10n.busCancelled}';
    }
    if (plan.usesBus && plan.progress != null) {
      return '$direction — ${l10n.stopsRemaining(plan.progress!.stopsRemaining)}';
    }
    return '$direction — ${_methodLabel(l10n, plan.transportMethod)}';
  }
}

class _DirectionCard extends StatelessWidget {
  const _DirectionCard({required this.studentId, required this.plan});

  final String studentId;
  final TransportDirectionPlan plan;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final progress = plan.progress;
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              plan.direction == 'SCHOOL_TO_HOME' ? l10n.schoolToHome : l10n.homeToSchool,
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            if (plan.cancelled)
              Text(l10n.busCancelled)
            else if (progress != null) ...[
              if (progress.busName != null) Text('${l10n.transport}: ${progress.busName}'),
              if (progress.currentStop != null)
                Text('${l10n.currentStop}: ${progress.currentStop!.name}'),
              if (progress.childStop != null) Text('${l10n.yourStop}: ${progress.childStop!.name}'),
              Text(l10n.stopsRemaining(progress.stopsRemaining)),
              Text(l10n.estimatedArrivalInMinutes(progress.estimatedMinutes)),
              if (progress.estimatedArrivalTime != null)
                Text('${l10n.estimatedArrival}: ${progress.estimatedArrivalTime}'),
              if (progress.childrenAtStop > 1)
                Text(l10n.childrenAtStopCount(progress.childrenAtStop)),
              Text(l10n.notLiveTracking, style: Theme.of(context).textTheme.bodySmall),
            ] else
              Text(_methodLabel(l10n, plan.transportMethod)),
            if (plan.usesBus || plan.cancelled)
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: TextButton(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => CancelTransportScreen(
                        studentId: studentId,
                        direction: plan.direction,
                      ),
                    ),
                  ),
                  child: Text(l10n.cancelBus),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

String _methodLabel(AppLocalizations l10n, String method) {
  switch (method) {
    case 'PARENT_CAR':
      return l10n.parentCar;
    case 'PARENT_PICKUP':
      return l10n.parentPickup;
    case 'AUTHORIZED_PICKUP':
      return l10n.authorizedPickup;
    case 'BUS':
      return l10n.transport;
    default:
      return method;
  }
}
