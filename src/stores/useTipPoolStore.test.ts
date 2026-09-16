import { beforeEach, describe, expect, it } from 'vitest'
import { useTipPoolStore } from '@/stores/useTipPoolStore'

beforeEach(() => {
  useTipPoolStore.setState({
    poolId: 'pool-1',
    poolName: '',
    totalTip: 0,
    intensityWindows: [],
    participants: [],
    employees: [],
    areas: [],
    history: [],
    templates: [],
  })
})

describe('shift templates', () => {
  it('does nothing without a name or without participants', () => {
    useTipPoolStore.getState().saveTemplate('   ')
    expect(useTipPoolStore.getState().templates).toEqual([])

    useTipPoolStore.getState().addParticipant({ name: 'Anna', startTime: '18:00', endTime: '22:00' })
    // clear participants back out to hit the "no participants" branch
    useTipPoolStore.setState({ participants: [] })
    useTipPoolStore.getState().saveTemplate('Leer')
    expect(useTipPoolStore.getState().templates).toEqual([])
  })

  it('saves the current roster and re-adds it as new participants via applyTemplate', () => {
    useTipPoolStore.getState().addParticipant({ name: 'Anna', area: 'Service', startTime: '18:00', endTime: '22:00' })
    useTipPoolStore.getState().addParticipant({ name: 'Ben', startTime: '17:00', endTime: '23:00' })
    useTipPoolStore.getState().saveTemplate('Standard Wochenende')

    const template = useTipPoolStore.getState().templates[0]
    expect(template.name).toBe('Standard Wochenende')
    expect(template.members).toEqual([
      { name: 'Anna', area: 'Service', startTime: '18:00', endTime: '22:00' },
      { name: 'Ben', area: undefined, startTime: '17:00', endTime: '23:00' },
    ])

    // simulate a fresh pool and load the template back in
    useTipPoolStore.setState({ participants: [] })
    useTipPoolStore.getState().applyTemplate(template.id)

    const names = useTipPoolStore.getState().participants.map((p) => p.name)
    expect(names.sort()).toEqual(['Anna', 'Ben'])
    expect(useTipPoolStore.getState().employees).toEqual(['Anna', 'Ben'])
    expect(useTipPoolStore.getState().areas).toEqual(['Service'])
  })

  it('overwrites an existing template with the same name instead of duplicating it', () => {
    useTipPoolStore.getState().addParticipant({ name: 'Anna', startTime: '18:00', endTime: '22:00' })
    useTipPoolStore.getState().saveTemplate('Standard')
    const firstId = useTipPoolStore.getState().templates[0].id

    useTipPoolStore.getState().addParticipant({ name: 'Ben', startTime: '17:00', endTime: '23:00' })
    useTipPoolStore.getState().saveTemplate('standard')

    const templates = useTipPoolStore.getState().templates
    expect(templates).toHaveLength(1)
    expect(templates[0].id).toBe(firstId)
    expect(templates[0].members).toHaveLength(2)
  })

  it('skips template members whose name already exists in the current pool', () => {
    useTipPoolStore.getState().addParticipant({ name: 'Anna', startTime: '18:00', endTime: '22:00' })
    useTipPoolStore.getState().addParticipant({ name: 'Ben', startTime: '17:00', endTime: '23:00' })
    useTipPoolStore.getState().saveTemplate('Standard')
    const templateId = useTipPoolStore.getState().templates[0].id

    useTipPoolStore.setState({
      participants: [
        { id: 'existing', name: 'anna ', startTime: '10:00', endTime: '12:00' },
      ],
    })
    useTipPoolStore.getState().applyTemplate(templateId)

    const names = useTipPoolStore.getState().participants.map((p) => p.name)
    expect(names).toEqual(['anna ', 'Ben'])
  })

  it('removes a template', () => {
    useTipPoolStore.getState().addParticipant({ name: 'Anna', startTime: '18:00', endTime: '22:00' })
    useTipPoolStore.getState().saveTemplate('Standard')
    const templateId = useTipPoolStore.getState().templates[0].id

    useTipPoolStore.getState().removeTemplate(templateId)
    expect(useTipPoolStore.getState().templates).toEqual([])
  })
})
