function showSuccessMessage(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Existing event listeners...

    // Add form submit handlers
    document.getElementById('login-form').querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      showSuccessMessage('Signed in successfully!');
    });

    document.getElementById('signup-form').querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      showSuccessMessage('Account created successfully!');
    });
  });
  function toggleForm(showSignup) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (showSignup) {
      loginForm.classList.add('translate-x-full', 'opacity-0');
      loginForm.classList.remove('z-10');
      signupForm.classList.remove('translate-x-full', 'opacity-0');
      signupForm.classList.add('z-10');
    } else {
      signupForm.classList.add('translate-x-full', 'opacity-0');
      signupForm.classList.remove('z-10');
      loginForm.classList.remove('translate-x-full', 'opacity-0');
      loginForm.classList.add('z-10');
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('switch-to-login').addEventListener('click', (e) => {
      e.preventDefault();
      toggleForm(false);
    });

    document.getElementById('switch-to-signup').addEventListener('click', (e) => {
      e.preventDefault();
      toggleForm(true);
    });
  });