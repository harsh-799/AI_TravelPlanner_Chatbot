const form = document.getElementById('chat-form');
const chatBox = document.getElementById('chat-box');

let chatState = 'idle';
let tempData = {
  source: '',
  destination: '',
  days: '',
  budget: '',
  query: ''
};

function applyTheme(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  document.body.style.backgroundColor = isDark ? '#1a202c' : '';
  document.body.style.color = isDark ? '#e2e8f0' : '';
  
  const darkToggle = document.getElementById('dark-toggle');
  if (darkToggle) {
    darkToggle.textContent = isDark ? '☀️' : '🌙';
  }
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

function handleThemeToggle() {
  const newDarkMode = !document.body.classList.contains('dark-mode');
  applyTheme(newDarkMode);
  if (window !== window.parent) {
    window.parent.postMessage({
      type: 'chatbotThemeChange',
      isDark: newDarkMode
    }, '*');
  }
}

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme');
  const initialDarkMode = savedTheme === 'dark';
  applyTheme(initialDarkMode);
  const darkToggle = document.getElementById('dark-toggle');
  if (darkToggle) {
    darkToggle.addEventListener('click', handleThemeToggle);
  }
  if (window !== window.parent) {
    window.parent.postMessage({ type: 'chatbotReady' }, '*');
  }
}

window.addEventListener('message', (event) => {
  if (event.data.type === 'updateTheme') {
    applyTheme(event.data.isDark);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  if (typeof greetingMessage !== 'undefined' && greetingMessage) {
    addMessage('bot', greetingMessage);
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearFeedback();

  const query = document.getElementById('query').value.trim();
  addMessage('user', query);
  document.getElementById('query').value = '';

  if (chatState === 'idle') {
    if (query.toLowerCase() === '/start') {
      chatState = 'awaiting_source';
      addMessage('bot', "Great! Where are you traveling *from*?");
    } else {
      addMessage('bot', "Please type /start to begin planning your trip.");
    }
    return;
  }

  switch (chatState) {
    case 'awaiting_source':
      tempData.source = query;
      chatState = 'awaiting_destination';
      addMessage('bot', "Awesome! Where are you traveling *to*?");
      return;

    case 'awaiting_destination':
      tempData.destination = query;
      chatState = 'awaiting_days';
      addMessage('bot', "Cool! How many *days* do you plan to travel?");
      return;

    case 'awaiting_days':
      if (isNaN(query) || Number(query) <= 0) {
        addMessage('bot', "Please enter a valid number of days.");
        return;
      }
      tempData.days = query;
      chatState = 'awaiting_budget';
      addMessage('bot', "Got it! What's your approximate *budget* (in ₹)? You can skip by typing 'skip'.");
      return;

    case 'awaiting_budget':
      if (query.toLowerCase() === 'skip') {
        tempData.budget = '';
      } else if (isNaN(query) || Number(query) < 0) {
        addMessage('bot', "Please enter a valid number for budget or type 'skip'.");
        return;
      } else {
        tempData.budget = query;
      }
      chatState = 'awaiting_query';
      addMessage('bot', "Great! Now type your query like *Plan my trip*, *Suggest itinerary*, etc.");
      return;

    case 'awaiting_query':
      tempData.query = query;
      chatState = 'idle';
      await submitToBackend();
      return;

    default:
      addMessage('bot', "Something went wrong. Please type /start to begin again.");
      chatState = 'idle';
      break;
  }
});

async function submitToBackend() {
  const responseDiv = document.createElement('div');
  responseDiv.className = 'message bot typing-indicator';
  responseDiv.innerHTML = `
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `;
  chatBox.appendChild(responseDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  const res = await fetch('/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: tempData.query,
      source_name: tempData.source,
      destination_name: tempData.destination,
      days: tempData.days,
      budget: tempData.budget
    })
  });

  const data = await res.json();
  let response = data.response
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank'>$1</a>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");

  responseDiv.classList.remove('typing-indicator');
  responseDiv.innerHTML = `<p>${response}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  tempData = { source: '', destination: '', days: '', budget: '', query: '' };
}

function addMessage(sender, text) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${sender}`;

  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "<a href='$2' target='_blank'>$1</a>")
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");

  messageDiv.innerHTML = formattedText;
  chatBox.appendChild(messageDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

let feedbackNote;
function showFeedback(type) {
  const botMessages = document.querySelectorAll('.message.bot');
  const lastBotMessage = botMessages[botMessages.length - 1];

  if (feedbackNote) feedbackNote.remove();

  feedbackNote = document.createElement('div');
  feedbackNote.className = 'feedback-note';
  feedbackNote.classList.add(type === 'positive' ? 'positive' : 'negative');

  feedbackNote.innerText =
    type === 'positive'
      ? 'User has given the chat a positive rating'
      : 'User has given the chat a negative rating\nI am sorry that you had a bad experience, please contact us at \n support@trippybot.com so we can assist you further';

  lastBotMessage.insertAdjacentElement('afterend', feedbackNote);
}

function clearFeedback() {
  if (feedbackNote) {
    feedbackNote.remove();
    feedbackNote = null;
  }
}

document.querySelector('.fa-thumbs-up').addEventListener('click', () => showFeedback('positive'));
document.querySelector('.fa-thumbs-down').addEventListener('click', () => showFeedback('negative'));