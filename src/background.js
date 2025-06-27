// Initialize focus mode state when extension is installed
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const result = await chrome.storage.local.get(["focusMode", "focusAreas"])
    if (result.focusMode === undefined) {
      await chrome.storage.local.set({ focusMode: false })
      console.log("Focus Mode initialized to OFF")
    }
    if (result.focusAreas === undefined) {
      await chrome.storage.local.set({ focusAreas: [] })
      console.log("Focus Areas initialized to empty array")
    }
  } catch (error) {
    console.error("Error initializing extension:", error)
  }
})

// Prepare prompt for Gemini API
function prepareGeminiPrompt(content, focusAreas) {
  const focusAreasText = focusAreas.join(", ")
  return `My current focus areas are: "${focusAreasText}". 

The content I'm about to view is: "${content}".

Please analyze if this content is relevant to any of my focus areas and will help me stay productive and focused on my goals. Consider:
- Is this educational or informative content related to any of my focus areas?
- Will this content help me achieve my current objectives in any of these areas?
- Is this content likely to be a distraction from all of my focus areas?

Respond with only "yes" if the content is relevant and helpful to at least one focus area, or "no" if it's likely to be distracting or irrelevant to all focus areas.`
}

// Gemini API call
async function evaluateContentWithGemini(content, focusAreas) {
  const API_KEY = process.env.GEMINI_API_KEY

  if (!API_KEY) {
    console.error("Gemini API key not found")
    return isContentRelevantFallback(content, focusAreas)
  }

  const prompt = prepareGeminiPrompt(content, focusAreas)

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      },
    )

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase().trim()

    console.log("Gemini response:", generatedText)

    // Parse the response
    const isRelevant = generatedText?.includes("yes") && !generatedText?.includes("no")

    return isRelevant
  } catch (error) {
    console.error("Error calling Gemini API:", error)
    // Fallback to simple keyword matching
    return isContentRelevantFallback(content, focusAreas)
  }
}

// Fallback function for when API fails
function isContentRelevantFallback(content, focusAreas) {
  if (!focusAreas || focusAreas.length === 0 || !content) {
    return false
  }

  const contentLower = content.toLowerCase()

  // Educational keywords that are generally considered productive
  const educationalKeywords = [
    "learn",
    "study",
    "tutorial",
    "education",
    "course",
    "programming",
    "code",
    "math",
    "science",
    "research",
    "analysis",
    "guide",
    "how to",
    "documentation",
    "lecture",
    "lesson",
    "training",
    "skill",
    "development",
  ]

  // Check if content contains educational keywords
  const hasEducationalContent = educationalKeywords.some((keyword) => contentLower.includes(keyword))

  // Check if content matches any focus area
  const matchesAnyFocusArea = focusAreas.some((focusArea) => {
    const focusKeywords = focusArea.toLowerCase().split(" ")
    return focusKeywords.some((keyword) => contentLower.includes(keyword))
  })

  return hasEducationalContent || matchesAnyFocusArea
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "focusModeChanged") {
    console.log("Focus Mode changed to:", message.focusMode)
    updateExtensionIcon(message.focusMode)
  }

  if (message.action === "focusAreasChanged") {
    console.log("Focus Areas changed to:", message.focusAreas)
  }

  if (message.action === "getFocusMode") {
    chrome.storage.local.get(["focusMode"]).then((result) => {
      sendResponse({ focusMode: result.focusMode || false })
    })
    return true
  }

  if (message.action === "evaluateContent") {
    const { content, focusAreas } = message
    console.log("Evaluating content:", content, "for focus areas:", focusAreas)

    // Use Gemini API for evaluation
    evaluateContentWithGemini(content, focusAreas)
      .then((isRelevant) => {
        sendResponse({
          isRelevant,
          content,
          focusAreas,
          evaluationMethod: process.env.GEMINI_API_KEY ? "gemini" : "fallback",
        })
      })
      .catch((error) => {
        console.error("Error in content evaluation:", error)
        sendResponse({
          isRelevant: false,
          content,
          focusAreas,
          evaluationMethod: "error_fallback",
        })
      })

    return true // Keep message channel open for async response
  }
})

// Update extension icon based on focus mode state
function updateExtensionIcon(isOn) {
  const badgeText = isOn ? "ON" : ""
  const badgeColor = isOn ? "#e74c3c" : "#27ae60"

  chrome.action.setBadgeText({ text: badgeText })
  chrome.action.setBadgeBackgroundColor({ color: badgeColor })
}

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
  console.log("Focus Mode extension started")
})

// Initialize badge on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const result = await chrome.storage.local.get(["focusMode"])
    updateExtensionIcon(result.focusMode || false)
  } catch (error) {
    console.error("Error setting initial badge:", error)
  }
})
