import 'package:digital_student/core/network/api_exception.dart';
import 'package:flutter/material.dart';

String parentGreeting(String firstName, [DateTime? now]) {
  final hour = (now ?? DateTime.now()).hour;
  final hello = hour < 12
      ? 'Good morning'
      : hour < 17
      ? 'Good afternoon'
      : 'Good evening';
  return '$hello, $firstName 👋';
}

String parentEventLabel(String eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return 'Present';
    case 'BUS_BOARDING':
      return 'On the bus';
    case 'SCHOOL_ARRIVAL':
      return 'Arrived at school';
    case 'CLASS_STARTED':
      return 'Class started';
    case 'BREAK_STARTED':
      return 'Break time';
    case 'ACTIVITY_STARTED':
      return 'Activity started';
    case 'MEAL':
      return 'Meal time';
    case 'SKILL_SESSION':
      return 'Learning activity';
    case 'BUS_DEPARTURE':
      return 'Left school';
    case 'HOME_DROPOFF':
      return 'Arrived home';
    default:
      return eventType.replaceAll('_', ' ').toLowerCase();
  }
}

String parentCurrentStatusLabel(String? eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return 'Present';
    case 'BUS_BOARDING':
      return 'On the bus';
    case 'SCHOOL_ARRIVAL':
      return 'Arrived at school';
    case 'CLASS_STARTED':
      return 'Currently in class';
    case 'BREAK_STARTED':
      return 'Break time';
    case 'ACTIVITY_STARTED':
      return 'Activity started';
    case 'MEAL':
      return 'Meal time';
    case 'SKILL_SESSION':
      return 'Learning activity';
    case 'BUS_DEPARTURE':
      return 'Left school';
    case 'HOME_DROPOFF':
      return 'Arrived home';
    default:
      return "Today's journey hasn't started yet.";
  }
}

String formatParentTime(DateTime value) {
  final local = value.toLocal();
  final hour = local.hour % 12 == 0 ? 12 : local.hour % 12;
  final minute = local.minute.toString().padLeft(2, '0');
  final period = local.hour >= 12 ? 'PM' : 'AM';
  return '${hour.toString().padLeft(2, '0')}:$minute $period';
}

IconData parentEventIcon(String eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return Icons.check_circle;
    case 'BUS_BOARDING':
    case 'BUS_DEPARTURE':
      return Icons.directions_bus;
    case 'SCHOOL_ARRIVAL':
      return Icons.school;
    case 'CLASS_STARTED':
      return Icons.menu_book;
    case 'BREAK_STARTED':
      return Icons.free_breakfast;
    case 'ACTIVITY_STARTED':
      return Icons.palette;
    case 'MEAL':
      return Icons.restaurant;
    case 'SKILL_SESSION':
      return Icons.extension;
    case 'HOME_DROPOFF':
      return Icons.home;
    default:
      return Icons.circle;
  }
}

Color parentStatusColor(String? eventType) {
  switch (eventType) {
    case 'BUS_BOARDING':
    case 'BUS_DEPARTURE':
      return Colors.orange;
    case null:
      return Colors.grey;
    default:
      return Colors.green;
  }
}

String parentLoadErrorMessage(Object error, {required String fallback}) {
  if (error is ApiException &&
      (error.statusCode == 403 || error.statusCode == 404)) {
    return 'This child is no longer available.';
  }
  return fallback;
}
