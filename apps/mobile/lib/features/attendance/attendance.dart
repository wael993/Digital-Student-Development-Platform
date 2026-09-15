class AttendanceStudent {
  const AttendanceStudent({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.studentNumber,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String studentNumber;

  String get displayName => '$firstName $lastName'.trim();

  factory AttendanceStudent.fromJson(Map<String, dynamic> json) {
    return AttendanceStudent(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      studentNumber: json['studentNumber'] as String,
    );
  }
}

class AttendanceRecord {
  const AttendanceRecord({
    required this.id,
    required this.student,
    required this.attendanceType,
    required this.scannedAt,
  });

  final String id;
  final AttendanceStudent student;
  final String attendanceType;
  final DateTime scannedAt;

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    return AttendanceRecord(
      id: json['id'] as String,
      student: AttendanceStudent.fromJson(json['student'] as Map<String, dynamic>),
      attendanceType: json['attendanceType'] as String,
      scannedAt: DateTime.parse(json['scannedAt'] as String),
    );
  }
}

class AttendanceScanResult {
  const AttendanceScanResult({
    required this.status,
    required this.attendance,
    required this.student,
  });

  final String status;
  final AttendanceRecord attendance;
  final AttendanceStudent student;

  bool get alreadyRecorded => status == 'ALREADY_RECORDED';

  factory AttendanceScanResult.fromJson(Map<String, dynamic> json) {
    final student = AttendanceStudent.fromJson(json['student'] as Map<String, dynamic>);
    final attendanceJson = Map<String, dynamic>.from(json['attendance'] as Map<String, dynamic>);
    return AttendanceScanResult(
      status: json['status'] as String,
      student: student,
      attendance: AttendanceRecord(
        id: attendanceJson['id'] as String,
        student: student,
        attendanceType: attendanceJson['attendanceType'] as String,
        scannedAt: DateTime.parse(attendanceJson['scannedAt'] as String),
      ),
    );
  }
}

