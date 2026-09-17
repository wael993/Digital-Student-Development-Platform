import type { ClassroomLevel } from '../../modules/classrooms/classroom.model';
import type { GuardianRelationshipType } from '../../modules/guardians/guardian.model';
import type { StudentGender } from '../../modules/students/student.model';
import { childKey } from './seed-helpers';

export const SEED_ORG_NAME = 'أكاديمية براعم المستقبل';
export const SEED_TIMEZONE = 'Asia/Riyadh';
export const SEED_PASSWORD = 'Demo@12345';
export const SEED_PLATFORM_ADMIN_EMAIL = 'platform.admin@demo.local';

export type CampusKey = 'nakheel' | 'nada';
export type ClassKey = 'kg_a' | 'kg_b' | 'nursery' | 'primary' | 'kg_nada';

export const CAMPUSES: { key: CampusKey; name: string }[] = [
  { key: 'nakheel', name: 'حرم النخيل' },
  { key: 'nada', name: 'حرم الندى' },
];

export const CLASSROOMS: {
  key: ClassKey;
  campusKey: CampusKey;
  name: string;
  level: ClassroomLevel;
  size: number;
}[] = [
  { key: 'kg_a', campusKey: 'nakheel', name: 'روضة النخيل أ', level: 'KINDERGARTEN', size: 20 },
  { key: 'kg_b', campusKey: 'nakheel', name: 'روضة النخيل ب', level: 'KINDERGARTEN', size: 18 },
  { key: 'nursery', campusKey: 'nakheel', name: 'حضانة البراعم', level: 'NURSERY', size: 5 },
  { key: 'primary', campusKey: 'nakheel', name: 'الصف الأول', level: 'PRIMARY', size: 10 },
  { key: 'kg_nada', campusKey: 'nada', name: 'روضة الندى', level: 'KINDERGARTEN', size: 10 },
];

export const STAFF = {
  admins: [
    {
      firstName: 'أحمد',
      lastName: 'سليمان الراشد',
      email: 'admin.ahmad@demo.local',
    },
    { firstName: 'منى', lastName: 'فهد السلمي', email: 'admin.mona@demo.local' },
  ],
  supervisors: [
    {
      firstName: 'خالد',
      lastName: 'ناصر العمري',
      email: 'supervisor.khalid@demo.local',
      campusKey: 'nakheel' as CampusKey,
    },
    {
      firstName: 'هدى',
      lastName: 'سالم النعيمي',
      email: 'supervisor.huda@demo.local',
      campusKey: 'nada' as CampusKey,
    },
  ],
  teachers: [
    {
      firstName: 'مريم',
      lastName: 'خالد الشمري',
      email: 'teacher.mariam@demo.local',
      classKey: 'kg_a' as ClassKey,
    },
    {
      firstName: 'هناء',
      lastName: 'يوسف القحطاني',
      email: 'teacher.hana@demo.local',
      classKey: 'kg_b' as ClassKey,
    },
    {
      firstName: 'نجلاء',
      lastName: 'أحمد العتيبي',
      email: 'teacher.najla@demo.local',
      classKey: 'nursery' as ClassKey,
    },
    {
      firstName: 'سامر',
      lastName: 'عبدالله الحربي',
      email: 'teacher.samer@demo.local',
      classKey: 'primary' as ClassKey,
    },
    {
      firstName: 'ريم',
      lastName: 'محمد الزهراني',
      email: 'teacher.reem@demo.local',
      classKey: 'kg_nada' as ClassKey,
    },
  ],
  drivers: [
    { firstName: 'سعد', lastName: 'عبدالله المطيري', email: 'driver.saad@demo.local' },
    { firstName: 'فهد', lastName: 'محمد الدوسري', email: 'driver.fahad@demo.local' },
    { firstName: 'طارق', lastName: 'أحمد العبدالله', email: 'driver.tariq@demo.local' },
    { firstName: 'حسن', lastName: 'يوسف الغامدي', email: 'driver.hassan@demo.local' },
  ],
};

export interface GuardianSpec {
  firstName: string;
  lastName: string;
  email: string;
  relationship: GuardianRelationshipType;
  isPrimary: boolean;
  canPickup: boolean;
  receivesNotifications: boolean;
}

export interface ChildSpec {
  firstName: string;
  gender: StudentGender;
  classKey: ClassKey;
}

export interface FamilySpec {
  key: string;
  patronymic: string;
  surname: string;
  children: ChildSpec[];
  guardians: GuardianSpec[];
  pickup?: GuardianSpec[];
}

function parent(
  firstName: string,
  lastName: string,
  email: string,
  relationship: 'MOTHER' | 'FATHER' | 'LEGAL_GUARDIAN',
  opts?: { primary?: boolean; pickup?: boolean; notify?: boolean },
): GuardianSpec {
  return {
    firstName,
    lastName,
    email,
    relationship,
    isPrimary: opts?.primary ?? relationship !== 'MOTHER',
    canPickup: opts?.pickup ?? true,
    receivesNotifications: opts?.notify ?? true,
  };
}

function extraPickup(firstName: string, lastName: string, email: string): GuardianSpec {
  return {
    firstName,
    lastName,
    email,
    relationship: 'OTHER',
    isPrimary: false,
    canPickup: true,
    receivesNotifications: false,
  };
}

export const FAMILIES: FamilySpec[] = [
  {
    key: 'otaibi',
    patronymic: 'محمد',
    surname: 'العتيبي',
    children: [
      { firstName: 'آدم', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'سارة', gender: 'FEMALE', classKey: 'kg_b' },
    ],
    guardians: [
      parent('محمد', 'عبدالله العتيبي', 'mohammed.alotaibi+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('نورة', 'سعد الشمري', 'noura.alshamri+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
    pickup: [extraPickup('إبراهيم', 'محمد العتيبي', 'ibrahim.alotaibi+guardian@demo.local')],
  },
  {
    key: 'harbi',
    patronymic: 'خالد',
    surname: 'الحربي',
    children: [
      { firstName: 'يوسف', gender: 'MALE', classKey: 'nursery' },
      { firstName: 'ليان', gender: 'FEMALE', classKey: 'kg_a' },
    ],
    guardians: [
      parent('خالد', 'يوسف الحربي', 'khalid.alharbi+guardian@demo.local', 'FATHER', {
        primary: false,
        notify: false,
      }),
      parent('سارة', 'فهد الدوسري', 'sara.aldosari+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'zahrani',
    patronymic: 'أحمد',
    surname: 'الزهراني',
    children: [
      { firstName: 'عمر', gender: 'MALE', classKey: 'primary' },
      { firstName: 'جود', gender: 'FEMALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('أحمد', 'تركي الزهراني', 'ahmad.alzahrani+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('هند', 'ماجد العتيبي', 'hind.alotaibi+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
    pickup: [extraPickup('فوزية', 'أحمد الزهراني', 'fawziah.alzahrani+guardian@demo.local')],
  },
  {
    key: 'qahtani',
    patronymic: 'سعد',
    surname: 'القحطاني',
    children: [
      { firstName: 'خالد', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'لمى', gender: 'FEMALE', classKey: 'kg_b' },
      { firstName: 'عبدالعزيز', gender: 'MALE', classKey: 'primary' },
    ],
    guardians: [
      parent('سعد', 'عبدالله القحطاني', 'saad.alqahtani+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('أريج', 'وليد المالكي', 'areej.almalki+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
    pickup: [extraPickup('عبدالله', 'سعد القحطاني', 'abdullah.alqahtani+guardian@demo.local')],
  },
  {
    key: 'salem',
    patronymic: 'علي',
    surname: 'السالم',
    children: [
      { firstName: 'نواف', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'دانة', gender: 'FEMALE', classKey: 'kg_b' },
      { firstName: 'راشد', gender: 'MALE', classKey: 'nursery' },
    ],
    guardians: [
      parent('علي', 'فهد السالم', 'ali.alsalem+guardian@demo.local', 'FATHER', { primary: true }),
      parent('حصة', 'ناصر الجهني', 'hessah.aljuhani+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
    pickup: [extraPickup('خديجة', 'عبدالله السالم', 'khadijah.alsalem+guardian@demo.local')],
  },
  {
    key: 'ghamdi',
    patronymic: 'فهد',
    surname: 'الغامدي',
    children: [
      { firstName: 'طارق', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'لين', gender: 'FEMALE', classKey: 'kg_a' },
    ],
    guardians: [
      parent('فهد', 'يوسف الغامدي', 'fahad.alghamdi+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('لجين', 'سالم العنزي', 'lujain.alanazi+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
  },
  {
    key: 'shamri',
    patronymic: 'خالد',
    surname: 'الشمري',
    children: [
      { firstName: 'مازن', gender: 'MALE', classKey: 'kg_b' },
      { firstName: 'ريناد', gender: 'FEMALE', classKey: 'kg_b' },
    ],
    guardians: [
      parent('خالد', 'ماجد الشمري', 'khalid.alshamri+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('رنا', 'عبدالله الثبيتي', 'rana.althubaiti+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
  },
  {
    key: 'mutairi',
    patronymic: 'علي',
    surname: 'المطيري',
    children: [
      { firstName: 'حسن', gender: 'MALE', classKey: 'kg_b' },
      { firstName: 'تالا', gender: 'FEMALE', classKey: 'nursery' },
    ],
    guardians: [
      parent('علي', 'سعد المطيري', 'ali.almutairi+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('بتول', 'فهد الرشيدي', 'batoul.alrashidi+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
    pickup: [extraPickup('لطيفة', 'علي المطيري', 'latifah.almutairi+guardian@demo.local')],
  },
  {
    key: 'abdullah',
    patronymic: 'فهد',
    surname: 'العبدالله',
    children: [
      { firstName: 'بدر', gender: 'MALE', classKey: 'primary' },
      { firstName: 'ميا', gender: 'FEMALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('فهد', 'ناصر العبدالله', 'fahad.alabdullah+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('جواهر', 'سامي العسيري', 'jawaher.alasiri+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
  },
  {
    key: 'qarni',
    patronymic: 'وليد',
    surname: 'القرني',
    children: [
      { firstName: 'أنس', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'ميساء', gender: 'FEMALE', classKey: 'nursery' },
    ],
    guardians: [
      parent('وليد', 'حسن القرني', 'walid.alqarni+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
      parent('إسراء', 'علي البلوي', 'isra.albalawi+guardian@demo.local', 'MOTHER', {
        primary: false,
      }),
    ],
  },
  {
    key: 'anazi',
    patronymic: 'ماجد',
    surname: 'العنزي',
    children: [
      { firstName: 'كريم', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'جنى', gender: 'FEMALE', classKey: 'kg_b' },
      { firstName: 'نورة', gender: 'FEMALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('سدين', 'محمد العنزي', 'sadeen.alanazi+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
    pickup: [extraPickup('مازن', 'سعد العنزي', 'mazen.alanazi+guardian@demo.local')],
  },
  {
    key: 'malki',
    patronymic: 'حسن',
    surname: 'المالكي',
    children: [
      { firstName: 'راكان', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'عبدالرحمن', gender: 'MALE', classKey: 'primary' },
    ],
    guardians: [
      parent('حسن', 'علي المالكي', 'hassan.almalki+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'subaie',
    patronymic: 'بدر',
    surname: 'السبيعي',
    children: [
      { firstName: 'تسنيم', gender: 'FEMALE', classKey: 'kg_a' },
      { firstName: 'رناد', gender: 'FEMALE', classKey: 'kg_b' },
    ],
    guardians: [
      parent('منيرة', 'بدر السبيعي', 'munirah.alsubaie+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'asiri',
    patronymic: 'فهد',
    surname: 'العسيري',
    children: [
      { firstName: 'أنس', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'رغد', gender: 'FEMALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('هدى', 'سامي العسيري', 'huda.alasiri+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'balawi',
    patronymic: 'سامي',
    surname: 'البلوي',
    children: [
      { firstName: 'أسيد', gender: 'MALE', classKey: 'kg_b' },
      { firstName: 'زياد', gender: 'MALE', classKey: 'primary' },
    ],
    guardians: [
      parent('سامي', 'وليد البلوي', 'sami.albalawi+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'juhani',
    patronymic: 'عمر',
    surname: 'الجهني',
    children: [
      { firstName: 'زياد', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'تالا', gender: 'FEMALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('شيخة', 'عمر الجهني', 'shaikhah.aljuhani+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'rashidi',
    patronymic: 'ناصر',
    surname: 'الرشيدي',
    children: [
      { firstName: 'رزان', gender: 'FEMALE', classKey: 'kg_b' },
      { firstName: 'ياسر', gender: 'MALE', classKey: 'primary' },
    ],
    guardians: [
      parent('خلود', 'ناصر الرشيدي', 'kholoud.alrashidi+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'harithi',
    patronymic: 'عمر',
    surname: 'الحارثي',
    children: [
      { firstName: 'ليث', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'ميا', gender: 'FEMALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('عمر', 'سعد الحارثي', 'omar.alharithi+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'khalidi',
    patronymic: 'يوسف',
    surname: 'الخالدي',
    children: [
      { firstName: 'شهد', gender: 'FEMALE', classKey: 'kg_b' },
      { firstName: 'بدر', gender: 'MALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('إيناس', 'يوسف الخالدي', 'enas.alkhalidi+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'fayez',
    patronymic: 'أحمد',
    surname: 'الفايز',
    children: [
      { firstName: 'قصي', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'أروى', gender: 'FEMALE', classKey: 'primary' },
    ],
    guardians: [
      parent('نسرين', 'أحمد الفايز', 'nisreen.alfayez+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'thubaiti',
    patronymic: 'سلمان',
    surname: 'الثبيتي',
    children: [
      { firstName: 'جود', gender: 'FEMALE', classKey: 'kg_b' },
      { firstName: 'تركي', gender: 'MALE', classKey: 'kg_nada' },
    ],
    guardians: [
      parent('سلمان', 'علي الثبيتي', 'salman.althubaiti+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'shahrani',
    patronymic: 'محمد',
    surname: 'الشهراني',
    children: [
      { firstName: 'إياد', gender: 'MALE', classKey: 'kg_a' },
      { firstName: 'غلا', gender: 'FEMALE', classKey: 'primary' },
    ],
    guardians: [
      parent('إلهام', 'محمد الشهراني', 'ilham.alshahrani+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'ajmi',
    patronymic: 'ماجد',
    surname: 'العجمي',
    children: [{ firstName: 'غلا', gender: 'FEMALE', classKey: 'kg_a' }],
    guardians: [
      parent('سلوى', 'فهد العجمي', 'salwa.alajmi+guardian@demo.local', 'MOTHER', { primary: true }),
    ],
  },
  {
    key: 'saadi',
    patronymic: 'بدر',
    surname: 'الصاعدي',
    children: [{ firstName: 'سلطان', gender: 'MALE', classKey: 'kg_a' }],
    guardians: [
      parent('بدر', 'علي الصاعدي', 'badr.alsaadi+guardian@demo.local', 'FATHER', { primary: true }),
    ],
  },
  {
    key: 'baqmi',
    patronymic: 'فهد',
    surname: 'البقمي',
    children: [{ firstName: 'إياد', gender: 'MALE', classKey: 'kg_a' }],
    guardians: [
      parent('عبير', 'سالم البقمي', 'abeer.albaqmi+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'daadi',
    patronymic: 'نواف',
    surname: 'الدعدي',
    children: [{ firstName: 'قصي', gender: 'MALE', classKey: 'kg_a' }],
    guardians: [
      parent('نواف', 'حسن الدعدي', 'nawaf.aldaadi+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'hashimi',
    patronymic: 'علي',
    surname: 'الهاشمي',
    children: [{ firstName: 'شهد', gender: 'FEMALE', classKey: 'kg_a' }],
    guardians: [
      parent('إيمان', 'خالد الهاشمي', 'eman.alhashimi+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'fahd',
    patronymic: 'سالم',
    surname: 'الفهد',
    children: [{ firstName: 'حاتم', gender: 'MALE', classKey: 'kg_b' }],
    guardians: [
      parent('سالم', 'محمد الفهد', 'salem.alfahd+guardian@demo.local', 'FATHER', { primary: true }),
    ],
  },
  {
    key: 'abadi',
    patronymic: 'عبدالعزيز',
    surname: 'العبادي',
    children: [{ firstName: 'بيان', gender: 'FEMALE', classKey: 'kg_b' }],
    guardians: [
      parent('نوال', 'عبدالعزيز العبادي', 'nawal.alabadi+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'sahli',
    patronymic: 'حسن',
    surname: 'السهلي',
    children: [{ firstName: 'وليد', gender: 'MALE', classKey: 'kg_b' }],
    guardians: [
      parent('حسن', 'إبراهيم السهلي', 'hassan.alsahli+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'bariqi',
    patronymic: 'تركي',
    surname: 'البارقي',
    children: [{ firstName: 'شوق', gender: 'FEMALE', classKey: 'kg_b' }],
    guardians: [
      parent('شذى', 'تركي البارقي', 'shatha.albariqi+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'ali',
    patronymic: 'يوسف',
    surname: 'العلي',
    children: [{ firstName: 'ماجد', gender: 'MALE', classKey: 'kg_b' }],
    guardians: [
      parent('يوسف', 'ناصر العلي', 'yousef.alali+guardian@demo.local', 'FATHER', { primary: true }),
    ],
  },
  {
    key: 'shehri',
    patronymic: 'ناصر',
    surname: 'الشهري',
    children: [{ firstName: 'جهاد', gender: 'MALE', classKey: 'kg_b' }],
    guardians: [
      parent('فاطمة', 'ناصر الشهري', 'fatimah.alshehri+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'amri',
    patronymic: 'فهد',
    surname: 'العمري',
    children: [{ firstName: 'ندى', gender: 'FEMALE', classKey: 'nursery' }],
    guardians: [
      parent('وفاء', 'سعد العمري', 'wafa.alamri+guardian@demo.local', 'MOTHER', { primary: true }),
    ],
  },
  {
    key: 'salmi',
    patronymic: 'عمر',
    surname: 'السلمي',
    children: [{ firstName: 'نايف', gender: 'MALE', classKey: 'primary' }],
    guardians: [
      parent('عمر', 'حسن السلمي', 'omar.alsalmi+guardian@demo.local', 'FATHER', { primary: true }),
    ],
  },
  {
    key: 'nuaimi',
    patronymic: 'ياسر',
    surname: 'النعيمي',
    children: [{ firstName: 'فيصل', gender: 'MALE', classKey: 'primary' }],
    guardians: [
      parent('ياسر', 'سالم النعيمي', 'yasser.alnuaimi+guardian@demo.local', 'FATHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'rashid',
    patronymic: 'فهد',
    surname: 'الراشد',
    children: [{ firstName: 'ديما', gender: 'FEMALE', classKey: 'kg_nada' }],
    guardians: [
      parent('أمل', 'سامي الراشد', 'amal.alrashid+guardian@demo.local', 'MOTHER', {
        primary: true,
      }),
    ],
  },
  {
    key: 'tuwairqi',
    patronymic: 'ماجد',
    surname: 'الطويرقي',
    children: [{ firstName: 'سندس', gender: 'FEMALE', classKey: 'kg_nada' }],
    guardians: [
      parent('هيفاء', 'علي الطويرقي', 'haifa.altuwairqi+guardian@demo.local', 'LEGAL_GUARDIAN', {
        primary: true,
      }),
    ],
  },
];

export const NO_BUS = [
  childKey('baqmi', 'إياد'),
  childKey('daadi', 'قصي'),
  childKey('hashimi', 'شهد'),
  childKey('bariqi', 'شوق'),
  childKey('ali', 'ماجد'),
  childKey('shehri', 'جهاد'),
  childKey('amri', 'ندى'),
  childKey('shahrani', 'غلا'),
  childKey('salmi', 'نايف'),
  childKey('nuaimi', 'فيصل'),
  childKey('rashid', 'ديما'),
  childKey('tuwairqi', 'سندس'),
];

export const MORNING_BUS_AFTERNOON_PARENT = [
  childKey('qahtani', 'خالد'),
  childKey('mutairi', 'حسن'),
  childKey('qahtani', 'عبدالعزيز'),
  childKey('anazi', 'جنى'),
  childKey('asiri', 'رغد'),
];

export const MORNING_PARENT_AFTERNOON_BUS = [
  childKey('fayez', 'قصي'),
  childKey('juhani', 'زياد'),
  childKey('fayez', 'أروى'),
  childKey('juhani', 'تالا'),
];

export const ROUTE_A_STOPS = [
  'حي الربيع',
  'برج الياسمين',
  'شارع التحلية',
  'مجمع النخبة',
  'واحة الصفوة',
  'عمارة الورد',
];

export const ROUTE_A_SEGMENT_MINUTES = [4, 3, 5, 2, 4];

export const ROUTE_A_MORNING: Record<string, string[]> = {
  'حي الربيع': [childKey('subaie', 'تسنيم'), childKey('asiri', 'أنس')],
  'برج الياسمين': [
    childKey('otaibi', 'آدم'),
    childKey('harbi', 'ليان'),
    childKey('qahtani', 'خالد'),
  ],
  'شارع التحلية': [childKey('shahrani', 'إياد'), childKey('ajmi', 'غلا')],
  'مجمع النخبة': [childKey('salem', 'نواف'), childKey('ghamdi', 'طارق')],
  'واحة الصفوة': [childKey('harithi', 'ليث'), childKey('malki', 'راكان')],
  'عمارة الورد': [
    childKey('ghamdi', 'لين'),
    childKey('qarni', 'أنس'),
    childKey('anazi', 'كريم'),
    childKey('saadi', 'سلطان'),
  ],
};

export const SHARED_STOPS = ['برج الياسمين', 'مجمع النخبة', 'عمارة الورد'] as const;

export const ROUTE_B_STOPS = [
  'حي الورود',
  'مجمع الأندلس',
  'شارع الملك عبدالله',
  'حي النسيم',
  'محطة الجامعة',
];

export const ROUTE_C_STOPS = ['حي الفيصلية', 'برج السلام', 'طريق الملك فهد', 'مجمع النور'];

export const JOURNEY_SCENARIOS = {
  onRoute: childKey('otaibi', 'آدم'),
  atSchool: childKey('shamri', 'مازن'),
  arrivedByCar: childKey('fayez', 'قصي'),
  absent: childKey('harbi', 'يوسف'),
  afternoonBusExpected: childKey('zahrani', 'عمر'),
  parentPickup: childKey('shamri', 'ريناد'),
  busCancelled: childKey('malki', 'راكان'),
  missedThenCar: childKey('harithi', 'ليث'),
  authorizedPickup: childKey('salem', 'دانة'),
};

export const DAILY_OVERRIDES = {
  cancelMorningToday: childKey('malki', 'راكان'),
  cancelAfternoonToday: childKey('salem', 'نواف'),
  cancelThreeDays: childKey('rashidi', 'رزان'),
};

export const PREFERENCE_USERS = {
  allOnEmail: 'mohammed.alotaibi+guardian@demo.local',
  mixedEmail: 'sara.aldosari+guardian@demo.local',
};

export const DEVICE_TOKEN_EMAILS = [
  'mohammed.alotaibi+guardian@demo.local',
  'areej.almalki+guardian@demo.local',
];

export const MEDIA_MULTIPLE = [childKey('otaibi', 'آدم'), childKey('otaibi', 'سارة')];
export const MEDIA_SINGLE_EXTRA = [
  childKey('harbi', 'ليان'),
  childKey('qahtani', 'خالد'),
  childKey('ghamdi', 'طارق'),
  childKey('qarni', 'أنس'),
  childKey('shamri', 'مازن'),
  childKey('zahrani', 'عمر'),
];

const CLASS_ORDER: ClassKey[] = ['kg_a', 'kg_b', 'nursery', 'primary', 'kg_nada'];

const DOB_START: Record<ClassKey, string> = {
  nursery: '2023-11-02',
  kg_a: '2021-02-03',
  kg_b: '2020-09-15',
  primary: '2018-08-20',
  kg_nada: '2021-06-01',
};

export interface CatalogStudent {
  familyKey: string;
  firstName: string;
  lastName: string;
  gender: StudentGender;
  classKey: ClassKey;
  studentNumber: string;
  dateOfBirth: Date;
}

function addDays(dateOnly: string, days: number): Date {
  const [year, month, day] = dateOnly.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days));
}

export function catalogStudents(): CatalogStudent[] {
  const byClass: Record<ClassKey, CatalogStudent[]> = {
    kg_a: [],
    kg_b: [],
    nursery: [],
    primary: [],
    kg_nada: [],
  };
  for (const family of FAMILIES) {
    for (const child of family.children) {
      byClass[child.classKey].push({
        familyKey: family.key,
        firstName: child.firstName,
        lastName: `${family.patronymic} ${family.surname}`,
        gender: child.gender,
        classKey: child.classKey,
        studentNumber: '',
        dateOfBirth: new Date(0),
      });
    }
  }
  const result: CatalogStudent[] = [];
  let n = 1;
  for (const classKey of CLASS_ORDER) {
    byClass[classKey].forEach((student, index) => {
      student.studentNumber = `STU-${String(n).padStart(4, '0')}`;
      student.dateOfBirth = addDays(DOB_START[classKey], index);
      result.push(student);
      n += 1;
    });
  }
  return result;
}

export function familyByKey(key: string): FamilySpec {
  const family = FAMILIES.find((row) => row.key === key);
  if (!family) {
    throw new Error(`Unknown family ${key}`);
  }
  return family;
}

export function allCatalogPeople(): { firstName: string; lastName: string; email?: string }[] {
  const people: { firstName: string; lastName: string; email?: string }[] = [];
  for (const admin of STAFF.admins) people.push(admin);
  for (const supervisor of STAFF.supervisors) people.push(supervisor);
  for (const teacher of STAFF.teachers) people.push(teacher);
  for (const driver of STAFF.drivers) people.push(driver);
  for (const family of FAMILIES) {
    for (const guardian of family.guardians) people.push(guardian);
    for (const pickup of family.pickup ?? []) people.push(pickup);
    for (const child of family.children) {
      people.push({
        firstName: child.firstName,
        lastName: `${family.patronymic} ${family.surname}`,
      });
    }
  }
  return people;
}

export function catalogEmails(): string[] {
  return allCatalogPeople()
    .map((person) => person.email)
    .filter((email): email is string => Boolean(email));
}

export function assertCatalog(): void {
  const errors: string[] = [];
  const counts: Record<ClassKey, number> = {
    kg_a: 0,
    kg_b: 0,
    nursery: 0,
    primary: 0,
    kg_nada: 0,
  };
  for (const family of FAMILIES) {
    for (const child of family.children) {
      counts[child.classKey] += 1;
    }
  }
  for (const classroom of CLASSROOMS) {
    if (counts[classroom.key] !== classroom.size) {
      errors.push(
        `${classroom.key} has ${counts[classroom.key]} children, expected ${classroom.size}`,
      );
    }
  }
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  if (total !== 63) {
    errors.push(`total students ${total}, expected 63`);
  }
  if (counts.kg_a + counts.kg_b + counts.nursery + counts.primary !== 53) {
    errors.push('campus 1 student count is not 53');
  }
  if (counts.kg_nada !== 10) {
    errors.push('campus 2 student count is not 10');
  }

  const names = new Map<string, string>();
  for (const person of allCatalogPeople()) {
    const full = `${person.firstName} ${person.lastName}`;
    const prev = names.get(full);
    if (prev) {
      errors.push(`duplicate full name ${full}`);
    }
    names.set(full, full);
  }

  const emails = new Map<string, string>();
  for (const email of catalogEmails()) {
    const normalized = email.toLowerCase();
    if (emails.has(normalized)) {
      errors.push(`duplicate email ${email}`);
    }
    emails.set(normalized, email);
    if (!normalized.endsWith('@demo.local')) {
      errors.push(`non-demo email ${email}`);
    }
  }

  const students = catalogStudents();
  const numbers = new Set(students.map((row) => row.studentNumber));
  if (numbers.size !== 63) {
    errors.push('student numbers are not unique');
  }
  const dobs = new Set(students.map((row) => row.dateOfBirth.toISOString()));
  if (dobs.size !== 63) {
    errors.push('dates of birth are not unique');
  }

  const studentKeys = new Set(students.map((row) => childKey(row.familyKey, row.firstName)));
  for (const key of [
    ...NO_BUS,
    ...MORNING_BUS_AFTERNOON_PARENT,
    ...MORNING_PARENT_AFTERNOON_BUS,
    ...Object.values(JOURNEY_SCENARIOS),
    ...Object.values(DAILY_OVERRIDES),
    ...MEDIA_MULTIPLE,
    ...MEDIA_SINGLE_EXTRA,
  ]) {
    if (!studentKeys.has(key)) {
      errors.push(`unknown child key ${key}`);
    }
  }

  const overlap = NO_BUS.filter((key) =>
    [...MORNING_BUS_AFTERNOON_PARENT, ...MORNING_PARENT_AFTERNOON_BUS].includes(key),
  );
  if (overlap.length) {
    errors.push(`no-bus overlap ${overlap.join(', ')}`);
  }

  const routeAKids = Object.values(ROUTE_A_MORNING).flat();
  if (new Set(routeAKids).size !== routeAKids.length) {
    errors.push('duplicate Route A assignments');
  }
  for (const key of routeAKids) {
    if (!studentKeys.has(key)) errors.push(`Route A unknown child ${key}`);
    if (NO_BUS.includes(key)) errors.push(`Route A includes no-bus child ${key}`);
    if (MORNING_PARENT_AFTERNOON_BUS.includes(key)) {
      errors.push(`Route A morning includes afternoon-only child ${key}`);
    }
  }
  if (ROUTE_A_MORNING['برج الياسمين']?.length !== 3) {
    errors.push('برج الياسمين must have 3 children');
  }
  if (ROUTE_A_MORNING['مجمع النخبة']?.length !== 2) {
    errors.push('مجمع النخبة must have 2 children');
  }
  if (ROUTE_A_MORNING['عمارة الورد']?.length !== 4) {
    errors.push('عمارة الورد must have 4 children');
  }

  const guardianUsers = new Set<string>();
  for (const family of FAMILIES) {
    for (const guardian of [...family.guardians, ...(family.pickup ?? [])]) {
      guardianUsers.add(guardian.email);
    }
    if (family.children.length === 0 || family.guardians.length === 0) {
      errors.push(`family ${family.key} missing guardians or children`);
    }
  }
  if (guardianUsers.size < 45 || guardianUsers.size > 55) {
    errors.push(`guardian users ${guardianUsers.size} not in 45–55`);
  }

  if (errors.length) {
    throw new Error(`Seed catalog invalid:\n${errors.join('\n')}`);
  }
}

assertCatalog();
