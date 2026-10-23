/**
 * Static general safety checklist for intimate image threats and digital blackmail.
 * Used as an offline or emergency fallback when AI analysis cannot be reached.
 * Clearly marked: General guidance — not personalised, not AI-generated.
 */

export interface ChecklistSection {
  title: string
  items: { text: string; details?: string }[]
}

export const GENERAL_SAFETY_CHECKLIST: ChecklistSection[] = [
  {
    title: '1. Immediate Protection Rules',
    items: [
      {
        text: 'Do not pay money or send additional media',
        details: 'Paying extortionists almost always results in higher subsequent demands and does not ensure deletion.',
      },
      {
        text: 'Do not delete the chat or communication thread yet',
        details: 'Preserve the conversation history and timestamps first so you have proof for law enforcement and platform reports.',
      },
      {
        text: 'Do not retaliate, threaten, or attempt to hack the sender',
        details: 'Retaliation can escalate the perpetrator’s aggression and complicate legal reporting.',
      },
    ],
  },
  {
    title: '2. Preserving Critical Evidence',
    items: [
      {
        text: 'Screenshot the threat messages with dates and times clearly visible',
        details: 'Ensure screenshots show sender username, handle, phone number, or profile identifier.',
      },
      {
        text: 'Save profile URLs and unique account identifiers',
        details: 'Copy the direct link to the perpetrator’s profile before they change handles or delete accounts.',
      },
      {
        text: 'Document payment demands (UPI IDs, bank details, cryptocurrency addresses)',
        details: 'Keep exact transaction IDs, UPI handles, and payment requests for financial fraud reports.',
      },
      {
        text: 'Store evidence securely in a private, password-protected location',
        details: 'Do not distribute or forward intimate images to friends or cloud shared albums.',
      },
    ],
  },
  {
    title: '3. Securing Your Accounts',
    items: [
      {
        text: 'Change passwords and enable Two-Factor Authentication (2FA)',
        details: 'Use authenticator apps rather than SMS where possible. Log out of all active unknown sessions.',
      },
      {
        text: 'Make your social media profiles and follower lists private',
        details: 'Restricting who can view your followers diminishes the extortionist’s ability to contact your peers.',
      },
      {
        text: 'Review account recovery emails and linked phone numbers',
        details: 'Ensure no unauthorized recovery accounts were added to your email or social accounts.',
      },
    ],
  },
  {
    title: '4. Official Reporting in India',
    items: [
      {
        text: 'Call 112 if in immediate physical danger',
        details: 'Emergency police response line available nationwide 24/7.',
      },
      {
        text: 'Call 1930 if money was sent or banking fraud occurred',
        details: 'National Cyber Crime Helpline can initiate immediate freezing requests with banks.',
      },
      {
        text: 'File a complaint on the National Cyber Crime Portal (cybercrime.gov.in)',
        details: 'Official Government of India portal for reporting digital blackmail and crimes against women/children.',
      },
      {
        text: 'Call 1098 (Childline) if you or the person targeted is under 18',
        details: '24/7 confidential outreach and support dedicated to minors.',
      },
      {
        text: 'Use StopNCII.org (Adults 18+) or TakeItDown.ncmec.org (Under 18)',
        details: 'Non-profit hash-sharing platforms that help prevent intimate images from being posted on participating platforms.',
      },
    ],
  },
]
