import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/students/student_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const relationships = ['MOTHER', 'FATHER', 'LEGAL_GUARDIAN', 'OTHER'];

class AddGuardianPage extends ConsumerStatefulWidget {
  const AddGuardianPage({super.key, required this.studentId});

  final String studentId;

  @override
  ConsumerState<AddGuardianPage> createState() => _AddGuardianPageState();
}

class _AddGuardianPageState extends ConsumerState<AddGuardianPage> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _first = TextEditingController();
  final _last = TextEditingController();
  String _relationship = 'MOTHER';
  bool _primary = false;
  bool _saving = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _first.dispose();
    _last.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context);
    if (!(_formKey.currentState?.validate() ?? false) || _saving) {
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(studentRepositoryProvider).addGuardian(
            studentId: widget.studentId,
            email: _email.text.trim(),
            password: _password.text,
            firstName: _first.text.trim(),
            lastName: _last.text.trim(),
            relationship: _relationship,
            isPrimary: _primary,
          );
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.addGuardianTitle)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(labelText: l10n.email, border: const OutlineInputBorder()),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? l10n.emailRequired : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _password,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: l10n.passwordNewAccount,
                  border: const OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _first,
                decoration: InputDecoration(
                  labelText: l10n.firstName,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? l10n.firstNameRequired : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _last,
                decoration: InputDecoration(
                  labelText: l10n.lastName,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? l10n.lastNameRequired : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _relationship,
                decoration: InputDecoration(
                  labelText: l10n.relationship,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  for (final value in relationships)
                    DropdownMenuItem(value: value, child: Text(relationshipLabel(l10n, value))),
                ],
                onChanged: (value) => setState(() => _relationship = value ?? _relationship),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.primaryGuardian),
                value: _primary,
                onChanged: (value) => setState(() => _primary = value),
              ),
              const SizedBox(height: 24),
              FilledButton(onPressed: _saving ? null : _save, child: Text(l10n.save)),
            ],
          ),
        ),
      ),
    );
  }
}
