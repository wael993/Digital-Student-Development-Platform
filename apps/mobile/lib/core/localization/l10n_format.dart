import 'package:digital_student/core/network/api_exception.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:intl/intl.dart';

String formatAppTime(DateTime value, String locale) {
  return DateFormat.jm(locale).format(value.toLocal());
}

String formatAppDate(DateTime value, String locale) {
  return DateFormat.yMMMMd(locale).format(value.toLocal());
}

String localizedError(
  AppLocalizations l10n,
  Object error, {
  String? fallback,
}) {
  if (error is ApiException) {
    return localizedErrorCode(l10n, error.code, fallback: fallback);
  }
  return fallback ?? l10n.errorRequestFailed;
}

String localizedErrorCode(
  AppLocalizations l10n,
  String code, {
  String? fallback,
}) {
  switch (code) {
    case 'INVALID_CREDENTIALS':
      return l10n.errorInvalidCredentials;
    case 'ACCOUNT_INACTIVE':
      return l10n.errorAccountInactive;
    case 'UNAUTHORIZED':
    case 'ACCESS_TOKEN_EXPIRED':
    case 'INVALID_REFRESH_TOKEN':
    case 'REFRESH_TOKEN_EXPIRED':
      return l10n.errorUnauthorized;
    case 'FORBIDDEN':
      return l10n.errorForbidden;
    case 'NOT_FOUND':
      return l10n.errorNotFound;
    case 'VALIDATION_ERROR':
      return l10n.errorValidation;
    case 'STUDENT_NOT_FOUND':
      return l10n.noActiveStudent;
    case 'STUDENT_INACTIVE':
      return l10n.errorStudentInactive;
    case 'ORGANIZATION_NOT_FOUND':
      return l10n.errorOrganizationNotFound;
    case 'ORGANIZATION_SUSPENDED':
    case 'TENANT_SUSPENDED':
      return l10n.errorOrganizationSuspended;
    case 'ORGANIZATION_INACTIVE':
    case 'TENANT_INACTIVE':
      return l10n.errorOrganizationInactive;
    case 'USER_NOT_FOUND':
      return l10n.errorUserNotFound;
    case 'USER_ALREADY_EXISTS':
      return l10n.errorUserAlreadyExists;
    case 'USER_ROLE_NOT_ALLOWED':
      return l10n.errorUserRoleNotAllowed;
    case 'LAST_ACTIVE_ADMIN':
      return l10n.errorLastActiveAdmin;
    case 'INVITATION_EXPIRED':
      return l10n.errorInvitationExpired;
    case 'INVITATION_ALREADY_USED':
      return l10n.errorInvitationAlreadyUsed;
    case 'INVITATION_REVOKED':
      return l10n.errorInvitationRevoked;
    case 'NETWORK_ERROR':
      return l10n.errorNetwork;
    case 'LOGIN_FAILED':
      return l10n.errorLoginFailed;
    case 'INTERNAL_ERROR':
      return l10n.errorInternal;
    default:
      return fallback ?? l10n.errorRequestFailed;
  }
}

String organizationStatusLabel(AppLocalizations l10n, String status) {
  switch (status) {
    case 'TRIAL':
      return l10n.orgStatusTrial;
    case 'ACTIVE':
      return l10n.orgStatusActive;
    case 'SUSPENDED':
      return l10n.orgStatusSuspended;
    case 'INACTIVE':
      return l10n.orgStatusInactive;
    case 'CANCELLED':
      return l10n.orgStatusCancelled;
    default:
      return status;
  }
}

String organizationPlanLabel(AppLocalizations l10n, String plan) {
  switch (plan) {
    case 'STARTER':
      return l10n.planStarter;
    case 'PROFESSIONAL':
      return l10n.planProfessional;
    case 'ENTERPRISE':
      return l10n.planEnterprise;
    default:
      return plan;
  }
}

String tenantRoleLabel(AppLocalizations l10n, String role) {
  switch (role) {
    case 'ADMIN':
      return l10n.roleAdmin;
    case 'SUPERVISOR':
      return l10n.roleSupervisor;
    case 'TEACHER':
      return l10n.roleTeacher;
    case 'DRIVER':
      return l10n.roleDriver;
    case 'GUARDIAN':
      return l10n.roleGuardian;
    case 'PLATFORM_ADMIN':
      return l10n.rolePlatformAdmin;
    default:
      return role;
  }
}

String userStatusLabel(AppLocalizations l10n, String status) {
  switch (status) {
    case 'ACTIVE':
      return l10n.userStatusActive;
    case 'INACTIVE':
      return l10n.userStatusInactive;
    default:
      return status;
  }
}

String parentEventLabel(AppLocalizations l10n, String eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return l10n.eventAttendancePresent;
    case 'BUS_BOARDING':
      return l10n.eventBusBoarding;
    case 'SCHOOL_ARRIVAL':
      return l10n.eventSchoolArrival;
    case 'CLASS_STARTED':
      return l10n.eventClassStarted;
    case 'BREAK_STARTED':
      return l10n.eventBreakStarted;
    case 'ACTIVITY_STARTED':
      return l10n.eventActivityStarted;
    case 'MEAL':
      return l10n.eventMeal;
    case 'SKILL_SESSION':
      return l10n.eventSkillSession;
    case 'BUS_DEPARTURE':
      return l10n.eventBusDeparture;
    case 'HOME_DROPOFF':
      return l10n.eventHomeDropoff;
    case 'ARRIVED_BY_CAR':
      return l10n.eventArrivedByCar;
    case 'PARENT_PICKUP':
      return l10n.eventParentPickup;
    case 'AUTHORIZED_PICKUP':
      return l10n.eventAuthorizedPickup;
    case 'MISSED_BUS':
      return l10n.eventMissedBus;
    case 'TRANSPORT_CANCELLED':
      return l10n.eventTransportCancelled;
    case 'NOT_PRESENT_AT_CLASS_CHECK':
      return l10n.eventNotPresentAtClass;
    default:
      return eventType;
  }
}

String parentCurrentStatusLabel(AppLocalizations l10n, String? eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return l10n.statusAttendancePresent;
    case 'BUS_BOARDING':
      return l10n.statusBusBoarding;
    case 'SCHOOL_ARRIVAL':
      return l10n.statusSchoolArrival;
    case 'CLASS_STARTED':
      return l10n.statusClassStarted;
    case 'BREAK_STARTED':
      return l10n.statusBreakStarted;
    case 'ACTIVITY_STARTED':
      return l10n.statusActivityStarted;
    case 'MEAL':
      return l10n.statusMeal;
    case 'SKILL_SESSION':
      return l10n.statusSkillSession;
    case 'BUS_DEPARTURE':
      return l10n.statusBusDeparture;
    case 'HOME_DROPOFF':
      return l10n.statusHomeDropoff;
    case 'ARRIVED_BY_CAR':
      return l10n.statusArrivedByCar;
    case 'PARENT_PICKUP':
      return l10n.statusParentPickup;
    case 'AUTHORIZED_PICKUP':
      return l10n.statusAuthorizedPickup;
    case 'MISSED_BUS':
      return l10n.statusMissedBus;
    case 'TRANSPORT_CANCELLED':
      return l10n.statusTransportCancelled;
    case 'NOT_PRESENT_AT_CLASS_CHECK':
      return l10n.statusNotPresentAtClass;
    default:
      return l10n.statusJourneyNotStarted;
  }
}

String staffEventLabel(AppLocalizations l10n, String eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return l10n.staffEventAttendancePresent;
    case 'BUS_BOARDING':
      return l10n.staffEventBusBoarding;
    case 'SCHOOL_ARRIVAL':
      return l10n.staffEventSchoolArrival;
    case 'CLASS_STARTED':
      return l10n.staffEventClassStarted;
    case 'BREAK_STARTED':
      return l10n.staffEventBreakStarted;
    case 'ACTIVITY_STARTED':
      return l10n.staffEventActivityStarted;
    case 'MEAL':
      return l10n.staffEventMeal;
    case 'SKILL_SESSION':
      return l10n.staffEventSkillSession;
    case 'BUS_DEPARTURE':
      return l10n.staffEventBusDeparture;
    case 'HOME_DROPOFF':
      return l10n.staffEventHomeDropoff;
    case 'ARRIVED_BY_CAR':
      return l10n.staffEventArrivedByCar;
    case 'PARENT_PICKUP':
      return l10n.staffEventParentPickup;
    case 'AUTHORIZED_PICKUP':
      return l10n.staffEventAuthorizedPickup;
    case 'MISSED_BUS':
      return l10n.staffEventMissedBus;
    case 'TRANSPORT_CANCELLED':
      return l10n.staffEventTransportCancelled;
    case 'NOT_PRESENT_AT_CLASS_CHECK':
      return l10n.staffEventNotPresentAtClass;
    default:
      return eventType;
  }
}

String staffCurrentStateLabel(AppLocalizations l10n, String? eventType) {
  switch (eventType) {
    case 'ATTENDANCE_PRESENT':
      return l10n.staffStatePresent;
    case 'BUS_BOARDING':
      return l10n.staffStateOnTheBus;
    case 'SCHOOL_ARRIVAL':
      return l10n.staffStateAtSchool;
    case 'CLASS_STARTED':
      return l10n.staffStateInClass;
    case 'BREAK_STARTED':
      return l10n.staffStateOnBreak;
    case 'ACTIVITY_STARTED':
      return l10n.staffStateInActivity;
    case 'MEAL':
      return l10n.staffStateAtMeal;
    case 'SKILL_SESSION':
      return l10n.staffStateInSkillSession;
    case 'BUS_DEPARTURE':
      return l10n.staffStateOnTheWayHome;
    case 'HOME_DROPOFF':
      return l10n.staffStateHome;
    case 'ARRIVED_BY_CAR':
      return l10n.staffEventArrivedByCar;
    case 'PARENT_PICKUP':
      return l10n.staffEventParentPickup;
    case 'AUTHORIZED_PICKUP':
      return l10n.staffEventAuthorizedPickup;
    case 'MISSED_BUS':
      return l10n.staffEventMissedBus;
    case 'TRANSPORT_CANCELLED':
      return l10n.staffEventTransportCancelled;
    case 'NOT_PRESENT_AT_CLASS_CHECK':
      return l10n.staffEventNotPresentAtClass;
    default:
      return l10n.staffStateNoEvents;
  }
}

String parentGreeting(AppLocalizations l10n, String firstName, [DateTime? now]) {
  final hour = (now ?? DateTime.now()).hour;
  final hello = hour < 12
      ? l10n.goodMorning
      : hour < 17
          ? l10n.goodAfternoon
          : l10n.goodEvening;
  return l10n.greeting(hello, firstName);
}

String studentStatusLabel(AppLocalizations l10n, String status) {
  switch (status) {
    case 'ACTIVE':
      return l10n.statusActive;
    case 'INACTIVE':
      return l10n.statusInactive;
    case 'TRANSFERRED':
      return l10n.statusTransferred;
    case 'GRADUATED':
      return l10n.statusGraduated;
    default:
      return status;
  }
}

String classroomLevelLabel(AppLocalizations l10n, String level) {
  switch (level) {
    case 'NURSERY':
      return l10n.levelNursery;
    case 'KINDERGARTEN':
      return l10n.levelKindergarten;
    case 'PRIMARY':
      return l10n.levelPrimary;
    case 'MIDDLE_SCHOOL':
      return l10n.levelMiddleSchool;
    case 'HIGH_SCHOOL':
      return l10n.levelHighSchool;
    default:
      return level.replaceAll('_', ' ');
  }
}

String relationshipLabel(AppLocalizations l10n, String value) {
  switch (value) {
    case 'MOTHER':
      return l10n.relationshipMother;
    case 'FATHER':
      return l10n.relationshipFather;
    case 'LEGAL_GUARDIAN':
      return l10n.relationshipLegalGuardian;
    case 'OTHER':
      return l10n.relationshipOther;
    default:
      return value.replaceAll('_', ' ');
  }
}

String notificationTypeLabel(AppLocalizations l10n, String type) {
  switch (type) {
    case 'STUDENT_ARRIVAL':
      return l10n.notifStudentArrival;
    case 'STUDENT_DEPARTURE':
      return l10n.notifStudentDeparture;
    case 'STUDENT_HOME_DROPOFF':
      return l10n.notifStudentHomeDropoff;
    case 'MEDIA_AVAILABLE':
      return l10n.notifMediaAvailable;
    case 'JOURNEY_UPDATE':
      return l10n.notifJourneyUpdate;
    default:
      return l10n.notificationUpdate;
  }
}

String notificationDayLabel(
  AppLocalizations l10n,
  String locale,
  DateTime value, [
  DateTime? now,
]) {
  final local = value.toLocal();
  final today = now ?? DateTime.now();
  final startToday = DateTime(today.year, today.month, today.day);
  final startThat = DateTime(local.year, local.month, local.day);
  final days = startToday.difference(startThat).inDays;
  if (days == 0) {
    return l10n.today;
  }
  if (days == 1) {
    return l10n.yesterday;
  }
  return DateFormat.EEEE(locale).format(local);
}
