import "./popup.css"

document.addEventListener("DOMContentLoaded", async () => {
  const statusDiv = document.getElementById("status")
  const toggleBtn = document.getElementById("toggleBtn")
  const focusAreaInput = document.getElementById("focusAreaInput")
  const addFocusBtn = document.getElementById("addFocusBtn")
  const focusAreasList = document.getElementById("focusAreasList")
  const emptyState = document.getElementById("emptyState")
  const siteTogglesList = document.getElementById("siteTogglesList")

  let currentFocusAreas = []
  let siteToggles = {}

  // Predefined sites to show in the popup
  const predefinedSites = [
    { domain: "youtube.com", name: "YouTube" },
    { domain: "reddit.com", name: "Reddit" },
    { domain: "instagram.com", name: "Instagram" },
    { domain: "facebook.com", name: "Facebook" },
    { domain: "tiktok.com", name: "TikTok" },
    { domain: "twitter.com", name: "Twitter" },
    { domain: "x.com", name: "X" },
  ]

  const chrome = window.chrome // Declare the chrome variable

  async function loadFocusMode() {
    try {
      const result = await chrome.storage.local.get(["focusMode"])
      const isOn = result.focusMode || false
      updateUI(isOn)

      chrome.runtime.sendMessage({
        action: "focusModeChanged",
        focusMode: isOn,
      })
    } catch (error) {
      console.error("Error loading focus mode:", error)
      updateUI(false)
    }
  }

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

  async function loadSiteToggles() {
    try {
      const result = await chrome.storage.local.get(["siteToggles"])
      siteToggles = result.siteToggles || {}
      renderSiteToggles()
    } catch (error) {
      console.error("Error loading site toggles:", error)
      siteToggles = {}
      renderSiteToggles()
    }
  }

  function renderSiteToggles() {
    siteTogglesList.innerHTML = ""

    predefinedSites.forEach((site) => {
      const toggleItem = document.createElement("div")
      toggleItem.className = "group"

      const currentState = siteToggles[site.domain] || "smart"

      toggleItem.innerHTML = `
  <div class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all duration-200 group-hover:bg-gray-50">
    <div class="flex items-center gap-3">
      <div class="w-2 h-2 bg-gray-400 rounded-full"></div>
      <div>
        <div class="text-sm font-medium text-gray-900">${site.name}</div>
        <div class="text-xs text-gray-500">${site.domain}</div>
      </div>
    </div>
    <div class="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5" data-site="${site.domain}">
      <button class="state-btn px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
        currentState === "blocked" ? "bg-red-500 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:shadow-sm"
      }" data-state="blocked" title="Completely blocked">
        <div class="w-2 h-2 bg-current rounded-full"></div>
      </button>
      <button class="state-btn px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
        currentState === "smart" ? "bg-amber-500 text-white shadow-sm" : "text-gray-600 hover:bg-white hover:shadow-sm"
      }" data-state="smart" title="AI evaluation">
        <div class="w-2 h-2 bg-current rounded-full"></div>
      </button>
      <button class="state-btn px-2 py-1 text-xs font-medium rounded-md transition-all duration-200 ${
        currentState === "allowed"
          ? "bg-green-500 text-white shadow-sm"
          : "text-gray-600 hover:bg-white hover:shadow-sm"
      }" data-state="allowed" title="Always allowed">
        <div class="w-2 h-2 bg-current rounded-full"></div>
      </button>
    </div>
  </div>
`

      const stateButtons = toggleItem.querySelectorAll(".state-btn")
      stateButtons.forEach((btn) => {
        btn.addEventListener("click", () => setSiteState(site.domain, btn.dataset.state))
      })

      siteTogglesList.appendChild(toggleItem)
    })
  }

  async function setSiteState(site, state) {
    try {
      siteToggles[site] = state
      await chrome.storage.local.set({ siteToggles })
      renderSiteToggles()

      chrome.runtime.sendMessage({
        action: "siteToggleChanged",
        site: site,
        state: state,
      })
    } catch (error) {
      console.error("Error setting site state:", error)
    }
  }

  function renderFocusAreas() {
    focusAreasList.innerHTML = ""

    if (currentFocusAreas.length === 0) {
      emptyState.classList.remove("hidden")
    } else {
      emptyState.classList.add("hidden")

      currentFocusAreas.forEach((area, index) => {
        const focusAreaItem = document.createElement("div")
        focusAreaItem.className = "group animate-in slide-in-from-top-2 duration-200"
        focusAreaItem.innerHTML = `
          <div class="flex items-center justify-between p-3 bg-blue-50 border border-blue-100 rounded-lg group-hover:bg-blue-100 transition-all duration-200">
            <div class="flex items-center gap-3">
              <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span class="text-sm font-medium text-blue-900">${area}</span>
            </div>
            <button class="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center text-blue-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-all duration-200" data-index="${index}" title="Remove ${area}">
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        `

        const removeBtn = focusAreaItem.querySelector("button")
        removeBtn.addEventListener("click", () => removeFocusArea(index))

        focusAreasList.appendChild(focusAreaItem)
      })
    }
  }

  async function addFocusArea() {
    const newArea = focusAreaInput.value.trim()

    if (!newArea) {
      focusAreaInput.focus()
      return
    }

    const isDuplicate = currentFocusAreas.some((area) => area.toLowerCase() === newArea.toLowerCase())

    if (isDuplicate) {
      showNotification("This focus area already exists!", "error")
      focusAreaInput.value = ""
      focusAreaInput.focus()
      return
    }

    if (currentFocusAreas.length >= 8) {
      showNotification("Maximum 8 focus areas allowed!", "error")
      return
    }

    try {
      addFocusBtn.disabled = true
      addFocusBtn.innerHTML = `
        <svg class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
        </svg>
      `

      currentFocusAreas.push(newArea)
      await chrome.storage.local.set({ focusAreas: currentFocusAreas })

      focusAreaInput.value = ""
      renderFocusAreas()

      chrome.runtime.sendMessage({
        action: "focusAreasChanged",
        focusAreas: currentFocusAreas,
      })

      addFocusBtn.innerHTML = `
        <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
      `

      setTimeout(() => {
        addFocusBtn.innerHTML = "Add"
        addFocusBtn.disabled = false
        focusAreaInput.focus()
      }, 1000)
    } catch (error) {
      console.error("Error adding focus area:", error)
      showNotification("Error adding focus area", "error")
      addFocusBtn.innerHTML = "Add"
      addFocusBtn.disabled = false
    }
  }

  async function removeFocusArea(index) {
    try {
      currentFocusAreas.splice(index, 1)
      await chrome.storage.local.set({ focusAreas: currentFocusAreas })

      renderFocusAreas()

      chrome.runtime.sendMessage({
        action: "focusAreasChanged",
        focusAreas: currentFocusAreas,
      })
    } catch (error) {
      console.error("Error removing focus area:", error)
      showNotification("Error removing focus area", "error")
    }
  }

  function showNotification(message, type = "info") {
    // Simple notification - you could enhance this with a proper toast system
    const notification = document.createElement("div")
    notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-sm font-medium z-50 ${
      type === "error"
        ? "bg-red-100 text-red-800 border border-red-200"
        : "bg-blue-100 text-blue-800 border border-blue-200"
    }`
    notification.textContent = message
    document.body.appendChild(notification)

    setTimeout(() => {
      notification.remove()
    }, 3000)
  }

  function updateUI(isOn) {
    if (isOn) {
      statusDiv.textContent = "Active and protecting your focus"
      statusDiv.className = "text-sm text-green-600 font-medium"
      toggleBtn.textContent = "Turn Off Focus Mode"
      toggleBtn.className =
        "w-full py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
    } else {
      statusDiv.textContent = "Currently inactive"
      statusDiv.className = "text-sm text-gray-500"
      toggleBtn.textContent = "Turn On Focus Mode"
      toggleBtn.className =
        "w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    }
  }

  async function toggleFocusMode() {
    try {
      const result = await chrome.storage.local.get(["focusMode"])
      const currentState = result.focusMode || false
      const newState = !currentState

      await chrome.storage.local.set({ focusMode: newState })
      updateUI(newState)

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

  focusAreaInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      addFocusArea()
    }
  })

  // Auto-focus input
  focusAreaInput.focus()

  // Load initial data
  loadFocusMode()
  loadFocusAreas()
  loadSiteToggles()
})
