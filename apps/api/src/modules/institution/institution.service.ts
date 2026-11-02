import { Types } from 'mongoose';
import { Institution, type IInstitution, type InstitutionType } from './institution.model';
import { Installation } from './installation.model';
import { AppError } from '../../middleware/errorHandler';

export interface CreateInstitutionInput {
  name: string;
  code?: string;
  type?: InstitutionType;
  branding?: IInstitution['branding'];
  hierarchyConfig?: Partial<IInstitution['hierarchyConfig']>;
  featureToggles?: Partial<IInstitution['featureToggles']>;
  settings?: Record<string, unknown>;
}

/**
 * Returns the single active Institution for this installation.
 * Throws if zero or more than one non-deleted Institution exists (misconfiguration).
 * Also validates _id === tenantId (fixed-value strategy).
 */
export async function getInstitution(): Promise<IInstitution> {
  const institutions = await Institution.find({ isDeleted: false }).limit(2).exec();

  if (institutions.length === 0) {
    throw new AppError(
      503,
      'Institution not configured. Complete first-run setup.',
      'INSTITUTION_NOT_CONFIGURED'
    );
  }

  if (institutions.length > 1) {
    throw new AppError(
      500,
      'Multiple institutions found. This installation must contain exactly one.',
      'INSTITUTION_MISCONFIGURED'
    );
  }

  const institution = institutions[0];
  if (String(institution._id) !== String(institution.tenantId)) {
    throw new AppError(
      500,
      'Institution identity invalid: _id must equal tenantId.',
      'INSTITUTION_ID_MISMATCH'
    );
  }

  return institution;
}

/**
 * Optional env pin: if INSTITUTION_ID is set it must match the document.
 */
export async function getInstitutionWithOptionalPin(
  envInstitutionId?: string | null
): Promise<IInstitution> {
  const institution = await getInstitution();

  if (envInstitutionId) {
    if (
      String(institution._id) !== envInstitutionId &&
      String(institution.tenantId) !== envInstitutionId
    ) {
      throw new AppError(
        500,
        'INSTITUTION_ID environment variable does not match the database institution.',
        'INSTITUTION_ID_MISMATCH'
      );
    }
  }

  return institution;
}

export async function isInstallationLocked(): Promise<boolean> {
  const state = await Installation.findOne().lean();
  return Boolean(state?.locked);
}

export async function getInstallationState() {
  return Installation.findOne().lean();
}

/**
 * Ensure a single Installation document exists (unlocked).
 * Uses upsert so concurrent callers share the same document.
 */
export async function ensureInstallationDocument() {
  const doc = await Installation.findOneAndUpdate(
    {},
    {
      $setOnInsert: {
        locked: false,
        lockedAt: null,
        institutionId: null,
        setupVersion: '1.0.0',
        completedSteps: [],
      },
    },
    { upsert: true, new: true }
  ).exec();
  return doc;
}

/**
 * Creates the single Institution document.
 * Sets tenantId = the new document's _id (fixed value strategy).
 * Refuses if an Institution already exists or installation is locked.
 *
 * Uses a unique partial index on isDeleted=false to prevent concurrent inserts
 * from creating two active institutions (duplicate key → 409).
 */
export async function createInstitution(
  input: CreateInstitutionInput
): Promise<IInstitution> {
  const locked = await isInstallationLocked();
  if (locked) {
    throw new AppError(403, 'Installation is already completed and locked.', 'INSTALLATION_LOCKED');
  }

  const existing = await Institution.countDocuments({ isDeleted: false });
  if (existing > 0) {
    throw new AppError(
      409,
      'An institution already exists for this installation.',
      'INSTITUTION_EXISTS'
    );
  }

  // Pre-generate ObjectId so tenantId can equal _id
  const id = new Types.ObjectId();

  try {
    const institution = await Institution.create({
      _id: id,
      tenantId: id,
      name: input.name.trim(),
      code: input.code?.trim() || null,
      type: input.type || 'affiliated',
      branding: input.branding || {},
      hierarchyConfig: {
        campus: false,
        school: false,
        department: true,
        program: true,
        academicYear: true,
        semester: true,
        batch: true,
        section: true,
        ...input.hierarchyConfig,
      },
      featureToggles: {
        labs: true,
        placement: true,
        library: true,
        examinations: true,
        admissions: true,
        finance: false,
        research: false,
        hostel: false,
        transport: false,
        ...input.featureToggles,
      },
      settings: input.settings || {},
    });

    if (String(institution._id) !== String(institution.tenantId)) {
      await Institution.deleteOne({ _id: institution._id });
      throw new AppError(
        500,
        'Institution identity invalid after create.',
        'INSTITUTION_ID_MISMATCH'
      );
    }

    return institution;
  } catch (err: unknown) {
    // Duplicate key from concurrent create (unique partial index on isDeleted:false)
    if (
      err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: number }).code === 11000
    ) {
      throw new AppError(
        409,
        'An institution already exists for this installation.',
        'INSTITUTION_EXISTS'
      );
    }
    throw err;
  }
}

/**
 * Permanently lock the installation. Only succeeds if currently unlocked.
 * Returns false if another process already locked it (concurrent setup).
 */
export async function lockInstallation(institutionId: Types.ObjectId): Promise<boolean> {
  await ensureInstallationDocument();

  const result = await Installation.findOneAndUpdate(
    { locked: { $ne: true } },
    {
      $set: {
        locked: true,
        lockedAt: new Date(),
        institutionId,
        setupVersion: '1.0.0',
        completedSteps: ['institution', 'admin', 'lock'],
      },
    },
    { new: true }
  ).exec();

  return Boolean(result?.locked);
}

export async function updateInstitution(
  updates: Partial<CreateInstitutionInput>
): Promise<IInstitution> {
  const institution = await getInstitution();

  if (updates.name !== undefined) institution.name = updates.name.trim();
  if (updates.code !== undefined) institution.code = updates.code?.trim() || null;
  if (updates.type !== undefined) institution.type = updates.type;
  if (updates.branding !== undefined) {
    institution.branding = { ...institution.branding, ...updates.branding };
  }
  if (updates.hierarchyConfig !== undefined) {
    institution.hierarchyConfig = {
      ...institution.hierarchyConfig,
      ...updates.hierarchyConfig,
    };
  }
  if (updates.featureToggles !== undefined) {
    institution.featureToggles = {
      ...institution.featureToggles,
      ...updates.featureToggles,
    };
  }
  if (updates.settings !== undefined) {
    institution.settings = { ...institution.settings, ...updates.settings };
  }

  await institution.save();
  return institution;
}
