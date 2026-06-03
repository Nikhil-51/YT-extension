document.addEventListener("DOMContentLoaded", () => {
  const ambientToggle = document.getElementById("ambient-glow-toggle");
  const transparentToggle = document.getElementById("transparent-ui-toggle");
  const searchToggle = document.getElementById("minimalist-search-toggle");
  const statusContainer = document.getElementById("status-container");
  const statusText = document.getElementById("status-text");

  // Load current settings
  chrome.storage.local.get(
    ["ambientGlowEnabled", "transparentUIEnabled", "minimalistSearchEnabled"],
    (result) => {
      if (result.ambientGlowEnabled !== undefined) {
        ambientToggle.checked = result.ambientGlowEnabled;
      }
      if (result.transparentUIEnabled !== undefined) {
        transparentToggle.checked = result.transparentUIEnabled;
      }
      if (result.minimalistSearchEnabled !== undefined) {
        searchToggle.checked = result.minimalistSearchEnabled;
      }
    }
  );

  // Save settings on toggle
  ambientToggle.addEventListener("change", () => {
    chrome.storage.local.set({ ambientGlowEnabled: ambientToggle.checked });
  });

  transparentToggle.addEventListener("change", () => {
    chrome.storage.local.set({ transparentUIEnabled: transparentToggle.checked });
  });

  searchToggle.addEventListener("change", () => {
    chrome.storage.local.set({ minimalistSearchEnabled: searchToggle.checked });
  });

  // Check if current page is YouTube
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs[0]) {
      const activeTab = tabs[0];
      const url = activeTab.url || "";

      if (url.includes("youtube.com")) {
        statusContainer.className = "status-container active";
        statusText.textContent = "Active on YouTube";
      } else {
        statusContainer.className = "status-container inactive";
        statusText.textContent = "Open YouTube";
        
        statusContainer.addEventListener("click", () => {
          chrome.tabs.create({ url: "https://www.youtube.com" });
        });
      }
    } else {
      statusContainer.className = "status-container inactive";
      statusText.textContent = "Open YouTube";
    }
  });
});
