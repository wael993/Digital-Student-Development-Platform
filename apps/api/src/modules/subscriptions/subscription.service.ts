import { CampusModel } from '../campuses/campus.model';
import { ClassroomModel } from '../classrooms/classroom.model';
import { BusModel } from '../buses/bus.model';
import { StudentModel } from '../students/student.model';
import { UserModel } from '../users/user.model';
import {
  findOrganizationById,
  updateOrganization,
} from '../organizations/organization.repository';
import {
  type PlanCode,
  type SubscriptionStatus,
  isOrganizationOperational,
} from '../organizations/organization.model';
import { AppError } from '../../utils/appError';
import { notFound } from '../../utils/validate';

export type PlanLimits = {
  maxCampuses: number;
  maxStudents: number;
  maxUsers: number;
  maxBuses: number;
  features: {
    busTracking: boolean;
    media: boolean;
    notifications: boolean;
    aiAssistant: boolean;
  };
};

/** note: hardcoded plan catalog until TenantPlan collection (Slice 2). */
export const PLAN_CATALOG: Record<PlanCode, PlanLimits> = {
  STARTER: {
    maxCampuses: 1,
    maxStudents: 100,
    maxUsers: 25,
    maxBuses: 2,
    features: {
      busTracking: true,
      media: true,
      notifications: true,
      aiAssistant: false,
    },
  },
  PROFESSIONAL: {
    maxCampuses: 5,
    maxStudents: 500,
    maxUsers: 150,
    maxBuses: 15,
    features: {
      busTracking: true,
      media: true,
      notifications: true,
      aiAssistant: false,
    },
  },
  ENTERPRISE: {
    maxCampuses: 50,
    maxStudents: 10_000,
    maxUsers: 2_000,
    maxBuses: 200,
    features: {
      busTracking: true,
      media: true,
      notifications: true,
      aiAssistant: true,
    },
  },
};

export type TenantUsage = {
  campusCount: number;
  classroomCount: number;
  studentCount: number;
  userCount: number;
  teacherCount: number;
  driverCount: number;
  supervisorCount: number;
  guardianCount: number;
  adminCount: number;
  busCount: number;
};

export async function getOrganizationOrThrow(organizationId: string) {
  const organization = await findOrganizationById(organizationId);
  if (!organization) {
    throw notFound();
  }
  return organization;
}

export function getPlan(planCode: PlanCode): PlanLimits {
  return PLAN_CATALOG[planCode];
}

export async function getUsage(organizationId: string): Promise<TenantUsage> {
  const [
    campusCount,
    classroomCount,
    studentCount,
    userCount,
    teacherCount,
    driverCount,
    supervisorCount,
    guardianCount,
    adminCount,
    busCount,
  ] = await Promise.all([
    CampusModel.countDocuments({ organizationId }),
    ClassroomModel.countDocuments({ organizationId }),
    StudentModel.countDocuments({ organizationId }),
    UserModel.countDocuments({ organizationId }),
    UserModel.countDocuments({ organizationId, role: 'TEACHER' }),
    UserModel.countDocuments({ organizationId, role: 'DRIVER' }),
    UserModel.countDocuments({ organizationId, role: 'SUPERVISOR' }),
    UserModel.countDocuments({ organizationId, role: 'GUARDIAN' }),
    UserModel.countDocuments({ organizationId, role: 'ADMIN' }),
    BusModel.countDocuments({ organizationId }),
  ]);
  return {
    campusCount,
    classroomCount,
    studentCount,
    userCount,
    teacherCount,
    driverCount,
    supervisorCount,
    guardianCount,
    adminCount,
    busCount,
  };
}

export async function assertCanOperate(organizationId: string): Promise<void> {
  const organization = await getOrganizationOrThrow(organizationId);
  if (!isOrganizationOperational(organization.status)) {
    throw new AppError(403, 'TENANT_SUSPENDED', 'Organization account is not operational');
  }
}

export async function canCreateCampus(organizationId: string): Promise<boolean> {
  const organization = await getOrganizationOrThrow(organizationId);
  if (!isOrganizationOperational(organization.status)) {
    return false;
  }
  const plan = getPlan(organization.planCode);
  const count = await CampusModel.countDocuments({ organizationId });
  return count < plan.maxCampuses;
}

export async function canCreateStudent(organizationId: string): Promise<boolean> {
  const organization = await getOrganizationOrThrow(organizationId);
  if (!isOrganizationOperational(organization.status)) {
    return false;
  }
  const plan = getPlan(organization.planCode);
  const count = await StudentModel.countDocuments({ organizationId });
  return count < plan.maxStudents;
}

export async function canCreateUser(organizationId: string): Promise<boolean> {
  const organization = await getOrganizationOrThrow(organizationId);
  if (!isOrganizationOperational(organization.status)) {
    return false;
  }
  const plan = getPlan(organization.planCode);
  const count = await UserModel.countDocuments({ organizationId });
  return count < plan.maxUsers;
}

export async function canCreateBus(organizationId: string): Promise<boolean> {
  const organization = await getOrganizationOrThrow(organizationId);
  if (!isOrganizationOperational(organization.status)) {
    return false;
  }
  const plan = getPlan(organization.planCode);
  const count = await BusModel.countDocuments({ organizationId });
  return count < plan.maxBuses;
}

export async function canUseFeature(
  organizationId: string,
  feature: keyof PlanLimits['features'],
): Promise<boolean> {
  const organization = await getOrganizationOrThrow(organizationId);
  if (!isOrganizationOperational(organization.status)) {
    return false;
  }
  return getPlan(organization.planCode).features[feature];
}

export async function canUseBusModule(organizationId: string): Promise<boolean> {
  return canUseFeature(organizationId, 'busTracking');
}

export async function assertCanCreateCampus(organizationId: string): Promise<void> {
  if (!(await canCreateCampus(organizationId))) {
    throw new AppError(403, 'PLAN_LIMIT', 'Campus limit reached for this plan');
  }
}

export async function assertCanCreateStudent(organizationId: string): Promise<void> {
  if (!(await canCreateStudent(organizationId))) {
    throw new AppError(403, 'PLAN_LIMIT', 'Student limit reached for this plan');
  }
}

export async function updateSubscription(
  organizationId: string,
  patch: {
    planCode?: PlanCode;
    subscriptionStatus?: SubscriptionStatus;
    subscriptionStartedAt?: Date | null;
    subscriptionEndsAt?: Date | null;
    trialEndsAt?: Date | null;
  },
) {
  const organization = await updateOrganization(organizationId, patch);
  if (!organization) {
    throw notFound();
  }
  return organization;
}
