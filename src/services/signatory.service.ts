import { get, post, put, del } from './api';

// ─── Types ─────────────────────────────────────────────────────────────

export interface SigTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  regulatoryBody: string;
  templateVersion?: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  status: 'Active' | 'Inactive' | 'Retired';
}

export interface SigDiscipline {
  id: number;
  disciplineCode: string;
  disciplineName: string;
  groupType: 'Chemical' | 'Biological' | 'Mechanical' | 'Statutory';
  nablScopeCode?: string | null;
  status: 'Active' | 'Inactive';
}

export interface Signatory {
  id: number;
  employeeId: string;
  fullName: string;
  designation?: string | null;
  qualification?: string | null;
  unit: string;
  email?: string | null;
  phone?: string | null;
  status: 'Active' | 'Inactive' | 'Suspended';
  dateOfJoining?: string | null;
  dateOfExit?: string | null;
  userId?: number | null;
}

export interface Authority {
  id: number;
  signatoryId: number;
  templateId: number;
  disciplineId: number;
  unit: string;
  authorisedFrom: string;
  authorisedTo: string;
  authorisedBy?: number | null;
  competenceEvidence?: string | null;
  authorityStatus: 'Active' | 'Withdrawn' | 'Expired';
  withdrawnReason?: string | null;
  withdrawnOn?: string | null;
  signatory?: Signatory;
  template?: SigTemplate;
  discipline?: SigDiscipline;
}

export interface Substitution {
  id: number;
  primaryAuthorityId: number;
  substituteAuthorityId: number;
  priority: 1 | 2 | 3;
  primary?: Authority;
  substitute?: Authority;
}

export interface Absence {
  id: number;
  signatoryId: number;
  absentFrom: string;
  absentTo: string;
  reason?: string | null;
  source: 'HR_SYNC' | 'MANUAL' | 'AUTO';
  notificationSent: boolean;
  signatory?: Signatory;
}

export interface AuditLogRow {
  id: number;
  reportId: string;
  templateId: number;
  disciplineId: number;
  signatoryId: number | null;
  authorityId: number | null;
  signedOnBehalfOf: number | null;
  signedAt: string;
  signatureMethod: string | null;
  signatureHash: string | null;
  ipAddress: string | null;
  result: 'SUCCESS' | 'REJECTED';
  rejectReason: string | null;
  signatory?: Signatory | null;
  principal?: Signatory | null;
  template?: SigTemplate;
  discipline?: SigDiscipline;
}

export interface CoverageCell {
  templateId: number; templateCode: string; templateName: string;
  disciplineId: number; disciplineCode: string; disciplineName: string;
  status: 'GREEN' | 'AMBER' | 'RED';
  active?: number; activeName?: string | null;
  authorityId?: number;
  coveringFor?: number | null; coveringForName?: string | null;
  priority?: number;
  reason?: string;
}

export interface CoverageReport {
  unit: string;
  date: string;
  summary: { green: number; amber: number; red: number };
  cells: CoverageCell[];
}

export interface MatrixData {
  unit: string;
  date: string;
  templates: SigTemplate[];
  disciplines: SigDiscipline[];
  signatories: Signatory[];
  authorities: Authority[];
}

export interface ProfileResponse {
  signatory: Signatory;
  authorities: Authority[];
  absences: Absence[];
  substitutes: Substitution[];
  history: AuditLogRow[];
}

interface ApiRes<T> { success: boolean; message: string; data: T }

// ─── Calls ─────────────────────────────────────────────────────────────

const unwrap = <T>(p: Promise<ApiRes<T>>) => p.then((r) => r.data);

export const signatoryApi = {
  // Masters
  listTemplates:    () => unwrap(get<ApiRes<SigTemplate[]>>('/signatories/templates')),
  createTemplate:   (b: Partial<SigTemplate>) => unwrap(post<ApiRes<SigTemplate>>('/signatories/templates', b)),
  updateTemplate:   (id: number, b: Partial<SigTemplate>) => unwrap(put<ApiRes<SigTemplate>>(`/signatories/templates/${id}`, b)),
  deleteTemplate:   (id: number) => unwrap(del<ApiRes<null>>(`/signatories/templates/${id}`)),

  listDisciplines:  () => unwrap(get<ApiRes<SigDiscipline[]>>('/signatories/disciplines')),
  createDiscipline: (b: Partial<SigDiscipline>) => unwrap(post<ApiRes<SigDiscipline>>('/signatories/disciplines', b)),
  updateDiscipline: (id: number, b: Partial<SigDiscipline>) => unwrap(put<ApiRes<SigDiscipline>>(`/signatories/disciplines/${id}`, b)),

  // Signatories
  listSignatories:  (q?: { unit?: string; status?: string; search?: string }) =>
    unwrap(get<ApiRes<Signatory[]>>('/signatories/signatories', { params: q })),
  getProfile:       (id: number) => unwrap(get<ApiRes<ProfileResponse>>(`/signatories/signatories/${id}`)),
  createSignatory:  (b: Partial<Signatory>) => unwrap(post<ApiRes<Signatory>>('/signatories/signatories', b)),
  updateSignatory:  (id: number, b: Partial<Signatory>) => unwrap(put<ApiRes<Signatory>>(`/signatories/signatories/${id}`, b)),

  // Authorities
  listAuthorities:  (q?: { templateId?: number; disciplineId?: number; unit?: string; signatoryId?: number; status?: string }) =>
    unwrap(get<ApiRes<Authority[]>>('/signatories/authorities', { params: q })),
  createAuthority:  (b: Partial<Authority>) => unwrap(post<ApiRes<Authority>>('/signatories/authorities', b)),
  updateAuthority:  (id: number, b: Partial<Authority>) => unwrap(put<ApiRes<Authority>>(`/signatories/authorities/${id}`, b)),
  withdrawAuthority:(id: number, reason: string) => unwrap(post<ApiRes<Authority>>(`/signatories/authorities/${id}/withdraw`, { reason })),

  // Substitutions
  listSubstitutions: (primaryAuthorityId?: number) =>
    unwrap(get<ApiRes<Substitution[]>>('/signatories/substitutions', { params: { primaryAuthorityId } })),
  createSubstitution: (b: { primaryAuthorityId: number; substituteAuthorityId: number; priority: 1 | 2 | 3 }) =>
    unwrap(post<ApiRes<Substitution>>('/signatories/substitutions', b)),
  deleteSubstitution: (id: number) => unwrap(del<ApiRes<null>>(`/signatories/substitutions/${id}`)),

  // Absences
  listAbsences:    (q?: { signatoryId?: number; from?: string; to?: string }) =>
    unwrap(get<ApiRes<Absence[]>>('/signatories/absences', { params: q })),
  createAbsence:   (b: Partial<Absence>) => unwrap(post<ApiRes<Absence>>('/signatories/absences', b)),
  deleteAbsence:   (id: number) => unwrap(del<ApiRes<null>>(`/signatories/absences/${id}`)),

  // Matrix + coverage
  matrix:          (unit = 'Delhi', date?: string) =>
    unwrap(get<ApiRes<MatrixData>>('/signatories/matrix', { params: { unit, date } })),
  coverage:        (unit = 'Delhi', date?: string) =>
    unwrap(get<ApiRes<CoverageReport>>('/signatories/coverage', { params: { unit, date } })),

  // Audit
  audit:           (q?: { signatoryId?: number; reportId?: string; result?: string; page?: number; limit?: number }) =>
    get<{ success: boolean; data: AuditLogRow[]; pagination: { total: number } }>('/signatories/audit', { params: q }),
};
