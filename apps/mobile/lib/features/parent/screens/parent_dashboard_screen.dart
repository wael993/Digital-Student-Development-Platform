import 'package:digital_student/features/auth/providers/auth_provider.dart';
import 'package:digital_student/features/parent/models/parent_labels.dart';
import 'package:digital_student/features/parent/providers/parent_providers.dart';
import 'package:digital_student/features/parent/screens/child_dashboard_screen.dart';
import 'package:digital_student/features/parent/widgets/child_selector.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class ParentDashboardScreen extends ConsumerWidget {
  const ParentDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final children = ref.watch(parentChildrenProvider);
    final selectedId = ref.watch(resolvedChildIdProvider);

    return SchoolScaffold(
      title: 'My Children',
      body: children.when(
        skipLoadingOnReload: true,
        loading: () =>
            const Center(child: Text('Loading child information...')),
        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  parentLoadErrorMessage(
                    error,
                    fallback: 'Unable to load your children.',
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                FilledButton(
                  key: const Key('parentChildrenRetry'),
                  onPressed: () => ref.invalidate(parentChildrenProvider),
                  child: const Text('Try Again'),
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
                children: const [
                  SizedBox(height: 80),
                  Text(
                    'No children available',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontWeight: FontWeight.w600),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Your school has not linked any active students to your account yet.',
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
                  parentGreeting(user?.firstName ?? ''),
                  key: const Key('parentGreeting'),
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Your children',
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
