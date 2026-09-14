import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/students/presentation/student_details_page.dart';
import 'package:digital_student/features/students/student_providers.dart';
import 'package:digital_student/features/students/student_repository.dart';
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
    final user = ref.watch(authProvider).user;
    final students = ref.watch(studentsProvider(_args));
    final canManage = (user?.canManageSchool ?? false) && widget.classroomId != null;
    final title = widget.title ?? widget.classroomName ?? 'Students';

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
          decoration: const InputDecoration(
            hintText: 'Search...',
            prefixIcon: Icon(Icons.search),
            border: OutlineInputBorder(),
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
        emptyMessage: 'No students yet',
        builder: (page) => ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: page.data.length,
          itemBuilder: (context, index) {
            final student = page.data[index];
            return ListTile(
              title: Text(student.displayName),
              subtitle: Text(student.classroomName ?? widget.classroomName ?? student.status),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => StudentDetailsPage(studentId: student.id),
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
    if (!(_formKey.currentState?.validate() ?? false) || _saving) {
      return;
    }
    if (_dob == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Date of birth is required')),
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
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(error.toString())));
        setState(() => _saving = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('New student')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
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
              TextFormField(
                controller: _number,
                decoration: const InputDecoration(
                  labelText: 'Student number',
                  border: OutlineInputBorder(),
                ),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? 'Student number is required' : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _gender,
                decoration: const InputDecoration(
                  labelText: 'Gender',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'FEMALE', child: Text('Female')),
                  DropdownMenuItem(value: 'MALE', child: Text('Male')),
                  DropdownMenuItem(value: 'OTHER', child: Text('Other')),
                ],
                onChanged: (value) => setState(() => _gender = value ?? _gender),
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(
                  _dob == null
                      ? 'Date of birth'
                      : MaterialLocalizations.of(context).formatFullDate(_dob!),
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
              FilledButton(onPressed: _saving ? null : _save, child: const Text('Save')),
            ],
          ),
        ),
      ),
    );
  }
}
