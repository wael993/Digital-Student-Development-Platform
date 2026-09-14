class Student {
  const Student({
    required this.id,
    required this.organizationId,
    required this.campusId,
    required this.classroomId,
    required this.firstName,
    required this.lastName,
    required this.dateOfBirth,
    required this.gender,
    required this.studentNumber,
    required this.status,
    this.classroomName,
    this.guardians = const [],
  });

  final String id;
  final String organizationId;
  final String campusId;
  final String classroomId;
  final String firstName;
  final String lastName;
  final DateTime dateOfBirth;
  final String gender;
  final String studentNumber;
  final String status;
  final String? classroomName;
  final List<StudentGuardian> guardians;

  String get displayName => '$firstName $lastName'.trim();

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as String,
      organizationId: json['organizationId'] as String,
      campusId: json['campusId'] as String,
      classroomId: json['classroomId'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      dateOfBirth: DateTime.parse(json['dateOfBirth'] as String),
      gender: json['gender'] as String,
      studentNumber: json['studentNumber'] as String,
      status: json['status'] as String,
      classroomName: json['classroomName'] as String?,
      guardians: (json['guardians'] as List<dynamic>? ?? [])
          .map((row) => StudentGuardian.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class StudentGuardian {
  const StudentGuardian({
    required this.userId,
    required this.relationship,
    required this.isPrimary,
    this.firstName,
    this.lastName,
    this.email,
  });

  final String userId;
  final String relationship;
  final bool isPrimary;
  final String? firstName;
  final String? lastName;
  final String? email;

  String get displayName {
    final name = '${firstName ?? ''} ${lastName ?? ''}'.trim();
    return name.isEmpty ? email ?? userId : name;
  }

  factory StudentGuardian.fromJson(Map<String, dynamic> json) {
    return StudentGuardian(
      userId: json['userId'] as String,
      relationship: json['relationship'] as String,
      isPrimary: json['isPrimary'] as bool? ?? false,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      email: json['email'] as String?,
    );
  }
}
