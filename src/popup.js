import "./popup.css"

document.addEventListener("DOMContentLoaded", async () => {
  const statusDiv = document.getElementById("status")
  const toggleBtn = document.getElementById("toggleBtn")

  // Load current focus mode state
  async function loadFocusMode() {
    try {
      const result = await chrome.storage.local.get(["focusMode"])
      const isOn = result.focusMode || false
      updateUI(isOn)
    } catch (error) {
      console.error("Error loading focus mode:", error)
      updateUI(false)
    }
  }

  // Update the UI based on focus mode state
  function updateUI(isOn) {
    if (isOn) {
      statusDiv.textContent = "Focus Mode: ON"
      statusDiv.className = "status on"
      toggleBtn.textContent = "Turn OFF"
      toggleBtn.className = "toggle-btn on"
    } else {
      statusDiv.textContent = "Focus Mode: OFF"
      statusDiv.className = "status off"
      toggleBtn.textContent = "Turn ON"
      toggleBtn.className = "toggle-btn off"
    }
  }

  // Toggle focus mode
  async function toggleFocusMode() {
    try {
      const result = await chrome.storage.local.get(["focusMode"])
      const currentState = result.focusMode || false
      const newState = !currentState

      await chrome.storage.local.set({ focusMode: newState })
      updateUI(newState)

      // Notify background script of the change
      chrome.runtime.sendMessage({
        action: "focusModeChanged",
        focusMode: newState,
      })
    } catch (error) {
      console.error("Error toggling focus mode:", error)
    }
  }

  // Add click event listener to toggle button
  toggleBtn.addEventListener("click", toggleFocusMode)

  // Load initial state
  loadFocusMode()
})