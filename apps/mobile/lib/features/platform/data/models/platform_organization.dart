/// Organization statuses returned by platform APIs.
const organizationStatuses = [
  'TRIAL',
  'ACTIVE',
  'SUSPENDED',
  'INACTIVE',
  'CANCELLED',
];

const organizationPlans = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];

class PlatformOrganizationUsage {
  const PlatformOrganizationUsage({
    required this.campusCount,
    required this.studentCount,
    required this.userCount,
    this.classroomCount,
    this.teacherCount,
    this.driverCount,
    this.supervisorCount,
    this.guardianCount,
    this.adminCount,
    this.busCount,
  });

  final int campusCount;
  final int studentCount;
  final int userCount;
  final int? classroomCount;
  final int? teacherCount;
  final int? driverCount;
  final int? supervisorCount;
  final int? guardianCount;
  final int? adminCount;
  final int? busCount;

  factory PlatformOrganizationUsage.fromJson(Map<String, dynamic> json) {
    return PlatformOrganizationUsage(
      campusCount: (json['campusCount'] as num?)?.toInt() ?? 0,
      studentCount: (json['studentCount'] as num?)?.toInt() ?? 0,
      userCount: (json['userCount'] as num?)?.toInt() ?? 0,
      classroomCount: (json['classroomCount'] as num?)?.toInt(),
      teacherCount: (json['teacherCount'] as num?)?.toInt(),
      driverCount: (json['driverCount'] as num?)?.toInt(),
      supervisorCount: (json['supervisorCount'] as num?)?.toInt(),
      guardianCount: (json['guardianCount'] as num?)?.toInt(),
      adminCount: (json['adminCount'] as num?)?.toInt(),
      busCount: (json['busCount'] as num?)?.toInt(),
    );
  }
}

class PlatformOrganization {
  const PlatformOrganization({
    required this.id,
    required this.name,
    required this.slug,
    required this.status,
    required this.country,
    required this.timezone,
    required this.defaultLanguage,
    required this.contactEmail,
    required this.planCode,
    required this.subscriptionStatus,
    required this.createdAt,
    this.contactPhone,
    this.address,
    this.website,
    this.logoUrl,
    this.notes,
    this.usage,
    this.trialEndsAt,
  });

  final String id;
  final String name;
  final String slug;
  final String status;
  final String country;
  final String timezone;
  final String defaultLanguage;
  final String contactEmail;
  final String? contactPhone;
  final String planCode;
  final String subscriptionStatus;
  final DateTime createdAt;
  final String? address;
  final String? website;
  final String? logoUrl;
  final String? notes;
  final PlatformOrganizationUsage? usage;
  final DateTime? trialEndsAt;

  factory PlatformOrganization.fromJson(Map<String, dynamic> json) {
    return PlatformOrganization(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
      // note: legacy tenants may omit slug/contactEmail; tolerate empty
      slug: json['slug'] as String? ?? '',
      status: json['status'] as String? ?? 'TRIAL',
      country: json['country'] as String? ?? '',
      timezone: json['timezone'] as String? ?? 'UTC',
      defaultLanguage: json['defaultLanguage'] as String? ?? 'ar',
      contactEmail: json['contactEmail'] as String? ?? '',
      contactPhone: json['contactPhone'] as String?,
      planCode: json['planCode'] as String? ?? 'STARTER',
      subscriptionStatus: json['subscriptionStatus'] as String? ?? 'TRIAL',
      createdAt: _parseDate(json['createdAt']) ?? DateTime.fromMillisecondsSinceEpoch(0),
      address: json['address'] as String?,
      website: json['website'] as String?,
      logoUrl: json['logoUrl'] as String?,
      notes: json['notes'] as String?,
      usage: json['usage'] is Map
          ? PlatformOrganizationUsage.fromJson(
              Map<String, dynamic>.from(json['usage'] as Map),
            )
          : null,
      trialEndsAt: _parseDate(json['trialEndsAt']),
    );
  }

  static DateTime? _parseDate(Object? value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
    return null;
  }

  bool get canActivate => status == 'TRIAL' || status == 'SUSPENDED';
  bool get canSuspend => status == 'ACTIVE';
  bool get canDeactivate => status == 'TRIAL' || status == 'ACTIVE';
}

class CreateOrganizationRequest {
  const CreateOrganizationRequest({
    required this.name,
    required this.country,
    required this.timezone,
    required this.defaultLanguage,
    required this.contactEmail,
    required this.planCode,
    this.contactPhone,
    this.address,
    this.website,
    this.logoUrl,
    this.adminFirstName,
    this.adminLastName,
    this.adminEmail,
  });

  final String name;
  final String country;
  final String timezone;
  final String defaultLanguage;
  final String contactEmail;
  final String planCode;
  final String? contactPhone;
  final String? address;
  final String? website;
  final String? logoUrl;
  final String? adminFirstName;
  final String? adminLastName;
  final String? adminEmail;

  bool get hasAdminInvite {
    final email = adminEmail?.trim() ?? '';
    final first = adminFirstName?.trim() ?? '';
    final last = adminLastName?.trim() ?? '';
    return email.isNotEmpty && first.isNotEmpty && last.isNotEmpty;
  }

  Map<String, dynamic> toJson() {
    final body = <String, dynamic>{
      'name': name.trim(),
      'country': country.trim(),
      'timezone': timezone.trim(),
      'defaultLanguage': defaultLanguage.trim(),
      'contactEmail': contactEmail.trim(),
      'planCode': planCode,
      if (contactPhone != null && contactPhone!.trim().isNotEmpty)
        'contactPhone': contactPhone!.trim(),
      if (address != null && address!.trim().isNotEmpty) 'address': address!.trim(),
      if (website != null && website!.trim().isNotEmpty) 'website': website!.trim(),
      if (logoUrl != null && logoUrl!.trim().isNotEmpty) 'logoUrl': logoUrl!.trim(),
    };
    if (hasAdminInvite) {
      body['admin'] = {
        'email': adminEmail!.trim(),
        'firstName': adminFirstName!.trim(),
        'lastName': adminLastName!.trim(),
      };
    }
    return body;
  }
}

/// Invitation confirmation without raw token (never display/store tokens in UI).
class PlatformInvitationResult {
  const PlatformInvitationResult({
    required this.invitationId,
    required this.email,
    this.expiresAt,
  });

  final String invitationId;
  final String email;
  final DateTime? expiresAt;

  factory PlatformInvitationResult.fromJson(Map<String, dynamic> json) {
    return PlatformInvitationResult(
      invitationId: json['invitationId'] as String,
      email: json['email'] as String,
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.tryParse(json['expiresAt'] as String),
    );
  }
}

class CreateTenantResult {
  const CreateTenantResult({
    required this.organization,
    this.invitation,
  });

  final PlatformOrganization organization;
  final PlatformInvitationResult? invitation;
}
