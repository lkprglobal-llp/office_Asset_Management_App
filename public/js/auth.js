document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const errorDiv = document.getElementById('loginError');
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, role })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } else {
      errorDiv.textContent = data.message || 'Invalid credentials or role mismatch. Please check the demo credentials.';
    }
  } catch (error) {
    errorDiv.textContent = 'Login failed. Please try again.';
    console.error('Login error:', error);
  }
});
