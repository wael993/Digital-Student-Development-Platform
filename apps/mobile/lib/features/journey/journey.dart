class JourneyEvent {
  const JourneyEvent({
    required this.id,
    required this.eventType,
    required this.occurredAt,
    this.recordedAt,
    this.source,
    this.metadata = const {},
  });

  final String id;
  final String eventType;
  final DateTime occurredAt;
  final DateTime? recordedAt;
  final String? source;
  final Map<String, dynamic> metadata;

  factory JourneyEvent.fromJson(Map<String, dynamic> json) {
    return JourneyEvent(
      id: json['id'] as String,
      eventType: json['eventType'] as String,
      occurredAt: DateTime.parse(json['occurredAt'] as String),
      recordedAt: json['recordedAt'] == null
          ? null
          : DateTime.parse(json['recordedAt'] as String),
      source: json['source'] as String?,
      metadata: Map<String, dynamic>.from(json['metadata'] as Map? ?? const {}),
    );
  }
}

class StudentJourney {
  const StudentJourney({
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
  final List<JourneyEvent> events;

  String get displayName => '$firstName $lastName'.trim();

  factory StudentJourney.fromJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>;
    return StudentJourney(
      studentId: student['id'] as String,
      firstName: student['firstName'] as String,
      lastName: student['lastName'] as String,
      currentState: json['currentState'] as String?,
      events: (json['events'] as List<dynamic>? ?? [])
          .map((row) => JourneyEvent.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

const staffJourneyEventTypes = [
  'SCHOOL_ARRIVAL',
  'CLASS_STARTED',
  'BREAK_STARTED',
  'ACTIVITY_STARTED',
  'MEAL',
  'SKILL_SESSION',
];
