let timestamps = { start: 0, end: 0 };
let clickCount = 0;
let isLooping = false;
let addedListener = false;

let video = null;
let progressBar = null;

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

document.addEventListener('yt-player-updated', async function () {
  let data = await browser.runtime.sendMessage({ action: "get" });

  if (data) {
    if (location.href != data.href) {
      browser.runtime.sendMessage({ action: "remove"}).then((data)=> {
          timestamps = { start: 0, end: 0 };
          clickCount = 0;
          isLooping = false;
          addedListener = false;
        })
    }
    else {
      timestamps = parseTimestamps(data.timestamps)
      isLooping = true;
    }
  }
  video = document.querySelector('video');
  progressBar = document.querySelector('.ytp-progress-bar');
});

const getClickedTime = (event) => {
  const rect = progressBar.getBoundingClientRect();
  const clickPosition = event.clientX - rect.left;
  const clickRatio = clickPosition / rect.width;
  return video.duration * clickRatio;
};

const progressBarClickListener = (event) => {
  const clickedTime = getClickedTime(event);
  clickCount++;

  if (clickCount === 1) {
    timestamps.start = clickedTime;
    showOverlay(`Start time set: ${formatTime(timestamps.start)}`);
  } else if (clickCount === 2) {
    timestamps.end = clickedTime;
    showOverlay(`End time set: ${formatTime(timestamps.end)}`);
    clickCount = 0;
    isLooping = true;
    
    const combinedTimestamps = `${formatTime(timestamps.start)} - ${formatTime(timestamps.end)}`;
    browser.runtime.sendMessage({ action: "set", data: { timestamps: combinedTimestamps, href: location.href }}).then(() => {
      browser.runtime.sendMessage({
        action: 'updateTimestamps',
        timestamps: combinedTimestamps,
      });
    });

    progressBar.removeEventListener('click', progressBarClickListener);
    addedListener = false;
  }
};

// Helper function to format seconds into hh:mm:ss
function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return [hrs, mins, secs]
    .map((v) => v.toString().padStart(2, '0')) // Add leading zero
    .join(':');
}

function enableClickListener() {
  if (!progressBar) {
    video = document.querySelector('video');
    progressBar = document.querySelector('.ytp-progress-bar');
  }

  if (!addedListener) {
    progressBar.addEventListener('click', progressBarClickListener);
    addedListener = true;
  }
}

// Function to show modern overlay
async function showOverlay(message) {

    const flag = (await browser.storage.local.get('showOverlay')).showOverlay

    if ((flag !== undefined) && !flag) {
        return;
    }

    // Create overlay element
    const overlay = document.createElement('div');
    overlay.textContent = message;
    
    // Apply modern styles
    Object.assign(overlay.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'rgba(0, 0, 0, 0.8)', // Semi-transparent dark background
      color: 'white',
      padding: '15px 30px',
      borderRadius: '10px',
      boxShadow: '0px 4px 15px rgba(0, 0, 0, 0.5)', // Subtle shadow for depth
      fontFamily: 'Arial, sans-serif',
      fontSize: '16px',
      textAlign: 'center',
      zIndex: '10000',
      opacity: '0', // Start hidden
      transition: 'opacity 0.3s ease-in-out', // Smooth fade-in/out
    });
  
    document.body.appendChild(overlay);
  
    // Trigger fade-in
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
  
    // Remove overlay after 2 seconds with fade-out
    setTimeout(() => {
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 300); // Ensure element is removed after fade-out
    }, 2000);
  }

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'startSelection') {
    clickCount = 0;
    showOverlay("Click on the video's progress bar to set the start and end times");
    enableClickListener();
  }
  else if (message.action === 'manualSelection') {
    timestamps.start = message.start
    timestamps.end = message.end
    progressBar.removeEventListener('click', progressBarClickListener);
    addedListener = false;
    isLooping = true;
  }
  else if (message.action === 'reset') {
    isLooping = false;
    clickCount = 0;
  }
});

function checkLoop() {
    if (isLooping) {
        let video = document.querySelector('video');
        if ( video.currentTime >= timestamps.end || video.currentTime < timestamps.start) {
            video.currentTime = timestamps.start;
            video.play();
          }
    }
}

setInterval(checkLoop, 1000);
