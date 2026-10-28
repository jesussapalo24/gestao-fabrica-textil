import type { UserValidateEvent } from '@netlify/functions'
// Accounts are provisioned by invitation; this application has no public registration.
export default {
  userValidate(event: UserValidateEvent) {
    return event.deny()
  },
}
