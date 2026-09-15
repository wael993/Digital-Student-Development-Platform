import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/providers/parent_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChildProfileScreen extends ConsumerWidget {
  const ChildProfileScreen({super.key, required this.studentId});

  final String studentId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final children = ref.watch(parentChildrenProvider);
    return Scaffold(
      appBar: AppBar(title: Text(l10n.child)),
      body: children.when(
        loading: () => Center(child: Text(l10n.loadingChildInfo)),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text(
              parentLoadErrorMessage(
                l10n,
                error,
                fallback: l10n.unableToLoadChildInfo,
              ),
              textAlign: TextAlign.center,
            ),
          ),
        ),
        data: (items) {
          final child = items.where((item) => item.id == studentId).firstOrNull;
          if (child == null) {
            return Center(child: Text(l10n.childUnavailable));
          }
          return ListView(
            padding: const EdgeInsets.all(24),
            children: [
              Text(
                child.displayName,
                style: Theme.of(context).textTheme.headlineSmall,
              ),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.classLabel),
                subtitle: Text(child.classroom.name),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.studentNumber),
                subtitle: Text(child.studentNumber),
              ),
              ListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(l10n.status),
                subtitle: Text(studentStatusLabel(l10n, child.status)),
              ),
            ],
          );
        },
      ),
    );
  }
}
