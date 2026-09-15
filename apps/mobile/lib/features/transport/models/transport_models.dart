class NamedId {
  const NamedId({required this.id, this.name});

  final String id;
  final String? name;

  factory NamedId.fromJson(Map<String, dynamic> json) {
    return NamedId(
      id: json['id'] as String,
      name: json['name'] as String? ??
          '${json['firstName'] ?? ''} ${json['lastName'] ?? ''}'.trim(),
    );
  }
}

class BusRecord {
  const BusRecord({
    required this.id,
    required this.name,
    required this.registrationNumber,
    required this.capacity,
    required this.status,
    this.driverId,
  });

  final String id;
  final String name;
  final String registrationNumber;
  final int capacity;
  final String status;
  final String? driverId;

  factory BusRecord.fromJson(Map<String, dynamic> json) {
    return BusRecord(
      id: json['id'] as String,
      name: json['name'] as String,
      registrationNumber: json['registrationNumber'] as String? ?? '',
      capacity: json['capacity'] as int? ?? 0,
      status: json['status'] as String? ?? 'ACTIVE',
      driverId: json['driverId'] as String?,
    );
  }
}

class BusRouteRecord {
  const BusRouteRecord({
    required this.id,
    required this.name,
    required this.busId,
    required this.direction,
    required this.status,
  });

  final String id;
  final String name;
  final String busId;
  final String direction;
  final String status;

  factory BusRouteRecord.fromJson(Map<String, dynamic> json) {
    return BusRouteRecord(
      id: json['id'] as String,
      name: json['name'] as String,
      busId: json['busId'] as String,
      direction: json['direction'] as String,
      status: json['status'] as String? ?? 'ACTIVE',
    );
  }
}

class RouteStop {
  const RouteStop({
    required this.id,
    required this.sequence,
    required this.name,
    this.status,
    this.students = const [],
  });

  final String id;
  final int sequence;
  final String name;
  final String? status;
  final List<NamedId> students;

  factory RouteStop.fromJson(Map<String, dynamic> json) {
    return RouteStop(
      id: json['id'] as String,
      sequence: json['sequence'] as int? ?? 0,
      name: json['name'] as String,
      status: json['status'] as String?,
      students: (json['students'] as List<dynamic>? ?? [])
          .map((row) => NamedId.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class RouteSegment {
  const RouteSegment({
    required this.id,
    required this.fromStopId,
    required this.toStopId,
    required this.estimatedMinutes,
  });

  final String id;
  final String fromStopId;
  final String toStopId;
  final int estimatedMinutes;

  factory RouteSegment.fromJson(Map<String, dynamic> json) {
    return RouteSegment(
      id: json['id'] as String,
      fromStopId: json['fromStopId'] as String,
      toStopId: json['toStopId'] as String,
      estimatedMinutes: json['estimatedMinutes'] as int? ?? 0,
    );
  }
}

class RouteStudents {
  const RouteStudents({required this.stops, required this.unassigned});

  final List<RouteStop> stops;
  final List<NamedId> unassigned;

  factory RouteStudents.fromJson(Map<String, dynamic> json) {
    return RouteStudents(
      stops: (json['stops'] as List<dynamic>? ?? [])
          .map((row) => RouteStop.fromJson(row as Map<String, dynamic>))
          .toList(),
      unassigned: (json['unassigned'] as List<dynamic>? ?? [])
          .map((row) => NamedId.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class RouteProgress {
  const RouteProgress({
    required this.liveTracking,
    required this.stops,
    this.currentStopId,
  });

  final bool liveTracking;
  final String? currentStopId;
  final List<RouteStop> stops;

  factory RouteProgress.fromJson(Map<String, dynamic> json) {
    return RouteProgress(
      liveTracking: json['liveTracking'] as bool? ?? false,
      currentStopId: json['currentStopId'] as String?,
      stops: (json['stops'] as List<dynamic>? ?? [])
          .map((row) => RouteStop.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class TransportDirectionPlan {
  const TransportDirectionPlan({
    required this.direction,
    required this.transportMethod,
    required this.status,
    this.progress,
  });

  final String direction;
  final String transportMethod;
  final String status;
  final ParentRouteProgress? progress;

  bool get cancelled => status == 'CANCELLED';
  bool get usesBus => transportMethod == 'BUS' && !cancelled;

  factory TransportDirectionPlan.fromJson(Map<String, dynamic> json) {
    final progress = json['progress'];
    return TransportDirectionPlan(
      direction: json['direction'] as String,
      transportMethod: json['transportMethod'] as String? ?? 'OTHER',
      status: json['status'] as String? ?? 'SCHEDULED',
      progress: progress is Map<String, dynamic>
          ? ParentRouteProgress.fromJson(progress)
          : null,
    );
  }
}

class ParentRouteProgress {
  const ParentRouteProgress({
    this.busName,
    this.currentStop,
    this.childStop,
    this.childrenAtStop = 0,
    this.stopsRemaining = 0,
    this.estimatedMinutes = 0,
    this.estimatedArrivalTime,
  });

  final String? busName;
  final NamedStop? currentStop;
  final NamedStop? childStop;
  final int childrenAtStop;
  final int stopsRemaining;
  final int estimatedMinutes;
  final String? estimatedArrivalTime;

  factory ParentRouteProgress.fromJson(Map<String, dynamic> json) {
    return ParentRouteProgress(
      busName: json['busName'] as String?,
      currentStop: json['currentStop'] is Map<String, dynamic>
          ? NamedStop.fromJson(json['currentStop'] as Map<String, dynamic>)
          : null,
      childStop: json['childStop'] is Map<String, dynamic>
          ? NamedStop.fromJson(json['childStop'] as Map<String, dynamic>)
          : null,
      childrenAtStop: json['childrenAtStop'] as int? ?? 0,
      stopsRemaining: json['stopsRemaining'] as int? ?? 0,
      estimatedMinutes: json['estimatedMinutes'] as int? ?? 0,
      estimatedArrivalTime: json['estimatedArrivalTime'] as String?,
    );
  }
}

class NamedStop {
  const NamedStop({required this.sequence, required this.name});

  final int sequence;
  final String name;

  factory NamedStop.fromJson(Map<String, dynamic> json) {
    return NamedStop(
      sequence: json['sequence'] as int? ?? 0,
      name: json['name'] as String? ?? '',
    );
  }
}

class ParentTransportToday {
  const ParentTransportToday({required this.date, required this.directions});

  final String date;
  final List<TransportDirectionPlan> directions;

  factory ParentTransportToday.fromJson(Map<String, dynamic> json) {
    return ParentTransportToday(
      date: json['date'] as String? ?? '',
      directions: (json['directions'] as List<dynamic>? ?? [])
          .map((row) => TransportDirectionPlan.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ClassroomTransportToday {
  const ClassroomTransportToday({
    required this.expected,
    required this.arrivedByBus,
    required this.arrivedByCar,
    required this.notArrived,
    required this.children,
  });

  final int expected;
  final int arrivedByBus;
  final int arrivedByCar;
  final int notArrived;
  final List<ClassroomChildTransport> children;

  factory ClassroomTransportToday.fromJson(Map<String, dynamic> json) {
    return ClassroomTransportToday(
      expected: json['expected'] as int? ?? 0,
      arrivedByBus: json['arrivedByBus'] as int? ?? 0,
      arrivedByCar: json['arrivedByCar'] as int? ?? 0,
      notArrived: json['notArrived'] as int? ?? 0,
      children: (json['children'] as List<dynamic>? ?? [])
          .map((row) => ClassroomChildTransport.fromJson(row as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ClassroomChildTransport {
  const ClassroomChildTransport({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.arrivalStatus,
  });

  final String id;
  final String firstName;
  final String lastName;
  final String arrivalStatus;

  String get displayName => '$firstName $lastName'.trim();

  factory ClassroomChildTransport.fromJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>? ?? json;
    return ClassroomChildTransport(
      id: student['id'] as String,
      firstName: student['firstName'] as String? ?? '',
      lastName: student['lastName'] as String? ?? '',
      arrivalStatus: json['arrivalStatus'] as String? ?? 'NOT_ARRIVED',
    );
  }
}

class BoardingResult {
  const BoardingResult({required this.status, required this.firstName, required this.lastName});

  final String status;
  final String firstName;
  final String lastName;

  String get displayName => '$firstName $lastName'.trim();
  bool get alreadyRecorded => status == 'ALREADY_RECORDED';

  factory BoardingResult.fromJson(Map<String, dynamic> json) {
    final student = json['student'] as Map<String, dynamic>? ?? {};
    return BoardingResult(
      status: json['status'] as String? ?? 'RECORDED',
      firstName: student['firstName'] as String? ?? '',
      lastName: student['lastName'] as String? ?? '',
    );
  }
}
