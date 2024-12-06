// IDs of the settings checkboxes
const settingsElements = {
    showOverlay: document.getElementById('showOverlay')
  };

const settingsDefaultValues = {
    showOverlay: true
}
  
  // Load settings when the page is loaded
  document.addEventListener('DOMContentLoaded', () => {
    browser.storage.local.get(Object.keys(settingsElements)).then((storedSettings) => {
      for (const [key, element] of Object.entries(settingsElements)) {
        element.checked = storedSettings[key] === undefined ? settingsDefaultValues[key] : storedSettings[key]
        element.addEventListener('change', (event) => {
            const new_value = event.target.checked ? true : false;
            browser.storage.local.set({[key]: new_value})
        })
      }
    });
  });