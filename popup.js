// Helper function to format seconds into hh:mm:ss
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return [hrs, mins, secs]
      .map((v) => v.toString().padStart(2, '0')) // Add leading zero
      .join(':');
  }
  
// Helper function to parse hh:mm:ss into seconds
function parseTime(timeString) {
    const parts = timeString.split(':').map((v) => parseInt(v, 10));
    if (parts.length === 3) {
        const [hrs, mins, secs] = parts;
        return hrs * 3600 + mins * 60 + secs;
    }
    return NaN; // Invalid format
}

// Helper function to validate manual input
function parseTimestamps(inputValue) {
    const parts = inputValue.split('-').map((v) => v.trim());
    if (parts.length === 2) {
        const start = parseTime(parts[0]);
        const end = parseTime(parts[1]);
        if (!isNaN(start) && !isNaN(end) && start >= 0 && end > start) {
        return { start, end };
        }
    }
    return null; // Invalid input
}

// Populate the input field when the popup loads
function populateInput() {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let tab = (tabs[0].id).toString()
        browser.storage.session.get(tab).then((data) => {
            if (data[tab].timestamps) {
                document.getElementById('timestamps').value = data[tab].timestamps;
            }
    });
    })
}

// Handle clicks on the input field to start selection
document.getElementById('timestamps').addEventListener('click', () => {
    browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        browser.tabs.sendMessage(tabs[0].id, { action: 'startSelection' });
    });
});

// Handle manual edits to the input field
document.getElementById('timestamps').addEventListener('input', (event) => {
    const inputField = event.target;
    const parsed = parseTimestamps(inputField.value);

    if (parsed) {
        browser.storage.session.set({timestamps: `${formatTime(parsed.start)} - ${formatTime(parsed.end)}`});
        inputField.style.borderColor = ''; // Valid input
        browser.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            browser.tabs.sendMessage(tabs[0].id, { action: 'manualSelection',
                start: parsed.start,
                end: parsed.end
             });
        });
    } else {
        inputField.style.borderColor = 'red'; // Highlight invalid input
    }
});

// Listen for messages from the content script
browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'updateTimestamps') {
        const inputField = document.getElementById('timestamps');
        inputField.value = message.timestamps;
        inputField.style.borderColor = ''; // Reset border on valid input
    }
});

document.getElementById('reset').addEventListener('click', function() {
    browser.tabs.query({active: true, currentWindow: true}, function(tabs) {
        browser.tabs.sendMessage(tabs[0].id, { action: 'reset' });
        browser.storage.session.remove((tabs[0].id).toString()).then((data) => {
            document.getElementById('timestamps').value = '';
            });
    
    });
    
});

// Populate input on popup load
populateInput();
  