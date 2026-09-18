class PlatformDashboard {
  const PlatformDashboard({
    required this.organizations,
    required this.students,
    required this.teachers,
    required this.buses,
  });

  final PlatformOrganizationCounts organizations;
  final int students;
  final int teachers;
  final int buses;

  bool get isEmpty =>
      organizations.total == 0 && students == 0 && teachers == 0 && buses == 0;

  factory PlatformDashboard.fromJson(Map<String, dynamic> json) {
    final orgsRaw = json['organizations'];
    final orgsMap = orgsRaw is Map
        ? Map<String, dynamic>.from(orgsRaw)
        : <String, dynamic>{};
    return PlatformDashboard(
      organizations: PlatformOrganizationCounts.fromJson(orgsMap),
      students: (json['students'] as num?)?.toInt() ?? 0,
      teachers: (json['teachers'] as num?)?.toInt() ?? 0,
      buses: (json['buses'] as num?)?.toInt() ?? 0,
    );
  }
}

class PlatformOrganizationCounts {
  const PlatformOrganizationCounts({
    required this.total,
    required this.active,
    required this.trial,
    required this.suspended,
    required this.inactive,
    required this.cancelled,
  });

  final int total;
  final int active;
  final int trial;
  final int suspended;
  final int inactive;
  final int cancelled;

  factory PlatformOrganizationCounts.fromJson(Map<String, dynamic> json) {
    return PlatformOrganizationCounts(
      total: (json['total'] as num?)?.toInt() ?? 0,
      active: (json['active'] as num?)?.toInt() ?? 0,
      trial: (json['trial'] as num?)?.toInt() ?? 0,
      suspended: (json['suspended'] as num?)?.toInt() ?? 0,
      inactive: (json['inactive'] as num?)?.toInt() ?? 0,
      cancelled: (json['cancelled'] as num?)?.toInt() ?? 0,
    );
  }
}
