
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('speakUpForm');
  const tableBody = document.getElementById('tableBody');
  const dateInput = document.getElementById('day');
  const weekDisplay = document.getElementById('weekDisplay');

  function saveTableData() {
    const savedData = JSON.parse(localStorage.getItem('speakUpData')) || [];
    localStorage.setItem('speakUpData', JSON.stringify(savedData));
    renderTable(savedData);
  }

  function renderTable(data) {
    tableBody.innerHTML = '';
    const grouped = {};
    const weekEnding = {};
  
    // Sort data chronologically by date
    data.sort((a, b) => new Date(a.day) - new Date(b.day));
  
    data.forEach(item => {
      const key = `${item.week}_${item.day}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
      if (!weekEnding[item.week]) weekEnding[item.week] = [];
      weekEnding[item.week].push(key);
    });
  
    const renderedWeeks = new Set();
    for (const key in grouped) {
      const group = grouped[key];
      const currentWeek = group[0].week;
  
      insertGroupedRows(group);
  
      const allKeys = weekEnding[currentWeek];
      if (key === allKeys[allKeys.length - 1] && !renderedWeeks.has(currentWeek)) {
        insertWeekEndRow(currentWeek);
        renderedWeeks.add(currentWeek);
      }
    }
  }
  
  function insertGroupedRows(group) {
    if (!group.length) return;
  
    const { week, day, topic, activities, attendees } = group[0];
    const dateObj = new Date(day);
    const dayLabel = `${dateObj.toLocaleDateString('en-US', { weekday: 'long' })} ${day}`;
  
    group.forEach((entry, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        ${index === 0 ? `<td rowspan="${group.length}">${week}</td>` : ''}
        ${index === 0 ? `<td rowspan="${group.length}" data-date="${day}">${dayLabel}</td>` : ''}
        <td>${entry.tutor}</td>
        ${index === 0 ? `<td rowspan="${group.length}">${topic}</td>` : ''}
        ${index === 0 ? `<td rowspan="${group.length}">${activities}</td>` : ''}
        ${index === 0 ? `<td rowspan="${group.length}">${attendees}</td>` : ''}
        <td>
          <button class="action-btn edit-btn">Edit</button>
          <button class="action-btn delete-btn">Delete</button>
        </td>
      `;
      tableBody.appendChild(row);
    });
  }
  

  function insertWeekEndRow(week) {
    const row = document.createElement('tr');
    row.classList.add('week-end-row');
    row.innerHTML = `
      <td colspan="7" style="text-align:center; font-weight:bold; background-color:#fce4ec; font-size: 24px; padding: 10px;">
        End of ${week}
      </td>
    `;
    tableBody.appendChild(row);
  }

  function getStoredData() {
    return JSON.parse(localStorage.getItem('speakUpData')) || [];
  }

  function addNewEntry(entry) {
    const data = getStoredData();
    data.push(entry);
    localStorage.setItem('speakUpData', JSON.stringify(data));
    renderTable(data);
  }

  dateInput.addEventListener('change', function () {
    const selectedDate = new Date(this.value);
    const dayOfWeek = selectedDate.getDay();

    if ([0, 1, 6].includes(dayOfWeek)) {
      weekDisplay.textContent = "No class on Monday, Saturday or Sunday!";
      this.value = "";
      return;
    }
    
    const startDate = new Date("2025-06-24");
    const diffInTime = selectedDate.getTime() - startDate.getTime();
    const diffInDays = Math.floor(diffInTime / (1000 * 3600 * 24));
    const weekNumber = Math.floor(diffInDays / 7) + 1;
    weekDisplay.textContent = `Week ${weekNumber}`;
  });

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const week = weekDisplay.textContent.trim();
    if (week.startsWith("No class")) return;

    const entry = {
      week,
      day: dateInput.value,
      tutor: document.getElementById('tutor').value.trim(),
      topic: document.getElementById('topic').value,
      activities: document.getElementById('activities').value,
      attendees: document.getElementById('attendees').value
    };

    addNewEntry(entry);
    form.reset();
    weekDisplay.textContent = "Week 1";
  });

  tableBody.addEventListener('click', function (event) {
    const row = event.target.closest('tr');
    if (!row || row.classList.contains('week-end-row')) return;

    let date = null;
    let tutorName = null;
    const allRows = Array.from(tableBody.rows);
    const currentIndex = allRows.indexOf(row);

    for (let i = currentIndex; i >= 0; i--) {
      const cells = allRows[i].cells;
      if (cells[1] && cells[1].hasAttribute('data-date')) {
        date = cells[1].getAttribute('data-date');
      }
      if (cells[2]) {
        tutorName = cells[2].textContent.trim();
        break;
      }
    }

    if (!date || !tutorName) return;

    if (event.target.classList.contains('delete-btn')) {
      const data = getStoredData().filter(item => !(item.day === date && item.tutor === tutorName));
      localStorage.setItem('speakUpData', JSON.stringify(data));
      renderTable(data);
    }

    if (event.target.classList.contains('edit-btn')) {
      const data = getStoredData();
      const entryIndex = data.findIndex(item => item.day === date && item.tutor === tutorName);
      if (entryIndex >= 0) {
        const entry = data[entryIndex];
        dateInput.value = entry.day;
        document.getElementById('tutor').value = entry.tutor;
        document.getElementById('topic').value = entry.topic;
        document.getElementById('activities').value = entry.activities;
        document.getElementById('attendees').value = entry.attendees;
        data.splice(entryIndex, 1);
        localStorage.setItem('speakUpData', JSON.stringify(data));
        renderTable(data);
      }
    }
  });

  renderTable(getStoredData());

  function exportToGoogleSheet() {
    const data = getStoredData(); // Reuse your existing data
  
    fetch('https://script.google.com/macros/s/AKfycbxa9yNzy6SFLMmkN4R7uLvGlEXm7UTl6JXBYtykgS734rj3yrwrU4fVQEg9VJzdXlUuHA/exec', {
      method: 'POST',
      body: JSON.stringify(data),
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.text())
    .then(result => alert("Export successful!"))
    .catch(error => alert("Export failed: " + error));
  }
});

function doGet(e) {
  return ContentService.createTextOutput("This script only supports POST requests.");
}

