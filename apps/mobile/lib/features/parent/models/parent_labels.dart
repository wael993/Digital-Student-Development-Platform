import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

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
    case 'ARRIVED_BY_CAR':
      return Icons.directions_car;
    case 'PARENT_PICKUP':
    case 'AUTHORIZED_PICKUP':
      return Icons.family_restroom;
    case 'MISSED_BUS':
    case 'TRANSPORT_CANCELLED':
      return Icons.directions_bus_filled;
    case 'NOT_PRESENT_AT_CLASS_CHECK':
      return Icons.hourglass_empty;
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

String parentLoadErrorMessage(
  AppLocalizations l10n,
  Object error, {
  required String fallback,
}) {
  if (error is ApiException &&
      (error.statusCode == 403 || error.statusCode == 404)) {
    return l10n.childUnavailable;
  }
  return fallback;
}
