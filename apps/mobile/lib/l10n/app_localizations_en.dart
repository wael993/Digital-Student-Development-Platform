// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get appName => 'My Journey';

  @override
  String get login => 'Login';

  @override
  String get email => 'Email';

  @override
  String get password => 'Password';

  @override
  String get welcome => 'Welcome';

  @override
  String get attendance => 'Attendance';

  @override
  String get journey => 'Journey';

  @override
  String get photos => 'Photos';

  @override
  String get notifications => 'Notifications';

  @override
  String get settings => 'Settings';

  @override
  String get language => 'Language';

  @override
  String get english => 'English';

  @override
  String get arabic => 'العربية';

  @override
  String get logOut => 'Log out';

  @override
  String get retry => 'Retry';

  @override
  String get tryAgain => 'Try Again';

  @override
  String get cancel => 'Cancel';

  @override
  String get save => 'Save';

  @override
  String get done => 'Done';

  @override
  String get search => 'Search...';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get passwordResetUnavailable => 'Password reset is not available yet.';

  @override
  String get emailRequired => 'Email is required';

  @override
  String get passwordRequired => 'Password is required';

  @override
  String get nothingHereYet => 'Nothing here yet';

  @override
  String get myChildren => 'My Children';

  @override
  String get myClasses => 'My Classes';

  @override
  String get campuses => 'Campuses';

  @override
  String get students => 'Students';

  @override
  String get student => 'Student';

  @override
  String get studentJourney => 'Student Journey';

  @override
  String get today => 'Today';

  @override
  String get yesterday => 'Yesterday';

  @override
  String get child => 'Child';

  @override
  String childDay(String name) {
    return '$name\'s Day';
  }

  @override
  String childPhotos(String name) {
    return '$name\'s Photos';
  }

  @override
  String get goodMorning => 'Good morning';

  @override
  String get goodAfternoon => 'Good afternoon';

  @override
  String get goodEvening => 'Good evening';

  @override
  String greeting(String hello, String name) {
    return '$hello, $name 👋';
  }

  @override
  String get yourChildren => 'Your children';

  @override
  String get noChildrenAvailable => 'No children available';

  @override
  String get noChildrenHint =>
      'Your school has not linked any active students to your account yet.';

  @override
  String get loadingChildInfo => 'Loading child information...';

  @override
  String get unableToLoadChildren => 'Unable to load your children.';

  @override
  String get unableToLoadChildInfo => 'Unable to load child information.';

  @override
  String get childUnavailable => 'This child is no longer available.';

  @override
  String get currentStatus => 'Current status';

  @override
  String lastUpdate(String time) {
    return 'Last update $time';
  }

  @override
  String get todaysAttendance => 'Today\'s Attendance';

  @override
  String get present => 'Present';

  @override
  String get notRecordedYet => 'Not recorded yet';

  @override
  String recordedAt(String time) {
    return 'Recorded at $time';
  }

  @override
  String get viewTodaysJourney => 'View Today\'s Journey';

  @override
  String get todaysJourney => 'Today\'s Journey';

  @override
  String get loadingTodaysJourney => 'Loading today\'s journey...';

  @override
  String get unableToLoadJourney => 'Unable to load today\'s journey.';

  @override
  String get noActivityYet => 'No activity has been recorded yet.';

  @override
  String get classLabel => 'Class';

  @override
  String get studentNumber => 'Student number';

  @override
  String get status => 'Status';

  @override
  String get statusActive => 'Active';

  @override
  String get statusInactive => 'Inactive';

  @override
  String get statusTransferred => 'Transferred';

  @override
  String get statusGraduated => 'Graduated';

  @override
  String currentlyStatus(String status) {
    return 'Currently $status';
  }

  @override
  String get todaysTimeline => 'Today\'s Timeline';

  @override
  String get noJourneyEventsYet => 'No journey events yet';

  @override
  String get eventAttendancePresent => 'Present';

  @override
  String get eventBusBoarding => 'On the bus';

  @override
  String get eventSchoolArrival => 'Arrived at school';

  @override
  String get eventClassStarted => 'Class started';

  @override
  String get eventBreakStarted => 'Break time';

  @override
  String get eventActivityStarted => 'Activity started';

  @override
  String get eventMeal => 'Meal time';

  @override
  String get eventSkillSession => 'Learning activity';

  @override
  String get eventBusDeparture => 'Left school';

  @override
  String get eventHomeDropoff => 'Arrived home';

  @override
  String get statusAttendancePresent => 'Present';

  @override
  String get statusBusBoarding => 'On the bus';

  @override
  String get statusSchoolArrival => 'Arrived at school';

  @override
  String get statusClassStarted => 'Currently in class';

  @override
  String get statusBreakStarted => 'Break time';

  @override
  String get statusActivityStarted => 'Activity started';

  @override
  String get statusMeal => 'Meal time';

  @override
  String get statusSkillSession => 'Learning activity';

  @override
  String get statusBusDeparture => 'Left school';

  @override
  String get statusHomeDropoff => 'Arrived home';

  @override
  String get statusJourneyNotStarted => 'Today\'s journey hasn\'t started yet.';

  @override
  String get staffEventAttendancePresent => 'Present';

  @override
  String get staffEventBusBoarding => 'Bus boarding';

  @override
  String get staffEventSchoolArrival => 'School arrival';

  @override
  String get staffEventClassStarted => 'Class started';

  @override
  String get staffEventBreakStarted => 'Break';

  @override
  String get staffEventActivityStarted => 'Activity';

  @override
  String get staffEventMeal => 'Meal';

  @override
  String get staffEventSkillSession => 'Skill session';

  @override
  String get staffEventBusDeparture => 'Bus departure';

  @override
  String get staffEventHomeDropoff => 'Home drop-off';

  @override
  String get staffStatePresent => 'present';

  @override
  String get staffStateOnTheBus => 'on the bus';

  @override
  String get staffStateAtSchool => 'at school';

  @override
  String get staffStateInClass => 'in class';

  @override
  String get staffStateOnBreak => 'on break';

  @override
  String get staffStateInActivity => 'in an activity';

  @override
  String get staffStateAtMeal => 'at meal';

  @override
  String get staffStateInSkillSession => 'in a skill session';

  @override
  String get staffStateOnTheWayHome => 'on the way home';

  @override
  String get staffStateHome => 'home';

  @override
  String get staffStateNoEvents => 'no events yet';

  @override
  String get scanStudentQr => 'Scan Student QR';

  @override
  String get noAttendanceYet => 'No attendance recorded yet';

  @override
  String get attendanceRecorded => 'Attendance Recorded';

  @override
  String get alreadyRecorded => 'Already Recorded';

  @override
  String get alreadyMarkedPresent => 'was already marked present today.';

  @override
  String get scanNextStudent => 'Scan Next Student';

  @override
  String get cameraPermissionNeeded => 'Camera Permission Needed';

  @override
  String get cameraPermissionScan =>
      'Camera permission is required to scan student QR codes.';

  @override
  String get qrNotRecognized => 'QR Code Not Recognized';

  @override
  String get noActiveStudent => 'No active student was found.';

  @override
  String get attendanceForbidden =>
      'You do not have permission to record attendance.';

  @override
  String get attendanceFailed => 'Unable to record attendance. Try again.';

  @override
  String get studentPhoto => 'Student Photo';

  @override
  String get takePhoto => 'Take Photo';

  @override
  String get chooseFromDevice => 'Choose from device';

  @override
  String get retake => 'Retake';

  @override
  String get usePhoto => 'Use Photo';

  @override
  String get photoUploaded => 'Photo uploaded';

  @override
  String get uploadFailed => 'Upload failed';

  @override
  String get uploadingPhoto => 'Uploading photo...';

  @override
  String get cameraAccessPhoto => 'Camera access is required to take a photo.';

  @override
  String get openSystemSettings => 'Open Settings';

  @override
  String get photo => 'Photo';

  @override
  String get photoUnavailable => 'Photo is unavailable.';

  @override
  String get noPhotosYet => 'No photos yet';

  @override
  String get viewAll => 'View all';

  @override
  String get photosAccessDenied => 'You do not have access to these photos.';

  @override
  String get unableToLoadPhotos => 'Unable to load photos.';

  @override
  String percentValue(int percent) {
    return '$percent%';
  }

  @override
  String get noNotificationsYet => 'No notifications yet';

  @override
  String get unableToLoadNotifications => 'Unable to load notifications.';

  @override
  String get unableToLoadNotificationSettings =>
      'Unable to load notification settings.';

  @override
  String get notificationsDisabledHint =>
      'Notifications are turned off in system settings. Enable them to receive push alerts.';

  @override
  String get journeyUpdates => 'Journey Updates';

  @override
  String get prefChildArrivedNursery => 'Child arrived at nursery';

  @override
  String get prefChildLeftNursery => 'Child left nursery';

  @override
  String get prefChildArrivedHome => 'Child arrived home';

  @override
  String get prefNewPhotos => 'New photos';

  @override
  String get notificationUpdate => 'Update';

  @override
  String get tapToViewJourney => 'Tap to view today\'s journey';

  @override
  String get notifStudentArrival => 'Arrived at school';

  @override
  String get notifStudentDeparture => 'Left school';

  @override
  String get notifStudentHomeDropoff => 'Arrived home';

  @override
  String get notifMediaAvailable => 'New photos';

  @override
  String get notifJourneyUpdate => 'Journey update';

  @override
  String get newStudent => 'New student';

  @override
  String get firstName => 'First name';

  @override
  String get lastName => 'Last name';

  @override
  String get firstNameRequired => 'First name is required';

  @override
  String get lastNameRequired => 'Last name is required';

  @override
  String get studentNumberRequired => 'Student number is required';

  @override
  String get gender => 'Gender';

  @override
  String get genderFemale => 'Female';

  @override
  String get genderMale => 'Male';

  @override
  String get genderOther => 'Other';

  @override
  String get dateOfBirth => 'Date of birth';

  @override
  String get dateOfBirthRequired => 'Date of birth is required';

  @override
  String get noStudentsYet => 'No students yet';

  @override
  String get attendanceQr => 'Attendance QR';

  @override
  String get guardians => 'Guardians';

  @override
  String get addGuardian => 'Add Guardian';

  @override
  String get addGuardianTitle => 'Add guardian';

  @override
  String get noGuardiansYet => 'No guardians yet';

  @override
  String get primaryGuardian => 'Primary guardian';

  @override
  String get passwordNewAccount => 'Password (required for a new account)';

  @override
  String get relationship => 'Relationship';

  @override
  String get relationshipMother => 'Mother';

  @override
  String get relationshipFather => 'Father';

  @override
  String get relationshipLegalGuardian => 'Legal guardian';

  @override
  String get relationshipOther => 'Other';

  @override
  String get name => 'Name';

  @override
  String get nameRequired => 'Name is required';

  @override
  String get newClassroom => 'New classroom';

  @override
  String get newCampus => 'New campus';

  @override
  String get campusName => 'Campus name';

  @override
  String get noClassroomsYet => 'No classrooms yet';

  @override
  String get noCampusesYet => 'No campuses yet';

  @override
  String get level => 'Level';

  @override
  String get levelNursery => 'Nursery';

  @override
  String get levelKindergarten => 'Kindergarten';

  @override
  String get levelPrimary => 'Primary';

  @override
  String get levelMiddleSchool => 'Middle school';

  @override
  String get levelHighSchool => 'High school';

  @override
  String get errorInvalidCredentials => 'Invalid email or password';

  @override
  String get errorAccountInactive => 'Account inactive';

  @override
  String get errorUnauthorized => 'Authentication required';

  @override
  String get errorForbidden =>
      'You do not have permission to perform this action';

  @override
  String get errorNotFound => 'Not found';

  @override
  String get errorValidation => 'Please check the form and try again.';

  @override
  String get errorLoginFailed => 'Unable to log in. Try again.';

  @override
  String get errorRequestFailed => 'Request failed';

  @override
  String get errorInternal => 'Something went wrong. Try again.';

  @override
  String get errorNetwork => 'Unable to connect. Try again.';

  @override
  String get errorStudentInactive => 'Student is not active';

  @override
  String get transport => 'Transport';

  @override
  String get buses => 'Buses';

  @override
  String get routes => 'Routes';

  @override
  String get myRoute => 'My Route';

  @override
  String get morningArrival => 'Morning Arrival';

  @override
  String get todaysTransport => 'Today\'s transport';

  @override
  String get homeToSchool => 'Home → School';

  @override
  String get schoolToHome => 'School → Home';

  @override
  String get cancelBus => 'Cancel bus';

  @override
  String get cancelBusFor => 'Cancel bus for';

  @override
  String get cancelToday => 'Today';

  @override
  String get cancelTomorrow => 'Tomorrow';

  @override
  String get cancelNextThreeDays => 'Next 3 days';

  @override
  String get cancelCustomDates => 'Custom dates';

  @override
  String get confirmCancelBus =>
      'Cancel bus transportation for the selected dates?';

  @override
  String get busCancelled => 'Bus cancelled';

  @override
  String get estimatedArrival => 'Estimated arrival';

  @override
  String estimatedArrivalInMinutes(int minutes) {
    return 'Estimated arrival in $minutes minutes';
  }

  @override
  String stopsRemaining(int count) {
    return '$count stops remaining';
  }

  @override
  String get currentStop => 'Current stop';

  @override
  String get yourStop => 'Your stop';

  @override
  String childrenAtStopCount(int count) {
    return '$count children are scheduled for this stop.';
  }

  @override
  String get notLiveTracking => 'Estimated arrival — not live location';

  @override
  String get arrivedAtStop => 'Arrived at stop';

  @override
  String get departStop => 'Depart stop';

  @override
  String get scanBoardingQr => 'Scan boarding QR';

  @override
  String get markAllArrived => 'Mark all arrived';

  @override
  String get confirmMarkAllArrived =>
      'Register all eligible children on this route as arrived?';

  @override
  String get nextStop => 'Next stop';

  @override
  String get noRoutesAssigned => 'No route assigned yet';

  @override
  String childrenExpected(int count) {
    return '$count children expected';
  }

  @override
  String arrivedByBusCount(int count) {
    return '$count arrived by bus';
  }

  @override
  String arrivedByCarCount(int count) {
    return '$count arrived by car';
  }

  @override
  String notArrivedCount(int count) {
    return '$count not arrived';
  }

  @override
  String get swipeRightArrived => 'Swipe right to mark arrived';

  @override
  String get swipeLeftNotPresent => 'Swipe left to mark not arrived';

  @override
  String get markArrived => 'Arrived';

  @override
  String get markNotPresent => 'Not arrived';

  @override
  String get arrivedByCar => 'Arrived by car';

  @override
  String get parentPickup => 'Parent pickup';

  @override
  String get authorizedPickup => 'Authorized pickup';

  @override
  String get confirmStatusChange => 'Update this child\'s status?';

  @override
  String get pickupPerson => 'Pickup person';

  @override
  String get newBus => 'New bus';

  @override
  String get newRoute => 'New route';

  @override
  String get registrationNumber => 'Registration number';

  @override
  String get capacity => 'Capacity';

  @override
  String get addStop => 'Add stop';

  @override
  String get assignChildren => 'Assign children';

  @override
  String get unassignedChildren => 'Not on this route';

  @override
  String get segmentMinutes => 'Travel time (minutes)';

  @override
  String get parentCar => 'Parent car';

  @override
  String get eventArrivedByCar => 'Arrived by car';

  @override
  String get eventParentPickup => 'Picked up by a parent';

  @override
  String get eventAuthorizedPickup => 'Picked up by an authorized person';

  @override
  String get eventMissedBus => 'Missed the bus';

  @override
  String get eventTransportCancelled => 'Bus cancelled';

  @override
  String get eventNotPresentAtClass => 'Not arrived yet';

  @override
  String get statusArrivedByCar => 'Arrived by car';

  @override
  String get statusParentPickup => 'Picked up';

  @override
  String get statusAuthorizedPickup => 'Picked up';

  @override
  String get statusMissedBus => 'Missed the bus';

  @override
  String get statusTransportCancelled => 'Bus cancelled';

  @override
  String get statusNotPresentAtClass => 'Not arrived yet';

  @override
  String get staffEventArrivedByCar => 'Arrived by car';

  @override
  String get staffEventParentPickup => 'Parent pickup';

  @override
  String get staffEventAuthorizedPickup => 'Authorized pickup';

  @override
  String get staffEventMissedBus => 'Missed bus';

  @override
  String get staffEventTransportCancelled => 'Transport cancelled';

  @override
  String get staffEventNotPresentAtClass => 'Not arrived';

  @override
  String get getReady => 'Get ready';

  @override
  String get confirm => 'Confirm';
}
