import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/campuses/campus_providers.dart';
import 'package:digital_student/features/classrooms/classroom_providers.dart';
import 'package:digital_student/features/transport/providers/transport_providers.dart';
import 'package:digital_student/features/users/presentation/user_details_page.dart';
import 'package:digital_student/features/users/user_providers.dart';
import 'package:digital_student/features/users/user_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class AddUserPage extends ConsumerStatefulWidget {
  const AddUserPage({super.key});

  @override
  ConsumerState<AddUserPage> createState() => _AddUserPageState();
}

class _AddUserPageState extends ConsumerState<AddUserPage> {
  final _formKey = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();

  String? _role;
  bool _setPassword = false;
  bool _saving = false;
  final Set<String> _campusIds = {};
  final Set<String> _classroomIds = {};
  final Set<String> _routeIds = {};
  String? _classroomCampusFilter;
  String? _routeCampusFilter;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    final actor = ref.read(authProvider).user;
    if (!(_formKey.currentState?.validate() ?? false) || _role == null || actor == null) {
      return;
    }
    if (!actor.canManageUserWithRole(_role!)) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.errorForbidden)),
      );
      return;
    }

    setState(() => _saving = true);
    try {
      final result = await ref.read(userRepositoryProvider).create(
            email: _email.text,
            firstName: _first.text,
            lastName: _last.text,
            role: _role!,
            invite: !_setPassword,
            password: _setPassword ? _password.text : null,
            campusIds: _role == 'SUPERVISOR' ? _campusIds.toList() : const [],
            classroomIds: _role == 'TEACHER' ? _classroomIds.toList() : const [],
            routeIds: _role == 'DRIVER' ? _routeIds.toList() : const [],
          );
      _password.clear();
      invalidateStaffUsers(ref);
      if (!mounted) return;
      if (result.invitation != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.userInvitationCreated)),
        );
        Navigator.of(context).pop(true);
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.userCreated)),
      );
      await Navigator.of(context).pushReplacement(
        MaterialPageRoute<void>(
          builder: (_) => UserDetailsPage(userId: result.user!.id),
        ),
      );
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final actor = ref.watch(authProvider).user;
    final roles = actor?.creatableStaffRoles ?? const <String>[];
    final campuses = ref.watch(campusesProvider);
    final classrooms = ref.watch(classroomsProvider(_classroomCampusFilter));
    final routes = ref.watch(routesProvider(_routeCampusFilter));

    return SchoolScaffold(
      title: l10n.addUser,
      showAttendanceShortcut: false,
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              key: const Key('addUserRoleField'),
              initialValue: _role,
              decoration: InputDecoration(labelText: l10n.role),
              items: [
                for (final role in roles)
                  DropdownMenuItem(
                    value: role,
                    child: Text(tenantRoleLabel(l10n, role)),
                  ),
              ],
              onChanged: (value) {
                setState(() {
                  _role = value;
                  _campusIds.clear();
                  _classroomIds.clear();
                  _routeIds.clear();
                });
              },
              validator: (v) => v == null ? l10n.fieldRequired : null,
            ),
            TextFormField(
              key: const Key('addUserFirstNameField'),
              controller: _first,
              decoration: InputDecoration(labelText: l10n.firstName),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
            ),
            TextFormField(
              key: const Key('addUserLastNameField'),
              controller: _last,
              decoration: InputDecoration(labelText: l10n.lastName),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
            ),
            TextFormField(
              key: const Key('addUserEmailField'),
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: InputDecoration(labelText: l10n.email),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return l10n.fieldRequired;
                if (!v.contains('@')) return l10n.invalidEmail;
                return null;
              },
            ),
            SwitchListTile(
              key: const Key('addUserSetPasswordSwitch'),
              contentPadding: EdgeInsets.zero,
              title: Text(l10n.setPasswordNow),
              subtitle: Text(l10n.setPasswordNowHint),
              value: _setPassword,
              onChanged: (value) => setState(() => _setPassword = value),
            ),
            if (_setPassword)
              TextFormField(
                key: const Key('addUserPasswordField'),
                controller: _password,
                obscureText: true,
                decoration: InputDecoration(labelText: l10n.password),
                validator: (v) {
                  if (!_setPassword) return null;
                  if (v == null || v.isEmpty) return l10n.fieldRequired;
                  if (v.length < 8) return l10n.passwordTooWeak;
                  return null;
                },
              ),
            if (_role == 'SUPERVISOR') ...[
              const SizedBox(height: 12),
              Text(l10n.assignCampuses, style: Theme.of(context).textTheme.titleMedium),
              campuses.when(
                loading: () => const LinearProgressIndicator(),
                error: (e, _) => Text(localizedError(l10n, e)),
                data: (page) => Column(
                  children: [
                    for (final campus in page.data)
                      CheckboxListTile(
                        value: _campusIds.contains(campus.id),
                        title: Text(campus.name),
                        onChanged: (checked) {
                          setState(() {
                            if (checked == true) {
                              _campusIds.add(campus.id);
                            } else {
                              _campusIds.remove(campus.id);
                            }
                          });
                        },
                      ),
                  ],
                ),
              ),
            ],
            if (_role == 'TEACHER') ...[
              const SizedBox(height: 12),
              Text(l10n.assignClassrooms, style: Theme.of(context).textTheme.titleMedium),
              campuses.when(
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
                data: (page) => DropdownButtonFormField<String>(
                  initialValue: _classroomCampusFilter,
                  decoration: InputDecoration(labelText: l10n.filterByCampus),
                  items: [
                    DropdownMenuItem(value: null, child: Text(l10n.filterAll)),
                    for (final campus in page.data)
                      DropdownMenuItem(value: campus.id, child: Text(campus.name)),
                  ],
                  onChanged: (value) => setState(() => _classroomCampusFilter = value),
                ),
              ),
              classrooms.when(
                loading: () => const LinearProgressIndicator(),
                error: (e, _) => Text(localizedError(l10n, e)),
                data: (page) => Column(
                  children: [
                    for (final room in page.data)
                      CheckboxListTile(
                        value: _classroomIds.contains(room.id),
                        title: Text(room.name),
                        onChanged: (checked) {
                          setState(() {
                            if (checked == true) {
                              _classroomIds.add(room.id);
                            } else {
                              _classroomIds.remove(room.id);
                            }
                          });
                        },
                      ),
                  ],
                ),
              ),
            ],
            if (_role == 'DRIVER') ...[
              const SizedBox(height: 12),
              Text(l10n.assignRoutes, style: Theme.of(context).textTheme.titleMedium),
              campuses.when(
                loading: () => const SizedBox.shrink(),
                error: (_, _) => const SizedBox.shrink(),
                data: (page) => DropdownButtonFormField<String>(
                  initialValue: _routeCampusFilter,
                  decoration: InputDecoration(labelText: l10n.filterByCampus),
                  items: [
                    DropdownMenuItem(value: null, child: Text(l10n.filterAll)),
                    for (final campus in page.data)
                      DropdownMenuItem(value: campus.id, child: Text(campus.name)),
                  ],
                  onChanged: (value) => setState(() => _routeCampusFilter = value),
                ),
              ),
              routes.when(
                loading: () => const LinearProgressIndicator(),
                error: (e, _) => Text(localizedError(l10n, e)),
                data: (list) => Column(
                  children: [
                    for (final route in list)
                      CheckboxListTile(
                        value: _routeIds.contains(route.id),
                        title: Text(route.name),
                        onChanged: (checked) {
                          setState(() {
                            if (checked == true) {
                              _routeIds.add(route.id);
                            } else {
                              _routeIds.remove(route.id);
                            }
                          });
                        },
                      ),
                  ],
                ),
              ),
            ],
            if (_role == 'GUARDIAN') ...[
              const SizedBox(height: 12),
              Text(l10n.guardianLinkHint),
            ],
            const SizedBox(height: 24),
            FilledButton(
              key: const Key('submitAddUserButton'),
              onPressed: _saving ? null : _submit,
              child: _saving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(l10n.addUser),
            ),
          ],
        ),
      ),
    );
  }
}
