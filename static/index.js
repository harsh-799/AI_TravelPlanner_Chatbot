// Tailwind dark mode config
tailwind.config = {
  darkMode: 'class'
};

function initializeTheme() {
  const html = document.documentElement;
  const modeToggle = document.getElementById('modeToggle');
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialDarkMode = savedTheme ? savedTheme === 'dark' : systemPrefersDark;

  html.classList.toggle('dark', initialDarkMode);
  modeToggle.textContent = initialDarkMode ? '☀️' : '🌙';
  modeToggle.addEventListener('click', toggleTheme);
  window.addEventListener('message', handleChatbotMessages);
}

function toggleTheme() {
  const html = document.documentElement;
  const modeToggle = document.getElementById('modeToggle');
  const isDark = !html.classList.contains('dark');

  html.classList.toggle('dark', isDark);
  modeToggle.textContent = isDark ? '☀️' : '🌙';
  localStorage.setItem('theme', isDark ? 'dark' : 'light');

  const iframe = document.querySelector('#chatbotContainer iframe');
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({
      type: 'updateTheme',
      isDark
    }, '*');
  }
}

function handleChatbotMessages(event) {
  if (event.data.type === 'chatbotThemeChange') {
    const isDark = event.data.isDark;
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('modeToggle').textContent = isDark ? '☀️' : '🌙';
  }

  if (event.data.type === 'chatbotReady') {
    const iframe = document.querySelector('#chatbotContainer iframe');
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({
        type: 'updateTheme',
        isDark: document.documentElement.classList.contains('dark')
      }, '*');
    }
  }
}

function setupChatbotOverlay() {
  const chatbotOverlay = document.getElementById('chatbotOverlay');
  const closeChatbot = document.getElementById('closeChatbot');
  const startPlanningBtn = document.getElementById('startPlanningBtn');

  if (startPlanningBtn) {
    startPlanningBtn.addEventListener('click', (e) => {
      e.preventDefault();
      chatbotOverlay.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeChatbot) {
    closeChatbot.addEventListener('click', () => {
      chatbotOverlay.classList.add('hidden');
      document.body.style.overflow = 'auto';
    });
  }

  if (chatbotOverlay) {
    chatbotOverlay.addEventListener('click', (e) => {
      if (e.target === chatbotOverlay) {
        chatbotOverlay.classList.add('hidden');
        document.body.style.overflow = 'auto';
      }
    });
  }
}

function setupSmoothScrolling() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      
      if (targetId === '#hero') {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
        history.replaceState(null, null, ' '); 
      } else {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          history.pushState(null, null, targetId);
        }
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupChatbotOverlay();
  setupSmoothScrolling();
});

window.addEventListener('popstate', () => {
  const chatbotOverlay = document.getElementById('chatbotOverlay');
  if (!chatbotOverlay.classList.contains('hidden')) {
    chatbotOverlay.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
});