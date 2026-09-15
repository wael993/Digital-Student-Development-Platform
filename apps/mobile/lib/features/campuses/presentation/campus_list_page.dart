import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/campuses/campus_providers.dart';
import 'package:digital_student/features/campuses/campus_repository.dart';
import 'package:digital_student/features/classrooms/presentation/classroom_list_page.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class CampusListPage extends ConsumerWidget {
  const CampusListPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final campuses = ref.watch(campusesProvider);
    final canManage = user?.canManageSchool ?? false;

    return SchoolScaffold(
      title: l10n.campuses,
      floatingActionButton: canManage
          ? FloatingActionButton(
              onPressed: () => _createCampus(context, ref),
              child: const Icon(Icons.add),
            )
          : null,
      body: AsyncRefreshBody(
        value: campuses,
        onRefresh: () async {
          ref.invalidate(campusesProvider);
          await ref.read(campusesProvider.future);
        },
        isEmpty: (page) => page.data.isEmpty,
        emptyMessage: l10n.noCampusesYet,
        builder: (page) => ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(),
          itemCount: page.data.length,
          itemBuilder: (context, index) {
            final campus = page.data[index];
            return ListTile(
              title: Text(campus.name),
              subtitle: Text(studentStatusLabel(l10n, campus.status)),
              onTap: () => Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (_) => ClassroomListPage(
                    campusId: campus.id,
                    campusName: campus.name,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _createCampus(BuildContext context, WidgetRef ref) async {
    final l10n = AppLocalizations.of(context);
    final name = await showDialog<String>(
      context: context,
      builder: (context) {
        final dialogL10n = AppLocalizations.of(context);
        return _NameDialog(
          title: dialogL10n.newCampus,
          label: dialogL10n.campusName,
          cancelLabel: dialogL10n.cancel,
          saveLabel: dialogL10n.save,
        );
      },
    );
    if (name == null || name.isEmpty) {
      return;
    }
    try {
      await ref.read(campusRepositoryProvider).create(name: name);
      ref.invalidate(campusesProvider);
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    }
  }
}

class _NameDialog extends StatefulWidget {
  const _NameDialog({
    required this.title,
    required this.label,
    required this.cancelLabel,
    required this.saveLabel,
  });

  final String title;
  final String label;
  final String cancelLabel;
  final String saveLabel;

  @override
  State<_NameDialog> createState() => _NameDialogState();
}

class _NameDialogState extends State<_NameDialog> {
  final _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: TextField(
        controller: _controller,
        autofocus: true,
        decoration: InputDecoration(labelText: widget.label),
        onSubmitted: (value) => Navigator.pop(context, value.trim()),
      ),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: Text(widget.cancelLabel)),
        FilledButton(
          onPressed: () => Navigator.pop(context, _controller.text.trim()),
          child: Text(widget.saveLabel),
        ),
      ],
    );
  }
}
