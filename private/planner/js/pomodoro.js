// ==========================================
// POMODORO TIMER MODULE
// ==========================================

// Pomodoro Timer Variables
let pomodoroInterval = null;
let pomodoroTimeRemaining = 25 * 60; // 25 minutes in seconds
let pomodoroMode = 'focus'; // 'focus', 'short-break', 'long-break'
let pomodoroSessionCount = parseInt(localStorage.getItem('pomodoroSessionCount') || '0');
let pomodoroIsRunning = false;
const POMODORO_FOCUS_TIME = 25 * 60; // 25 minutes
const POMODORO_SHORT_BREAK = 5 * 60; // 5 minutes
const POMODORO_LONG_BREAK = 15 * 60; // 15 minutes

function initPomodoro() {
    // Show the timer when user is authenticated
    const timer = document.getElementById('pomodoroTimer');
    if (timer && typeof accessToken !== 'undefined' && accessToken) {
        timer.style.display = 'flex';
        updatePomodoroDisplay();
        updatePomodoroSessionDisplay();
    }
}

function startPomodoro() {
    pomodoroIsRunning = true;
    document.getElementById('pomodoroStart').style.display = 'none';
    document.getElementById('pomodoroPause').style.display = 'inline-block';
    
    pomodoroInterval = setInterval(() => {
        if (pomodoroTimeRemaining > 0) {
            pomodoroTimeRemaining--;
            updatePomodoroDisplay();
        } else {
            // Timer completed
            completePomodoroSession();
        }
    }, 1000);
}

function pausePomodoro() {
    pomodoroIsRunning = false;
    document.getElementById('pomodoroStart').style.display = 'inline-block';
    document.getElementById('pomodoroPause').style.display = 'none';
    
    if (pomodoroInterval) {
        clearInterval(pomodoroInterval);
        pomodoroInterval = null;
    }
}

function resetPomodoro() {
    pausePomodoro();
    pomodoroMode = 'focus';
    pomodoroTimeRemaining = POMODORO_FOCUS_TIME;
    updatePomodoroDisplay();
}

function completePomodoroSession() {
    pausePomodoro();
    
    // Play notification sound (browser notification)
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Pomodoro Complete!', {
            body: pomodoroMode === 'focus' ? 'Time for a break!' : 'Ready to focus again?',
            icon: '🍅'
        });
    }
    
    // Update session count and mode
    if (pomodoroMode === 'focus') {
        pomodoroSessionCount++;
        localStorage.setItem('pomodoroSessionCount', pomodoroSessionCount.toString());
        updatePomodoroSessionDisplay();
        
        // Determine break type (long break after 4 sessions)
        if (pomodoroSessionCount % 4 === 0) {
            pomodoroMode = 'long-break';
            pomodoroTimeRemaining = POMODORO_LONG_BREAK;
        } else {
            pomodoroMode = 'short-break';
            pomodoroTimeRemaining = POMODORO_SHORT_BREAK;
        }
    } else {
        // Break is over, back to focus
        pomodoroMode = 'focus';
        pomodoroTimeRemaining = POMODORO_FOCUS_TIME;
    }
    
    updatePomodoroDisplay();
    
    // Auto-start next session (optional - user can change this)
    // startPomodoro();
}

function updatePomodoroDisplay() {
    const minutes = Math.floor(pomodoroTimeRemaining / 60);
    const seconds = pomodoroTimeRemaining % 60;
    const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    document.getElementById('pomodoroTime').textContent = timeString;
    
    const modeLabels = {
        'focus': 'Focus',
        'short-break': 'Short Break',
        'long-break': 'Long Break'
    };
    document.getElementById('pomodoroMode').textContent = modeLabels[pomodoroMode];
    
    // Update document title when running
    if (pomodoroIsRunning) {
        document.title = `${timeString} - ${modeLabels[pomodoroMode]} - Planner Pro`;
    } else {
        document.title = 'SkibaTech Engineering - Planner Pro';
    }
}

function updatePomodoroSessionDisplay() {
    document.getElementById('pomodoroSessions').textContent = `🍅 ${pomodoroSessionCount}`;
}

// Request notification permission on page load
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}
