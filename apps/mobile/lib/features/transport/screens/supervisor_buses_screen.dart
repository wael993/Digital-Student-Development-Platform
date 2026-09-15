import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/transport/repositories/transport_repository.dart';
import 'package:digital_student/features/transport/screens/route_setup_screen.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SupervisorBusesScreen extends ConsumerWidget {
  const SupervisorBusesScreen({super.key, this.campusId});

  final String? campusId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final buses = ref.watch(busesProvider(campusId));
    final routes = ref.watch(routesProvider(campusId));
    return SchoolScaffold(
      title: l10n.buses,
      floatingActionButton: campusId == null
          ? null
          : FloatingActionButton(
              onPressed: () => _createBus(context, ref),
              child: const Icon(Icons.add),
            ),
      body: ListView(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Text(l10n.buses, style: Theme.of(context).textTheme.titleMedium),
          ),
          buses.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text(localizedError(l10n, error)),
            ),
            data: (items) => items.isEmpty
                ? ListTile(title: Text(l10n.nothingHereYet))
                : Column(
                    children: [
                      for (final bus in items)
                        ListTile(
                          title: Text(bus.name),
                          subtitle: Text(bus.registrationNumber),
                        ),
                    ],
                  ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: Row(
              children: [
                Text(l10n.routes, style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                if (campusId != null)
                  TextButton(
                    onPressed: () => _createRoute(context, ref),
                    child: Text(l10n.newRoute),
                  ),
              ],
            ),
          ),
          routes.when(
            loading: () => const LinearProgressIndicator(),
            error: (error, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text(localizedError(l10n, error)),
            ),
            data: (items) => Column(
              children: [
                for (final route in items)
                  ListTile(
                    title: Text(route.name),
                    subtitle: Text(
                      route.direction == 'SCHOOL_TO_HOME'
                          ? l10n.schoolToHome
                          : l10n.homeToSchool,
                    ),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute<void>(
                        builder: (_) => RouteSetupScreen(route: route),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _createBus(BuildContext context, WidgetRef ref) async {
    final campus = campusId;
    if (campus == null) {
      return;
    }
    final created = await showDialog<_BusDraft>(
      context: context,
      builder: (context) => const _BusDialog(),
    );
    if (created == null || created.name.isEmpty || created.registration.isEmpty) {
      return;
    }
    try {
      await ref.read(transportRepositoryProvider).createBus(
            campusId: campus,
            name: created.name,
            registrationNumber: created.registration,
            capacity: created.capacity,
          );
      ref.invalidate(busesProvider(campusId));
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(AppLocalizations.of(context), error))),
        );
      }
    }
  }

  Future<void> _createRoute(BuildContext context, WidgetRef ref) async {
    final buses = await ref.read(busesProvider(campusId).future);
    if (buses.isEmpty || !context.mounted) {
      return;
    }
    final created = await showDialog<_RouteDraft>(
      context: context,
      builder: (context) => _RouteDialog(buses: buses),
    );
    if (created == null || created.name.isEmpty) {
      return;
    }
    try {
      await ref.read(transportRepositoryProvider).createRoute(
            busId: created.busId,
            name: created.name,
            direction: created.direction,
          );
      ref.invalidate(routesProvider(campusId));
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(AppLocalizations.of(context), error))),
        );
      }
    }
  }
}

class _BusDraft {
  const _BusDraft(this.name, this.registration, this.capacity);
  final String name;
  final String registration;
  final int capacity;
}

class _BusDialog extends StatefulWidget {
  const _BusDialog();

  @override
  State<_BusDialog> createState() => _BusDialogState();
}

class _BusDialogState extends State<_BusDialog> {
  final _name = TextEditingController();
  final _registration = TextEditingController();
  final _capacity = TextEditingController(text: '18');

  @override
  void dispose() {
    _name.dispose();
    _registration.dispose();
    _capacity.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return AlertDialog(
      title: Text(l10n.newBus),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          TextField(controller: _name, decoration: InputDecoration(labelText: l10n.name)),
          TextField(
            controller: _registration,
            decoration: InputDecoration(labelText: l10n.registrationNumber),
          ),
          TextField(
            controller: _capacity,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(labelText: l10n.capacity),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.cancel)),
        FilledButton(
          onPressed: () => Navigator.pop(
            context,
            _BusDraft(_name.text.trim(), _registration.text.trim(), int.tryParse(_capacity.text) ?? 18),
          ),
          child: Text(l10n.save),
        ),
      ],
    );
  }
}

class _RouteDraft {
  const _RouteDraft(this.busId, this.name, this.direction);
  final String busId;
  final String name;
  final String direction;
}

class _RouteDialog extends StatefulWidget {
  const _RouteDialog({required this.buses});

  final List<BusRecord> buses;

  @override
  State<_RouteDialog> createState() => _RouteDialogState();
}

class _RouteDialogState extends State<_RouteDialog> {
  late String _busId = widget.buses.first.id;
  final _name = TextEditingController();
  String _direction = 'HOME_TO_SCHOOL';

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return AlertDialog(
      title: Text(l10n.newRoute),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonFormField<String>(
            initialValue: _busId,
            items: [
              for (final bus in widget.buses)
                DropdownMenuItem(value: bus.id, child: Text(bus.name)),
            ],
            onChanged: (value) => setState(() => _busId = value ?? _busId),
          ),
          TextField(controller: _name, decoration: InputDecoration(labelText: l10n.name)),
          DropdownButtonFormField<String>(
            initialValue: _direction,
            items: [
              DropdownMenuItem(value: 'HOME_TO_SCHOOL', child: Text(l10n.homeToSchool)),
              DropdownMenuItem(value: 'SCHOOL_TO_HOME', child: Text(l10n.schoolToHome)),
            ],
            onChanged: (value) => setState(() => _direction = value ?? _direction),
          ),
        ],
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(l10n.cancel)),
        FilledButton(
          onPressed: () => Navigator.pop(context, _RouteDraft(_busId, _name.text.trim(), _direction)),
          child: Text(l10n.save),
        ),
      ],
    );
  }
}
