/**
 * Rules-based, deterministic, client-side safety triage module.
 * No AI, no network, no randomness.
 * Evaluates the 3 triage questions and outputs an ordered ActionCard (at most 5 items).
 */

export type MoneyAnswer = 'yes' | 'no' | 'not_sure'
export type AgeAnswer = 'yes' | 'no' | 'prefer_not_to_say'
export type DangerAnswer = 'yes' | 'no' | 'not_sure'

export interface TriageAnswers {
  money: MoneyAnswer
  age: AgeAnswer
  danger: DangerAnswer
}

export interface ActionItem {
  id: string
  title: string
  why: string
  resourceIds?: string[]
}

export interface ActionCard {
  items: ActionItem[] // At most 5 items
  resourceIds: string[]
  isAiDisabled: boolean
  isMinorRoute: boolean
  hasUrgentDanger: boolean
  disclaimer: string
}

export function triage(answers: TriageAnswers): ActionCard {
  const { money, age, danger } = answers
  const items: ActionItem[] = []

  const hasUrgentDanger = danger === 'yes' || danger === 'not_sure'
  const isMinorRoute = age === 'yes' || age === 'prefer_not_to_say'
  const isAiDisabled = isMinorRoute // AI and screenshot picker are disabled on the conservative minor route

  // R1: Danger = yes or not_sure -> FIRST item
  if (hasUrgentDanger) {
    if (danger === 'yes') {
      items.push({
        id: 'r1_emergency_danger',
        title: 'Move to a safe place and call 112',
        why: 'If you are in immediate physical danger or have been threatened with physical harm, emergency services can assist you immediately.',
        resourceIds: ['ERSS_112'],
      })
    } else {
      items.push({
        id: 'r1_emergency_not_sure',
        title: 'Move to a safe place and call 112',
        why: 'If you are not sure whether you are in physical danger, it is okay to treat it as urgent and contact emergency services at 112.',
        resourceIds: ['ERSS_112'],
      })
    }
  }

  // R2: Age = yes or prefer_not_to_say ("conservative route")
  if (isMinorRoute) {
    // (a) Safe adult
    items.push({
      id: 'r2_safe_adult',
      title: 'Tell a safe adult you trust',
      why: 'Tell a safe adult you trust — a parent or guardian, another relative, a teacher, or a counsellor. If a parent or guardian might react in a way that is not safe, choose another adult or call Childline 1098 or 112.',
      resourceIds: ['CHILDLINE_1098', 'ERSS_112'],
    })

    // (b) & (c) Do not collect, forward, or duplicate intimate material; safe evidence advice
    items.push({
      id: 'r2_media_safety',
      title: 'Do not forward, upload, or collect intimate images',
      why: 'Do not save, screenshot, download, copy, forward, or send any nude or sexual images or videos of anyone. If some already exist, do not pass them on, and ask a safe adult or an official service how to proceed safely. If an officer asks for material, ask how to share it safely rather than uploading it.',
      resourceIds: [],
    })

    // (d) Take It Down
    items.push({
      id: 'r2_take_it_down',
      title: 'Use Take It Down with a safe adult',
      why: 'Take It Down helps remove explicit images taken when under 18 from participating platforms. The image stays on your device and only a digital fingerprint is shared.',
      resourceIds: ['TAKE_IT_DOWN'],
    })
  }

  // R3 / R3b / R4: Money handling
  if (money === 'yes') {
    // R3: money = yes
    items.push({
      id: 'r3_money_yes',
      title: 'Do not send money, and contact 1930 if already paid',
      why: 'Do not send more money or more images. If money has already been sent, call 1930 quickly and tell your bank or payment app. 1930 is mainly for online financial fraud; if no money was sent, you do not need 1930.',
      resourceIds: ['HELPLINE_1930'],
    })
  } else if (money === 'not_sure') {
    // R3b: money = not sure
    items.push({
      id: 'r3b_money_not_sure',
      title: 'Do not pay demands or send material',
      why: 'Do not send money or more images. If you have already paid, see the 1930 helpline note and alert your payment provider. Note that 1930 is mainly for online financial fraud.',
      resourceIds: ['HELPLINE_1930'],
    })
  } else {
    // R4: money = no -> NEVER mention 1930; point to portal and platform reporting
    items.push({
      id: 'r4_money_no',
      title: 'Do not pay or send material; prepare portal reporting',
      why: 'Do not send money or additional material. You can report the harassment to the National Cyber Crime Reporting Portal and directly on the platform where it occurred.',
      resourceIds: ['NCRP'],
    })
  }

  // R5: Always preserve context (not intimate media) and secure accounts
  items.push({
    id: 'r5_preserve_and_secure',
    title: 'Preserve messages and context, then secure your accounts',
    why: 'Preserve threatening messages, account usernames, URLs, dates, and times before blocking or reporting. Do not reply or confront the sender. Then update your passwords and turn on multi-factor authentication.',
    resourceIds: ['NCRP'],
  })

  // R6: Age = no (Adults only) -> StopNCII
  if (age === 'no') {
    items.push({
      id: 'r6_stopncii',
      title: 'Use StopNCII.org if intimate images exist',
      why: 'If intimate images of you exist and may be shared, StopNCII.org can help protect them on participating platforms. A digital fingerprint is made directly on your device, and images are never uploaded.',
      resourceIds: ['STOPNCII'],
    })
  }

  // Enforce at most 5 items
  const finalItems = items.slice(0, 5)

  // Collect unique resourceIds in order of appearance
  const resSet = new Set<string>()
  for (const item of finalItems) {
    if (item.resourceIds) {
      for (const rid of item.resourceIds) {
        resSet.add(rid)
      }
    }
  }

  return {
    items: finalItems,
    resourceIds: Array.from(resSet),
    isAiDisabled,
    isMinorRoute,
    hasUrgentDanger,
    disclaimer:
      'These three questions provide an initial routing decision and safety guidance, not a full risk assessment or legal determination.',
  }
}
