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
const statsDisplay = document.getElementById('stats');

function formatTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const hours = Math.floor((time / (1000 * 60 * 60)) % 24);

  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  const formattedHours = hours < 10 ? `0${hours}` : hours;

  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

function formatShortTime(time) {
  const seconds = Math.floor((time / 1000) % 60);
  const minutes = Math.floor((time / (1000 * 60)) % 60);
  const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  return `${formattedMinutes}m${formattedSeconds}s`;
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
  breastCount = 0;
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

  sessions.sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time));

  sessions.forEach((session, index) => {
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

    const dateParts = session.date.split('/');
    const timeParts = session.time.split(':');
    const duration = formatShortTime(session.duration);

    sessionElement.innerHTML = `#${sessions.length - index} - ${dateParts[0]}/${dateParts[1]}/${dateParts[2]} @ ${timeParts[0]}:${timeParts[1]} - dur: ${duration}`;
    sessionElement.appendChild(trashIcon);
    sessionHistoryDisplay.prepend(sessionElement);
  });

  calculateAndDisplayStats();
}


function calculateAndDisplayStats() {
  if (sessions.length === 0) return;

  const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
  const averageDuration = totalDuration / sessions.length;

  statsDisplay.innerHTML = `
      <h3>Statistics</h3>
      <p>Total Time: ${formatTime(totalDuration)}</p>
      <p>Avg Time: ${formatTime(averageDuration)}</p>
      <p>Sessions: ${sessions.length}</p>
  `;
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
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Hour'
          },
          ticks: {
            stepSize: 1,
            min: 1,
            max: 23
          }
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Feedings'
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
  for (let i = 1; i <= 23; i++) {
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
