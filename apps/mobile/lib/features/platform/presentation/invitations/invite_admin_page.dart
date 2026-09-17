import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/platform/data/platform_repository.dart';
import 'package:digital_student/features/platform/providers/platform_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class InviteAdminPage extends ConsumerStatefulWidget {
  const InviteAdminPage({super.key});

  @override
  ConsumerState<InviteAdminPage> createState() => _InviteAdminPageState();
}

class _InviteAdminPageState extends ConsumerState<InviteAdminPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  String? _organizationId;
  bool _saving = false;

  @override
  void dispose() {
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final orgs = ref.watch(platformOrganizationsProvider);

    return SchoolScaffold(
      title: l10n.platformInvitations,
      showAttendanceShortcut: false,
      body: orgs.when(
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
                  onPressed: () => ref.invalidate(platformOrganizationsProvider),
                  child: Text(l10n.retry),
                ),
              ],
            ),
          ),
        ),
        data: (page) {
          if (page.data.isEmpty) {
            return Center(child: Text(l10n.noOrganizationsYet));
          }
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text(l10n.inviteAdminHint),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  key: const Key('inviteOrganizationField'),
                  initialValue: _organizationId,
                  decoration: InputDecoration(labelText: l10n.platformOrganizations),
                  items: [
                    for (final org in page.data)
                      DropdownMenuItem(value: org.id, child: Text(org.name)),
                  ],
                  onChanged: (value) => setState(() => _organizationId = value),
                  validator: (value) =>
                      value == null || value.isEmpty ? l10n.fieldRequired : null,
                ),
                TextFormField(
                  key: const Key('inviteFirstNameField'),
                  controller: _firstName,
                  decoration: InputDecoration(labelText: l10n.adminFirstName),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
                ),
                TextFormField(
                  key: const Key('inviteLastNameField'),
                  controller: _lastName,
                  decoration: InputDecoration(labelText: l10n.adminLastName),
                  validator: (v) =>
                      (v == null || v.trim().isEmpty) ? l10n.fieldRequired : null,
                ),
                TextFormField(
                  key: const Key('inviteEmailField'),
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  decoration: InputDecoration(labelText: l10n.adminEmail),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return l10n.fieldRequired;
                    if (!v.contains('@')) return l10n.invalidEmail;
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                FilledButton(
                  key: const Key('submitInviteAdminButton'),
                  onPressed: _saving ? null : _submit,
                  child: _saving
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : Text(l10n.sendInvitation),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);
    if (!_formKey.currentState!.validate() || _organizationId == null) {
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(platformRepositoryProvider).inviteAdmin(
            organizationId: _organizationId!,
            email: _email.text,
            firstName: _firstName.text,
            lastName: _lastName.text,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.invitationCreated)),
      );
      _firstName.clear();
      _lastName.clear();
      _email.clear();
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
}
