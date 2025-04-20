let timers = {};
let timerIdCounter = 1;  // To generate unique timer IDs

// Load existing timers from localStorage on page load
window.onload = function () {
  loadTimers();
  
  // Set up periodic saving to ensure we capture all state changes
  setInterval(saveTimers, 10000); // Save state every 10 seconds
};

function loadTimers() {
  const storedTimers = JSON.parse(localStorage.getItem('timers')) || [];
  
  // Update the counter to be higher than any existing timer ID
  storedTimers.forEach(timer => {
    const numericId = parseInt(timer.id, 10);
    if (numericId >= timerIdCounter) {
      timerIdCounter = numericId + 1;
    }
  });
  
  storedTimers.forEach(timer => {
    // Ensure color exists, use default if not
    const timerColor = timer.color || "#4CAF50";
    
    addTimerToDOM(timer.id, timer.name, timer.timeLeft, timerColor);
    
    // If timer was running when saved, restart it
    if (timer.isRunning) {
      let remainingTime = timer.timeLeft;
      
      // If startTime exists, calculate elapsed time
      if (timer.startTime) {
        const currentTime = new Date().getTime();
        const elapsedSeconds = Math.floor((currentTime - timer.startTime) / 1000);
        
        // Calculate remaining time
        remainingTime = timer.timeLeft - elapsedSeconds;
        
        // If timer should have completed already, set to 0
        if (remainingTime < 0) {
          remainingTime = 0;
        }
      }
      
      // Update display with correct time
      const display = document.getElementById(`display${timer.id}`);
      display.textContent = formatTime(remainingTime);
      
      // If time still remains, restart the timer
      if (remainingTime > 0) {
        timers[timer.id].timeLeft = remainingTime;
        startTimer(timer.id, true); // true indicates this is a restart
      }
    }
    
    // Update the timer header color from saved data
    const timerHeader = document.querySelector(`[data-id="${timer.id}"] .timer-header`);
    if (timerHeader) {
      timerHeader.style.backgroundColor = timerColor;
    }
    
    // Update the color picker to match the saved color
    const colorPicker = document.getElementById(`color${timer.id}`);
    if (colorPicker) {
      colorPicker.value = timerColor;
    }
  });
}

function saveTimers() {
  const timerElements = document.querySelectorAll('.timer');
  const timerData = [];
  
  timerElements.forEach(timer => {
    const id = timer.getAttribute('data-id');
    const name = document.getElementById(`name${id}`).value;
    const timeLeft = parseTimeToSeconds(document.getElementById(`display${id}`).textContent);
    
    // Get color from the header and color picker (prefer the color picker for accuracy)
    const colorPicker = document.getElementById(`color${id}`);
    let color = "#4CAF50"; // Default color as fallback
    
    if (colorPicker && colorPicker.value) {
      color = colorPicker.value;
    } else {
      const timerHeader = timer.querySelector('.timer-header');
      if (timerHeader && timerHeader.style.backgroundColor) {
        color = timerHeader.style.backgroundColor;
      }
    }
    
    const isRunning = timers[id] && timers[id].intervalId !== null;
    
    // Update startTime to the current time if the timer is running
    // This ensures we have a fresh timestamp on each save
    let startTime = null;
    if (isRunning) {
      startTime = new Date().getTime();
    }
    
    timerData.push({ 
      id, 
      name, 
      timeLeft, 
      color, 
      isRunning,
      startTime
    });
  });
  
  try {
    localStorage.setItem('timers', JSON.stringify(timerData));
    console.log('Timers saved to localStorage:', timerData);
  } catch (e) {
    console.error('Error saving timers to localStorage:', e);
  }
}

// Function to generate a random color in hex format
function generateRandomColor() {
  // Generate random values for red, green, and blue
  const r = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const g = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  const b = Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  
  // Return hex color
  return `#${r}${g}${b}`;
}

function addNewTimer() {
  const timerId = timerIdCounter++;
  const defaultTime = 60; // Default 1 minute in seconds
  const randomColor = generateRandomColor(); // Generate random color
  
  // Create a new timer and add it to the DOM
  addTimerToDOM(timerId, `New Timer ${timerId}`, defaultTime, randomColor);
}

function addTimerToDOM(timerId, name, timeLeft, color) {
  const container = document.getElementById('timerContainer');
  const timerDiv = document.createElement('div');
  timerDiv.classList.add('timer');
  timerDiv.setAttribute('data-id', timerId);
  
  timerDiv.innerHTML = `
    <div class="timer-header" style="background-color: ${color};">
      <input type="text" id="name${timerId}" value="${name}" class="timer-name" onchange="updateTimerName(${timerId})">
    </div>
    <div class="timer-display" id="display${timerId}">${formatTime(timeLeft)}</div>
    <div class="timer-controls">
      <button onclick="startTimer(${timerId})">Start</button>
      <button onclick="pauseTimer(${timerId})">Pause</button>
      <button onclick="resetTimer(${timerId})">Reset</button>
    </div>
    <div class="timer-settings" id="settings${timerId}">
      <div class="time-setter">
        <div class="time-input">
          <label for="hours${timerId}">Hours:</label>
          <input type="number" id="hours${timerId}" min="0" max="23" value="${Math.floor(timeLeft/3600)}" onchange="updateTimerLength(${timerId})">
        </div>
        <div class="time-input">
          <label for="minutes${timerId}">Minutes:</label>
          <input type="number" id="minutes${timerId}" min="0" max="59" value="${Math.floor((timeLeft%3600)/60)}" onchange="updateTimerLength(${timerId})">
        </div>
        <div class="time-input">
          <label for="seconds${timerId}">Seconds:</label>
          <input type="number" id="seconds${timerId}" min="0" max="59" value="${timeLeft%60}" onchange="updateTimerLength(${timerId})">
        </div>
      </div>
    </div>
    <div class="color-picker">
      <label for="color${timerId}">Choose Color: </label>
      <input type="color" id="color${timerId}" value="${color}" onchange="updateTimerColor(${timerId})">
    </div>
  `;
  
  container.appendChild(timerDiv);
  timers[timerId] = { timeLeft, intervalId: null, startTime: null };
}

function updateTimerName(timerId) {
  const name = document.getElementById(`name${timerId}`).value;
  console.log(`Timer ${timerId} name updated to: ${name}`);
  saveTimers();
}

function updateTimerColor(timerId) {
  const color = document.getElementById(`color${timerId}`).value;
  const timerHeader = document.querySelector(`[data-id="${timerId}"] .timer-header`);
  
  if (timerHeader) {
    timerHeader.style.backgroundColor = color;
  }
  
  // Ensure the input color matches the header
  const colorPicker = document.getElementById(`color${timerId}`);
  if (colorPicker) {
    colorPicker.value = color;
  }
  
  console.log(`Timer ${timerId} color updated to: ${color}`);
  saveTimers(); // Save the updated color to localStorage
}

function startTimer(timerId, isRestart = false) {
  // Clear any existing interval for this timer first
  if (timers[timerId] && timers[timerId].intervalId) {
    clearInterval(timers[timerId].intervalId);
  }
  
  const display = document.getElementById(`display${timerId}`);
  let timeLeft = parseTimeToSeconds(display.textContent);
  
  // Hide timer settings when running
  const settings = document.getElementById(`settings${timerId}`);
  settings.style.display = 'none';
  
  // Record the start time
  // Always update start time to current time when starting or restarting
  timers[timerId].startTime = new Date().getTime();
  
  timers[timerId].intervalId = setInterval(function () {
    if (timeLeft <= 0) {
      clearInterval(timers[timerId].intervalId);
      timers[timerId].intervalId = null;
      timers[timerId].startTime = null;
      const timerName = getTimerName(timerId);
      console.log(`Timer finished: name=${timerName}, id=${timerId}`);
      alert(`${timerName} timer finished!`);
      // Show settings again when timer finishes
      settings.style.display = 'block';
      saveTimers();
    } else {
      timeLeft--;
      display.textContent = formatTime(timeLeft);
    }
  }, 1000);
  
  timers[timerId].timeLeft = timeLeft; // Save the current timeLeft
  saveTimers(); // Save the updated timer to localStorage
}

function pauseTimer(timerId) {
  if (timers[timerId] && timers[timerId].intervalId) {
    clearInterval(timers[timerId].intervalId);
    timers[timerId].intervalId = null;
    timers[timerId].startTime = null; // Clear start time on pause
    
    // Show settings when paused
    const settings = document.getElementById(`settings${timerId}`);
    settings.style.display = 'block';
    saveTimers();
  }
}

function resetTimer(timerId) {
  if (timers[timerId]) {
    if (timers[timerId].intervalId) {
      clearInterval(timers[timerId].intervalId);
      timers[timerId].intervalId = null;
    }
    
    timers[timerId].startTime = null; // Clear start time on reset
    
    const display = document.getElementById(`display${timerId}`);
    display.textContent = "01:00"; // Reset to default time of 1 minute
    timers[timerId].timeLeft = 60;
    
    // Update the time inputs to match the reset time
    document.getElementById(`hours${timerId}`).value = 0;
    document.getElementById(`minutes${timerId}`).value = 1;
    document.getElementById(`seconds${timerId}`).value = 0;
    
    // Show settings when reset
    const settings = document.getElementById(`settings${timerId}`);
    settings.style.display = 'block';
    
    saveTimers(); // Save the reset timer to localStorage
  }
}

function getTimerName(timerId) {
  return document.getElementById(`name${timerId}`).value;
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes < 10 ? '0' + minutes : minutes}:${remainingSeconds < 10 ? '0' + remainingSeconds : remainingSeconds}`;
}

function parseTimeToSeconds(timeString) {
  const [minutes, seconds] = timeString.split(':').map(num => parseInt(num, 10));
  return minutes * 60 + seconds;
}

function updateTimerLength(timerId) {
  const hours = parseInt(document.getElementById(`hours${timerId}`).value) || 0;
  const minutes = parseInt(document.getElementById(`minutes${timerId}`).value) || 0;
  const seconds = parseInt(document.getElementById(`seconds${timerId}`).value) || 0;
  
  // Ensure values are within bounds
  const validHours = Math.min(Math.max(hours, 0), 23);
  const validMinutes = Math.min(Math.max(minutes, 0), 59);
  const validSeconds = Math.min(Math.max(seconds, 0), 59);
  
  // Update input fields with valid values
  document.getElementById(`hours${timerId}`).value = validHours;
  document.getElementById(`minutes${timerId}`).value = validMinutes;
  document.getElementById(`seconds${timerId}`).value = validSeconds;
  
  // Calculate total seconds
  const totalSeconds = (validHours * 3600) + (validMinutes * 60) + validSeconds;
  
  // Update the timer display
  const display = document.getElementById(`display${timerId}`);
  display.textContent = formatTime(totalSeconds);
  
  // Update stored timer
  timers[timerId].timeLeft = totalSeconds;
  saveTimers();
}
