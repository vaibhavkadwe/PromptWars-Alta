import React from 'react'
import { describe, expect, it } from 'vitest'
import resourcesData from '../../../shared/resources.json'
import { Resource } from '../types/report'

describe('Shared Resources Catalog Validation', () => {
  const resources = resourcesData as Resource[]

  it('contains valid and required resources', () => {
    expect(resources.length).toBeGreaterThanOrEqual(7)
  })

  resources.forEach((r) => {
    it(`validates resource schema and invariants for ${r.id}`, () => {
      // Required fields
      expect(r.id).toBeDefined()
      expect(r.name).toBeDefined()
      expect(r.kind).toBeDefined()
      expect(r.value).toBeDefined()
      expect(r.purpose).toBeDefined()
      expect(r.whenToUse).toBeDefined()
      expect(r.doesNotCover).toBeDefined()
      expect(r.verificationSource).toBeDefined()
      expect(r.verificationLevel).toBeDefined()
      expect(r.lastChecked).toBeDefined()

      // Kind is link or phone
      expect(['link', 'phone']).toContain(r.kind)

      // Links must use https
      if (r.kind === 'link') {
        expect(r.value).toMatch(/^https:\/\//)
      } else {
        expect(r.value).toMatch(/^\d+$/)
      }

      // Verification level is valid
      expect(['primary', 'partial', 'needs_review']).toContain(r.verificationLevel)

      // ISO lastChecked format (YYYY-MM-DD) and not in the future
      expect(r.lastChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      const checkedDate = new Date(r.lastChecked)
      const now = new Date('2026-10-23T23:59:59Z') // Current local anchor
      expect(checkedDate.getTime()).toBeLessThanOrEqual(now.getTime())
    })
  })

  it('hides resources with verificationLevel "needs_review" from the UI', async () => {
    const { render } = await import('@testing-library/react')
    const { ResourceCard } = await import('../components/ResourceCard')

    const unverifiedResource: Resource = {
      id: 'UNVERIFIED_RESOURCE' as unknown as Resource['id'],
      name: 'Unverified Helpline',
      kind: 'phone',
      value: '99999',
      purpose: 'Unverified test',
      whenToUse: 'Testing',
      doesNotCover: 'Everything',
      verificationSource: 'Unknown blog',
      verificationLevel: 'needs_review',
      lastChecked: '2026-10-23',
    }

    const { container } = render(React.createElement(ResourceCard, { resource: unverifiedResource }))
    expect(container.firstChild).toBeNull()
  })

  it('renders verified primary/partial resources with safe attributes and disclaimers', async () => {
    const { render, screen } = await import('@testing-library/react')
    const { ResourceCard } = await import('../components/ResourceCard')

    const linkResource = resources.find((r) => r.kind === 'link' && r.verificationLevel !== 'needs_review')
    expect(linkResource).toBeDefined()
    if (linkResource) {
      render(React.createElement(ResourceCard, { resource: linkResource }))
      expect(screen.getByText(linkResource.name)).toBeDefined()
      const linkEl = screen.getByRole('link', { name: new RegExp(`Open ${linkResource.name}`, 'i') })
      expect(linkEl.getAttribute('target')).toBe('_blank')
      expect(linkEl.getAttribute('rel')).toContain('noopener')
      expect(linkEl.getAttribute('rel')).toContain('noreferrer')
      expect(screen.getByText(/Opening this does not file a complaint/i)).toBeDefined()
    }
  })
})
