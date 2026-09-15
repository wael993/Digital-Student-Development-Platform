import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/journey/presentation/journey_page.dart';
import 'package:digital_student/features/students/presentation/student_details_page.dart';
import 'package:digital_student/features/students/student_providers.dart';
import 'package:digital_student/features/students/student_repository.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class StudentListPage extends ConsumerStatefulWidget {
  const StudentListPage({super.key, this.classroomId, this.classroomName, this.title});

  final String? classroomId;
  final String? classroomName;
  final String? title;

  @override
  ConsumerState<StudentListPage> createState() => _StudentListPageState();
}

class _StudentListPageState extends ConsumerState<StudentListPage> {
  final _search = TextEditingController();
  String _submitted = '';

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  StudentListArgs get _args => StudentListArgs(
        classroomId: widget.classroomId,
        search: _submitted.isEmpty ? null : _submitted,
      );

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final students = ref.watch(studentsProvider(_args));
    final canManage = (user?.canManageSchool ?? false) && widget.classroomId != null;
    final title = widget.title ?? widget.classroomName ?? l10n.students;

    return SchoolScaffold(
      title: title,
      floatingActionButton: canManage
          ? FloatingActionButton(
              onPressed: () => _createStudent(),
              child: const Icon(Icons.add),
            )
          : null,
      bottom: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: TextField(
          controller: _search,
          decoration: InputDecoration(
            hintText: l10n.search,
            prefixIcon: const Icon(Icons.search),
            border: const OutlineInputBorder(),
            isDense: true,
          ),
          textInputAction: TextInputAction.search,
          onSubmitted: (value) => setState(() => _submitted = value.trim()),
        ),
      ),
      body: AsyncRefreshBody(
        value: students,
        onRefresh: () async {
          ref.invalidate(studentsProvider(_args));
          await ref.read(studentsProvider(_args).future);
        },
        isEmpty: (page) => page.data.isEmpty,
        emptyMessage: l10n.noStudentsYet,
        builder: (page) => ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: page.data.length,
          itemBuilder: (context, index) {
            final student = page.data[index];
            return ListTile(
              title: Text(student.displayName),
              subtitle: Text(student.classroomName ?? widget.classroomName ?? studentStatusLabel(l10n, student.status)),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => user?.role == 'GUARDIAN'
                      ? JourneyPage(studentId: student.id)
                      : StudentDetailsPage(studentId: student.id),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _createStudent() async {
    final classroomId = widget.classroomId;
    if (classroomId == null) {
      return;
    }
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CreateStudentPage(classroomId: classroomId),
      ),
    );
    if (created == true) {
      ref.invalidate(studentsProvider(_args));
    }
  }
}

class CreateStudentPage extends ConsumerStatefulWidget {
  const CreateStudentPage({super.key, required this.classroomId});

  final String classroomId;

  @override
  ConsumerState<CreateStudentPage> createState() => _CreateStudentPageState();
}

class _CreateStudentPageState extends ConsumerState<CreateStudentPage> {
  final _formKey = GlobalKey<FormState>();
  final _first = TextEditingController();
  final _last = TextEditingController();
  final _number = TextEditingController();
  DateTime? _dob;
  String _gender = 'FEMALE';
  bool _saving = false;

  @override
  void dispose() {
    _first.dispose();
    _last.dispose();
    _number.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final l10n = AppLocalizations.of(context);
    if (!(_formKey.currentState?.validate() ?? false) || _saving) {
      return;
    }
    if (_dob == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.dateOfBirthRequired)),
      );
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(studentRepositoryProvider).create(
            firstName: _first.text.trim(),
            lastName: _last.text.trim(),
            dateOfBirth: _dob!,
            gender: _gender,
            studentNumber: _number.text.trim(),
            classroomId: widget.classroomId,
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
    final locale = Localizations.localeOf(context).toString();
    return Scaffold(
      appBar: AppBar(title: Text(l10n.newStudent)),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
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
              TextFormField(
                controller: _number,
                decoration: InputDecoration(
                  labelText: l10n.studentNumber,
                  border: const OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? l10n.studentNumberRequired : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _gender,
                decoration: InputDecoration(
                  labelText: l10n.gender,
                  border: const OutlineInputBorder(),
                ),
                items: [
                  DropdownMenuItem(value: 'FEMALE', child: Text(l10n.genderFemale)),
                  DropdownMenuItem(value: 'MALE', child: Text(l10n.genderMale)),
                  DropdownMenuItem(value: 'OTHER', child: Text(l10n.genderOther)),
                ],
                onChanged: (value) => setState(() => _gender = value ?? _gender),
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  _dob == null ? l10n.dateOfBirth : formatAppDate(_dob!, locale),
                ),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: DateTime(2022, 3, 12),
                    firstDate: DateTime(1990),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) {
                    setState(() => _dob = picked);
                  }
                },
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
