// Initialize default settings on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(
    ["ambientGlowEnabled", "transparentUIEnabled", "minimalistSearchEnabled"],
    (result) => {
      const updates = {};
      if (result.ambientGlowEnabled === undefined) {
        updates.ambientGlowEnabled = true;
      }
      if (result.transparentUIEnabled === undefined) {
        updates.transparentUIEnabled = true;
      }
      if (result.minimalistSearchEnabled === undefined) {
        updates.minimalistSearchEnabled = true;
      }

      if (Object.keys(updates).length > 0) {
        chrome.storage.local.set(updates, () => {
          console.log("Nikhil's Personal YT: Default preferences initialized", updates);
        });
      }
    }
  );
});

