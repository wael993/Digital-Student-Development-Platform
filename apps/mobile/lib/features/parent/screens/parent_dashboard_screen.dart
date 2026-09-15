import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/providers/parent_providers.dart';
import 'package:digital_student/features/parent/screens/child_dashboard_screen.dart';
import 'package:digital_student/features/parent/widgets/child_selector.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final user = ref.watch(authProvider).user;
    final children = ref.watch(parentChildrenProvider);
    final selectedId = ref.watch(resolvedChildIdProvider);

    return SchoolScaffold(
      title: l10n.myChildren,
      body: children.when(
        skipLoadingOnReload: true,
        loading: () => Center(child: Text(l10n.loadingChildInfo)),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  parentLoadErrorMessage(
                    l10n,
                    error,
                    fallback: l10n.unableToLoadChildren,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  key: const Key('parentChildrenRetry'),
                  onPressed: () => ref.invalidate(parentChildrenProvider),
                  child: Text(l10n.tryAgain),
                ),
              ],
            ),
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(parentChildrenProvider);
                await ref.read(parentChildrenProvider.future);
              },
              child: ListView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(24),
                children: [
                  const SizedBox(height: 80),
                  Text(
                    l10n.noChildrenAvailable,
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    l10n.noChildrenHint,
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Text(
                  parentGreeting(l10n, user?.firstName ?? ''),
                  key: const Key('parentGreeting'),
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  l10n.yourChildren,
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
              const SizedBox(height: 8),
              ChildSelector(
                children: items,
                selectedId: selectedId,
                onSelected: (id) =>
                    ref.read(selectedChildIdProvider.notifier).state = id,
              ),
              Expanded(
                child: RefreshIndicator(
                  key: const Key('parentRefresh'),
                  onRefresh: () async {
                    if (selectedId == null) {
                      ref.invalidate(parentChildrenProvider);
                      await ref.read(parentChildrenProvider.future);
                      return;
                    }
                    await refreshParentChild(ref, selectedId);
                  },
                  child: selectedId == null
                      ? ListView(
                          physics: const AlwaysScrollableScrollPhysics(),
                          children: const [SizedBox.shrink()],
                        )
                      : ChildDashboardScreen(studentId: selectedId),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
