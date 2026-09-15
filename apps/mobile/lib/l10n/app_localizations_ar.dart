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
}
