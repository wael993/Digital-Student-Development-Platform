import 'package:digital_student/features/students/student_repository.dart';
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add guardian')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _email,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(labelText: 'Email', border: OutlineInputBorder()),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Email is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _password,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Password (required for a new account)',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _first,
                decoration: const InputDecoration(
                  labelText: 'First name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'First name is required' : null,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _last,
                decoration: const InputDecoration(
                  labelText: 'Last name',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Last name is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _relationship,
                decoration: const InputDecoration(
                  labelText: 'Relationship',
                  border: OutlineInputBorder(),
                ),
                items: [
                  for (final value in relationships)
                    DropdownMenuItem(value: value, child: Text(value.replaceAll('_', ' '))),
                ],
                onChanged: (value) => setState(() => _relationship = value ?? _relationship),
              ),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Primary guardian'),
                value: _primary,
                onChanged: (value) => setState(() => _primary = value),
              ),
              const SizedBox(height: 24),
              FilledButton(onPressed: _saving ? null : _save, child: const Text('Save')),
            ],
          ),
        ),
      ),
    );
  }
}
