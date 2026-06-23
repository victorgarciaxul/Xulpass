// Content script: listens for autofill trigger from background
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'PING') return true
})
