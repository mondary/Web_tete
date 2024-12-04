let startTime = 0;
let elapsedTime = 0;
let timerInterval;
let isRunning = false;
let sessions = [];
let breastCount = 0;

const startStopButton = document.getElementById('startStopButton');
const timerDisplay = document.getElementById('timer');
const sessionHistoryDisplay = document.getElementById('sessionHistory');
const feedingChartCanvas = document.getElementById('feedingChart');
const breastCountDisplay = document.getElementById('breastCountDisplay');

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
  const formattedTime = formatTime(elapsedTime);
  const timeParts = formattedTime.split(':');
  timerDisplay.innerHTML = `
    <span>${timeParts[0]}</span>
    <span>${timeParts[1]}</span>
    <span>${timeParts[2]}</span>
  `;
}

function logSession() {
  const now = new Date();
  const dateString = now.toLocaleDateString();
  const timeString = now.toLocaleTimeString();
  const durationString = formatTime(elapsedTime);

  const sessionData = { date: dateString, time: timeString, duration: elapsedTime, breastCount: breastCount };
  sessions.push(sessionData);
  updateSessionStorage();

  displaySessionHistory();
  createFeedingChart();
  console.log('Session logged:', sessionData);
  displayRecentSessionList();
  breastCount = 0; // Reset breast count after logging
  breastCountDisplay.textContent = breastCount;
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
    const trashIcon = document.createElement('img');
    trashIcon.src = 'trash.png';
    trashIcon.alt = 'Delete Session';
    trashIcon.addEventListener('click', () => {
      sessions.splice(index, 1);
      updateSessionStorage();
      displaySessionHistory();
      createFeedingChart();
    });
    sessionElement.innerHTML = `Date: ${session.date}, Time: ${session.time}, Duration: ${formatTime(session.duration)}, Breast Count: ${session.breastCount}`;
    sessionElement.appendChild(trashIcon);
    sessionHistoryDisplay.appendChild(sessionElement);
  });

  calculateAndDisplayStats();
}


function calculateAndDisplayStats() {
  if (sessions.length === 0) return;

  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const averageDuration = totalDuration / sessions.length;
  const totalBreastCount = sessions.reduce((sum, session) => sum + session.breastCount, 0);
  const averageBreastCount = totalBreastCount / sessions.length;

  const statsDisplay = document.createElement('div');
  statsDisplay.innerHTML = `
      <h3>Statistics</h3>
      <p>Total Feeding Time: ${formatTime(totalDuration)}</p>
      <p>Average Feeding Time: ${formatTime(averageDuration)}</p>
      <p>Number of Feedings: ${sessions.length}</p>
      <p>Total Breast Count: ${totalBreastCount}</p>
      <p>Average Breast Count: ${averageBreastCount.toFixed(1)}</p>
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
    alert(`Date: ${lastSession.date}, Time: ${lastSession.time}, Duration: ${formatTime(lastSession.duration)}, Breast Count: ${lastSession.breastCount}`);
  }
}

window.addEventListener('load', () => {
  displaySessionHistory();
  createFeedingChart();
  const incrementBreastCountButton = document.createElement('button');
  incrementBreastCountButton.textContent = '+ Breast';
  incrementBreastCountButton.style.cssText = `
    padding: 8px 15px;
    margin-left: 10px;
    background-color: #008CBA;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    box-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
  `;
  incrementBreastCountButton.addEventListener('click', () => {
    breastCount++;
    breastCountDisplay.textContent = breastCount;
  });
  document.querySelector('.container').appendChild(incrementBreastCountButton);
});

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
