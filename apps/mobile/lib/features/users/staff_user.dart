class StaffUser {
  const StaffUser({
    required this.id,
    required this.organizationId,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.role,
    required this.status,
    required this.campusIds,
    required this.classroomIds,
    required this.routeIds,
    this.lastLoginAt,
    this.createdAt,
    this.updatedAt,
  });

  final String id;
  final String? organizationId;
  final String firstName;
  final String lastName;
  final String email;
  final String role;
  final String status;
  final List<String> campusIds;
  final List<String> classroomIds;
  final List<String> routeIds;
  final DateTime? lastLoginAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  String get displayName => '$firstName $lastName'.trim();

  bool get isActive => status == 'ACTIVE';

  factory StaffUser.fromJson(Map<String, dynamic> json) {
    return StaffUser(
      id: json['id'] as String,
      organizationId: json['organizationId'] as String?,
      firstName: json['firstName'] as String? ?? '',
      lastName: json['lastName'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? '',
      status: json['status'] as String? ?? 'ACTIVE',
      campusIds: _stringList(json['campusIds']),
      classroomIds: _stringList(json['classroomIds']),
      routeIds: _stringList(json['routeIds']),
      lastLoginAt: _parseDate(json['lastLoginAt']),
      createdAt: _parseDate(json['createdAt']),
      updatedAt: _parseDate(json['updatedAt']),
    );
  }

  static List<String> _stringList(Object? value) {
    if (value is! List) return const [];
    return value.map((e) => e.toString()).toList();
  }

  static DateTime? _parseDate(Object? value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String && value.isNotEmpty) return DateTime.tryParse(value);
    return null;
  }
}

class StaffInvitationResult {
  const StaffInvitationResult({
    required this.invitationId,
    required this.email,
    this.expiresAt,
    this.status,
  });

  final String invitationId;
  final String email;
  final DateTime? expiresAt;
  final String? status;

  factory StaffInvitationResult.fromJson(Map<String, dynamic> json) {
    return StaffInvitationResult(
      invitationId: json['invitationId'] as String,
      email: json['email'] as String,
      expiresAt: json['expiresAt'] == null
          ? null
          : DateTime.tryParse(json['expiresAt'] as String),
      status: json['status'] as String?,
    );
  }
}

class CreateStaffResult {
  const CreateStaffResult({this.user, this.invitation});

  final StaffUser? user;
  final StaffInvitationResult? invitation;
}

class StaffUserListArgs {
  const StaffUserListArgs({
    this.q,
    this.role,
    this.status,
    this.campusId,
    this.page = 1,
  });

  final String? q;
  final String? role;
  final String? status;
  final String? campusId;
  final int page;

  @override
  bool operator ==(Object other) =>
      other is StaffUserListArgs &&
      other.q == q &&
      other.role == role &&
      other.status == status &&
      other.campusId == campusId &&
      other.page == page;

  @override
  int get hashCode => Object.hash(q, role, status, campusId, page);
}
