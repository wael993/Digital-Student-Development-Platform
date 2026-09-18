import 'package:dio/dio.dart';
import 'package:digital_student/core/network/api_call.dart';
import 'package:digital_student/features/platform/data/models/platform_dashboard.dart';
import 'package:digital_student/features/platform/data/models/platform_organization.dart';
import 'package:digital_student/shared/models/page_result.dart';

class PlatformApi {
  PlatformApi(this._dio);

  final Dio _dio;

  Future<PlatformDashboard> getDashboard() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>('/platform/dashboard');
      final data = requireData(response.data);
      return PlatformDashboard.fromJson(Map<String, dynamic>.from(data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PageResult<PlatformOrganization>> listOrganizations({
    int page = 1,
    String? q,
    String? status,
  }) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/platform/organizations',
        queryParameters: {
          'page': page,
          if (q != null && q.trim().isNotEmpty) 'q': q.trim(),
          if (status != null && status.isNotEmpty) 'status': status,
        },
      );
      return PageResult.fromJson(
        requireData(response.data),
        PlatformOrganization.fromJson,
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PlatformOrganization> getOrganization(String organizationId) async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(
        '/platform/organizations/$organizationId',
      );
      return PlatformOrganization.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<CreateTenantResult> createOrganization(
    CreateOrganizationRequest request,
  ) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/platform/organizations',
        data: request.toJson(),
      );
      final data = requireData(response.data);
      final initialAdminJson = data['initialAdmin'];
      return CreateTenantResult(
        organization: PlatformOrganization.fromJson(
          data['organization'] as Map<String, dynamic>,
        ),
        initialAdmin: initialAdminJson is Map<String, dynamic>
            ? InitialAdminResult.fromJson(initialAdminJson)
            : null,
      );
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PlatformOrganization> activateOrganization(String organizationId) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/platform/organizations/$organizationId/activate',
      );
      return PlatformOrganization.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PlatformOrganization> suspendOrganization(String organizationId) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/platform/organizations/$organizationId/suspend',
      );
      return PlatformOrganization.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PlatformOrganization> deactivateOrganization(String organizationId) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/platform/organizations/$organizationId/deactivate',
      );
      return PlatformOrganization.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }

  Future<PlatformInvitationResult> inviteAdmin({
    required String organizationId,
    required String email,
    required String firstName,
    required String lastName,
  }) async {
    try {
      final response = await _dio.post<Map<String, dynamic>>(
        '/platform/organizations/$organizationId/admin-invitation',
        data: {
          'email': email.trim(),
          'firstName': firstName.trim(),
          'lastName': lastName.trim(),
        },
      );
      // note: discard any raw token from the response body
      return PlatformInvitationResult.fromJson(requireData(response.data));
    } on DioException catch (error) {
      throwApi(error);
    }
  }
}
