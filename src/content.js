// Function to safely add CSS link
function addStylesheet() {
  if (document.head) {
    const blockedPageStylesLink = document.createElement("link")
    blockedPageStylesLink.rel = "stylesheet"
    blockedPageStylesLink.href = window.chrome.runtime.getURL("blocked-page.css")
    document.head.appendChild(blockedPageStylesLink)
  } else {
    // If document.head is not available yet, wait for it
    setTimeout(addStylesheet, 10)
  }
}

// Add stylesheet when DOM is ready
addStylesheet()

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
    try {
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
    } catch (error) {
      console.error("Error pausing video:", error)
      // Don't throw the error, just return false
      return false
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
    return `<span style="padding: 0.375rem 0.75rem; background: #f3f4f6; color: #6b7280; font-size: 0.875rem; border-radius: 9999px;">None set</span>`
  }

  return focusAreas.map((area) => `<span style="padding: 0.375rem 0.75rem; background: #dbeafe; color: #1e40af; font-size: 0.875rem; font-weight: 500; border-radius: 9999px;">${area}</span>`).join(" ")
}

// Create motivational overlay
function createMotivationalOverlay(content, focusAreas) {
  try {
    // Wait for DOM to be ready before creating overlay
    if (!document.body || !document.head) {
      setTimeout(() => createMotivationalOverlay(content, focusAreas), 100)
      return
    }

    // Remove any existing overlay
    const existingOverlay = document.getElementById("focus-mode-overlay")
    if (existingOverlay) {
      existingOverlay.remove()
    }

    // Pause video BEFORE creating overlay to avoid conflicts
    const videoPaused = pauseYouTubeVideo()
    if (videoPaused) {
      console.log("Video paused before showing overlay")
    }

    // Small delay to let YouTube's observers settle
    setTimeout(() => {
      createOverlayDOM(content, focusAreas)
    }, 250)
    
  } catch (error) {
    console.error("Error creating motivational overlay:", error)
    // Try again with a longer delay
    setTimeout(() => createMotivationalOverlay(content, focusAreas), 1000)
  }
}

// Separate function to create the actual overlay DOM
function createOverlayDOM(content, focusAreas) {
  try {
    const focusAreasDisplay = formatFocusAreasForDisplay(focusAreas)

  const overlay = document.createElement("div")
  overlay.id = "focus-mode-overlay"
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `
  overlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      border: 1px solid #f3f4f6;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
      max-width: 40rem;
      margin: 0 1.5rem;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    ">
      <div style="padding: 2rem; text-align: center;">
        <!-- Icon and Header -->
        <div style="
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
        ">
          <svg style="width: 2rem; height: 2rem; color: white;" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clip-rule="evenodd"></path>
          </svg>
        </div>
        
        <h1 style="font-size: 1.5rem; font-weight: 600; color: #111827; margin-bottom: 1.5rem;">Content Not Aligned with Your Focus</h1>
        
        <!-- Content Info -->
        <div style="
          background: #f9fafb;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          text-align: left;
        ">
          <div style="margin-bottom: 1rem;">
            <p style="font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.5rem;">Your Focus Areas:</p>
            <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">${focusAreasDisplay}</div>
          </div>
          <div>
            <p style="font-size: 0.875rem; font-weight: 500; color: #374151; margin-bottom: 0.25rem;">Current Content:</p>
            <p style="font-size: 0.875rem; color: #4b5563;">"${content}"</p>
          </div>
        </div>
        
        <!-- Motivational Quote -->
        <div style="
          background: #eff6ff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          padding: 1rem;
          margin-bottom: 1.5rem;
        ">
          <p style="font-size: 0.875rem; font-style: italic; color: #1e3a8a;">"Success is the result of preparation, hard work, and learning from failure." - Colin Powell</p>
        </div>
        
        <!-- Action Buttons -->
        <div style="display: flex; gap: 0.75rem; justify-content: center; margin-bottom: 1.5rem;">
          <button id="goBackBtn" style="
            padding: 0.625rem 1.5rem;
            background: #111827;
            color: white;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 12px;
            border: none;
            cursor: pointer;
            transition: background-color 0.2s;
          ">
            Take Me Back
          </button>
          <button id="continueBtn" style="
            padding: 0.625rem 1.5rem;
            background: #e5e7eb;
            color: #374151;
            font-size: 0.875rem;
            font-weight: 500;
            border-radius: 12px;
            border: none;
            cursor: not-allowed;
            opacity: 0.5;
            transition: all 0.2s;
          " disabled>
            Continue Anyway (<span id="countdown">120</span>s)
          </button>
        </div>
        
        <!-- Justification Section -->
        <div id="justificationSection" style="display: none;">
          <div style="border-top: 1px solid #f3f4f6; padding-top: 1.5rem;">
            <h3 style="font-size: 1.125rem; font-weight: 500; color: #111827; margin-bottom: 1rem;">Why do you need to view this content?</h3>
            <textarea id="justificationText" placeholder="Explain why this content is necessary for your current focus..." style="
              width: 100%;
              height: 6rem;
              padding: 0.75rem;
              font-size: 0.875rem;
              border: 1px solid #d1d5db;
              border-radius: 12px;
              resize: none;
              margin-bottom: 1rem;
              box-sizing: border-box;
            "></textarea>
            <button id="submitJustification" style="
              width: 100%;
              padding: 0.625rem 1.5rem;
              background: #2563eb;
              color: white;
              font-size: 0.875rem;
              font-weight: 500;
              border-radius: 12px;
              border: none;
              cursor: pointer;
              transition: background-color 0.2s;
            ">
              Submit & Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  `

  // Safely append overlay to DOM
  if (document.body) {
    document.body.appendChild(overlay)
  } else {
    // If body doesn't exist yet, append to document.documentElement
    document.documentElement.appendChild(overlay)
  }

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
  } catch (error) {
    console.error("Error creating overlay DOM:", error)
    // If there's an error, try to create a simpler overlay
    createSimpleOverlay(content, focusAreas)
  }
}

// Simple fallback overlay function
function createSimpleOverlay(content, focusAreas) {
  try {
    const overlay = document.createElement("div")
    overlay.id = "focus-mode-overlay"
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `
    
    overlay.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 12px;
        text-align: center;
        max-width: 500px;
        margin: 20px;
      ">
        <h2 style="margin: 0 0 20px 0; color: #333;">Content Not Aligned with Your Focus</h2>
        <p style="margin: 0 0 20px 0; color: #666;">This content doesn't match your current focus areas.</p>
        <button id="simple-go-back" style="
          background: #333;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          margin-right: 10px;
        ">Go Back</button>
        <button id="simple-continue" style="
          background: #ccc;
          color: #333;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
        ">Continue Anyway</button>
      </div>
    `
    
    document.body.appendChild(overlay)
    
    document.getElementById("simple-go-back").addEventListener("click", () => {
      window.history.back()
    })
    
    document.getElementById("simple-continue").addEventListener("click", () => {
      overlay.remove()
    })
    
  } catch (error) {
    console.error("Error creating simple overlay:", error)
  }
}

// Show complete block message (Stage 1 behavior)
function showCompleteBlockMessage() {
  // Wait for DOM to be ready before replacing content
  if (!document.documentElement) {
    setTimeout(showCompleteBlockMessage, 100)
    return
  }

  // Clear existing content and set up the page structure
  document.head.innerHTML = `
    <title>Site Blocked - Focus Mode</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
  `
  
  // Create and inject CSS link
  const cssLink = document.createElement('link')
  cssLink.rel = 'stylesheet'
  cssLink.href = window.chrome.runtime.getURL('blocked-page.css')
  document.head.appendChild(cssLink)
  
  // Set up the body with proper classes and content
  document.body.className = 'blocked-page-body'
  document.body.innerHTML = `
    <div class="blocked-page-container">
      <!-- Icon -->
      <div class="blocked-page-icon blocked-page-icon-red">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" fill="none"/><path d="M128,60a20,20,0,0,1,40,0v56" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M88,76V44a20,20,0,0,1,40,0v68" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/><path d="M128,176a40,40,0,0,1,40-40V116a20,20,0,0,1,40,0v36a80,80,0,0,1-160,0V76a20,20,0,0,1,40,0v44" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="16"/></svg>l
      </div>
      
      <!-- Header -->
      <h1 class="blocked-page-title">Site Completely Blocked</h1>
      
      <!-- Content -->
      <p class="blocked-page-description">
        <span class="blocked-page-domain">${window.location.hostname}</span> is completely blocked while Focus Mode is active.
      </p>
      <p class="blocked-page-subtitle">This site is known to be highly distracting and doesn't support content evaluation.</p>
      
      <!-- Motivational Quote -->
      <div class="blocked-page-quote">
        <p class="blocked-page-quote-text">"The successful warrior is the average person with laser-like focus." - Bruce Lee</p>
      </div>
      
      <!-- Action Buttons -->
      <div class="blocked-page-buttons">
        <button id="closeTabBtn" class="blocked-page-btn blocked-page-btn-primary">
          Close Tab
        </button>
      </div>
    </div>
  `
  
  // Add event listener for close tab button
  setTimeout(() => {
    const closeTabBtn = document.getElementById('closeTabBtn')
    if (closeTabBtn) {
      closeTabBtn.addEventListener('click', () => {
        // Try multiple methods to close the tab
        try {
          // Method 1: Try window.close() first
          window.close()
          
          // Method 2: If that doesn't work, send message to background script
          setTimeout(() => {
            if (window.chrome && window.chrome.runtime) {
              window.chrome.runtime.sendMessage({
                action: 'closeTab'
              }).catch(() => {
                // Method 3: If all else fails, navigate to about:blank
                window.location.href = 'about:blank'
              })
            } else {
              // Fallback: navigate to about:blank
              window.location.href = 'about:blank'
            }
          }, 100)
        } catch (error) {
          console.error('Error closing tab:', error)
          // Final fallback
          window.location.href = 'about:blank'
        }
      })
    }
  }, 100)
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
    // Ensure DOM is ready before proceeding
    if (!document.body || !document.head) {
      setTimeout(handleFocusMode, 100)
      return
    }
    
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

