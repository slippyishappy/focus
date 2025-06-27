import "./popup.css"

document.addEventListener("DOMContentLoaded", async () => {
  const statusDiv = document.getElementById("status")
  const toggleBtn = document.getElementById("toggleBtn")
  const focusAreaInput = document.getElementById("focusAreaInput")
  const addFocusBtn = document.getElementById("addFocusBtn")
  const focusAreasList = document.getElementById("focusAreasList")
  const emptyState = document.getElementById("emptyState")

  let currentFocusAreas = []

  // Load current focus mode state
  async function loadFocusMode() {
    try {
      const result = await chrome.storage.local.get(["focusMode"])
      const isOn = result.focusMode || false
      updateUI(isOn)

      // Update badge when popup loads
      chrome.runtime.sendMessage({
        action: "focusModeChanged",
        focusMode: isOn,
      })
    } catch (error) {
      console.error("Error loading focus mode:", error)
      updateUI(false)
    }
  }

  // Load current focus areas
  async function loadFocusAreas() {
    try {
      const result = await chrome.storage.local.get(["focusAreas"])
      currentFocusAreas = result.focusAreas || []
      renderFocusAreas()
    } catch (error) {
      console.error("Error loading focus areas:", error)
      currentFocusAreas = []
      renderFocusAreas()
    }
  }

  // Render focus areas in the UI
  function renderFocusAreas() {
    focusAreasList.innerHTML = ""

    if (currentFocusAreas.length === 0) {
      emptyState.classList.remove("hidden")
    } else {
      emptyState.classList.add("hidden")

      currentFocusAreas.forEach((area, index) => {
        const focusAreaItem = document.createElement("div")
        focusAreaItem.className = "focus-area-item"
        focusAreaItem.innerHTML = `
          <span class="focus-area-text">${area}</span>
          <button class="remove-btn" data-index="${index}" title="Remove ${area}">×</button>
        `

        // Add remove functionality
        const removeBtn = focusAreaItem.querySelector(".remove-btn")
        removeBtn.addEventListener("click", () => removeFocusArea(index))

        focusAreasList.appendChild(focusAreaItem)
      })
    }
  }

  // Add a new focus area
  async function addFocusArea() {
    const newArea = focusAreaInput.value.trim()

    if (!newArea) {
      focusAreaInput.focus()
      return
    }

    // Check for duplicates (case insensitive)
    const isDuplicate = currentFocusAreas.some((area) => area.toLowerCase() === newArea.toLowerCase())

    if (isDuplicate) {
      alert("This focus area already exists!")
      focusAreaInput.value = ""
      focusAreaInput.focus()
      return
    }

    // Check maximum limit
    if (currentFocusAreas.length >= 8) {
      alert("Maximum 8 focus areas allowed!")
      return
    }

    try {
      addFocusBtn.disabled = true
      addFocusBtn.textContent = "Adding..."

      // Add to current array
      currentFocusAreas.push(newArea)

      // Save to storage
      await chrome.storage.local.set({ focusAreas: currentFocusAreas })

      // Clear input and re-render
      focusAreaInput.value = ""
      renderFocusAreas()

      // Notify background script
      chrome.runtime.sendMessage({
        action: "focusAreasChanged",
        focusAreas: currentFocusAreas,
      })

      // Success feedback
      addFocusBtn.textContent = "Added!"
      setTimeout(() => {
        addFocusBtn.textContent = "Add"
        addFocusBtn.disabled = false
        focusAreaInput.focus()
      }, 800)

      // Add success animation to the new item
      setTimeout(() => {
        const newItem = focusAreasList.lastElementChild
        if (newItem) {
          newItem.classList.add("success-flash")
        }
      }, 100)
    } catch (error) {
      console.error("Error adding focus area:", error)
      alert("Error adding focus area")
      addFocusBtn.textContent = "Add"
      addFocusBtn.disabled = false
    }
  }

  // Remove a focus area
  async function removeFocusArea(index) {
    try {
      // Remove from current array
      currentFocusAreas.splice(index, 1)

      // Save to storage
      await chrome.storage.local.set({ focusAreas: currentFocusAreas })

      // Re-render
      renderFocusAreas()

      // Notify background script
      chrome.runtime.sendMessage({
        action: "focusAreasChanged",
        focusAreas: currentFocusAreas,
      })
    } catch (error) {
      console.error("Error removing focus area:", error)
      alert("Error removing focus area")
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

  // Event listeners
  toggleBtn.addEventListener("click", toggleFocusMode)
  addFocusBtn.addEventListener("click", addFocusArea)

  // Allow adding with Enter key
  focusAreaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addFocusArea()
    }
  })

  // Auto-focus input when popup opens
  focusAreaInput.focus()

  // Load initial states
  loadFocusMode()
  loadFocusAreas()
})
