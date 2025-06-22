// List of blocked websites (you can expand this list)
const BLOCKED_SITES = [
    "youtube.com",
    "www.youtube.com",
    "twitter.com",
    "www.twitter.com",
    "x.com",
    "www.x.com",
    "facebook.com",
    "www.facebook.com",
    "instagram.com",
    "www.instagram.com",
    "reddit.com",
    "www.reddit.com",
    "tiktok.com",
    "www.tiktok.com",
  ]
  
  // Check if current site should be blocked
  function shouldBlockSite() {
    const currentDomain = window.location.hostname.toLowerCase()
    return BLOCKED_SITES.some((blockedSite) => currentDomain === blockedSite || currentDomain.endsWith("." + blockedSite))
  }
  
  // Create and show blocked site message
  function showBlockedMessage() {
    // Remove all existing content
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
          <div class="icon">🎯</div>
          <h1>Focus Mode Active</h1>
          <p>
            <span class="site-name">${window.location.hostname}</span> is blocked while Focus Mode is on.
          </p>
          <p>Stay focused on what matters most!</p>
          
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
  
  // Main function to check and block if necessary
  async function checkAndBlock() {
    try {
      // Get focus mode state from storage
      const response = await chrome.runtime.sendMessage({ action: "getFocusMode" })
      const focusMode = response.focusMode
  
      // If focus mode is on and current site should be blocked
      if (focusMode && shouldBlockSite()) {
        showBlockedMessage()
      }
    } catch (error) {
      console.error("Error checking focus mode:", error)
    }
  }
  
  // Run the check when page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAndBlock)
  } else {
    checkAndBlock()
  }
  
  // Also check when focus mode changes (listen for storage changes)
  chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === "local" && changes.focusMode) {
      checkAndBlock()
    }
  })
  