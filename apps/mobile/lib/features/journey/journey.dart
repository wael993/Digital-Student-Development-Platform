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

String journeyEventLabel(String eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return 'Present';
    case 'BUS_BOARDING':
      return 'Bus boarding';
    case 'SCHOOL_ARRIVAL':
      return 'School arrival';
    case 'CLASS_STARTED':
      return 'Class started';
    case 'BREAK_STARTED':
      return 'Break';
    case 'ACTIVITY_STARTED':
      return 'Activity';
    case 'MEAL':
      return 'Meal';
    case 'SKILL_SESSION':
      return 'Skill session';
    case 'BUS_DEPARTURE':
      return 'Bus departure';
    case 'HOME_DROPOFF':
      return 'Home drop-off';
    default:
      return eventType.replaceAll('_', ' ').toLowerCase();
  }
}

String journeyCurrentStateLabel(String? eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return 'Present';
    case 'BUS_BOARDING':
      return 'On the bus';
    case 'SCHOOL_ARRIVAL':
      return 'At school';
    case 'CLASS_STARTED':
      return 'In class';
    case 'BREAK_STARTED':
      return 'On break';
    case 'ACTIVITY_STARTED':
      return 'In an activity';
    case 'MEAL':
      return 'At meal';
    case 'SKILL_SESSION':
      return 'In a skill session';
    case 'BUS_DEPARTURE':
      return 'On the way home';
    case 'HOME_DROPOFF':
      return 'Home';
    default:
      return 'No events yet';
  }
}

String formatJourneyTime(DateTime value) {
  final local = value.toLocal();
  return '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
}
