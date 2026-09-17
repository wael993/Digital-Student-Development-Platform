import 'package:digital_student/features/platform/providers/platform_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformDashboardPage extends ConsumerWidget {
  const PlatformDashboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final dashboard = ref.watch(platformDashboardProvider);

    return SchoolScaffold(
      title: l10n.platformDashboard,
      showAttendanceShortcut: false,
      body: AsyncRefreshBody(
        value: dashboard,
        onRefresh: () async {
          ref.invalidate(platformDashboardProvider);
          await ref.read(platformDashboardProvider.future);
        },
        isEmpty: (data) => data.isEmpty,
        emptyMessage: l10n.platformDashboardEmpty,
        builder: (data) {
          final width = MediaQuery.sizeOf(context).width;
          final crossAxisCount = width >= 900 ? 3 : (width >= 600 ? 2 : 1);
          final cards = <_StatCard>[
            _StatCard(
              label: l10n.platformTotalOrganizations,
              value: data.organizations.total,
            ),
            _StatCard(
              label: l10n.platformActiveOrganizations,
              value: data.organizations.active,
            ),
            _StatCard(
              label: l10n.platformTrialOrganizations,
              value: data.organizations.trial,
            ),
            _StatCard(
              label: l10n.platformSuspendedOrganizations,
              value: data.organizations.suspended,
            ),
            _StatCard(
              label: l10n.platformInactiveOrganizations,
              value: data.organizations.inactive,
            ),
            _StatCard(
              label: l10n.platformCancelledOrganizations,
              value: data.organizations.cancelled,
            ),
            _StatCard(label: l10n.platformTotalStudents, value: data.students),
            _StatCard(label: l10n.platformTotalTeachers, value: data.teachers),
            _StatCard(label: l10n.platformTotalBuses, value: data.buses),
          ];

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            physics: const AlwaysScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: crossAxisCount,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: crossAxisCount == 1 ? 3.2 : 1.6,
            ),
            itemCount: cards.length,
            itemBuilder: (context, index) => cards[index],
          );
        },
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({required this.label, required this.value});

  final String label;
  final int value;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: theme.textTheme.titleSmall),
            const SizedBox(height: 8),
            Text('$value', style: theme.textTheme.headlineMedium),
          ],
        ),
      ),
    );
  }
}
