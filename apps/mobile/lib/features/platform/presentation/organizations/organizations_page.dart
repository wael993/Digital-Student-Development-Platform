import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/platform/data/models/platform_organization.dart';
import 'package:digital_student/features/platform/presentation/organizations/create_organization_page.dart';
import 'package:digital_student/features/platform/presentation/organizations/organization_details_page.dart';
import 'package:digital_student/features/platform/providers/platform_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OrganizationsPage extends ConsumerStatefulWidget {
  const OrganizationsPage({super.key});

  @override
  ConsumerState<OrganizationsPage> createState() => _OrganizationsPageState();
}

class _OrganizationsPageState extends ConsumerState<OrganizationsPage> {
  late final TextEditingController _search;

  @override
  void initState() {
    super.initState();
    _search = TextEditingController();
  }

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final filter = ref.watch(organizationListFilterProvider);
    final orgs = ref.watch(platformOrganizationsProvider);

    return SchoolScaffold(
      title: l10n.platformOrganizations,
      showAttendanceShortcut: false,
      floatingActionButton: FloatingActionButton(
        key: const Key('createOrganizationButton'),
        onPressed: () async {
          final created = await Navigator.of(context).push<bool>(
            MaterialPageRoute<bool>(
              builder: (_) => const CreateOrganizationPage(),
            ),
          );
          if (created == true) {
            invalidatePlatformOrgData(ref);
          }
        },
        child: const Icon(Icons.add),
      ),
      bottom: Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
        child: Column(
          children: [
            TextField(
              key: const Key('organizationSearchField'),
              controller: _search,
              decoration: InputDecoration(
                hintText: l10n.searchOrganizations,
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (value) =>
                  ref.read(organizationListFilterProvider.notifier).setQuery(value),
            ),
            const SizedBox(height: 8),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _StatusChip(
                    label: l10n.filterAll,
                    selected: filter.status == null,
                    onSelected: () =>
                        ref.read(organizationListFilterProvider.notifier).setStatus(null),
                  ),
                  for (final status in organizationStatuses)
                    _StatusChip(
                      label: organizationStatusLabel(l10n, status),
                      selected: filter.status == status,
                      onSelected: () => ref
                          .read(organizationListFilterProvider.notifier)
                          .setStatus(status),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: AsyncRefreshBody(
        value: orgs,
        onRefresh: () async {
          ref.invalidate(platformOrganizationsProvider);
          await ref.read(platformOrganizationsProvider.future);
        },
        isEmpty: (page) => page.data.isEmpty,
        emptyMessage: l10n.noOrganizationsYet,
        builder: (page) {
          final width = MediaQuery.sizeOf(context).width;
          if (width >= 800) {
            return GridView.builder(
              padding: const EdgeInsets.all(16),
              physics: const AlwaysScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 2.4,
              ),
              itemCount: page.data.length,
              itemBuilder: (context, index) =>
                  _OrganizationTile(organization: page.data[index]),
            );
          }
          return ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            itemCount: page.data.length,
            separatorBuilder: (_, _) => const Divider(height: 1),
            itemBuilder: (context, index) =>
                _OrganizationTile(organization: page.data[index]),
          );
        },
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  const _StatusChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  final String label;
  final bool selected;
  final VoidCallback onSelected;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(end: 8),
      child: FilterChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) => onSelected(),
      ),
    );
  }
}

class _OrganizationTile extends StatelessWidget {
  const _OrganizationTile({required this.organization});

  final PlatformOrganization organization;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toString();
    final usage = organization.usage;

    return ListTile(
      key: Key('organizationTile_${organization.id}'),
      title: Text(organization.name),
      subtitle: Text(
        [
          organizationStatusLabel(l10n, organization.status),
          organizationPlanLabel(l10n, organization.planCode),
          if (usage != null)
            l10n.organizationUsageSummary(
              usage.campusCount,
              usage.studentCount,
              usage.userCount,
            ),
          formatAppDate(organization.createdAt, locale),
        ].join(' · '),
      ),
      isThreeLine: true,
      onTap: () => Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => OrganizationDetailsPage(organizationId: organization.id),
        ),
      ),
    );
  }
}
