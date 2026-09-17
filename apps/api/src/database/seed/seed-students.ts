import { CLASSROOMS, catalogStudents, type CampusKey } from './catalog';
import { StudentModel } from '../../modules/students/student.model';
import { randomQrToken } from '../../modules/students/student.repository';
import { childKey, upsert } from './seed-helpers';
import type { SeedIds } from './seed-types';

export async function seedStudents(ids: SeedIds): Promise<void> {
  const catalog = catalogStudents();
  const keepNumbers = catalog.map((row) => row.studentNumber);
  const campusByClass = Object.fromEntries(
    CLASSROOMS.map((row) => [row.key, row.campusKey]),
  ) as Record<(typeof CLASSROOMS)[number]['key'], CampusKey>;

  for (const student of catalog) {
    const campusKey = campusByClass[student.classKey];
    const campusId = ids.campuses[campusKey];
    const classroomId = ids.classrooms[student.classKey];
    const doc = await upsert(
      StudentModel,
      { organizationId: ids.organizationId, studentNumber: student.studentNumber },
      {
        organizationId: ids.organizationId,
        campusId,
        classroomId,
        firstName: student.firstName,
        lastName: student.lastName,
        dateOfBirth: student.dateOfBirth,
        gender: student.gender,
        studentNumber: student.studentNumber,
        status: 'ACTIVE',
      },
      { qrToken: randomQrToken() },
    );
    const seeded = {
      ...student,
      id: doc._id,
      campusId,
      classroomId,
      campusKey,
    };
    ids.students.push(seeded);
    ids.studentsByKey.set(childKey(student.familyKey, student.firstName), seeded);
  }

  await StudentModel.deleteMany({
    organizationId: ids.organizationId,
    studentNumber: { $nin: keepNumbers },
  });
}
