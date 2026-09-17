import 'dart:async';

import 'package:digital_student/features/platform/data/models/platform_dashboard.dart';
import 'package:digital_student/features/platform/data/models/platform_organization.dart';
import 'package:digital_student/features/platform/data/platform_repository.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final platformDashboardProvider =
    FutureProvider.autoDispose<PlatformDashboard>((ref) {
  return ref.watch(platformRepositoryProvider).getDashboard();
});

class OrganizationListFilter {
  const OrganizationListFilter({this.q = '', this.status});

  final String q;
  final String? status;

  OrganizationListFilter copyWith({String? q, String? status, bool clearStatus = false}) {
    return OrganizationListFilter(
      q: q ?? this.q,
      status: clearStatus ? null : (status ?? this.status),
    );
  }
}

class OrganizationListFilterController extends StateNotifier<OrganizationListFilter> {
  OrganizationListFilterController() : super(const OrganizationListFilter());

  Timer? _debounce;

  void setQuery(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 400), () {
      state = state.copyWith(q: value);
    });
  }

  void setStatus(String? status) {
    if (status == null || status.isEmpty) {
      state = state.copyWith(clearStatus: true);
      return;
    }
    state = state.copyWith(status: status);
  }

  @override
  void dispose() {
    _debounce?.cancel();
    super.dispose();
  }
}

final organizationListFilterProvider = StateNotifierProvider.autoDispose<
    OrganizationListFilterController, OrganizationListFilter>(
  (ref) => OrganizationListFilterController(),
);

final platformOrganizationsProvider =
    FutureProvider.autoDispose<PageResult<PlatformOrganization>>((ref) {
  final filter = ref.watch(organizationListFilterProvider);
  return ref.watch(platformRepositoryProvider).listOrganizations(
        q: filter.q,
        status: filter.status,
      );
});

final platformOrganizationProvider =
    FutureProvider.autoDispose.family<PlatformOrganization, String>((ref, id) {
  return ref.watch(platformRepositoryProvider).getOrganization(id);
});

void invalidatePlatformOrgData(WidgetRef ref, {String? organizationId}) {
  ref.invalidate(platformDashboardProvider);
  ref.invalidate(platformOrganizationsProvider);
  if (organizationId != null) {
    ref.invalidate(platformOrganizationProvider(organizationId));
  }
}
