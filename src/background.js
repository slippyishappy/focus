// Initialize focus mode state when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
    try {
      const result = await chrome.storage.local.get(["focusMode"])
      if (result.focusMode === undefined) {
        await chrome.storage.local.set({ focusMode: false })
        console.log("Focus Mode initialized to OFF")
      }
    } catch (error) {
      console.error("Error initializing focus mode:", error)
    }
  })
  
  // Listen for messages from popup or content scripts
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "focusModeChanged") {
      console.log("Focus Mode changed to:", message.focusMode)
  
      // Update the extension icon
      updateExtensionIcon(message.focusMode)
    }
  
    if (message.action === "getFocusMode") {
      chrome.storage.local.get(["focusMode"]).then((result) => {
        sendResponse({ focusMode: result.focusMode || false })
      })
      return true // Keep message channel open for async response
    }
  })
  
  // Update extension icon based on focus mode state
  function updateExtensionIcon(isOn) {
    const badgeText = isOn ? "ON" : ""
    const badgeColor = isOn ? "#e74c3c" : "#27ae60"
  
    // Set badge text and color
    chrome.action.setBadgeText({ text: badgeText })
    chrome.action.setBadgeBackgroundColor({ color: badgeColor })
  }
  
  // Keep service worker alive
  chrome.runtime.onStartup.addListener(() => {
    console.log("Focus Mode extension started")
  })
