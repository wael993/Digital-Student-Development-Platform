class ParentClassroom {
  const ParentClassroom({required this.id, required this.name});

  final String id;
  final String name;

  factory ParentClassroom.fromJson(Map<String, dynamic> json) {
    return ParentClassroom(
      id: json['id'] as String,
      name: json['name'] as String? ?? '',
    );
  }
}

class ParentChild {
  const ParentChild({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.studentNumber,
    required this.status,
    required this.classroom,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String studentNumber;
  final String status;
  final ParentClassroom classroom;

  String get displayName => '$firstName $lastName'.trim();

  factory ParentChild.fromJson(Map<String, dynamic> json) {
    return ParentChild(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      studentNumber: json['studentNumber'] as String,
      status: json['status'] as String,
      classroom: ParentClassroom.fromJson(
        json['classroom'] as Map<String, dynamic>,
      ),
    );
  }
}

class ParentAttendance {
  const ParentAttendance({required this.status, this.recordedAt});

  final String status;
  final DateTime? recordedAt;

  bool get isPresent => status == 'PRESENT';
  bool get isRecorded => isPresent && recordedAt != null;

  factory ParentAttendance.fromJson(Map<String, dynamic> json) {
    return ParentAttendance(
      status: json['status'] as String? ?? 'NOT_RECORDED',
      recordedAt: json['recordedAt'] == null
          ? null
          : DateTime.parse(json['recordedAt'] as String),
    );
  }
}

class ParentJourneySummary {
  const ParentJourneySummary({this.currentState, this.lastEventAt});

  final String? currentState;
  final DateTime? lastEventAt;

  factory ParentJourneySummary.fromJson(Map<String, dynamic> json) {
    return ParentJourneySummary(
      currentState: json['currentState'] as String?,
      lastEventAt: json['lastEventAt'] == null
          ? null
          : DateTime.parse(json['lastEventAt'] as String),
    );
  }
}

class ChildDashboard {
  const ChildDashboard({
    required this.student,
    required this.attendance,
    required this.journey,
  });

  final ParentChild student;
  final ParentAttendance attendance;
  final ParentJourneySummary journey;

  factory ChildDashboard.fromJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>;
    return ChildDashboard(
      student: ParentChild(
        id: student['id'] as String,
        firstName: student['firstName'] as String,
        lastName: student['lastName'] as String,
        studentNumber: student['studentNumber'] as String? ?? '',
        status: student['status'] as String? ?? 'ACTIVE',
        classroom: ParentClassroom.fromJson(
          student['classroom'] as Map<String, dynamic>,
        ),
      ),
      attendance: ParentAttendance.fromJson(
        json['attendance'] as Map<String, dynamic>? ?? const {},
      ),
      journey: ParentJourneySummary.fromJson(
        json['journey'] as Map<String, dynamic>? ?? const {},
      ),
    );
  }
}

class ParentJourneyEvent {
  const ParentJourneyEvent({
    required this.id,
    required this.eventType,
    required this.occurredAt,
    this.source,
  });

  final String id;
  final String eventType;
  final DateTime occurredAt;
  final String? source;

  factory ParentJourneyEvent.fromJson(Map<String, dynamic> json) {
    return ParentJourneyEvent(
      id: json['id'] as String,
      eventType: json['eventType'] as String,
      occurredAt: DateTime.parse(json['occurredAt'] as String),
      source: json['source'] as String?,
    );
  }
}

class ChildJourney {
  const ChildJourney({
    required this.studentId,
    required this.firstName,
    required this.lastName,
    this.currentState,
    this.events = const [],
  });

  final String studentId;
  final String firstName;
  final String lastName;
  final String? currentState;
  final List<ParentJourneyEvent> events;

  String get displayName => '$firstName $lastName'.trim();

  factory ChildJourney.fromJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>;
    return ChildJourney(
      studentId: student['id'] as String,
      firstName: student['firstName'] as String,
      lastName: student['lastName'] as String,
      currentState: json['currentState'] as String?,
      events: (json['events'] as List<dynamic>? ?? [])
          .map(
            (row) => ParentJourneyEvent.fromJson(row as Map<String, dynamic>),
          )
          .toList(),
    );
  }
}
