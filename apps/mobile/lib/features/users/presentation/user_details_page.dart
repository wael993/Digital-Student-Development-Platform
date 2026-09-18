import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/models/user.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/campuses/campus_providers.dart';
import 'package:digital_student/features/classrooms/classroom_providers.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/users/staff_user.dart';
import 'package:digital_student/features/users/user_providers.dart';
import 'package:digital_student/features/users/user_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserDetailsPage extends ConsumerWidget {
  const UserDetailsPage({super.key, required this.userId});

  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final actor = ref.watch(authProvider).user;
    final details = ref.watch(staffUserDetailsProvider(userId));

    return SchoolScaffold(
      title: l10n.userDetails,
      showAttendanceShortcut: false,
      body: details.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(localizedError(l10n, error), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                FilledButton(
                  onPressed: () => ref.invalidate(staffUserDetailsProvider(userId)),
                  child: Text(l10n.retry),
                ),
              ],
            ),
          ),
        ),
        data: (staff) {
          final canManage = actor?.canManageUserWithRole(staff.role) ?? false;
          final canChangeRole = actor?.canChangeUserRoles ?? false;
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              ListTile(
                title: Text(staff.displayName),
                subtitle: Text(staff.email),
              ),
              ListTile(
                title: Text(l10n.role),
                subtitle: Text(tenantRoleLabel(l10n, staff.role)),
              ),
              ListTile(
                title: Text(l10n.status),
                subtitle: Text(userStatusLabel(l10n, staff.status)),
              ),
              if (staff.campusIds.isNotEmpty)
                _AssignmentNames(
                  title: l10n.assignCampuses,
                  ids: staff.campusIds,
                  kind: _AssignmentKind.campus,
                ),
              if (staff.classroomIds.isNotEmpty)
                _AssignmentNames(
                  title: l10n.assignClassrooms,
                  ids: staff.classroomIds,
                  kind: _AssignmentKind.classroom,
                ),
              if (staff.routeIds.isNotEmpty)
                _AssignmentNames(
                  title: l10n.assignRoutes,
                  ids: staff.routeIds,
                  kind: _AssignmentKind.route,
                ),
              if (staff.createdAt != null)
                ListTile(
                  title: Text(l10n.createdAt),
                  subtitle: Text(
                    formatAppDate(staff.createdAt!, Localizations.localeOf(context).toString()),
                  ),
                ),
              if (canManage) ...[
                const SizedBox(height: 16),
                FilledButton(
                  key: const Key('editUserButton'),
                  onPressed: () => _edit(context, ref, actor!, staff, canChangeRole),
                  child: Text(l10n.editUser),
                ),
                const SizedBox(height: 8),
                if (staff.isActive)
                  OutlinedButton(
                    key: const Key('disableUserButton'),
                    onPressed: () => _confirmDisable(context, ref, staff),
                    child: Text(l10n.disableUser),
                  )
                else
                  OutlinedButton(
                    key: const Key('enableUserButton'),
                    onPressed: () => _enable(context, ref, staff),
                    child: Text(l10n.enableUser),
                  ),
              ],
            ],
          );
        },
      ),
    );
  }

  Future<void> _confirmDisable(
    BuildContext context,
    WidgetRef ref,
    StaffUser staff,
  ) async {
    final l10n = AppLocalizations.of(context);
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.disableUser),
        content: Text(l10n.confirmDisableUser),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: Text(l10n.cancel)),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(l10n.disableUser)),
        ],
      ),
    );
    if (ok != true || !context.mounted) return;
    try {
      await ref.read(userRepositoryProvider).disable(staff.id);
      invalidateStaffUsers(ref, userId: staff.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.userDisabled)));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    }
  }

  Future<void> _enable(BuildContext context, WidgetRef ref, StaffUser staff) async {
    final l10n = AppLocalizations.of(context);
    try {
      await ref.read(userRepositoryProvider).enable(staff.id);
      invalidateStaffUsers(ref, userId: staff.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.userEnabled)));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    }
  }

  Future<void> _edit(
    BuildContext context,
    WidgetRef ref,
    User actor,
    StaffUser staff,
    bool canChangeRole,
  ) async {
    final l10n = AppLocalizations.of(context);
    final first = TextEditingController(text: staff.firstName);
    final last = TextEditingController(text: staff.lastName);
    var role = staff.role;

    final saved = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setState) {
            return AlertDialog(
              title: Text(l10n.editUser),
              content: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextField(
                      controller: first,
                      decoration: InputDecoration(labelText: l10n.firstName),
                    ),
                    TextField(
                      controller: last,
                      decoration: InputDecoration(labelText: l10n.lastName),
                    ),
                    if (canChangeRole)
                      DropdownButtonFormField<String>(
                        initialValue: role,
                        decoration: InputDecoration(labelText: l10n.role),
                        items: [
                          for (final r in actor.creatableStaffRoles)
                            DropdownMenuItem(
                              value: r,
                              child: Text(tenantRoleLabel(l10n, r)),
                            ),
                        ],
                        onChanged: (value) {
                          if (value != null) setState(() => role = value);
                        },
                      ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: Text(l10n.cancel),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: Text(l10n.save),
                ),
              ],
            );
          },
        );
      },
    );

    if (saved != true || !context.mounted) {
      first.dispose();
      last.dispose();
      return;
    }

    try {
      await ref.read(userRepositoryProvider).patch(
            id: staff.id,
            firstName: first.text,
            lastName: last.text,
            role: canChangeRole && role != staff.role ? role : null,
          );
      invalidateStaffUsers(ref, userId: staff.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.userUpdated)));
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    } finally {
      first.dispose();
      last.dispose();
    }
  }
}

enum _AssignmentKind { campus, classroom, route }

class _AssignmentNames extends ConsumerWidget {
  const _AssignmentNames({
    required this.title,
    required this.ids,
    required this.kind,
  });

  final String title;
  final List<String> ids;
  final _AssignmentKind kind;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final names = switch (kind) {
      _AssignmentKind.campus => ref.watch(campusesProvider).maybeWhen(
            data: (page) => [
              for (final c in page.data)
                if (ids.contains(c.id)) c.name,
            ],
            orElse: () => ids,
          ),
      _AssignmentKind.classroom => ref.watch(classroomsProvider(null)).maybeWhen(
            data: (page) => [
              for (final c in page.data)
                if (ids.contains(c.id)) c.name,
            ],
            orElse: () => ids,
          ),
      _AssignmentKind.route => ref.watch(routesProvider(null)).maybeWhen(
            data: (list) => [
              for (final r in list)
                if (ids.contains(r.id)) r.name,
            ],
            orElse: () => ids,
          ),
    };

    return ListTile(
      title: Text(title),
      subtitle: Text(names.isEmpty ? ids.join(', ') : names.join(', ')),
    );
  }
}
