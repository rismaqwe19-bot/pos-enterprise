/**
 * Login Page Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const toggleRegisterBtn = document.getElementById('toggleRegister');
  const toggleLoginBtn = document.getElementById('toggleLogin');

  // Toggle between login dan register form
  toggleRegisterBtn.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  toggleLoginBtn.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Handle login
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const messageDiv = document.getElementById('loginMessage');

    try {
      showMessage(messageDiv, 'Sedang login...', 'info');
      
      const result = await api.login(username, password);

      if (result.success) {
        showMessage(messageDiv, 'Login berhasil! Redirect...', 'success');
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
      } else {
        showMessage(messageDiv, result.message || 'Login gagal', 'error');
      }
    } catch (error) {
      showMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
  });

  // Handle register
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const fullName = document.getElementById('regFullName').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const messageDiv = document.getElementById('registerMessage');

    // Validation
    if (password !== passwordConfirm) {
      showMessage(messageDiv, 'Password tidak cocok', 'error');
      return;
    }

    if (password.length < 6) {
      showMessage(messageDiv, 'Password minimal 6 karakter', 'error');
      return;
    }

    try {
      showMessage(messageDiv, 'Sedang mendaftar...', 'info');
      
      const result = await api.register(username, password, email, fullName);

      if (result.success) {
        showMessage(messageDiv, 'Registrasi berhasil! Login sekarang...', 'success');
        
        // Isi form login dengan username/password baru
        document.getElementById('loginUsername').value = username;
        document.getElementById('loginPassword').value = password;
        
        setTimeout(() => {
          registerForm.classList.add('hidden');
          loginForm.classList.remove('hidden');
          document.getElementById('loginMessage').innerHTML = '';
        }, 1500);
      } else {
        showMessage(messageDiv, result.message || 'Registrasi gagal', 'error');
      }
    } catch (error) {
      showMessage(messageDiv, 'Error: ' + error.message, 'error');
    }
  });

  // Check jika sudah login, redirect ke dashboard
  if (api.isAuthenticated()) {
    window.location.href = '/index.html';
  }
});

/**
 * Helper function untuk show message
 */
function showMessage(element, message, type) {
  element.textContent = message;
  element.className = `message ${type}`;
  element.classList.remove('hidden');
  
  // Auto hide error message after 5 seconds
  if (type === 'error') {
    setTimeout(() => {
      element.classList.add('hidden');
    }, 5000);
  }
}