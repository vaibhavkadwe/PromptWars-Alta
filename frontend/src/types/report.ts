/**
 * TypeScript types for SafeSignal ComplaintDraft architecture and resources.
 */

export type AccountIdentifierKind = 'username' | 'phone' | 'email' | 'upi_id' | 'url' | 'other'

export type Source = 'user_description' | 'evidence_text'

export type Certainty = 'stated' | 'approximate' | 'unknown' | 'conflicting'

export type MoneyTransferred = 'sent' | 'not_sent' | 'not_stated'

export type ResourceId =
  | 'ERSS_112'
  | 'CHILDLINE_1098'
  | 'NCRP'
  | 'HELPLINE_1930'
  | 'STOPNCII'
  | 'TAKE_IT_DOWN'
  | 'META_NCII'

export type VerificationLevel = 'primary' | 'partial' | 'needs_review'

export interface Resource {
  id: ResourceId | string
  name: string
  kind: 'link' | 'phone'
  value: string
  purpose: string
  whenToUse: string
  doesNotCover: string
  verificationSource: string
  verificationLevel: VerificationLevel
  lastChecked: string
}

export interface AccountIdentifier {
  kind: AccountIdentifierKind
  value: string
  source: Source
}

export interface ChronologyItem {
  when_text?: string | null
  event: string
  source: Source
  certainty: Certainty
}

export interface MissingInformationItem {
  item: string
  why: string
}

export interface EvidenceChecklistItem {
  item: string
  how_to_preserve: string
  isAiSuggested?: boolean
}

export interface ActionSuggestionItem {
  title: string
  why: string
  resource_ids: ResourceId[] | string[]
}

export interface ComplaintDraft {
  what_happened: string
  platform_or_service?: string | null
  when_it_happened?: string | null
  account_identifiers: AccountIdentifier[]
  threat_and_demand: string
  demand_amount_or_deadline?: string | null
  money_transferred: MoneyTransferred
  chronology: ChronologyItem[]
  supporting_material_user_has: string[]
  missing_information: MissingInformationItem[]
  evidence_checklist: EvidenceChecklistItem[]
  action_suggestions: ActionSuggestionItem[]
  limitations: string[]
}

export interface SafetyFlags {
  physical_danger: boolean
  self_harm: boolean
}

export interface AnalyzeRequest {
  description: string
  evidence_text?: string | null
  platform?: string | null
  incident_when?: string | null
  money_status?: 'sent' | 'not_sent' | 'unsure' | null
  adult_confirmed: boolean
  consent_ai_processing: boolean
}

export interface AnalyzeResponse {
  request_id: string
  source: 'gemini' | 'sample'
  model: string | null
  paid_tier: boolean
  generated_at: string
  draft: ComplaintDraft
  safety: SafetyFlags
  notices: string[]
  resource_ids: string[]
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
