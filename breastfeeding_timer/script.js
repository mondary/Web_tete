let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;
let sessions = [];

const startStopButton = document.getElementById('startStopButton');
const timerDisplay = document.getElementById('timer');
const sessionHistoryDisplay = document.getElementById('sessionHistory');
const feedingChartCanvas = document.getElementById('feedingChart');

function formatTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedHours = hours < 10 ? `0${hours}` : hours;

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function updateTimer() {
  elapsedTime = Date.now() - startTime;
  timerDisplay.textContent = formatTime(elapsedTime);
}

function logSession() {
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();
  const durationString = formatTime(elapsedTime);

  const sessionData = { date: dateString, time: timeString, duration: elapsedTime };
  sessions.push(sessionData);
  updateSessionStorage();

  displaySessionHistory();
  createFeedingChart();
  console.log('Session logged:', sessionData);
  displayRecentSessionList();
}

function updateSessionStorage() {
    localStorage.setItem('sessions', JSON.stringify(sessions));
}

function displaySessionHistory() {
  sessions = JSON.parse(localStorage.getItem('sessions')) || [];
  sessionHistoryDisplay.innerHTML = '';

  if (sessions.length === 0) {
    sessionHistoryDisplay.textContent = 'No sessions yet.';
    return;
  }

  sessions.reverse().forEach((session, index) => {
    const sessionElement = document.createElement('div');
    sessionElement.classList.add('session-item');
    sessionElement.innerHTML = `Date: ${session.date}, Time: ${session.time}, Duration: ${formatTime(session.duration)}`;
    sessionHistoryDisplay.appendChild(sessionElement);
  });

  calculateAndDisplayStats();
}


function calculateAndDisplayStats() {
    if (sessions.length === 0) return;

    const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
    const averageDuration = totalDuration / sessions.length;

    const statsDisplay = document.createElement('div');
    statsDisplay.innerHTML = `
        <h3>Statistics</h3>
        <p>Total Feeding Time: ${formatTime(totalDuration)}</p>
        <p>Average Feeding Time: ${formatTime(averageDuration)}</p>
        <p>Number of Feedings: ${sessions.length}</p>
    `;
    sessionHistoryDisplay.appendChild(statsDisplay);
}


function createFeedingChart() {
  sessions = JSON.parse(localStorage.getItem('sessions')) || [];
  const hourlyData = getHourlyFeedingData(sessions);

  const ctx = feedingChartCanvas.getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: hourlyData.labels,
      datasets: [{
        label: 'Feeding Sessions',
        data: hourlyData.data,
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        x: {
          title: {
            display: true,
            text: 'Number of Feedings'
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Hour of Day'
          }
        }
      }
    }
  });
}

function getHourlyFeedingData(sessions) {
    const hourlyCounts = {};
    sessions.forEach(session => {
        const timeParts = session.time.split(':');
        const hour = parseInt(timeParts[0]);
        hourlyCounts[hour] = (hourlyCounts[hour] || 0) + 1;
    });

    const labels = [];
    const data = [];
    for (let i = 0; i < 24; i++) {
        labels.push(i);
        data.push(hourlyCounts[i] || 0);
    }
    return { labels, data };
}

function displayRecentSessionList() {
    if (sessions.length > 0) {
        const lastSession = sessions[sessions.length - 1];
        alert(`Date: ${lastSession.date}, Time: ${lastSession.time}, Duration: ${formatTime(lastSession.duration)}`);
    }
}

window.addEventListener('load', displaySessionHistory);
window.addEventListener('load', createFeedingChart);

startStopButton.addEventListener('click', () => {
  if (!isRunning) {
    elapsedTime = 0;
    startTime = Date.now();
    timerInterval = setInterval(updateTimer, 100);
    startStopButton.textContent = 'Stop';
    isRunning = true;
  } else {
    clearInterval(timerInterval);
    startStopButton.textContent = 'Start';
    isRunning = false;
    logSession();
  }
});
