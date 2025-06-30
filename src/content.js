// List of sites that get completely blocked (Stage 1 behavior)
const COMPLETELY_BLOCKED_SITES = [
  "facebook.com",
  "www.facebook.com",
  "instagram.com",
  "www.instagram.com",
  "reddit.com",
  "www.reddit.com",
  "tiktok.com",
  "www.tiktok.com",
]

// List of sites that get content evaluation (Stage 2 behavior)
const CONTENT_EVALUATED_SITES = [
  "youtube.com",
  "www.youtube.com",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
]

// Check if current site should be completely blocked
function shouldCompletelyBlockSite() {
  const currentDomain = window.location.hostname.toLowerCase()
  return COMPLETELY_BLOCKED_SITES.some(
    (blockedSite) => currentDomain === blockedSite || currentDomain.endsWith("." + blockedSite),
  )
}

// Check if current site should have content evaluated
function shouldEvaluateContent() {
  const currentDomain = window.location.hostname.toLowerCase()
  return CONTENT_EVALUATED_SITES.some((site) => currentDomain === site || currentDomain.endsWith("." + site))
}

// Check if we're on a specific content page (not homepage/search)
function isOnSpecificContent() {
  const hostname = window.location.hostname.toLowerCase()
  const pathname = window.location.pathname
  const search = window.location.search

  if (hostname.includes("youtube.com")) {
    // Only evaluate if we're on a video page
    return pathname === "/watch" && search.includes("v=")
  } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    // Only evaluate if we're on a specific tweet
    return pathname.includes("/status/") || pathname.includes("/tweet/")
  }

  return false
}

// Pause YouTube video
function pauseYouTubeVideo() {
  const hostname = window.location.hostname.toLowerCase()

  if (hostname.includes("youtube.com")) {
    // Try multiple methods to pause the video

    // Method 1: Find video element directly
    const videoElement = document.querySelector("video")
    if (videoElement && !videoElement.paused) {
      videoElement.pause()
      console.log("Video paused using video element")
      return true
    }

    // Method 2: Try YouTube's player API
    if (window.ytplayer && window.ytplayer.pauseVideo) {
      window.ytplayer.pauseVideo()
      console.log("Video paused using YouTube player API")
      return true
    }

    // Method 3: Try to click the pause button
    const pauseButton = document.querySelector(".ytp-play-button[aria-label*='Pause']")
    if (pauseButton) {
      pauseButton.click()
      console.log("Video paused by clicking pause button")
      return true
    }

    // Method 4: Try keyboard shortcut (spacebar)
    const playerContainer = document.querySelector("#movie_player, .html5-video-player")
    if (playerContainer) {
      const spaceEvent = new KeyboardEvent("keydown", {
        key: " ",
        code: "Space",
        keyCode: 32,
        which: 32,
        bubbles: true,
      })
      playerContainer.dispatchEvent(spaceEvent)
      console.log("Attempted to pause video with spacebar")
      return true
    }
  }

  return false
}

// Extract content from different sites
function extractPageContent() {
  const hostname = window.location.hostname.toLowerCase()
  let content = ""

  if (hostname.includes("youtube.com")) {
    // Only extract if we're on a video page
    if (!isOnSpecificContent()) {
      return ""
    }

    // Try multiple selectors for YouTube video titles
    const titleSelectors = [
      "h1.ytd-video-primary-info-renderer",
      "h1.title.style-scope.ytd-video-primary-info-renderer",
      'h1[class*="title"]',
      ".title.style-scope.ytd-video-primary-info-renderer",
      "h1.style-scope.ytd-video-primary-info-renderer",
      "yt-formatted-string.style-scope.ytd-video-primary-info-renderer",
      "#container h1",
      ".ytd-video-primary-info-renderer h1",
      // New selectors for updated YouTube layout
      "h1.ytd-watch-metadata",
      "yt-formatted-string#title",
      ".ytd-watch-metadata h1",
    ]

    for (const selector of titleSelectors) {
      const titleElement = document.querySelector(selector)
      if (titleElement && titleElement.textContent.trim()) {
        content = titleElement.textContent.trim()
        break
      }
    }

    // Additional check for video description or channel info if title is generic
    if (!content || content.length < 5) {
      // Try to get more context from the page
      const descriptionElement = document.querySelector("#description-text, .ytd-video-secondary-info-renderer")
      if (descriptionElement) {
        const description = descriptionElement.textContent.trim().substring(0, 100)
        if (description) {
          content = `${content || "Video"}: ${description}`
        }
      }
    }
  } else if (hostname.includes("twitter.com") || hostname.includes("x.com")) {
    // Only extract if we're on a specific tweet
    if (!isOnSpecificContent()) {
      return ""
    }

    // Extract tweet content
    const tweetElement = document.querySelector('[data-testid="tweetText"]')
    if (tweetElement) {
      content = tweetElement.textContent.trim()
    }
  }

  console.log("Extracted content:", content)
  return content
}

// Format focus areas for display
function formatFocusAreasForDisplay(focusAreas) {
  if (!focusAreas || focusAreas.length === 0) {
    return "None set"
  }

  return focusAreas.map((area) => `<span class="focus-tag">${area}</span>`).join("")
}

// Create motivational overlay
function createMotivationalOverlay(content, focusAreas) {
  // Remove any existing overlay
  const existingOverlay = document.getElementById("focus-mode-overlay")
  if (existingOverlay) {
    existingOverlay.remove()
  }

  // Pause video before showing overlay
  const videoPaused = pauseYouTubeVideo()
  if (videoPaused) {
    console.log("Video paused before showing overlay")
  }

  const focusAreasDisplay = formatFocusAreasForDisplay(focusAreas)

  const overlay = document.createElement("div")
  overlay.id = "focus-mode-overlay"
  overlay.innerHTML = `
    <div class="focus-overlay-container">
      <div class="focus-overlay-content">
        <div class="focus-icon">🎯</div>
        <h1>Content Not Aligned with Your Focus</h1>
        <div class="content-info">
          <p><strong>Your Focus Areas:</strong></p>
          <div class="focus-areas-display">${focusAreasDisplay}</div>
          <p><strong>Current Content:</strong> "${content}"</p>
        </div>
        <div class="motivational-quote">
          <p>"Success is the result of preparation, hard work, and learning from failure." - Colin Powell</p>
        </div>
        <div class="overlay-buttons">
          <button id="goBackBtn" class="overlay-btn back-btn">Take Me Back</button>
          <button id="continueBtn" class="overlay-btn continue-btn" disabled>
            Continue Anyway (<span id="countdown">120</span>s)
          </button>
        </div>
        <div class="justification-section" id="justificationSection" style="display: none;">
          <h3>Why do you need to view this content?</h3>
          <textarea id="justificationText" placeholder="Explain why this content is necessary for your current focus..."></textarea>
          <button id="submitJustification" class="overlay-btn justify-btn">Submit & Continue</button>
        </div>
      </div>
    </div>
  `

  // Add styles
  const style = document.createElement("style")
  style.textContent = `
    #focus-mode-overlay {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.95) !important;
      z-index: 2147483647 !important;
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      font-family: Arial, sans-serif !important;
    }
    
    .focus-overlay-container {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
      border-radius: 20px !important;
      padding: 40px !important;
      max-width: 600px !important;
      text-align: center !important;
      color: white !important;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3) !important;
    }
    
    .focus-icon {
      font-size: 4em !important;
      margin-bottom: 20px !important;
    }
    
    .focus-overlay-content h1 {
      font-size: 2.2em !important;
      margin-bottom: 30px !important;
      color: #fff !important;
    }
    
    .content-info {
      background: rgba(255, 255, 255, 0.1) !important;
      padding: 20px !important;
      border-radius: 10px !important;
      margin-bottom: 30px !important;
      text-align: left !important;
    }
    
    .content-info p {
      margin: 10px 0 !important;
      font-size: 1.1em !important;
    }
    
    .focus-areas-display {
      margin: 10px 0 !important;
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 8px !important;
    }
    
    .focus-tag {
      display: inline-block !important;
      background-color: rgba(255, 255, 255, 0.2) !important;
      color: #fff !important;
      padding: 4px 12px !important;
      border-radius: 15px !important;
      font-size: 0.9em !important;
      border: 1px solid rgba(255, 255, 255, 0.3) !important;
    }
    
    .motivational-quote {
      font-style: italic !important;
      margin: 30px 0 !important;
      padding: 20px !important;
      background: rgba(255, 255, 255, 0.1) !important;
      border-radius: 10px !important;
      border-left: 4px solid #ffeb3b !important;
    }
    
    .overlay-buttons {
      display: flex !important;
      gap: 20px !important;
      justify-content: center !important;
      margin-top: 30px !important;
    }
    
    .overlay-btn {
      padding: 15px 30px !important;
      border: none !important;
      border-radius: 25px !important;
      font-size: 1.1em !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      font-weight: bold !important;
    }
    
    .back-btn {
      background: #4caf50 !important;
      color: white !important;
    }
    
    .back-btn:hover {
      background: #45a049 !important;
      transform: translateY(-2px) !important;
    }
    
    .continue-btn {
      background: #ff6b6b !important;
      color: white !important;
    }
    
    .continue-btn:disabled {
      background: #ccc !important;
      cursor: not-allowed !important;
    }
    
    .continue-btn:not(:disabled):hover {
      background: #ff5252 !important;
      transform: translateY(-2px) !important;
    }
    
    .justification-section {
      margin-top: 30px !important;
      text-align: left !important;
    }
    
    .justification-section h3 {
      margin-bottom: 15px !important;
      text-align: center !important;
    }
    
    .justification-section textarea {
      width: 100% !important;
      height: 100px !important;
      padding: 15px !important;
      border: none !important;
      border-radius: 10px !important;
      font-size: 1em !important;
      resize: vertical !important;
      margin-bottom: 15px !important;
      box-sizing: border-box !important;
    }
    
    .justify-btn {
      background: #ff9800 !important;
      color: white !important;
      width: 100% !important;
    }
    
    .justify-btn:hover {
      background: #f57c00 !important;
    }
  `

  document.head.appendChild(style)
  document.body.appendChild(overlay)

  // Handle button clicks
  const goBackBtn = document.getElementById("goBackBtn")
  const continueBtn = document.getElementById("continueBtn")
  const justificationSection = document.getElementById("justificationSection")
  const submitJustificationBtn = document.getElementById("submitJustification")
  const countdownSpan = document.getElementById("countdown")

  goBackBtn.addEventListener("click", () => {
    window.history.back()
  })

  // Countdown timer for continue button
  let countdown = 120 // 2 minutes
  const countdownInterval = setInterval(() => {
    countdown--
    countdownSpan.textContent = countdown

    if (countdown <= 0) {
      clearInterval(countdownInterval)
      continueBtn.disabled = false
      continueBtn.innerHTML = "Continue Anyway"
    }
  }, 1000)

  continueBtn.addEventListener("click", () => {
    if (!continueBtn.disabled) {
      justificationSection.style.display = "block"
      continueBtn.style.display = "none"
    }
  })

  submitJustificationBtn.addEventListener("click", () => {
    const justification = document.getElementById("justificationText").value.trim()
    if (justification.length < 20) {
      alert("Please provide a more detailed justification (at least 20 characters)")
      return
    }

    // Log the justification for analytics
    console.log("User justification:", justification)

    // Remove overlay and allow access
    overlay.remove()
  })
}

// Show complete block message (Stage 1 behavior)
function showCompleteBlockMessage() {
  document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Site Blocked - Focus Mode</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          margin: 0;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        .container {
          text-align: center;
          padding: 40px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
          max-width: 500px;
        }
        h1 {
          font-size: 2.5em;
          margin-bottom: 20px;
          color: #fff;
        }
        .icon {
          font-size: 4em;
          margin-bottom: 20px;
        }
        p {
          font-size: 1.2em;
          line-height: 1.6;
          margin-bottom: 30px;
          opacity: 0.9;
        }
        .site-name {
          font-weight: bold;
          color: #ffeb3b;
        }
        .motivational {
          font-style: italic;
          margin-top: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          border-left: 4px solid #ffeb3b;
        }
        button {
          background: #ff6b6b;
          color: white;
          border: none;
          padding: 12px 30px;
          font-size: 1.1em;
          border-radius: 25px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin: 10px;
        }
        button:hover {
          background: #ff5252;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(255, 107, 107, 0.4);
        }
        .turn-off-btn {
          background: #4caf50;
        }
        .turn-off-btn:hover {
          background: #45a049;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🚫</div>
        <h1>Site Completely Blocked</h1>
        <p>
          <span class="site-name">${window.location.hostname}</span> is completely blocked while Focus Mode is on.
        </p>
        <p>This site is known to be highly distracting and doesn't support content evaluation.</p>
        
        <div class="motivational">
          "The successful warrior is the average person with laser-like focus." - Bruce Lee
        </div>
        
        <div style="margin-top: 30px;">
          <button onclick="history.back()" class="turn-off-btn">Go Back</button>
          <button onclick="window.close()">Close Tab</button>
        </div>
      </div>
    </body>
    </html>
  `
}

// Get site toggle state for current domain
function getSiteToggleState(domain, siteToggles) {
  // Check for exact domain match or www variant
  const possibleDomains = [
    domain,
    domain.startsWith('www.') ? domain.substring(4) : `www.${domain}`,
  ]
  
  for (const possibleDomain of possibleDomains) {
    if (siteToggles.hasOwnProperty(possibleDomain)) {
      return siteToggles[possibleDomain]
    }
  }
  
  // Return default state based on site type
  if (COMPLETELY_BLOCKED_SITES.includes(domain) || 
      COMPLETELY_BLOCKED_SITES.includes(`www.${domain}`) ||
      COMPLETELY_BLOCKED_SITES.includes(domain.replace('www.', ''))) {
    return 'blocked'
  }
  
  if (CONTENT_EVALUATED_SITES.includes(domain) || 
      CONTENT_EVALUATED_SITES.includes(`www.${domain}`) ||
      CONTENT_EVALUATED_SITES.includes(domain.replace('www.', ''))) {
    return 'smart'
  }
  
  return 'allowed'
}

// Main function to check and handle focus mode
async function handleFocusMode() {
  try {
    console.log("Handling focus mode for:", window.location.href)

    // Get focus mode state, focus areas, and site toggles
    const result = await window.chrome.storage.local.get(["focusMode", "focusAreas", "siteToggles"])
    const focusMode = result.focusMode || false
    const focusAreas = result.focusAreas || []
    const siteToggles = result.siteToggles || {}

    console.log("Focus mode:", focusMode, "Focus areas:", focusAreas, "Site toggles:", siteToggles)

    if (!focusMode) {
      return // Focus mode is off, do nothing
    }

    // Get current domain and its toggle state
    const currentDomain = window.location.hostname.toLowerCase()
    const siteToggleState = getSiteToggleState(currentDomain, siteToggles)
    
    console.log("Current domain:", currentDomain, "Toggle state:", siteToggleState)

    // If site is set to 'allowed', don't block or evaluate
    if (siteToggleState === 'allowed') {
      console.log("Site is set to allowed, skipping blocking/evaluation")
      return
    }

    // If site is set to 'blocked' or should be completely blocked by default
    if (siteToggleState === 'blocked' || shouldCompletelyBlockSite()) {
      console.log("Site should be completely blocked")
      showCompleteBlockMessage()
      return
    }

    // If site is set to 'smart' or should have content evaluated by default
    if ((siteToggleState === 'smart' || shouldEvaluateContent()) && isOnSpecificContent()) {
      console.log("Site should have content evaluated and we're on specific content")

      // Wait a bit for page content to load
      setTimeout(async () => {
        const content = extractPageContent()
        console.log("Extracted content:", content)

        // Only proceed if we have meaningful content and focus areas
        if (content && content.length > 5 && focusAreas.length > 0) {
          try {
            // Send content to background script for evaluation
            const response = await window.chrome.runtime.sendMessage({
              action: "evaluateContent",
              content: content,
              focusAreas: focusAreas,
            })

            console.log("Evaluation response:", response)

            if (response && !response.isRelevant) {
              console.log("Content is not relevant, showing overlay")
              createMotivationalOverlay(content, focusAreas)
            } else {
              console.log("Content is relevant, allowing access")
            }
          } catch (error) {
            console.error("Error sending message to background:", error)
          }
        } else {
          console.log("No meaningful content found or no focus areas set")
        }
      }, 3000) // Wait 3 seconds for content to load
    } else {
      console.log("Not evaluating content - either not a monitored site or not on specific content")
    }
  } catch (error) {
    console.error("Error handling focus mode:", error)
  }
}

// Run when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", handleFocusMode)
} else {
  handleFocusMode()
}

// Also run when navigating within single-page applications
let lastUrl = location.href
new MutationObserver(() => {
  const url = location.href
  if (url !== lastUrl) {
    lastUrl = url
    console.log("URL changed to:", url)
    setTimeout(handleFocusMode, 2000) // Wait for new content to load
  }
}).observe(document, { subtree: true, childList: true })

// Listen for storage changes
window.chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && (changes.focusMode || changes.focusAreas)) {
    console.log("Storage changed, re-evaluating")
    handleFocusMode()
  }
})