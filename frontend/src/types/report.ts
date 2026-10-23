/**
 * TypeScript types for SafeSignal report and workflow state.
 */

export type CategoryId =
  | 'THREAT_TO_SHARE_IMAGES'
  | 'MONEY_DEMAND'
  | 'THREAT_TO_CONTACT_OTHERS'
  | 'COERCION_FOR_MORE_CONTENT'
  | 'SUSPECTED_NON_CONSENSUAL_RECORDING'
  | 'SUSPECTED_AI_GENERATED_IMAGERY'
  | 'IMPERSONATION_OR_FAKE_PROFILE'
  | 'INSUFFICIENT_INFORMATION'

export type Likelihood = 'stated' | 'likely' | 'possible'

export type DetailKind =
  | 'date_time'
  | 'platform'
  | 'username'
  | 'money_demand'
  | 'image_demand'
  | 'threat'
  | 'deadline'
  | 'payment_method'
  | 'other'

export type Source = 'user_description' | 'evidence_text'

export type Basis = 'stated' | 'inferred'

export type Certainty = 'stated' | 'approximate' | 'unknown' | 'conflicting'

export type RiskLevel = 'routine' | 'elevated' | 'urgent'

export type Urgency = 'now' | 'today' | 'soon'

export type Relevance = 'high' | 'medium' | 'low'

export type ResourceId =
  | 'NCRP'
  | 'HELPLINE_1930'
  | 'ERSS_112'
  | 'CHILDLINE_1098'
  | 'WOMEN_181'
  | 'STOPNCII'
  | 'TAKE_IT_DOWN'
  | 'META_NCII'

export interface IncidentDetails {
  incident_when?: string | null
  platform?: string | null
  threat_types: CategoryId[]
  money_demanded?: boolean | null
  more_images_demanded?: boolean | null
  immediate_disclosure_threat?: boolean | null
  feels_physically_unsafe?: boolean | null
  may_be_under_18?: boolean | null
}

export interface AnalyzeRequest {
  description: string
  evidence_text?: string | null
  details: IncidentDetails
  consent_ai_processing: boolean
}

export interface CategoryItem {
  id: CategoryId
  likelihood: Likelihood
  rationale: string
}

export interface ExtractedDetail {
  kind: DetailKind
  label: string
  value: string
  source: Source
  basis: Basis
}

export interface TimelineItem {
  when_text?: string | null
  event: string
  source: Source
  certainty: Certainty
}

export interface MissingInfoItem {
  question: string
  why_it_matters: string
}

export interface RiskAssessment {
  level: RiskLevel
  factors: string[]
  physical_danger_mentioned: boolean
  self_harm_mentioned: boolean
  possible_minor: boolean
}

export interface ActionItem {
  priority: number
  title: string
  why: string
  urgency: Urgency
  resource_ids: ResourceId[]
}

export interface EvidenceItem {
  item: string
  how_to_preserve: string
  suggested_filename?: string | null
  relevance: Relevance
}

export interface IncidentReport {
  summary: string
  categories: CategoryItem[]
  extracted_details: ExtractedDetail[]
  timeline: TimelineItem[]
  missing_information: MissingInfoItem[]
  risk: RiskAssessment
  actions: ActionItem[]
  evidence_items: EvidenceItem[]
  limitations: string[]
}

export interface SafetyFlags {
  physical_danger: boolean
  self_harm: boolean
  possible_minor: boolean
}

export interface Resource {
  id: ResourceId
  title: string
  kind: 'link' | 'phone'
  value: string
  purpose: string
  when: string
  limitations: string
  last_checked: string
}

export interface AnalyzeResponse {
  request_id: string
  source: 'gemini' | 'sample'
  model: string | null
  paid_tier: boolean
  generated_at: string
  report: IncidentReport
  safety: SafetyFlags
  resources: Resource[]
}

export interface HealthResponse {
  ai_configured: boolean
  paid_tier: boolean
}

export interface ApiError {
  code: string
  message: string
  request_id?: string
  retryAfter?: number
}

// Client review states for interactive editing
export interface ReviewedDetail {
  id: string
  original: ExtractedDetail
  include: boolean
  confirmed: boolean
  valueOverride?: string
}

export interface ReviewedTimeline {
  id: string
  original: TimelineItem
  include: boolean
}

export interface ReviewedEvidence {
  id: string
  original: EvidenceItem
  include: boolean
  confirmed: boolean
}

export interface ReviewedAction {
  id: string
  original: ActionItem
  include: boolean
}
