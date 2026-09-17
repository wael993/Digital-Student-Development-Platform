import 'package:digital_student/core/network/api_client.dart';
import 'package:digital_student/features/platform/data/models/platform_dashboard.dart';
import 'package:digital_student/features/platform/data/models/platform_organization.dart';
import 'package:digital_student/features/platform/data/platform_api.dart';
import 'package:digital_student/shared/models/page_result.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class PlatformRepository {
  PlatformRepository(this._api);

  final PlatformApi _api;

  Future<PlatformDashboard> getDashboard() => _api.getDashboard();

  Future<PageResult<PlatformOrganization>> listOrganizations({
    int page = 1,
    String? q,
    String? status,
  }) =>
      _api.listOrganizations(page: page, q: q, status: status);

  Future<PlatformOrganization> getOrganization(String organizationId) =>
      _api.getOrganization(organizationId);

  Future<CreateTenantResult> createOrganization(CreateOrganizationRequest request) =>
      _api.createOrganization(request);

  Future<PlatformOrganization> activateOrganization(String organizationId) =>
      _api.activateOrganization(organizationId);

  Future<PlatformOrganization> suspendOrganization(String organizationId) =>
      _api.suspendOrganization(organizationId);

  Future<PlatformOrganization> deactivateOrganization(String organizationId) =>
      _api.deactivateOrganization(organizationId);

  Future<PlatformInvitationResult> inviteAdmin({
    required String organizationId,
    required String email,
    required String firstName,
    required String lastName,
  }) =>
      _api.inviteAdmin(
        organizationId: organizationId,
        email: email,
        firstName: firstName,
        lastName: lastName,
      );
}

final platformApiProvider = Provider<PlatformApi>(
  (ref) => PlatformApi(ref.watch(apiClientProvider)),
);

final platformRepositoryProvider = Provider<PlatformRepository>(
  (ref) => PlatformRepository(ref.watch(platformApiProvider)),
);
