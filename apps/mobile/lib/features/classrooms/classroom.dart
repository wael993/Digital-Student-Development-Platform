class Classroom {
  const Classroom({
    required this.id,
    required this.organizationId,
    required this.campusId,
    required this.name,
    required this.level,
    required this.status,
  });

  final String id;
  final String organizationId;
  final String campusId;
  final String name;
  final String level;
  final String status;

  factory Classroom.fromJson(Map<String, dynamic> json) {
    return Classroom(
      id: json['id'] as String,
      organizationId: json['organizationId'] as String,
      campusId: json['campusId'] as String,
      name: json['name'] as String,
      level: json['level'] as String,
      status: json['status'] as String,
    );
  }
}
