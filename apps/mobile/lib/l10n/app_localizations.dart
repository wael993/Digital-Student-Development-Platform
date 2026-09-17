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

  /// No description provided for @platformDashboard.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get platformDashboard;

  /// No description provided for @platformOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Organizations'**
  String get platformOrganizations;

  /// No description provided for @platformInvitations.
  ///
  /// In en, this message translates to:
  /// **'Invitations'**
  String get platformInvitations;

  /// No description provided for @platformAccount.
  ///
  /// In en, this message translates to:
  /// **'Account'**
  String get platformAccount;

  /// No description provided for @platformDashboardEmpty.
  ///
  /// In en, this message translates to:
  /// **'No platform activity yet'**
  String get platformDashboardEmpty;

  /// No description provided for @platformTotalOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Total organizations'**
  String get platformTotalOrganizations;

  /// No description provided for @platformActiveOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Active organizations'**
  String get platformActiveOrganizations;

  /// No description provided for @platformTrialOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Trial organizations'**
  String get platformTrialOrganizations;

  /// No description provided for @platformSuspendedOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Suspended organizations'**
  String get platformSuspendedOrganizations;

  /// No description provided for @platformInactiveOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Inactive organizations'**
  String get platformInactiveOrganizations;

  /// No description provided for @platformCancelledOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Cancelled organizations'**
  String get platformCancelledOrganizations;

  /// No description provided for @platformTotalStudents.
  ///
  /// In en, this message translates to:
  /// **'Total students'**
  String get platformTotalStudents;

  /// No description provided for @platformTotalTeachers.
  ///
  /// In en, this message translates to:
  /// **'Total teachers'**
  String get platformTotalTeachers;

  /// No description provided for @platformTotalBuses.
  ///
  /// In en, this message translates to:
  /// **'Total buses'**
  String get platformTotalBuses;

  /// No description provided for @searchOrganizations.
  ///
  /// In en, this message translates to:
  /// **'Search organizations...'**
  String get searchOrganizations;

  /// No description provided for @filterAll.
  ///
  /// In en, this message translates to:
  /// **'All'**
  String get filterAll;

  /// No description provided for @noOrganizationsYet.
  ///
  /// In en, this message translates to:
  /// **'No organizations yet'**
  String get noOrganizationsYet;

  /// No description provided for @organizationDetails.
  ///
  /// In en, this message translates to:
  /// **'Organization'**
  String get organizationDetails;

  /// No description provided for @organizationName.
  ///
  /// In en, this message translates to:
  /// **'Organization name'**
  String get organizationName;

  /// No description provided for @organizationSlug.
  ///
  /// In en, this message translates to:
  /// **'Slug'**
  String get organizationSlug;

  /// No description provided for @organizationCountry.
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get organizationCountry;

  /// No description provided for @organizationTimezone.
  ///
  /// In en, this message translates to:
  /// **'Timezone'**
  String get organizationTimezone;

  /// No description provided for @organizationDefaultLanguage.
  ///
  /// In en, this message translates to:
  /// **'Default language'**
  String get organizationDefaultLanguage;

  /// No description provided for @organizationContactEmail.
  ///
  /// In en, this message translates to:
  /// **'Contact email'**
  String get organizationContactEmail;

  /// No description provided for @organizationContactPhone.
  ///
  /// In en, this message translates to:
  /// **'Contact phone'**
  String get organizationContactPhone;

  /// No description provided for @organizationContactPhoneOptional.
  ///
  /// In en, this message translates to:
  /// **'Contact phone (optional)'**
  String get organizationContactPhoneOptional;

  /// No description provided for @organizationAddressOptional.
  ///
  /// In en, this message translates to:
  /// **'Address (optional)'**
  String get organizationAddressOptional;

  /// No description provided for @organizationWebsiteOptional.
  ///
  /// In en, this message translates to:
  /// **'Website (optional)'**
  String get organizationWebsiteOptional;

  /// No description provided for @organizationLogoOptional.
  ///
  /// In en, this message translates to:
  /// **'Logo URL (optional)'**
  String get organizationLogoOptional;

  /// No description provided for @organizationStatus.
  ///
  /// In en, this message translates to:
  /// **'Status'**
  String get organizationStatus;

  /// No description provided for @organizationPlan.
  ///
  /// In en, this message translates to:
  /// **'Plan'**
  String get organizationPlan;

  /// No description provided for @organizationUsage.
  ///
  /// In en, this message translates to:
  /// **'Usage'**
  String get organizationUsage;

  /// No description provided for @organizationUsageSummary.
  ///
  /// In en, this message translates to:
  /// **'{campuses} campuses · {students} students · {users} users'**
  String organizationUsageSummary(int campuses, int students, int users);

  /// No description provided for @usageCampuses.
  ///
  /// In en, this message translates to:
  /// **'Campuses'**
  String get usageCampuses;

  /// No description provided for @usageStudents.
  ///
  /// In en, this message translates to:
  /// **'Students'**
  String get usageStudents;

  /// No description provided for @usageUsers.
  ///
  /// In en, this message translates to:
  /// **'Users'**
  String get usageUsers;

  /// No description provided for @usageClassrooms.
  ///
  /// In en, this message translates to:
  /// **'Classrooms'**
  String get usageClassrooms;

  /// No description provided for @usageBuses.
  ///
  /// In en, this message translates to:
  /// **'Buses'**
  String get usageBuses;

  /// No description provided for @createdAt.
  ///
  /// In en, this message translates to:
  /// **'Created'**
  String get createdAt;

  /// No description provided for @createOrganization.
  ///
  /// In en, this message translates to:
  /// **'Create organization'**
  String get createOrganization;

  /// No description provided for @activateOrganization.
  ///
  /// In en, this message translates to:
  /// **'Activate'**
  String get activateOrganization;

  /// No description provided for @suspendOrganization.
  ///
  /// In en, this message translates to:
  /// **'Suspend'**
  String get suspendOrganization;

  /// No description provided for @deactivateOrganization.
  ///
  /// In en, this message translates to:
  /// **'Deactivate'**
  String get deactivateOrganization;

  /// No description provided for @confirmSuspendOrganization.
  ///
  /// In en, this message translates to:
  /// **'Suspend this organization? Tenant users will lose access until it is activated again.'**
  String get confirmSuspendOrganization;

  /// No description provided for @confirmDeactivateOrganization.
  ///
  /// In en, this message translates to:
  /// **'Deactivate this organization? This stops normal tenant access.'**
  String get confirmDeactivateOrganization;

  /// No description provided for @organizationCreated.
  ///
  /// In en, this message translates to:
  /// **'Organization created successfully'**
  String get organizationCreated;

  /// No description provided for @organizationCreatedWithInvitation.
  ///
  /// In en, this message translates to:
  /// **'Organization created and invitation sent'**
  String get organizationCreatedWithInvitation;

  /// No description provided for @organizationUpdated.
  ///
  /// In en, this message translates to:
  /// **'Organization updated'**
  String get organizationUpdated;

  /// No description provided for @optionalAdminInvitation.
  ///
  /// In en, this message translates to:
  /// **'Initial admin invitation (optional)'**
  String get optionalAdminInvitation;

  /// No description provided for @adminFirstName.
  ///
  /// In en, this message translates to:
  /// **'Admin first name'**
  String get adminFirstName;

  /// No description provided for @adminLastName.
  ///
  /// In en, this message translates to:
  /// **'Admin last name'**
  String get adminLastName;

  /// No description provided for @adminEmail.
  ///
  /// In en, this message translates to:
  /// **'Admin email'**
  String get adminEmail;

  /// No description provided for @adminFirstNameOptional.
  ///
  /// In en, this message translates to:
  /// **'Admin first name (optional)'**
  String get adminFirstNameOptional;

  /// No description provided for @adminLastNameOptional.
  ///
  /// In en, this message translates to:
  /// **'Admin last name (optional)'**
  String get adminLastNameOptional;

  /// No description provided for @adminEmailOptional.
  ///
  /// In en, this message translates to:
  /// **'Admin email (optional)'**
  String get adminEmailOptional;

  /// No description provided for @adminInviteIncomplete.
  ///
  /// In en, this message translates to:
  /// **'Provide admin first name, last name, and email together'**
  String get adminInviteIncomplete;

  /// No description provided for @inviteAdminHint.
  ///
  /// In en, this message translates to:
  /// **'Invite the first tenant admin for an existing organization.'**
  String get inviteAdminHint;

  /// No description provided for @sendInvitation.
  ///
  /// In en, this message translates to:
  /// **'Send invitation'**
  String get sendInvitation;

  /// No description provided for @invitationCreated.
  ///
  /// In en, this message translates to:
  /// **'Invitation created successfully'**
  String get invitationCreated;

  /// No description provided for @role.
  ///
  /// In en, this message translates to:
  /// **'Role'**
  String get role;

  /// No description provided for @rolePlatformAdmin.
  ///
  /// In en, this message translates to:
  /// **'Platform admin'**
  String get rolePlatformAdmin;

  /// No description provided for @accountStatus.
  ///
  /// In en, this message translates to:
  /// **'Account status'**
  String get accountStatus;

  /// No description provided for @orgStatusTrial.
  ///
  /// In en, this message translates to:
  /// **'Trial'**
  String get orgStatusTrial;

  /// No description provided for @orgStatusActive.
  ///
  /// In en, this message translates to:
  /// **'Active'**
  String get orgStatusActive;

  /// No description provided for @orgStatusSuspended.
  ///
  /// In en, this message translates to:
  /// **'Suspended'**
  String get orgStatusSuspended;

  /// No description provided for @orgStatusInactive.
  ///
  /// In en, this message translates to:
  /// **'Inactive'**
  String get orgStatusInactive;

  /// No description provided for @orgStatusCancelled.
  ///
  /// In en, this message translates to:
  /// **'Cancelled'**
  String get orgStatusCancelled;

  /// No description provided for @planStarter.
  ///
  /// In en, this message translates to:
  /// **'Starter'**
  String get planStarter;

  /// No description provided for @planProfessional.
  ///
  /// In en, this message translates to:
  /// **'Professional'**
  String get planProfessional;

  /// No description provided for @planEnterprise.
  ///
  /// In en, this message translates to:
  /// **'Enterprise'**
  String get planEnterprise;

  /// No description provided for @fieldRequired.
  ///
  /// In en, this message translates to:
  /// **'This field is required'**
  String get fieldRequired;

  /// No description provided for @invalidEmail.
  ///
  /// In en, this message translates to:
  /// **'Enter a valid email'**
  String get invalidEmail;

  /// No description provided for @errorOrganizationNotFound.
  ///
  /// In en, this message translates to:
  /// **'Organization not found'**
  String get errorOrganizationNotFound;

  /// No description provided for @errorOrganizationSuspended.
  ///
  /// In en, this message translates to:
  /// **'Organization is suspended'**
  String get errorOrganizationSuspended;

  /// No description provided for @errorOrganizationInactive.
  ///
  /// In en, this message translates to:
  /// **'Organization is inactive'**
  String get errorOrganizationInactive;

  /// No description provided for @errorUserNotFound.
  ///
  /// In en, this message translates to:
  /// **'User not found'**
  String get errorUserNotFound;

  /// No description provided for @errorUserAlreadyExists.
  ///
  /// In en, this message translates to:
  /// **'A user with this email already exists'**
  String get errorUserAlreadyExists;

  /// No description provided for @errorUserRoleNotAllowed.
  ///
  /// In en, this message translates to:
  /// **'This role is not allowed'**
  String get errorUserRoleNotAllowed;

  /// No description provided for @errorInvitationExpired.
  ///
  /// In en, this message translates to:
  /// **'This invitation has expired'**
  String get errorInvitationExpired;

  /// No description provided for @errorInvitationAlreadyUsed.
  ///
  /// In en, this message translates to:
  /// **'This invitation was already used'**
  String get errorInvitationAlreadyUsed;

  /// No description provided for @errorInvitationRevoked.
  ///
  /// In en, this message translates to:
  /// **'This invitation was revoked'**
  String get errorInvitationRevoked;

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

  /// No description provided for @transport.
  ///
  /// In en, this message translates to:
  /// **'Transport'**
  String get transport;

  /// No description provided for @buses.
  ///
  /// In en, this message translates to:
  /// **'Buses'**
  String get buses;

  /// No description provided for @routes.
  ///
  /// In en, this message translates to:
  /// **'Routes'**
  String get routes;

  /// No description provided for @myRoute.
  ///
  /// In en, this message translates to:
  /// **'My Route'**
  String get myRoute;

  /// No description provided for @morningArrival.
  ///
  /// In en, this message translates to:
  /// **'Morning Arrival'**
  String get morningArrival;

  /// No description provided for @todaysTransport.
  ///
  /// In en, this message translates to:
  /// **'Today\'s transport'**
  String get todaysTransport;

  /// No description provided for @homeToSchool.
  ///
  /// In en, this message translates to:
  /// **'Home → School'**
  String get homeToSchool;

  /// No description provided for @schoolToHome.
  ///
  /// In en, this message translates to:
  /// **'School → Home'**
  String get schoolToHome;

  /// No description provided for @cancelBus.
  ///
  /// In en, this message translates to:
  /// **'Cancel bus'**
  String get cancelBus;

  /// No description provided for @cancelBusFor.
  ///
  /// In en, this message translates to:
  /// **'Cancel bus for'**
  String get cancelBusFor;

  /// No description provided for @cancelToday.
  ///
  /// In en, this message translates to:
  /// **'Today'**
  String get cancelToday;

  /// No description provided for @cancelTomorrow.
  ///
  /// In en, this message translates to:
  /// **'Tomorrow'**
  String get cancelTomorrow;

  /// No description provided for @cancelNextThreeDays.
  ///
  /// In en, this message translates to:
  /// **'Next 3 days'**
  String get cancelNextThreeDays;

  /// No description provided for @cancelCustomDates.
  ///
  /// In en, this message translates to:
  /// **'Custom dates'**
  String get cancelCustomDates;

  /// No description provided for @confirmCancelBus.
  ///
  /// In en, this message translates to:
  /// **'Cancel bus transportation for the selected dates?'**
  String get confirmCancelBus;

  /// No description provided for @busCancelled.
  ///
  /// In en, this message translates to:
  /// **'Bus cancelled'**
  String get busCancelled;

  /// No description provided for @estimatedArrival.
  ///
  /// In en, this message translates to:
  /// **'Estimated arrival'**
  String get estimatedArrival;

  /// No description provided for @estimatedArrivalInMinutes.
  ///
  /// In en, this message translates to:
  /// **'Estimated arrival in {minutes} minutes'**
  String estimatedArrivalInMinutes(int minutes);

  /// No description provided for @stopsRemaining.
  ///
  /// In en, this message translates to:
  /// **'{count} stops remaining'**
  String stopsRemaining(int count);

  /// No description provided for @currentStop.
  ///
  /// In en, this message translates to:
  /// **'Current stop'**
  String get currentStop;

  /// No description provided for @yourStop.
  ///
  /// In en, this message translates to:
  /// **'Your stop'**
  String get yourStop;

  /// No description provided for @childrenAtStopCount.
  ///
  /// In en, this message translates to:
  /// **'{count} children are scheduled for this stop.'**
  String childrenAtStopCount(int count);

  /// No description provided for @notLiveTracking.
  ///
  /// In en, this message translates to:
  /// **'Estimated arrival — not live location'**
  String get notLiveTracking;

  /// No description provided for @arrivedAtStop.
  ///
  /// In en, this message translates to:
  /// **'Arrived at stop'**
  String get arrivedAtStop;

  /// No description provided for @departStop.
  ///
  /// In en, this message translates to:
  /// **'Depart stop'**
  String get departStop;

  /// No description provided for @scanBoardingQr.
  ///
  /// In en, this message translates to:
  /// **'Scan boarding QR'**
  String get scanBoardingQr;

  /// No description provided for @markAllArrived.
  ///
  /// In en, this message translates to:
  /// **'Mark all arrived'**
  String get markAllArrived;

  /// No description provided for @confirmMarkAllArrived.
  ///
  /// In en, this message translates to:
  /// **'Register all eligible children on this route as arrived?'**
  String get confirmMarkAllArrived;

  /// No description provided for @nextStop.
  ///
  /// In en, this message translates to:
  /// **'Next stop'**
  String get nextStop;

  /// No description provided for @noRoutesAssigned.
  ///
  /// In en, this message translates to:
  /// **'No route assigned yet'**
  String get noRoutesAssigned;

  /// No description provided for @childrenExpected.
  ///
  /// In en, this message translates to:
  /// **'{count} children expected'**
  String childrenExpected(int count);

  /// No description provided for @arrivedByBusCount.
  ///
  /// In en, this message translates to:
  /// **'{count} arrived by bus'**
  String arrivedByBusCount(int count);

  /// No description provided for @arrivedByCarCount.
  ///
  /// In en, this message translates to:
  /// **'{count} arrived by car'**
  String arrivedByCarCount(int count);

  /// No description provided for @notArrivedCount.
  ///
  /// In en, this message translates to:
  /// **'{count} not arrived'**
  String notArrivedCount(int count);

  /// No description provided for @swipeRightArrived.
  ///
  /// In en, this message translates to:
  /// **'Swipe right to mark arrived'**
  String get swipeRightArrived;

  /// No description provided for @swipeLeftNotPresent.
  ///
  /// In en, this message translates to:
  /// **'Swipe left to mark not arrived'**
  String get swipeLeftNotPresent;

  /// No description provided for @markArrived.
  ///
  /// In en, this message translates to:
  /// **'Arrived'**
  String get markArrived;

  /// No description provided for @markNotPresent.
  ///
  /// In en, this message translates to:
  /// **'Not arrived'**
  String get markNotPresent;

  /// No description provided for @arrivedByCar.
  ///
  /// In en, this message translates to:
  /// **'Arrived by car'**
  String get arrivedByCar;

  /// No description provided for @parentPickup.
  ///
  /// In en, this message translates to:
  /// **'Parent pickup'**
  String get parentPickup;

  /// No description provided for @authorizedPickup.
  ///
  /// In en, this message translates to:
  /// **'Authorized pickup'**
  String get authorizedPickup;

  /// No description provided for @confirmStatusChange.
  ///
  /// In en, this message translates to:
  /// **'Update this child\'s status?'**
  String get confirmStatusChange;

  /// No description provided for @pickupPerson.
  ///
  /// In en, this message translates to:
  /// **'Pickup person'**
  String get pickupPerson;

  /// No description provided for @newBus.
  ///
  /// In en, this message translates to:
  /// **'New bus'**
  String get newBus;

  /// No description provided for @newRoute.
  ///
  /// In en, this message translates to:
  /// **'New route'**
  String get newRoute;

  /// No description provided for @registrationNumber.
  ///
  /// In en, this message translates to:
  /// **'Registration number'**
  String get registrationNumber;

  /// No description provided for @capacity.
  ///
  /// In en, this message translates to:
  /// **'Capacity'**
  String get capacity;

  /// No description provided for @addStop.
  ///
  /// In en, this message translates to:
  /// **'Add stop'**
  String get addStop;

  /// No description provided for @assignChildren.
  ///
  /// In en, this message translates to:
  /// **'Assign children'**
  String get assignChildren;

  /// No description provided for @unassignedChildren.
  ///
  /// In en, this message translates to:
  /// **'Not on this route'**
  String get unassignedChildren;

  /// No description provided for @segmentMinutes.
  ///
  /// In en, this message translates to:
  /// **'Travel time (minutes)'**
  String get segmentMinutes;

  /// No description provided for @parentCar.
  ///
  /// In en, this message translates to:
  /// **'Parent car'**
  String get parentCar;

  /// No description provided for @eventArrivedByCar.
  ///
  /// In en, this message translates to:
  /// **'Arrived by car'**
  String get eventArrivedByCar;

  /// No description provided for @eventParentPickup.
  ///
  /// In en, this message translates to:
  /// **'Picked up by a parent'**
  String get eventParentPickup;

  /// No description provided for @eventAuthorizedPickup.
  ///
  /// In en, this message translates to:
  /// **'Picked up by an authorized person'**
  String get eventAuthorizedPickup;

  /// No description provided for @eventMissedBus.
  ///
  /// In en, this message translates to:
  /// **'Missed the bus'**
  String get eventMissedBus;

  /// No description provided for @eventTransportCancelled.
  ///
  /// In en, this message translates to:
  /// **'Bus cancelled'**
  String get eventTransportCancelled;

  /// No description provided for @eventNotPresentAtClass.
  ///
  /// In en, this message translates to:
  /// **'Not arrived yet'**
  String get eventNotPresentAtClass;

  /// No description provided for @statusArrivedByCar.
  ///
  /// In en, this message translates to:
  /// **'Arrived by car'**
  String get statusArrivedByCar;

  /// No description provided for @statusParentPickup.
  ///
  /// In en, this message translates to:
  /// **'Picked up'**
  String get statusParentPickup;

  /// No description provided for @statusAuthorizedPickup.
  ///
  /// In en, this message translates to:
  /// **'Picked up'**
  String get statusAuthorizedPickup;

  /// No description provided for @statusMissedBus.
  ///
  /// In en, this message translates to:
  /// **'Missed the bus'**
  String get statusMissedBus;

  /// No description provided for @statusTransportCancelled.
  ///
  /// In en, this message translates to:
  /// **'Bus cancelled'**
  String get statusTransportCancelled;

  /// No description provided for @statusNotPresentAtClass.
  ///
  /// In en, this message translates to:
  /// **'Not arrived yet'**
  String get statusNotPresentAtClass;

  /// No description provided for @staffEventArrivedByCar.
  ///
  /// In en, this message translates to:
  /// **'Arrived by car'**
  String get staffEventArrivedByCar;

  /// No description provided for @staffEventParentPickup.
  ///
  /// In en, this message translates to:
  /// **'Parent pickup'**
  String get staffEventParentPickup;

  /// No description provided for @staffEventAuthorizedPickup.
  ///
  /// In en, this message translates to:
  /// **'Authorized pickup'**
  String get staffEventAuthorizedPickup;

  /// No description provided for @staffEventMissedBus.
  ///
  /// In en, this message translates to:
  /// **'Missed bus'**
  String get staffEventMissedBus;

  /// No description provided for @staffEventTransportCancelled.
  ///
  /// In en, this message translates to:
  /// **'Transport cancelled'**
  String get staffEventTransportCancelled;

  /// No description provided for @staffEventNotPresentAtClass.
  ///
  /// In en, this message translates to:
  /// **'Not arrived'**
  String get staffEventNotPresentAtClass;

  /// No description provided for @getReady.
  ///
  /// In en, this message translates to:
  /// **'Get ready'**
  String get getReady;

  /// No description provided for @confirm.
  ///
  /// In en, this message translates to:
  /// **'Confirm'**
  String get confirm;
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
