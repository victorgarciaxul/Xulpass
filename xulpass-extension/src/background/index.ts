import { supabase } from '../lib/supabase'

// Keep session alive and notify popup of auth changes
supabase.auth.onAuthStateChange((event, session) => {
  chrome.storage.local.set({ xulpass_session: session })
})

// Listen for autofill requests from popup
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'AUTOFILL') {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const tabId = tabs[0]?.id
      if (!tabId) return
      chrome.scripting.executeScript({
        target: { tabId },
        func: (username: string, password: string) => {
          // Find the most likely login form fields
          const userFields = document.querySelectorAll<HTMLInputElement>(
            'input[type="email"], input[type="text"][name*="user"], input[type="text"][name*="email"], input[type="text"][id*="user"], input[type="text"][id*="email"], input[autocomplete="username"], input[autocomplete="email"]'
          )
          const passFields = document.querySelectorAll<HTMLInputElement>('input[type="password"]')

          const userField = userFields[0]
          const passField = passFields[0]

          function fillField(el: HTMLInputElement, value: string) {
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
            nativeInputValueSetter?.call(el, value)
            el.dispatchEvent(new Event('input', { bubbles: true }))
            el.dispatchEvent(new Event('change', { bubbles: true }))
          }

          if (userField) fillField(userField, username)
          if (passField) fillField(passField, password)
        },
        args: [msg.username, msg.password],
      })
      sendResponse({ ok: true })
    })
    return true
  }
})
