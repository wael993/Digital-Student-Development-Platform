import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/transport/repositories/transport_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class RouteSetupScreen extends ConsumerWidget {
  const RouteSetupScreen({super.key, required this.route});

  final BusRouteRecord route;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final stops = ref.watch(routeStopsProvider(route.id));
    final students = ref.watch(routeStudentsProvider(route.id));
    final segments = ref.watch(routeSegmentsProvider(route.id));
    return Scaffold(
      appBar: AppBar(title: Text(route.name)),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final name = await showDialog<String>(
            context: context,
            builder: (context) => _NameDialog(title: l10n.addStop, label: l10n.name),
          );
          if (name == null || name.isEmpty) {
            return;
          }
          await ref.read(transportRepositoryProvider).addStop(route.id, name: name);
          ref.invalidate(routeStopsProvider(route.id));
          ref.invalidate(routeSegmentsProvider(route.id));
        },
        child: const Icon(Icons.add_location_alt),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Text(l10n.routes, style: Theme.of(context).textTheme.titleMedium),
          stops.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, _) => Text(localizedError(l10n, error)),
            data: (items) => Column(
              children: [
                for (final stop in items)
                  ListTile(title: Text('${stop.sequence}. ${stop.name}')),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(l10n.segmentMinutes, style: Theme.of(context).textTheme.titleMedium),
          segments.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, _) => Text(localizedError(l10n, error)),
            data: (items) => Column(
              children: [
                for (final segment in items)
                  ListTile(
                    title: Text('${segment.estimatedMinutes}'),
                    trailing: IconButton(
                      icon: const Icon(Icons.edit),
                      onPressed: () async {
                        final minutes = await showDialog<int>(
                          context: context,
                          builder: (context) => _MinutesDialog(current: segment.estimatedMinutes),
                        );
                        if (minutes == null) {
                          return;
                        }
                        await ref.read(transportRepositoryProvider).patchSegment(
                              segment.id,
                              estimatedMinutes: minutes,
                            );
                        ref.invalidate(routeSegmentsProvider(route.id));
                      },
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          Text(l10n.assignChildren, style: Theme.of(context).textTheme.titleMedium),
          students.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, _) => Text(localizedError(l10n, error)),
            data: (roster) => Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final stop in roster.stops) ...[
                  Text(stop.name, style: const TextStyle(fontWeight: FontWeight.w600)),
                  for (final student in stop.students)
                    ListTile(
                      title: Text(student.name ?? student.id),
                      trailing: IconButton(
                        icon: const Icon(Icons.remove_circle_outline),
                        onPressed: () async {
                          await ref.read(transportRepositoryProvider).removeStudent(
                                route.id,
                                student.id,
                              );
                          ref.invalidate(routeStudentsProvider(route.id));
                        },
                      ),
                    ),
                ],
                const SizedBox(height: 8),
                Text(l10n.unassignedChildren, style: const TextStyle(fontWeight: FontWeight.w600)),
                for (final student in roster.unassigned)
                  ListTile(
                    title: Text(student.name ?? student.id),
                    trailing: IconButton(
                      icon: const Icon(Icons.add),
                      onPressed: roster.stops.isEmpty
                          ? null
                          : () async {
                              await ref.read(transportRepositoryProvider).assignStudent(
                                    route.id,
                                    studentId: student.id,
                                    stopId: roster.stops.first.id,
                                  );
                              ref.invalidate(routeStudentsProvider(route.id));
                            },
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NameDialog extends StatefulWidget {
  const _NameDialog({required this.title, required this.label});

  final String title;
  final String label;

  @override
  State<_NameDialog> createState() => _NameDialogState();
}

class _NameDialogState extends State<_NameDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return AlertDialog(
      title: Text(widget.title),
      content: TextField(controller: _controller, decoration: InputDecoration(labelText: widget.label)),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.cancel)),
        FilledButton(
          onPressed: () => Navigator.pop(context, _controller.text.trim()),
          child: Text(l10n.save),
        ),
      ],
    );
  }
}

class _MinutesDialog extends StatefulWidget {
  const _MinutesDialog({required this.current});

  final int current;

  @override
  State<_MinutesDialog> createState() => _MinutesDialogState();
}

class _MinutesDialogState extends State<_MinutesDialog> {
  late final _controller = TextEditingController(text: '${widget.current}');

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return AlertDialog(
      title: Text(l10n.segmentMinutes),
      content: TextField(
        controller: _controller,
        keyboardType: TextInputType.number,
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.cancel)),
        FilledButton(
          onPressed: () => Navigator.pop(context, int.tryParse(_controller.text)),
          child: Text(l10n.save),
        ),
      ],
    );
  }
}
