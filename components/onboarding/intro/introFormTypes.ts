/** Local state for intro wizard steps (commitment checkbox, wake picker, optional CMS fields). */
export type IntroFormData = {
  commitmentAccepted: boolean
  wakeTime: string
  goalNotes: string
  sleepNotes: string
  accountabilityNotes: string
  paymentAcknowledged: boolean
}

export function createEmptyIntroFormData(): IntroFormData {
  return {
    commitmentAccepted: false,
    wakeTime: '06:00',
    goalNotes: '',
    sleepNotes: '',
    accountabilityNotes: '',
    paymentAcknowledged: false,
  }
}

