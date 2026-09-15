import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/transport/repositories/transport_repository.dart';
import 'package:digital_student/features/transport/screens/boarding_scan_page.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DriverRouteScreen extends ConsumerWidget {
  const DriverRouteScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final routes = ref.watch(routesProvider(null));
    return SchoolScaffold(
      title: l10n.myRoute,
      body: AsyncRefreshBody(
        value: routes,
        onRefresh: () async {
          ref.invalidate(routesProvider(null));
          await ref.read(routesProvider(null).future);
        },
        isEmpty: (items) => items.isEmpty,
        emptyMessage: l10n.noRoutesAssigned,
        builder: (items) => ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: items.length,
          itemBuilder: (context, index) {
            final route = items[index];
            return _RouteCard(route: route);
          },
        ),
      ),
    );
  }
}

class _RouteCard extends ConsumerWidget {
  const _RouteCard({required this.route});

  final BusRouteRecord route;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final progress = ref.watch(routeProgressProvider(route.id));
    final students = ref.watch(routeStudentsProvider(route.id));
    return Card(
      margin: const EdgeInsets.all(12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(route.name, style: Theme.of(context).textTheme.titleLarge),
            Text(
              route.direction == 'SCHOOL_TO_HOME' ? l10n.schoolToHome : l10n.homeToSchool,
            ),
            const SizedBox(height: 8),
            progress.when(
              loading: () => const LinearProgressIndicator(),
              error: (error, _) => Text(localizedError(l10n, error)),
              data: (data) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.notLiveTracking, style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 8),
                  for (final stop in data.stops)
                    ListTile(
                      dense: true,
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(
                        stop.status == 'DEPARTED' || stop.status == 'ARRIVED'
                            ? Icons.check_circle
                            : stop.status == 'APPROACHING'
                                ? Icons.radio_button_checked
                                : Icons.radio_button_unchecked,
                      ),
                      title: Text('${stop.sequence}. ${stop.name}'),
                      subtitle: stop.status == null ? null : Text(stop.status!),
                    ),
                  const SizedBox(height: 8),
                  _NextStopActions(routeId: route.id, stops: data.stops),
                  students.maybeWhen(
                    data: (roster) {
                      final next = data.stops.where(
                        (stop) => stop.status == 'APPROACHING' || stop.status == null,
                      );
                      if (next.isEmpty) {
                        return const SizedBox.shrink();
                      }
                      final stop = next.first;
                      final match = roster.stops.where((row) => row.id == stop.id);
                      final count = match.isEmpty ? 0 : match.first.students.length;
                      return Text('${l10n.nextStop}: ${stop.name} ($count)');
                    },
                    orElse: () => const SizedBox.shrink(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                FilledButton.icon(
                  onPressed: () => Navigator.of(context).push(
                    MaterialPageRoute<void>(builder: (_) => const BoardingScanPage()),
                  ),
                  icon: const Icon(Icons.qr_code_scanner),
                  label: Text(l10n.scanBoardingQr),
                ),
                OutlinedButton(
                  onPressed: () async {
                    final ok = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: Text(l10n.markAllArrived),
                        content: Text(l10n.confirmMarkAllArrived),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: Text(l10n.cancel),
                          ),
                          FilledButton(
                            onPressed: () => Navigator.pop(context, true),
                            child: Text(l10n.confirm),
                          ),
                        ],
                      ),
                    );
                    if (ok == true) {
                      await ref.read(transportRepositoryProvider).registerArrivals(route.id);
                      ref.invalidate(routeStudentsProvider(route.id));
                    }
                  },
                  child: Text(l10n.markAllArrived),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _NextStopActions extends ConsumerWidget {
  const _NextStopActions({required this.routeId, required this.stops});

  final String routeId;
  final List<RouteStop> stops;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final approaching = stops.where((stop) => stop.status == 'APPROACHING');
    final arrived = stops.where((stop) => stop.status == 'ARRIVED');
    final pending = stops.where((stop) => stop.status == null);
    final current = approaching.isNotEmpty
        ? approaching.last
        : arrived.isNotEmpty
            ? arrived.last
            : pending.isNotEmpty
                ? pending.first
                : null;
    if (current == null) {
      return const SizedBox.shrink();
    }
    return Row(
      children: [
        FilledButton(
          onPressed: () async {
            await ref.read(transportRepositoryProvider).recordProgress(
                  routeId,
                  stopId: current.id,
                  status: 'ARRIVED',
                );
            ref.invalidate(routeProgressProvider(routeId));
          },
          child: Text(l10n.arrivedAtStop),
        ),
        const SizedBox(width: 8),
        OutlinedButton(
          onPressed: () async {
            await ref.read(transportRepositoryProvider).recordProgress(
                  routeId,
                  stopId: current.id,
                  status: 'DEPARTED',
                );
            ref.invalidate(routeProgressProvider(routeId));
          },
          child: Text(l10n.departStop),
        ),
      ],
    );
  }
}
