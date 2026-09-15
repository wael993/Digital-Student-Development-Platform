import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('ar'),
    Locale('en'),
  ];

  /// No description provided for @appName.
  ///
  /// In en, this message translates to:
  /// **'My Journey'**
  String get appName;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @email.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password;

  /// No description provided for @welcome.
  ///
  /// In en, this message translates to:
  /// **'Welcome'**
  String get welcome;

  /// No description provided for @attendance.
  ///
  /// In en, this message translates to:
  /// **'Attendance'**
  String get attendance;

  /// No description provided for @journey.
  ///
  /// In en, this message translates to:
  /// **'Journey'**
  String get journey;

  /// No description provided for @photos.
  ///
  /// In en, this message translates to:
  /// **'Photos'**
  String get photos;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @language.
  ///
  /// In en, this message translates to:
  /// **'Language'**
  String get language;

  /// No description provided for @english.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english;

  /// No description provided for @arabic.
  ///
  /// In en, this message translates to:
  /// **'العربية'**
  String get arabic;

  /// No description provided for @logOut.
  ///
  /// In en, this message translates to:
  /// **'Log out'**
  String get logOut;

  /// No description provided for @retry.
  ///
  /// In en, this message translates to:
  /// **'Retry'**
  String get retry;

  /// No description provided for @tryAgain.
  ///
  /// In en, this message translates to:
  /// **'Try Again'**
  String get tryAgain;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @save.
  ///
  /// In en, this message translates to:
  /// **'Save'**
  String get save;

  /// No description provided for @done.
  ///
  /// In en, this message translates to:
  /// **'Done'**
  String get done;

  /// No description provided for @search.
  ///
  /// In en, this message translates to:
  /// **'Search...'**
  String get search;

  /// No description provided for @forgotPassword.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgotPassword;

  /// No description provided for @passwordResetUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Password reset is not available yet.'**
  String get passwordResetUnavailable;

  /// No description provided for @emailRequired.
  ///
  /// In en, this message translates to:
  /// **'Email is required'**
  String get emailRequired;

  /// No description provided for @passwordRequired.
  ///
  /// In en, this message translates to:
  /// **'Password is required'**
  String get passwordRequired;

  /// No description provided for @nothingHereYet.
  ///
  /// In en, this message translates to:
  /// **'Nothing here yet'**
  String get nothingHereYet;

  /// No description provided for @myChildren.
  ///
  /// In en, this message translates to:
  /// **'My Children'**
  String get myChildren;

  /// No description provided for @myClasses.
  ///
  /// In en, this message translates to:
  /// **'My Classes'**
  String get myClasses;

  /// No description provided for @campuses.
  ///
  /// In en, this message translates to:
  /// **'Campuses'**
  String get campuses;

  /// No description provided for @students.
  ///
  /// In en, this message translates to:
  /// **'Students'**
  String get students;

  /// No description provided for @student.
  ///
  /// In en, this message translates to:
  /// **'Student'**
  String get student;

  /// No description provided for @studentJourney.
  ///
  /// In en, this message translates to:
  /// **'Student Journey'**
  String get studentJourney;

  /// No description provided for @today.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get today;

  /// No description provided for @yesterday.
  ///
  /// In en, this message translates to:
  /// **'Yesterday'**
  String get yesterday;

  /// No description provided for @child.
  ///
  /// In en, this message translates to:
  /// **'Child'**
  String get child;

  /// No description provided for @childDay.
  ///
  /// In en, this message translates to:
  /// **'{name}\'s Day'**
  String childDay(String name);

  /// No description provided for @childPhotos.
  ///
  /// In en, this message translates to:
  /// **'{name}\'s Photos'**
  String childPhotos(String name);

  /// No description provided for @goodMorning.
  ///
  /// In en, this message translates to:
  /// **'Good morning'**
  String get goodMorning;

  /// No description provided for @goodAfternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon'**
  String get goodAfternoon;

  /// No description provided for @goodEvening.
  ///
  /// In en, this message translates to:
  /// **'Good evening'**
  String get goodEvening;

  /// No description provided for @greeting.
  ///
  /// In en, this message translates to:
  /// **'{hello}, {name} 👋'**
  String greeting(String hello, String name);

  /// No description provided for @yourChildren.
  ///
  /// In en, this message translates to:
  /// **'Your children'**
  String get yourChildren;

  /// No description provided for @noChildrenAvailable.
  ///
  /// In en, this message translates to:
  /// **'No children available'**
  String get noChildrenAvailable;

  /// No description provided for @noChildrenHint.
  ///
  /// In en, this message translates to:
  /// **'Your school has not linked any active students to your account yet.'**
  String get noChildrenHint;

  /// No description provided for @loadingChildInfo.
  ///
  /// In en, this message translates to:
  /// **'Loading child information...'**
  String get loadingChildInfo;

  /// No description provided for @unableToLoadChildren.
  ///
  /// In en, this message translates to:
  /// **'Unable to load your children.'**
  String get unableToLoadChildren;

  /// No description provided for @unableToLoadChildInfo.
  ///
  /// In en, this message translates to:
  /// **'Unable to load child information.'**
  String get unableToLoadChildInfo;

  /// No description provided for @childUnavailable.
  ///
  /// In en, this message translates to:
  /// **'This child is no longer available.'**
  String get childUnavailable;

  /// No description provided for @currentStatus.
  ///
  /// In en, this message translates to:
  /// **'Current status'**
  String get currentStatus;

  /// No description provided for @lastUpdate.
  ///
  /// In en, this message translates to:
  /// **'Last update {time}'**
  String lastUpdate(String time);

  /// No description provided for @todaysAttendance.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Attendance'**
  String get todaysAttendance;

  /// No description provided for @present.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get present;

  /// No description provided for @notRecordedYet.
  ///
  /// In en, this message translates to:
  /// **'Not recorded yet'**
  String get notRecordedYet;

  /// No description provided for @recordedAt.
  ///
  /// In en, this message translates to:
  /// **'Recorded at {time}'**
  String recordedAt(String time);

  /// No description provided for @viewTodaysJourney.
  ///
  /// In en, this message translates to:
  /// **'View Today\'s Journey'**
  String get viewTodaysJourney;

  /// No description provided for @todaysJourney.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Journey'**
  String get todaysJourney;

  /// No description provided for @loadingTodaysJourney.
  ///
  /// In en, this message translates to:
  /// **'Loading today\'s journey...'**
  String get loadingTodaysJourney;

  /// No description provided for @unableToLoadJourney.
  ///
  /// In en, this message translates to:
  /// **'Unable to load today\'s journey.'**
  String get unableToLoadJourney;

  /// No description provided for @noActivityYet.
  ///
  /// In en, this message translates to:
  /// **'No activity has been recorded yet.'**
  String get noActivityYet;

  /// No description provided for @classLabel.
  ///
  /// In en, this message translates to:
  /// **'Class'**
  String get classLabel;

  /// No description provided for @studentNumber.
  ///
  /// In en, this message translates to:
  /// **'Student number'**
  String get studentNumber;

  /// No description provided for @status.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get status;

  /// No description provided for @statusActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get statusActive;

  /// No description provided for @statusInactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get statusInactive;

  /// No description provided for @statusTransferred.
  ///
  /// In en, this message translates to:
  /// **'Transferred'**
  String get statusTransferred;

  /// No description provided for @statusGraduated.
  ///
  /// In en, this message translates to:
  /// **'Graduated'**
  String get statusGraduated;

  /// No description provided for @currentlyStatus.
  ///
  /// In en, this message translates to:
  /// **'Currently {status}'**
  String currentlyStatus(String status);

  /// No description provided for @todaysTimeline.
  ///
  /// In en, this message translates to:
  /// **'Today\'s Timeline'**
  String get todaysTimeline;

  /// No description provided for @noJourneyEventsYet.
  ///
  /// In en, this message translates to:
  /// **'No journey events yet'**
  String get noJourneyEventsYet;

  /// No description provided for @eventAttendancePresent.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get eventAttendancePresent;

  /// No description provided for @eventBusBoarding.
  ///
  /// In en, this message translates to:
  /// **'On the bus'**
  String get eventBusBoarding;

  /// No description provided for @eventSchoolArrival.
  ///
  /// In en, this message translates to:
  /// **'Arrived at school'**
  String get eventSchoolArrival;

  /// No description provided for @eventClassStarted.
  ///
  /// In en, this message translates to:
  /// **'Class started'**
  String get eventClassStarted;

  /// No description provided for @eventBreakStarted.
  ///
  /// In en, this message translates to:
  /// **'Break time'**
  String get eventBreakStarted;

  /// No description provided for @eventActivityStarted.
  ///
  /// In en, this message translates to:
  /// **'Activity started'**
  String get eventActivityStarted;

  /// No description provided for @eventMeal.
  ///
  /// In en, this message translates to:
  /// **'Meal time'**
  String get eventMeal;

  /// No description provided for @eventSkillSession.
  ///
  /// In en, this message translates to:
  /// **'Learning activity'**
  String get eventSkillSession;

  /// No description provided for @eventBusDeparture.
  ///
  /// In en, this message translates to:
  /// **'Left school'**
  String get eventBusDeparture;

  /// No description provided for @eventHomeDropoff.
  ///
  /// In en, this message translates to:
  /// **'Arrived home'**
  String get eventHomeDropoff;

  /// No description provided for @statusAttendancePresent.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get statusAttendancePresent;

  /// No description provided for @statusBusBoarding.
  ///
  /// In en, this message translates to:
  /// **'On the bus'**
  String get statusBusBoarding;

  /// No description provided for @statusSchoolArrival.
  ///
  /// In en, this message translates to:
  /// **'Arrived at school'**
  String get statusSchoolArrival;

  /// No description provided for @statusClassStarted.
  ///
  /// In en, this message translates to:
  /// **'Currently in class'**
  String get statusClassStarted;

  /// No description provided for @statusBreakStarted.
  ///
  /// In en, this message translates to:
  /// **'Break time'**
  String get statusBreakStarted;

  /// No description provided for @statusActivityStarted.
  ///
  /// In en, this message translates to:
  /// **'Activity started'**
  String get statusActivityStarted;

  /// No description provided for @statusMeal.
  ///
  /// In en, this message translates to:
  /// **'Meal time'**
  String get statusMeal;

  /// No description provided for @statusSkillSession.
  ///
  /// In en, this message translates to:
  /// **'Learning activity'**
  String get statusSkillSession;

  /// No description provided for @statusBusDeparture.
  ///
  /// In en, this message translates to:
  /// **'Left school'**
  String get statusBusDeparture;

  /// No description provided for @statusHomeDropoff.
  ///
  /// In en, this message translates to:
  /// **'Arrived home'**
  String get statusHomeDropoff;

  /// No description provided for @statusJourneyNotStarted.
  ///
  /// In en, this message translates to:
  /// **'Today\'s journey hasn\'t started yet.'**
  String get statusJourneyNotStarted;

  /// No description provided for @staffEventAttendancePresent.
  ///
  /// In en, this message translates to:
  /// **'Present'**
  String get staffEventAttendancePresent;

  /// No description provided for @staffEventBusBoarding.
  ///
  /// In en, this message translates to:
  /// **'Bus boarding'**
  String get staffEventBusBoarding;

  /// No description provided for @staffEventSchoolArrival.
  ///
  /// In en, this message translates to:
  /// **'School arrival'**
  String get staffEventSchoolArrival;

  /// No description provided for @staffEventClassStarted.
  ///
  /// In en, this message translates to:
  /// **'Class started'**
  String get staffEventClassStarted;

  /// No description provided for @staffEventBreakStarted.
  ///
  /// In en, this message translates to:
  /// **'Break'**
  String get staffEventBreakStarted;

  /// No description provided for @staffEventActivityStarted.
  ///
  /// In en, this message translates to:
  /// **'Activity'**
  String get staffEventActivityStarted;

  /// No description provided for @staffEventMeal.
  ///
  /// In en, this message translates to:
  /// **'Meal'**
  String get staffEventMeal;

  /// No description provided for @staffEventSkillSession.
  ///
  /// In en, this message translates to:
  /// **'Skill session'**
  String get staffEventSkillSession;

  /// No description provided for @staffEventBusDeparture.
  ///
  /// In en, this message translates to:
  /// **'Bus departure'**
  String get staffEventBusDeparture;

  /// No description provided for @staffEventHomeDropoff.
  ///
  /// In en, this message translates to:
  /// **'Home drop-off'**
  String get staffEventHomeDropoff;

  /// No description provided for @staffStatePresent.
  ///
  /// In en, this message translates to:
  /// **'present'**
  String get staffStatePresent;

  /// No description provided for @staffStateOnTheBus.
  ///
  /// In en, this message translates to:
  /// **'on the bus'**
  String get staffStateOnTheBus;

  /// No description provided for @staffStateAtSchool.
  ///
  /// In en, this message translates to:
  /// **'at school'**
  String get staffStateAtSchool;

  /// No description provided for @staffStateInClass.
  ///
  /// In en, this message translates to:
  /// **'in class'**
  String get staffStateInClass;

  /// No description provided for @staffStateOnBreak.
  ///
  /// In en, this message translates to:
  /// **'on break'**
  String get staffStateOnBreak;

  /// No description provided for @staffStateInActivity.
  ///
  /// In en, this message translates to:
  /// **'in an activity'**
  String get staffStateInActivity;

  /// No description provided for @staffStateAtMeal.
  ///
  /// In en, this message translates to:
  /// **'at meal'**
  String get staffStateAtMeal;

  /// No description provided for @staffStateInSkillSession.
  ///
  /// In en, this message translates to:
  /// **'in a skill session'**
  String get staffStateInSkillSession;

  /// No description provided for @staffStateOnTheWayHome.
  ///
  /// In en, this message translates to:
  /// **'on the way home'**
  String get staffStateOnTheWayHome;

  /// No description provided for @staffStateHome.
  ///
  /// In en, this message translates to:
  /// **'home'**
  String get staffStateHome;

  /// No description provided for @staffStateNoEvents.
  ///
  /// In en, this message translates to:
  /// **'no events yet'**
  String get staffStateNoEvents;

  /// No description provided for @scanStudentQr.
  ///
  /// In en, this message translates to:
  /// **'Scan Student QR'**
  String get scanStudentQr;

  /// No description provided for @noAttendanceYet.
  ///
  /// In en, this message translates to:
  /// **'No attendance recorded yet'**
  String get noAttendanceYet;

  /// No description provided for @attendanceRecorded.
  ///
  /// In en, this message translates to:
  /// **'Attendance Recorded'**
  String get attendanceRecorded;

  /// No description provided for @alreadyRecorded.
  ///
  /// In en, this message translates to:
  /// **'Already Recorded'**
  String get alreadyRecorded;

  /// No description provided for @alreadyMarkedPresent.
  ///
  /// In en, this message translates to:
  /// **'was already marked present today.'**
  String get alreadyMarkedPresent;

  /// No description provided for @scanNextStudent.
  ///
  /// In en, this message translates to:
  /// **'Scan Next Student'**
  String get scanNextStudent;

  /// No description provided for @cameraPermissionNeeded.
  ///
  /// In en, this message translates to:
  /// **'Camera Permission Needed'**
  String get cameraPermissionNeeded;

  /// No description provided for @cameraPermissionScan.
  ///
  /// In en, this message translates to:
  /// **'Camera permission is required to scan student QR codes.'**
  String get cameraPermissionScan;

  /// No description provided for @qrNotRecognized.
  ///
  /// In en, this message translates to:
  /// **'QR Code Not Recognized'**
  String get qrNotRecognized;

  /// No description provided for @noActiveStudent.
  ///
  /// In en, this message translates to:
  /// **'No active student was found.'**
  String get noActiveStudent;

  /// No description provided for @attendanceForbidden.
  ///
  /// In en, this message translates to:
  /// **'You do not have permission to record attendance.'**
  String get attendanceForbidden;

  /// No description provided for @attendanceFailed.
  ///
  /// In en, this message translates to:
  /// **'Unable to record attendance. Try again.'**
  String get attendanceFailed;

  /// No description provided for @studentPhoto.
  ///
  /// In en, this message translates to:
  /// **'Student Photo'**
  String get studentPhoto;

  /// No description provided for @takePhoto.
  ///
  /// In en, this message translates to:
  /// **'Take Photo'**
  String get takePhoto;

  /// No description provided for @chooseFromDevice.
  ///
  /// In en, this message translates to:
  /// **'Choose from device'**
  String get chooseFromDevice;

  /// No description provided for @retake.
  ///
  /// In en, this message translates to:
  /// **'Retake'**
  String get retake;

  /// No description provided for @usePhoto.
  ///
  /// In en, this message translates to:
  /// **'Use Photo'**
  String get usePhoto;

  /// No description provided for @photoUploaded.
  ///
  /// In en, this message translates to:
  /// **'Photo uploaded'**
  String get photoUploaded;

  /// No description provided for @uploadFailed.
  ///
  /// In en, this message translates to:
  /// **'Upload failed'**
  String get uploadFailed;

  /// No description provided for @uploadingPhoto.
  ///
  /// In en, this message translates to:
  /// **'Uploading photo...'**
  String get uploadingPhoto;

  /// No description provided for @cameraAccessPhoto.
  ///
  /// In en, this message translates to:
  /// **'Camera access is required to take a photo.'**
  String get cameraAccessPhoto;

  /// No description provided for @openSystemSettings.
  ///
  /// In en, this message translates to:
  /// **'Open Settings'**
  String get openSystemSettings;

  /// No description provided for @photo.
  ///
  /// In en, this message translates to:
  /// **'Photo'**
  String get photo;

  /// No description provided for @photoUnavailable.
  ///
  /// In en, this message translates to:
  /// **'Photo is unavailable.'**
  String get photoUnavailable;

  /// No description provided for @noPhotosYet.
  ///
  /// In en, this message translates to:
  /// **'No photos yet'**
  String get noPhotosYet;

  /// No description provided for @viewAll.
  ///
  /// In en, this message translates to:
  /// **'View all'**
  String get viewAll;

  /// No description provided for @photosAccessDenied.
  ///
  /// In en, this message translates to:
  /// **'You do not have access to these photos.'**
  String get photosAccessDenied;

  /// No description provided for @unableToLoadPhotos.
  ///
  /// In en, this message translates to:
  /// **'Unable to load photos.'**
  String get unableToLoadPhotos;

  /// No description provided for @percentValue.
  ///
  /// In en, this message translates to:
  /// **'{percent}%'**
  String percentValue(int percent);

  /// No description provided for @noNotificationsYet.
  ///
  /// In en, this message translates to:
  /// **'No notifications yet'**
  String get noNotificationsYet;

  /// No description provided for @unableToLoadNotifications.
  ///
  /// In en, this message translates to:
  /// **'Unable to load notifications.'**
  String get unableToLoadNotifications;

  /// No description provided for @unableToLoadNotificationSettings.
  ///
  /// In en, this message translates to:
  /// **'Unable to load notification settings.'**
  String get unableToLoadNotificationSettings;

  /// No description provided for @notificationsDisabledHint.
  ///
  /// In en, this message translates to:
  /// **'Notifications are turned off in system settings. Enable them to receive push alerts.'**
  String get notificationsDisabledHint;

  /// No description provided for @journeyUpdates.
  ///
  /// In en, this message translates to:
  /// **'Journey Updates'**
  String get journeyUpdates;

  /// No description provided for @prefChildArrivedNursery.
  ///
  /// In en, this message translates to:
  /// **'Child arrived at nursery'**
  String get prefChildArrivedNursery;

  /// No description provided for @prefChildLeftNursery.
  ///
  /// In en, this message translates to:
  /// **'Child left nursery'**
  String get prefChildLeftNursery;

  /// No description provided for @prefChildArrivedHome.
  ///
  /// In en, this message translates to:
  /// **'Child arrived home'**
  String get prefChildArrivedHome;

  /// No description provided for @prefNewPhotos.
  ///
  /// In en, this message translates to:
  /// **'New photos'**
  String get prefNewPhotos;

  /// No description provided for @notificationUpdate.
  ///
  /// In en, this message translates to:
  /// **'Update'**
  String get notificationUpdate;

  /// No description provided for @tapToViewJourney.
  ///
  /// In en, this message translates to:
  /// **'Tap to view today\'s journey'**
  String get tapToViewJourney;

  /// No description provided for @notifStudentArrival.
  ///
  /// In en, this message translates to:
  /// **'Arrived at school'**
  String get notifStudentArrival;

  /// No description provided for @notifStudentDeparture.
  ///
  /// In en, this message translates to:
  /// **'Left school'**
  String get notifStudentDeparture;

  /// No description provided for @notifStudentHomeDropoff.
  ///
  /// In en, this message translates to:
  /// **'Arrived home'**
  String get notifStudentHomeDropoff;

  /// No description provided for @notifMediaAvailable.
  ///
  /// In en, this message translates to:
  /// **'New photos'**
  String get notifMediaAvailable;

  /// No description provided for @notifJourneyUpdate.
  ///
  /// In en, this message translates to:
  /// **'Journey update'**
  String get notifJourneyUpdate;

  /// No description provided for @newStudent.
  ///
  /// In en, this message translates to:
  /// **'New student'**
  String get newStudent;

  /// No description provided for @firstName.
  ///
  /// In en, this message translates to:
  /// **'First name'**
  String get firstName;

  /// No description provided for @lastName.
  ///
  /// In en, this message translates to:
  /// **'Last name'**
  String get lastName;

  /// No description provided for @firstNameRequired.
  ///
  /// In en, this message translates to:
  /// **'First name is required'**
  String get firstNameRequired;

  /// No description provided for @lastNameRequired.
  ///
  /// In en, this message translates to:
  /// **'Last name is required'**
  String get lastNameRequired;

  /// No description provided for @studentNumberRequired.
  ///
  /// In en, this message translates to:
  /// **'Student number is required'**
  String get studentNumberRequired;

  /// No description provided for @gender.
  ///
  /// In en, this message translates to:
  /// **'Gender'**
  String get gender;

  /// No description provided for @genderFemale.
  ///
  /// In en, this message translates to:
  /// **'Female'**
  String get genderFemale;

  /// No description provided for @genderMale.
  ///
  /// In en, this message translates to:
  /// **'Male'**
  String get genderMale;

  /// No description provided for @genderOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get genderOther;

  /// No description provided for @dateOfBirth.
  ///
  /// In en, this message translates to:
  /// **'Date of birth'**
  String get dateOfBirth;

  /// No description provided for @dateOfBirthRequired.
  ///
  /// In en, this message translates to:
  /// **'Date of birth is required'**
  String get dateOfBirthRequired;

  /// No description provided for @noStudentsYet.
  ///
  /// In en, this message translates to:
  /// **'No students yet'**
  String get noStudentsYet;

  /// No description provided for @attendanceQr.
  ///
  /// In en, this message translates to:
  /// **'Attendance QR'**
  String get attendanceQr;

  /// No description provided for @guardians.
  ///
  /// In en, this message translates to:
  /// **'Guardians'**
  String get guardians;

  /// No description provided for @addGuardian.
  ///
  /// In en, this message translates to:
  /// **'Add Guardian'**
  String get addGuardian;

  /// No description provided for @addGuardianTitle.
  ///
  /// In en, this message translates to:
  /// **'Add guardian'**
  String get addGuardianTitle;

  /// No description provided for @noGuardiansYet.
  ///
  /// In en, this message translates to:
  /// **'No guardians yet'**
  String get noGuardiansYet;

  /// No description provided for @primaryGuardian.
  ///
  /// In en, this message translates to:
  /// **'Primary guardian'**
  String get primaryGuardian;

  /// No description provided for @passwordNewAccount.
  ///
  /// In en, this message translates to:
  /// **'Password (required for a new account)'**
  String get passwordNewAccount;

  /// No description provided for @relationship.
  ///
  /// In en, this message translates to:
  /// **'Relationship'**
  String get relationship;

  /// No description provided for @relationshipMother.
  ///
  /// In en, this message translates to:
  /// **'Mother'**
  String get relationshipMother;

  /// No description provided for @relationshipFather.
  ///
  /// In en, this message translates to:
  /// **'Father'**
  String get relationshipFather;

  /// No description provided for @relationshipLegalGuardian.
  ///
  /// In en, this message translates to:
  /// **'Legal guardian'**
  String get relationshipLegalGuardian;

  /// No description provided for @relationshipOther.
  ///
  /// In en, this message translates to:
  /// **'Other'**
  String get relationshipOther;

  /// No description provided for @name.
  ///
  /// In en, this message translates to:
  /// **'Name'**
  String get name;

  /// No description provided for @nameRequired.
  ///
  /// In en, this message translates to:
  /// **'Name is required'**
  String get nameRequired;

  /// No description provided for @newClassroom.
  ///
  /// In en, this message translates to:
  /// **'New classroom'**
  String get newClassroom;

  /// No description provided for @newCampus.
  ///
  /// In en, this message translates to:
  /// **'New campus'**
  String get newCampus;

  /// No description provided for @campusName.
  ///
  /// In en, this message translates to:
  /// **'Campus name'**
  String get campusName;

  /// No description provided for @noClassroomsYet.
  ///
  /// In en, this message translates to:
  /// **'No classrooms yet'**
  String get noClassroomsYet;

  /// No description provided for @noCampusesYet.
  ///
  /// In en, this message translates to:
  /// **'No campuses yet'**
  String get noCampusesYet;

  /// No description provided for @level.
  ///
  /// In en, this message translates to:
  /// **'Level'**
  String get level;

  /// No description provided for @levelNursery.
  ///
  /// In en, this message translates to:
  /// **'Nursery'**
  String get levelNursery;

  /// No description provided for @levelKindergarten.
  ///
  /// In en, this message translates to:
  /// **'Kindergarten'**
  String get levelKindergarten;

  /// No description provided for @levelPrimary.
  ///
  /// In en, this message translates to:
  /// **'Primary'**
  String get levelPrimary;

  /// No description provided for @levelMiddleSchool.
  ///
  /// In en, this message translates to:
  /// **'Middle school'**
  String get levelMiddleSchool;

  /// No description provided for @levelHighSchool.
  ///
  /// In en, this message translates to:
  /// **'High school'**
  String get levelHighSchool;

  /// No description provided for @errorInvalidCredentials.
  ///
  /// In en, this message translates to:
  /// **'Invalid email or password'**
  String get errorInvalidCredentials;

  /// No description provided for @errorAccountInactive.
  ///
  /// In en, this message translates to:
  /// **'Account inactive'**
  String get errorAccountInactive;

  /// No description provided for @errorUnauthorized.
  ///
  /// In en, this message translates to:
  /// **'Authentication required'**
  String get errorUnauthorized;

  /// No description provided for @errorForbidden.
  ///
  /// In en, this message translates to:
  /// **'You do not have permission to perform this action'**
  String get errorForbidden;

  /// No description provided for @errorNotFound.
  ///
  /// In en, this message translates to:
  /// **'Not found'**
  String get errorNotFound;

  /// No description provided for @errorValidation.
  ///
  /// In en, this message translates to:
  /// **'Please check the form and try again.'**
  String get errorValidation;

  /// No description provided for @errorLoginFailed.
  ///
  /// In en, this message translates to:
  /// **'Unable to log in. Try again.'**
  String get errorLoginFailed;

  /// No description provided for @errorRequestFailed.
  ///
  /// In en, this message translates to:
  /// **'Request failed'**
  String get errorRequestFailed;

  /// No description provided for @errorInternal.
  ///
  /// In en, this message translates to:
  /// **'Something went wrong. Try again.'**
  String get errorInternal;

  /// No description provided for @errorNetwork.
  ///
  /// In en, this message translates to:
  /// **'Unable to connect. Try again.'**
  String get errorNetwork;

  /// No description provided for @errorStudentInactive.
  ///
  /// In en, this message translates to:
  /// **'Student is not active'**
  String get errorStudentInactive;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['ar', 'en'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'ar':
      return AppLocalizationsAr();
    case 'en':
      return AppLocalizationsEn();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
