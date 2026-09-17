import 'package:digital_student/core/localization/l10n_format.dart';
import 'package:digital_student/features/platform/data/models/platform_organization.dart';
import 'package:digital_student/features/platform/data/platform_repository.dart';
import 'package:digital_student/features/platform/providers/platform_providers.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:digital_student/shared/widgets/school_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class OrganizationDetailsPage extends ConsumerWidget {
  const OrganizationDetailsPage({super.key, required this.organizationId});

  final String organizationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final orgAsync = ref.watch(platformOrganizationProvider(organizationId));

    return SchoolScaffold(
      title: l10n.organizationDetails,
      showAttendanceShortcut: false,
      body: AsyncRefreshBody(
        value: orgAsync,
        onRefresh: () async {
          ref.invalidate(platformOrganizationProvider(organizationId));
          await ref.read(platformOrganizationProvider(organizationId).future);
        },
        isEmpty: (_) => false,
        builder: (org) => _DetailsBody(organization: org),
      ),
    );
  }
}

class _DetailsBody extends ConsumerWidget {
  const _DetailsBody({required this.organization});

  final PlatformOrganization organization;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).toString();
    final usage = organization.usage;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _row(l10n.organizationName, organization.name),
        _row(l10n.organizationSlug, organization.slug),
        _row(l10n.organizationCountry, organization.country),
        _row(l10n.organizationTimezone, organization.timezone),
        _row(l10n.organizationDefaultLanguage, organization.defaultLanguage),
        _row(l10n.organizationContactEmail, organization.contactEmail),
        if (organization.contactPhone != null && organization.contactPhone!.isNotEmpty)
          _row(l10n.organizationContactPhone, organization.contactPhone!),
        _row(l10n.organizationStatus, organizationStatusLabel(l10n, organization.status)),
        _row(l10n.organizationPlan, organizationPlanLabel(l10n, organization.planCode)),
        _row(l10n.createdAt, formatAppDate(organization.createdAt, locale)),
        if (usage != null) ...[
          const Divider(),
          Text(l10n.organizationUsage, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          _row(l10n.usageCampuses, '${usage.campusCount}'),
          _row(l10n.usageStudents, '${usage.studentCount}'),
          _row(l10n.usageUsers, '${usage.userCount}'),
          if (usage.classroomCount != null)
            _row(l10n.usageClassrooms, '${usage.classroomCount}'),
          if (usage.busCount != null) _row(l10n.usageBuses, '${usage.busCount}'),
        ],
        const SizedBox(height: 24),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            if (organization.canActivate)
              FilledButton(
                key: const Key('activateOrganizationButton'),
                onPressed: () => _runLifecycle(
                  context,
                  ref,
                  confirm: false,
                  actionLabel: l10n.activateOrganization,
                  request: () => ref
                      .read(platformRepositoryProvider)
                      .activateOrganization(organization.id),
                ),
                child: Text(l10n.activateOrganization),
              ),
            if (organization.canSuspend)
              FilledButton.tonal(
                key: const Key('suspendOrganizationButton'),
                onPressed: () => _runLifecycle(
                  context,
                  ref,
                  confirm: true,
                  confirmMessage: l10n.confirmSuspendOrganization,
                  actionLabel: l10n.suspendOrganization,
                  request: () => ref
                      .read(platformRepositoryProvider)
                      .suspendOrganization(organization.id),
                ),
                child: Text(l10n.suspendOrganization),
              ),
            if (organization.canDeactivate)
              OutlinedButton(
                key: const Key('deactivateOrganizationButton'),
                onPressed: () => _runLifecycle(
                  context,
                  ref,
                  confirm: true,
                  confirmMessage: l10n.confirmDeactivateOrganization,
                  actionLabel: l10n.deactivateOrganization,
                  request: () => ref
                      .read(platformRepositoryProvider)
                      .deactivateOrganization(organization.id),
                ),
                child: Text(l10n.deactivateOrganization),
              ),
          ],
        ),
      ],
    );
  }

  Widget _row(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  Future<void> _runLifecycle(
    BuildContext context,
    WidgetRef ref, {
    required bool confirm,
    String? confirmMessage,
    required String actionLabel,
    required Future<PlatformOrganization> Function() request,
  }) async {
    final l10n = AppLocalizations.of(context);
    if (confirm) {
      final ok = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: Text(actionLabel),
          content: Text(confirmMessage ?? l10n.confirm),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(l10n.cancel),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(l10n.confirm),
            ),
          ],
        ),
      );
      if (ok != true) {
        return;
      }
    }

    try {
      await request();
      invalidatePlatformOrgData(ref, organizationId: organization.id);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.organizationUpdated)),
        );
      }
    } catch (error) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(localizedError(l10n, error))),
        );
      }
    }
  }
}
