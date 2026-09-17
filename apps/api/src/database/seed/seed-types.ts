import type mongoose from 'mongoose';
import type { CampusKey, ClassKey, CatalogStudent } from './catalog';

export interface SeedIds {
  organizationId: mongoose.Types.ObjectId;
  timezone: string;
  today: string;
  campuses: Record<CampusKey, mongoose.Types.ObjectId>;
  classrooms: Record<ClassKey, mongoose.Types.ObjectId>;
  admins: mongoose.Types.ObjectId[];
  supervisors: Record<CampusKey, mongoose.Types.ObjectId>;
  teachers: Record<ClassKey, mongoose.Types.ObjectId>;
  drivers: mongoose.Types.ObjectId[];
  usersByEmail: Map<string, mongoose.Types.ObjectId>;
  students: Array<
    CatalogStudent & {
      id: mongoose.Types.ObjectId;
      campusId: mongoose.Types.ObjectId;
      classroomId: mongoose.Types.ObjectId;
      campusKey: CampusKey;
    }
  >;
  studentsByKey: Map<
    string,
    CatalogStudent & {
      id: mongoose.Types.ObjectId;
      campusId: mongoose.Types.ObjectId;
      classroomId: mongoose.Types.ObjectId;
      campusKey: CampusKey;
    }
  >;
  routes: {
    aMorning: mongoose.Types.ObjectId;
    aAfternoon: mongoose.Types.ObjectId;
    bMorning: mongoose.Types.ObjectId;
    bAfternoon: mongoose.Types.ObjectId;
    cMorning: mongoose.Types.ObjectId;
    cAfternoon: mongoose.Types.ObjectId;
  };
}

export interface SeedSummary {
  organization: number;
  campuses: number;
  classrooms: number;
  students: number;
  teachers: number;
  admins: number;
  supervisors: number;
  guardians: number;
  drivers: number;
  buses: number;
  routes: number;
  stops: number;
  guardianRelationships: number;
  authorizedPickupPeople: number;
  attendanceRecords: number;
  journeyEvents: number;
  notifications: number;
  mediaRecords: number;
}
