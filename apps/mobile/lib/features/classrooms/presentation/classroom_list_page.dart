import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/classrooms/classroom_providers.dart';
import 'package:digital_student/features/classrooms/classroom_repository.dart';
import 'package:digital_student/features/students/presentation/student_list_page.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

const classroomLevels = [
  'NURSERY',
  'KINDERGARTEN',
  'PRIMARY',
  'MIDDLE_SCHOOL',
  'HIGH_SCHOOL',
];

class ClassroomListPage extends ConsumerWidget {
  const ClassroomListPage({super.key, this.campusId, this.campusName});

  final String? campusId;
  final String? campusName;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final classrooms = ref.watch(classroomsProvider(campusId));
    final canManage = (user?.canManageSchool ?? false) && campusId != null;
    final title = campusName ?? l10n.myClasses;

    return SchoolScaffold(
      title: title,
      floatingActionButton: canManage
          ? FloatingActionButton(
              onPressed: () => _createClassroom(context, ref),
              child: const Icon(Icons.add),
            )
          : null,
      body: AsyncRefreshBody(
        value: classrooms,
        onRefresh: () async {
          ref.invalidate(classroomsProvider(campusId));
          await ref.read(classroomsProvider(campusId).future);
        },
        isEmpty: (page) => page.data.isEmpty,
        emptyMessage: l10n.noClassroomsYet,
        builder: (page) => ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: page.data.length,
          itemBuilder: (context, index) {
            final classroom = page.data[index];
            return ListTile(
              title: Text(classroom.name),
              subtitle: Text(classroomLevelLabel(l10n, classroom.level)),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => StudentListPage(
                    classroomId: classroom.id,
                    classroomName: classroom.name,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _createClassroom(BuildContext context, WidgetRef ref) async {
    final campus = campusId;
    if (campus == null) {
      return;
    }
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => _CreateClassroomPage(campusId: campus),
      ),
    );
    if (created == true) {
      ref.invalidate(classroomsProvider(campusId));
    }
  }
}

class _CreateClassroomPage extends ConsumerStatefulWidget {
  const _CreateClassroomPage({required this.campusId});

  final String campusId;

  @override
  ConsumerState<_CreateClassroomPage> createState() => _CreateClassroomPageState();
}

class _CreateClassroomPageState extends ConsumerState<_CreateClassroomPage> {
  final _formKey = GlobalKey<FormState>();
  final _name = TextEditingController();
  String _level = 'NURSERY';
  bool _saving = false;

  @override
  void dispose() {
    _name.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false) || _saving) {
      return;
    }
    setState(() => _saving = true);
    try {
      await ref.read(classroomRepositoryProvider).create(
            campusId: widget.campusId,
            name: _name.text.trim(),
            level: _level,
          );
      if (mounted) {
        Navigator.pop(context, true);
      }
    } catch (error) {
      if (mounted) {
        final l10n = AppLocalizations.of(context);
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
      appBar: AppBar(title: Text(l10n.newClassroom)),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _name,
                decoration: InputDecoration(labelText: l10n.name, border: const OutlineInputBorder()),
                validator: (value) =>
                    value == null || value.trim().isEmpty ? l10n.nameRequired : null,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _level,
                decoration: InputDecoration(labelText: l10n.level, border: const OutlineInputBorder()),
                items: [
                  for (final level in classroomLevels)
                    DropdownMenuItem(value: level, child: Text(classroomLevelLabel(l10n, level))),
                ],
                onChanged: (value) => setState(() => _level = value ?? _level),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: _saving ? null : _save,
                child: Text(l10n.save),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
