// ignore: unused_import
import 'package:intl/intl.dart' as intl;

import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Arabic (`ar`).
class AppLocalizationsAr extends AppLocalizations {
  AppLocalizationsAr([String locale = 'ar']) : super(locale);

  @override
  String get appName => 'رحلتي';

  @override
  String get login => 'تسجيل الدخول';

  @override
  String get email => 'البريد الإلكتروني';

  @override
  String get password => 'كلمة المرور';

  @override
  String get welcome => 'مرحباً';

  @override
  String get attendance => 'الحضور';

  @override
  String get journey => 'الرحلة';

  @override
  String get photos => 'الصور';

  @override
  String get notifications => 'الإشعارات';

  @override
  String get settings => 'الإعدادات';

  @override
  String get language => 'اللغة';

  @override
  String get english => 'English';

  @override
  String get arabic => 'العربية';

  @override
  String get logOut => 'تسجيل الخروج';

  @override
  String get retry => 'إعادة المحاولة';

  @override
  String get tryAgain => 'حاول مرة أخرى';

  @override
  String get cancel => 'إلغاء';

  @override
  String get save => 'حفظ';

  @override
  String get done => 'تم';

  @override
  String get search => 'بحث...';

  @override
  String get forgotPassword => 'نسيت كلمة المرور؟';

  @override
  String get passwordResetUnavailable =>
      'إعادة تعيين كلمة المرور غير متاحة حالياً.';

  @override
  String get platformDashboard => 'لوحة التحكم';

  @override
  String get platformOrganizations => 'المؤسسات';

  @override
  String get platformInvitations => 'الدعوات';

  @override
  String get platformAccount => 'الحساب';

  @override
  String get platformDashboardEmpty => 'لا يوجد نشاط على المنصة بعد';

  @override
  String get platformTotalOrganizations => 'إجمالي المؤسسات';

  @override
  String get platformActiveOrganizations => 'المؤسسات النشطة';

  @override
  String get platformTrialOrganizations => 'مؤسسات تجريبية';

  @override
  String get platformSuspendedOrganizations => 'المؤسسات المعلّقة';

  @override
  String get platformInactiveOrganizations => 'المؤسسات غير النشطة';

  @override
  String get platformCancelledOrganizations => 'المؤسسات الملغاة';

  @override
  String get platformTotalStudents => 'إجمالي الطلاب';

  @override
  String get platformTotalTeachers => 'إجمالي المعلمين';

  @override
  String get platformTotalBuses => 'إجمالي الحافلات';

  @override
  String get searchOrganizations => 'بحث عن المؤسسات...';

  @override
  String get filterAll => 'الكل';

  @override
  String get noOrganizationsYet => 'لا توجد مؤسسات بعد';

  @override
  String get organizationDetails => 'المؤسسة';

  @override
  String get organizationName => 'اسم المؤسسة';

  @override
  String get organizationSlug => 'المعرّف';

  @override
  String get organizationCountry => 'الدولة';

  @override
  String get organizationTimezone => 'المنطقة الزمنية';

  @override
  String get organizationDefaultLanguage => 'اللغة الافتراضية';

  @override
  String get organizationContactEmail => 'البريد للتواصل';

  @override
  String get organizationContactPhone => 'هاتف التواصل';

  @override
  String get organizationContactPhoneOptional => 'هاتف التواصل (اختياري)';

  @override
  String get organizationAddressOptional => 'العنوان (اختياري)';

  @override
  String get organizationWebsiteOptional => 'الموقع (اختياري)';

  @override
  String get organizationLogoOptional => 'رابط الشعار (اختياري)';

  @override
  String get organizationStatus => 'الحالة';

  @override
  String get organizationPlan => 'الخطة';

  @override
  String get organizationUsage => 'الاستخدام';

  @override
  String organizationUsageSummary(int campuses, int students, int users) {
    return '$campuses فروع · $students طلاب · $users مستخدمون';
  }

  @override
  String get usageCampuses => 'الفروع';

  @override
  String get usageStudents => 'الطلاب';

  @override
  String get usageUsers => 'المستخدمون';

  @override
  String get usageClassrooms => 'الفصول';

  @override
  String get usageBuses => 'الحافلات';

  @override
  String get createdAt => 'تاريخ الإنشاء';

  @override
  String get createOrganization => 'إنشاء مؤسسة';

  @override
  String get activateOrganization => 'تفعيل';

  @override
  String get suspendOrganization => 'تعليق';

  @override
  String get deactivateOrganization => 'إلغاء التفعيل';

  @override
  String get confirmSuspendOrganization =>
      'هل تريد تعليق هذه المؤسسة؟ سيفقد مستخدمو المستأجر الوصول حتى يتم تفعيلها مرة أخرى.';

  @override
  String get confirmDeactivateOrganization =>
      'هل تريد إلغاء تفعيل هذه المؤسسة؟ سيوقف ذلك الوصول الاعتيادي للمستأجر.';

  @override
  String get organizationCreated => 'تم إنشاء المؤسسة بنجاح';

  @override
  String get organizationCreatedWithInvitation =>
      'تم إنشاء المؤسسة وإرسال الدعوة';

  @override
  String get organizationUpdated => 'تم تحديث المؤسسة';

  @override
  String get optionalAdminInvitation => 'دعوة المسؤول الأول (اختياري)';

  @override
  String get adminFirstName => 'الاسم الأول للمسؤول';

  @override
  String get adminLastName => 'اسم عائلة المسؤول';

  @override
  String get adminEmail => 'بريد المسؤول';

  @override
  String get adminFirstNameOptional => 'الاسم الأول للمسؤول (اختياري)';

  @override
  String get adminLastNameOptional => 'اسم عائلة المسؤول (اختياري)';

  @override
  String get adminEmailOptional => 'بريد المسؤول (اختياري)';

  @override
  String get adminInviteIncomplete =>
      'أدخل الاسم الأول واسم العائلة والبريد معاً';

  @override
  String get inviteAdminHint => 'ادعُ المسؤول الأول لمؤسسة موجودة.';

  @override
  String get sendInvitation => 'إرسال الدعوة';

  @override
  String get invitationCreated => 'تم إنشاء الدعوة بنجاح';

  @override
  String get role => 'الدور';

  @override
  String get rolePlatformAdmin => 'مسؤول المنصة';

  @override
  String get accountStatus => 'حالة الحساب';

  @override
  String get orgStatusTrial => 'تجريبي';

  @override
  String get orgStatusActive => 'نشط';

  @override
  String get orgStatusSuspended => 'معلّق';

  @override
  String get orgStatusInactive => 'غير نشط';

  @override
  String get orgStatusCancelled => 'ملغى';

  @override
  String get planStarter => 'أساسي';

  @override
  String get planProfessional => 'احترافي';

  @override
  String get planEnterprise => 'مؤسسي';

  @override
  String get fieldRequired => 'هذا الحقل مطلوب';

  @override
  String get invalidEmail => 'أدخل بريداً إلكترونياً صالحاً';

  @override
  String get errorOrganizationNotFound => 'المؤسسة غير موجودة';

  @override
  String get errorOrganizationSuspended => 'المؤسسة معلّقة';

  @override
  String get errorOrganizationInactive => 'المؤسسة غير نشطة';

  @override
  String get errorUserNotFound => 'المستخدم غير موجود';

  @override
  String get errorUserAlreadyExists => 'يوجد مستخدم بهذا البريد مسبقاً';

  @override
  String get errorUserRoleNotAllowed => 'هذا الدور غير مسموح';

  @override
  String get errorInvitationExpired => 'انتهت صلاحية هذه الدعوة';

  @override
  String get errorInvitationAlreadyUsed => 'تم استخدام هذه الدعوة مسبقاً';

  @override
  String get errorInvitationRevoked => 'تم إلغاء هذه الدعوة';

  @override
  String get emailRequired => 'البريد الإلكتروني مطلوب';

  @override
  String get passwordRequired => 'كلمة المرور مطلوبة';

  @override
  String get nothingHereYet => 'لا يوجد شيء هنا بعد';

  @override
  String get myChildren => 'أبنائي';

  @override
  String get myClasses => 'صفوفي';

  @override
  String get campuses => 'الفروع';

  @override
  String get students => 'الطلاب';

  @override
  String get student => 'الطالب';

  @override
  String get studentJourney => 'رحلة الطالب';

  @override
  String get today => 'اليوم';

  @override
  String get yesterday => 'أمس';

  @override
  String get child => 'الطفل';

  @override
  String childDay(String name) {
    return 'يوم $name';
  }

  @override
  String childPhotos(String name) {
    return 'صور $name';
  }

  @override
  String get goodMorning => 'صباح الخير';

  @override
  String get goodAfternoon => 'طاب يومك';

  @override
  String get goodEvening => 'مساء الخير';

  @override
  String greeting(String hello, String name) {
    return '$hello، $name 👋';
  }

  @override
  String get yourChildren => 'أبناؤك';

  @override
  String get noChildrenAvailable => 'لا يوجد أطفال';

  @override
  String get noChildrenHint => 'لم تربط مدرستك أي طلاب نشطين بحسابك بعد.';

  @override
  String get loadingChildInfo => 'جاري تحميل معلومات الطفل...';

  @override
  String get unableToLoadChildren => 'تعذر تحميل قائمة أبنائك.';

  @override
  String get unableToLoadChildInfo => 'تعذر تحميل معلومات الطفل.';

  @override
  String get childUnavailable => 'هذا الطفل لم يعد متاحاً.';

  @override
  String get currentStatus => 'الحالة الحالية';

  @override
  String lastUpdate(String time) {
    return 'آخر تحديث $time';
  }

  @override
  String get todaysAttendance => 'حضور اليوم';

  @override
  String get present => 'حاضر';

  @override
  String get notRecordedYet => 'لم يُسجل بعد';

  @override
  String recordedAt(String time) {
    return 'سُجل في $time';
  }

  @override
  String get viewTodaysJourney => 'عرض رحلة اليوم';

  @override
  String get todaysJourney => 'رحلة اليوم';

  @override
  String get loadingTodaysJourney => 'جاري تحميل رحلة اليوم...';

  @override
  String get unableToLoadJourney => 'تعذر تحميل رحلة اليوم.';

  @override
  String get noActivityYet => 'لم يُسجل أي نشاط بعد.';

  @override
  String get classLabel => 'الصف';

  @override
  String get studentNumber => 'رقم الطالب';

  @override
  String get status => 'الحالة';

  @override
  String get statusActive => 'نشط';

  @override
  String get statusInactive => 'غير نشط';

  @override
  String get statusTransferred => 'منقول';

  @override
  String get statusGraduated => 'متخرج';

  @override
  String currentlyStatus(String status) {
    return 'حالياً $status';
  }

  @override
  String get todaysTimeline => 'الجدول الزمني لليوم';

  @override
  String get noJourneyEventsYet => 'لا توجد أحداث في الرحلة بعد';

  @override
  String get eventAttendancePresent => 'حاضر';

  @override
  String get eventBusBoarding => 'في الحافلة';

  @override
  String get eventSchoolArrival => 'وصل إلى المدرسة';

  @override
  String get eventClassStarted => 'بدأت الحصة';

  @override
  String get eventBreakStarted => 'وقت الاستراحة';

  @override
  String get eventActivityStarted => 'بدأ النشاط';

  @override
  String get eventMeal => 'وقت الوجبة';

  @override
  String get eventSkillSession => 'نشاط تعليمي';

  @override
  String get eventBusDeparture => 'غادر المدرسة';

  @override
  String get eventHomeDropoff => 'وصل إلى المنزل';

  @override
  String get statusAttendancePresent => 'حاضر';

  @override
  String get statusBusBoarding => 'في الحافلة';

  @override
  String get statusSchoolArrival => 'وصل إلى المدرسة';

  @override
  String get statusClassStarted => 'حالياً في الصف';

  @override
  String get statusBreakStarted => 'وقت الاستراحة';

  @override
  String get statusActivityStarted => 'بدأ النشاط';

  @override
  String get statusMeal => 'وقت الوجبة';

  @override
  String get statusSkillSession => 'نشاط تعليمي';

  @override
  String get statusBusDeparture => 'غادر المدرسة';

  @override
  String get statusHomeDropoff => 'وصل إلى المنزل';

  @override
  String get statusJourneyNotStarted => 'لم تبدأ رحلة اليوم بعد.';

  @override
  String get staffEventAttendancePresent => 'حاضر';

  @override
  String get staffEventBusBoarding => 'صعود الحافلة';

  @override
  String get staffEventSchoolArrival => 'الوصول إلى المدرسة';

  @override
  String get staffEventClassStarted => 'بدأت الحصة';

  @override
  String get staffEventBreakStarted => 'استراحة';

  @override
  String get staffEventActivityStarted => 'نشاط';

  @override
  String get staffEventMeal => 'وجبة';

  @override
  String get staffEventSkillSession => 'جلسة مهارات';

  @override
  String get staffEventBusDeparture => 'مغادرة الحافلة';

  @override
  String get staffEventHomeDropoff => 'التوصيل إلى المنزل';

  @override
  String get staffStatePresent => 'حاضر';

  @override
  String get staffStateOnTheBus => 'في الحافلة';

  @override
  String get staffStateAtSchool => 'في المدرسة';

  @override
  String get staffStateInClass => 'في الصف';

  @override
  String get staffStateOnBreak => 'في الاستراحة';

  @override
  String get staffStateInActivity => 'في نشاط';

  @override
  String get staffStateAtMeal => 'في الوجبة';

  @override
  String get staffStateInSkillSession => 'في جلسة مهارات';

  @override
  String get staffStateOnTheWayHome => 'في الطريق إلى المنزل';

  @override
  String get staffStateHome => 'في المنزل';

  @override
  String get staffStateNoEvents => 'لا توجد أحداث بعد';

  @override
  String get scanStudentQr => 'مسح رمز الطالب';

  @override
  String get noAttendanceYet => 'لم يُسجل حضور بعد';

  @override
  String get attendanceRecorded => 'تم تسجيل الحضور';

  @override
  String get alreadyRecorded => 'مسجل مسبقاً';

  @override
  String get alreadyMarkedPresent => 'تم تسجيل حضوره اليوم مسبقاً.';

  @override
  String get scanNextStudent => 'مسح الطالب التالي';

  @override
  String get cameraPermissionNeeded => 'يلزم إذن الكاميرا';

  @override
  String get cameraPermissionScan => 'يلزم إذن الكاميرا لمسح رموز الطلاب.';

  @override
  String get qrNotRecognized => 'تعذر التعرف على الرمز';

  @override
  String get noActiveStudent => 'لم يُعثر على طالب نشط.';

  @override
  String get attendanceForbidden => 'ليس لديك صلاحية لتسجيل الحضور.';

  @override
  String get attendanceFailed => 'تعذر تسجيل الحضور. حاول مرة أخرى.';

  @override
  String get studentPhoto => 'صورة الطالب';

  @override
  String get takePhoto => 'التقاط صورة';

  @override
  String get chooseFromDevice => 'اختيار من الجهاز';

  @override
  String get retake => 'إعادة الالتقاط';

  @override
  String get usePhoto => 'استخدام الصورة';

  @override
  String get photoUploaded => 'تم رفع الصورة';

  @override
  String get uploadFailed => 'فشل الرفع';

  @override
  String get uploadingPhoto => 'جاري رفع الصورة...';

  @override
  String get cameraAccessPhoto => 'يلزم الوصول إلى الكاميرا لالتقاط صورة.';

  @override
  String get openSystemSettings => 'فتح الإعدادات';

  @override
  String get photo => 'صورة';

  @override
  String get photoUnavailable => 'الصورة غير متاحة.';

  @override
  String get noPhotosYet => 'لا توجد صور بعد';

  @override
  String get viewAll => 'عرض الكل';

  @override
  String get photosAccessDenied => 'ليس لديك صلاحية لعرض هذه الصور.';

  @override
  String get unableToLoadPhotos => 'تعذر تحميل الصور.';

  @override
  String percentValue(int percent) {
    return '$percent٪';
  }

  @override
  String get noNotificationsYet => 'لا توجد إشعارات بعد';

  @override
  String get unableToLoadNotifications => 'تعذر تحميل الإشعارات.';

  @override
  String get unableToLoadNotificationSettings =>
      'تعذر تحميل إعدادات الإشعارات.';

  @override
  String get notificationsDisabledHint =>
      'الإشعارات متوقفة في إعدادات النظام. فعّلها لاستلام التنبيهات.';

  @override
  String get journeyUpdates => 'تحديثات الرحلة';

  @override
  String get prefChildArrivedNursery => 'وصول الطفل إلى الحضانة';

  @override
  String get prefChildLeftNursery => 'مغادرة الطفل للحضانة';

  @override
  String get prefChildArrivedHome => 'وصول الطفل إلى المنزل';

  @override
  String get prefNewPhotos => 'صور جديدة';

  @override
  String get notificationUpdate => 'تحديث';

  @override
  String get tapToViewJourney => 'اضغط لعرض رحلة اليوم';

  @override
  String get notifStudentArrival => 'وصل إلى المدرسة';

  @override
  String get notifStudentDeparture => 'غادر المدرسة';

  @override
  String get notifStudentHomeDropoff => 'وصل إلى المنزل';

  @override
  String get notifMediaAvailable => 'صور جديدة';

  @override
  String get notifJourneyUpdate => 'تحديث الرحلة';

  @override
  String get newStudent => 'طالب جديد';

  @override
  String get firstName => 'الاسم الأول';

  @override
  String get lastName => 'اسم العائلة';

  @override
  String get firstNameRequired => 'الاسم الأول مطلوب';

  @override
  String get lastNameRequired => 'اسم العائلة مطلوب';

  @override
  String get studentNumberRequired => 'رقم الطالب مطلوب';

  @override
  String get gender => 'الجنس';

  @override
  String get genderFemale => 'أنثى';

  @override
  String get genderMale => 'ذكر';

  @override
  String get genderOther => 'آخر';

  @override
  String get dateOfBirth => 'تاريخ الميلاد';

  @override
  String get dateOfBirthRequired => 'تاريخ الميلاد مطلوب';

  @override
  String get noStudentsYet => 'لا يوجد طلاب بعد';

  @override
  String get attendanceQr => 'رمز الحضور';

  @override
  String get guardians => 'أولياء الأمور';

  @override
  String get addGuardian => 'إضافة ولي أمر';

  @override
  String get addGuardianTitle => 'إضافة ولي أمر';

  @override
  String get noGuardiansYet => 'لا يوجد أولياء أمور بعد';

  @override
  String get primaryGuardian => 'ولي الأمر الأساسي';

  @override
  String get passwordNewAccount => 'كلمة المرور (مطلوبة لحساب جديد)';

  @override
  String get relationship => 'صلة القرابة';

  @override
  String get relationshipMother => 'الأم';

  @override
  String get relationshipFather => 'الأب';

  @override
  String get relationshipLegalGuardian => 'ولي أمر قانوني';

  @override
  String get relationshipOther => 'أخرى';

  @override
  String get name => 'الاسم';

  @override
  String get nameRequired => 'الاسم مطلوب';

  @override
  String get newClassroom => 'صف جديد';

  @override
  String get newCampus => 'فرع جديد';

  @override
  String get campusName => 'اسم الفرع';

  @override
  String get noClassroomsYet => 'لا توجد صفوف بعد';

  @override
  String get noCampusesYet => 'لا توجد فروع بعد';

  @override
  String get level => 'المرحلة';

  @override
  String get levelNursery => 'حضانة';

  @override
  String get levelKindergarten => 'روضة';

  @override
  String get levelPrimary => 'ابتدائي';

  @override
  String get levelMiddleSchool => 'متوسط';

  @override
  String get levelHighSchool => 'ثانوي';

  @override
  String get errorInvalidCredentials =>
      'البريد الإلكتروني أو كلمة المرور غير صحيحة';

  @override
  String get errorAccountInactive => 'الحساب غير نشط';

  @override
  String get errorUnauthorized => 'يلزم تسجيل الدخول';

  @override
  String get errorForbidden => 'ليس لديك صلاحية لتنفيذ هذا الإجراء';

  @override
  String get errorNotFound => 'غير موجود';

  @override
  String get errorValidation => 'يرجى التحقق من النموذج والمحاولة مرة أخرى.';

  @override
  String get errorLoginFailed => 'تعذر تسجيل الدخول. حاول مرة أخرى.';

  @override
  String get errorRequestFailed => 'فشل الطلب';

  @override
  String get errorInternal => 'حدث خطأ. حاول مرة أخرى.';

  @override
  String get errorNetwork => 'تعذر الاتصال. حاول مرة أخرى.';

  @override
  String get errorStudentInactive => 'الطالب غير نشط';

  @override
  String get transport => 'النقل';

  @override
  String get buses => 'الحافلات';

  @override
  String get routes => 'المسارات';

  @override
  String get myRoute => 'مساري';

  @override
  String get morningArrival => 'وصول الصباح';

  @override
  String get todaysTransport => 'نقل اليوم';

  @override
  String get homeToSchool => 'المنزل → المدرسة';

  @override
  String get schoolToHome => 'المدرسة → المنزل';

  @override
  String get cancelBus => 'إلغاء الحافلة';

  @override
  String get cancelBusFor => 'إلغاء الحافلة لـ';

  @override
  String get cancelToday => 'اليوم';

  @override
  String get cancelTomorrow => 'غداً';

  @override
  String get cancelNextThreeDays => 'الأيام الثلاثة القادمة';

  @override
  String get cancelCustomDates => 'تواريخ مخصصة';

  @override
  String get confirmCancelBus => 'إلغاء النقل بالحافلة للتواريخ المحددة؟';

  @override
  String get busCancelled => 'تم إلغاء الحافلة';

  @override
  String get estimatedArrival => 'الوصول المتوقع';

  @override
  String estimatedArrivalInMinutes(int minutes) {
    return 'الوصول المتوقع خلال $minutes دقائق';
  }

  @override
  String stopsRemaining(int count) {
    return '$count محطات متبقية';
  }

  @override
  String get currentStop => 'المحطة الحالية';

  @override
  String get yourStop => 'محطتك';

  @override
  String childrenAtStopCount(int count) {
    return '$count أطفال مجدولون في هذه المحطة.';
  }

  @override
  String get notLiveTracking => 'وصول متوقع — ليست موقعاً مباشراً';

  @override
  String get arrivedAtStop => 'وصلت إلى المحطة';

  @override
  String get departStop => 'مغادرة المحطة';

  @override
  String get scanBoardingQr => 'مسح رمز الصعود';

  @override
  String get markAllArrived => 'تسجيل وصول الجميع';

  @override
  String get confirmMarkAllArrived =>
      'تسجيل جميع الأطفال المؤهلين في هذا المسار كواصلين؟';

  @override
  String get nextStop => 'المحطة التالية';

  @override
  String get noRoutesAssigned => 'لا يوجد مسار معيّن بعد';

  @override
  String childrenExpected(int count) {
    return '$count أطفال متوقعون';
  }

  @override
  String arrivedByBusCount(int count) {
    return '$count وصلوا بالحافلة';
  }

  @override
  String arrivedByCarCount(int count) {
    return '$count وصلوا بالسيارة';
  }

  @override
  String notArrivedCount(int count) {
    return '$count لم يصلوا';
  }

  @override
  String get swipeRightArrived => 'اسحب يميناً لتسجيل الوصول';

  @override
  String get swipeLeftNotPresent => 'اسحب يساراً لتسجيل عدم الوصول';

  @override
  String get markArrived => 'وصل';

  @override
  String get markNotPresent => 'لم يصل';

  @override
  String get arrivedByCar => 'وصل بالسيارة';

  @override
  String get parentPickup => 'استلام ولي الأمر';

  @override
  String get authorizedPickup => 'استلام مفوّض';

  @override
  String get confirmStatusChange => 'تحديث حالة هذا الطفل؟';

  @override
  String get pickupPerson => 'الشخص المستلم';

  @override
  String get newBus => 'حافلة جديدة';

  @override
  String get newRoute => 'مسار جديد';

  @override
  String get registrationNumber => 'رقم التسجيل';

  @override
  String get capacity => 'السعة';

  @override
  String get addStop => 'إضافة محطة';

  @override
  String get assignChildren => 'تعيين الأطفال';

  @override
  String get unassignedChildren => 'ليسوا على هذا المسار';

  @override
  String get segmentMinutes => 'مدة التنقل (دقائق)';

  @override
  String get parentCar => 'سيارة ولي الأمر';

  @override
  String get eventArrivedByCar => 'وصل بالسيارة';

  @override
  String get eventParentPickup => 'استلمه ولي الأمر';

  @override
  String get eventAuthorizedPickup => 'استلمه شخص مفوّض';

  @override
  String get eventMissedBus => 'فاتته الحافلة';

  @override
  String get eventTransportCancelled => 'أُلغيت الحافلة';

  @override
  String get eventNotPresentAtClass => 'لم يصل بعد';

  @override
  String get statusArrivedByCar => 'وصل بالسيارة';

  @override
  String get statusParentPickup => 'تم الاستلام';

  @override
  String get statusAuthorizedPickup => 'تم الاستلام';

  @override
  String get statusMissedBus => 'فاتته الحافلة';

  @override
  String get statusTransportCancelled => 'أُلغيت الحافلة';

  @override
  String get statusNotPresentAtClass => 'لم يصل بعد';

  @override
  String get staffEventArrivedByCar => 'وصل بالسيارة';

  @override
  String get staffEventParentPickup => 'استلام ولي الأمر';

  @override
  String get staffEventAuthorizedPickup => 'استلام مفوّض';

  @override
  String get staffEventMissedBus => 'فاتته الحافلة';

  @override
  String get staffEventTransportCancelled => 'أُلغي النقل';

  @override
  String get staffEventNotPresentAtClass => 'لم يصل';

  @override
  String get getReady => 'استعد';

  @override
  String get confirm => 'تأكيد';
}
