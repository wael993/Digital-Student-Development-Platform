class AppNotification {
  const AppNotification({
    required this.id,
    required this.studentId,
    required this.type,
    required this.title,
    required this.body,
    required this.data,
    required this.status,
    required this.createdAt,
    this.sentAt,
    this.readAt,
  });

  final String id;
  final String studentId;
  final String type;
  final String title;
  final String body;
  final Map<String, String> data;
  final String status;
  final DateTime createdAt;
  final DateTime? sentAt;
  final DateTime? readAt;

  bool get isUnread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    final raw = json['data'];
    final data = <String, String>{};
    if (raw is Map) {
      raw.forEach((key, value) {
        if (value is String) {
          data['$key'] = value;
        }
      });
    }
    return AppNotification(
      id: json['id'] as String,
      studentId: json['studentId'] as String? ?? data['studentId'] ?? '',
      type: json['type'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      data: data,
      status: json['status'] as String? ?? 'SENT',
      createdAt: DateTime.parse(json['createdAt'] as String),
      sentAt: json['sentAt'] == null
          ? null
          : DateTime.parse(json['sentAt'] as String),
      readAt: json['readAt'] == null
          ? null
          : DateTime.parse(json['readAt'] as String),
    );
  }
}

class NotificationPreferences {
  const NotificationPreferences({
    required this.journeyUpdates,
    required this.studentArrival,
    required this.studentDeparture,
    required this.homeDropoff,
    required this.mediaAvailable,
  });

  final bool journeyUpdates;
  final bool studentArrival;
  final bool studentDeparture;
  final bool homeDropoff;
  final bool mediaAvailable;

  factory NotificationPreferences.fromJson(Map<String, dynamic> json) {
    return NotificationPreferences(
      journeyUpdates: json['journeyUpdates'] as bool? ?? true,
      studentArrival: json['studentArrival'] as bool? ?? true,
      studentDeparture: json['studentDeparture'] as bool? ?? true,
      homeDropoff: json['homeDropoff'] as bool? ?? true,
      mediaAvailable: json['mediaAvailable'] as bool? ?? true,
    );
  }

  Map<String, bool> toPatch() => {
    'journeyUpdates': journeyUpdates,
    'studentArrival': studentArrival,
    'studentDeparture': studentDeparture,
    'homeDropoff': homeDropoff,
    'mediaAvailable': mediaAvailable,
  };

  NotificationPreferences copyWith({
    bool? journeyUpdates,
    bool? studentArrival,
    bool? studentDeparture,
    bool? homeDropoff,
    bool? mediaAvailable,
  }) {
    return NotificationPreferences(
      journeyUpdates: journeyUpdates ?? this.journeyUpdates,
      studentArrival: studentArrival ?? this.studentArrival,
      studentDeparture: studentDeparture ?? this.studentDeparture,
      homeDropoff: homeDropoff ?? this.homeDropoff,
      mediaAvailable: mediaAvailable ?? this.mediaAvailable,
    );
  }
}

class NotificationList {
  const NotificationList({
    required this.items,
    required this.unreadCount,
    this.page = 1,
    this.total = 0,
  });

  final List<AppNotification> items;
  final int unreadCount;
  final int page;
  final int total;

  bool get isEmpty => items.isEmpty;
}

class PushPayload {
  const PushPayload({
    required this.type,
    required this.studentId,
    this.notificationId,
    this.eventId,
    this.mediaId,
    this.title,
    this.body,
  });

  final String type;
  final String studentId;
  final String? notificationId;
  final String? eventId;
  final String? mediaId;
  final String? title;
  final String? body;

  factory PushPayload.fromData(Map<String, dynamic> data, {String? title, String? body}) {
    return PushPayload(
      type: '${data['type'] ?? ''}',
      studentId: '${data['studentId'] ?? ''}',
      notificationId: data['notificationId']?.toString(),
      eventId: data['eventId']?.toString(),
      mediaId: data['mediaId']?.toString(),
      title: title,
      body: body,
    );
  }
}
