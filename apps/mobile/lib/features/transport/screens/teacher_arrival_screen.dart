import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/students/presentation/student_list_page.dart';
import 'package:digital_student/features/students/student_providers.dart';
import 'package:digital_student/features/transport/models/transport_models.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/transport/repositories/transport_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class TeacherArrivalScreen extends ConsumerWidget {
  const TeacherArrivalScreen({super.key, required this.classroomId, required this.classroomName});

  final String classroomId;
  final String classroomName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final today = ref.watch(classroomTransportProvider(classroomId));
    return SchoolScaffold(
      title: l10n.morningArrival,
      body: today.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(child: Text(localizedError(l10n, error))),
        data: (data) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(classroomTransportProvider(classroomId));
            await ref.read(classroomTransportProvider(classroomId).future);
          },
          child: ListView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            children: [
              Text(classroomName, style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 8),
              Text(l10n.childrenExpected(data.expected)),
              Text(l10n.arrivedByBusCount(data.arrivedByBus)),
              Text(l10n.arrivedByCarCount(data.arrivedByCar)),
              Text(l10n.notArrivedCount(data.notArrived)),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.groups_outlined),
                title: Text(l10n.students),
                trailing: const Icon(Icons.arrow_forward),
                onTap: () => Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (_) => StudentListPage(
                      classroomId: classroomId,
                      classroomName: classroomName,
                    ),
                  ),
                ),
              ),
              Text(l10n.swipeRightArrived, style: Theme.of(context).textTheme.bodySmall),
              Text(l10n.swipeLeftNotPresent, style: Theme.of(context).textTheme.bodySmall),
              const SizedBox(height: 12),
              for (final child in data.children)
                _ChildTile(classroomId: classroomId, child: child),
            ],
          ),
        ),
      ),
    );
  }
}

class _ChildTile extends ConsumerWidget {
  const _ChildTile({required this.classroomId, required this.child});

  final String classroomId;
  final ClassroomChildTransport child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    return Dismissible(
      key: ValueKey(child.id),
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.startToEnd) {
          return _confirmAndRun(context, ref, () {
            return ref.read(transportRepositoryProvider).recordArrival(child.id);
          });
        }
        return _confirmAndRun(context, ref, () {
          return ref.read(transportRepositoryProvider).recordArrival(
                child.id,
                status: 'NOT_PRESENT',
              );
        });
      },
      background: Container(
        color: Colors.green.shade100,
        alignment: AlignmentDirectional.centerStart,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Text(l10n.markArrived),
      ),
      secondaryBackground: Container(
        color: Colors.orange.shade100,
        alignment: AlignmentDirectional.centerEnd,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Text(l10n.markNotPresent),
      ),
      child: ListTile(
        title: Text(child.displayName),
        subtitle: Text(_statusLabel(l10n, child.arrivalStatus)),
        trailing: PopupMenuButton<String>(
          onSelected: (value) => _onMenu(context, ref, value),
          itemBuilder: (context) => [
            PopupMenuItem(value: 'CAR', child: Text(l10n.arrivedByCar)),
            PopupMenuItem(value: 'PARENT_PICKUP', child: Text(l10n.parentPickup)),
            PopupMenuItem(value: 'AUTHORIZED_PICKUP', child: Text(l10n.authorizedPickup)),
          ],
        ),
      ),
    );
  }

  Future<void> _onMenu(BuildContext context, WidgetRef ref, String value) async {
    final l10n = AppLocalizations.of(context);
    final ok = await _confirm(context, l10n);
    if (!ok || !context.mounted) {
      return;
    }
    final repo = ref.read(transportRepositoryProvider);
    try {
      if (value == 'CAR') {
        await repo.recordArrival(child.id, method: 'PARENT_CAR');
      } else if (value == 'PARENT_PICKUP') {
        await repo.recordPickup(child.id, type: value);
      } else if (value == 'AUTHORIZED_PICKUP') {
        final personId = await _pickAuthorizedPerson(context, ref);
        if (personId == null) {
          return;
        }
        await repo.recordPickup(child.id, type: value, pickupPersonId: personId);
      }
      ref.invalidate(classroomTransportProvider(classroomId));
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    }
  }

  Future<String?> _pickAuthorizedPerson(BuildContext context, WidgetRef ref) async {
    final l10n = AppLocalizations.of(context);
    final student = await ref.read(studentDetailsProvider(child.id).future);
    if (!context.mounted) {
      return null;
    }
    if (student.guardians.isEmpty) {
      return null;
    }
    return showDialog<String>(
      context: context,
      builder: (context) => SimpleDialog(
        title: Text(l10n.pickupPerson),
        children: [
          for (final guardian in student.guardians)
            SimpleDialogOption(
              onPressed: () => Navigator.pop(context, guardian.userId),
              child: Text(
                '${guardian.displayName} (${relationshipLabel(l10n, guardian.relationship)})',
              ),
            ),
        ],
      ),
    );
  }

  Future<bool> _confirmAndRun(
    BuildContext context,
    WidgetRef ref,
    Future<void> Function() action,
  ) async {
    final l10n = AppLocalizations.of(context);
    final ok = await _confirm(context, l10n);
    if (!ok) {
      return false;
    }
    try {
      await action();
      ref.invalidate(classroomTransportProvider(classroomId));
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    }
    return false;
  }

  Future<bool> _confirm(BuildContext context, AppLocalizations l10n) async {
    return await showDialog<bool>(
          context: context,
          builder: (context) => AlertDialog(
            title: Text(l10n.confirmStatusChange),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.cancel)),
              FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l10n.confirm)),
            ],
          ),
        ) ??
        false;
  }

  String _statusLabel(AppLocalizations l10n, String status) {
    switch (status) {
      case 'ARRIVED':
        return l10n.markArrived;
      case 'ARRIVED_BY_CAR':
        return l10n.arrivedByCar;
      case 'PARENT_PICKUP':
        return l10n.parentPickup;
      case 'AUTHORIZED_PICKUP':
        return l10n.authorizedPickup;
      default:
        return l10n.markNotPresent;
    }
  }
}
