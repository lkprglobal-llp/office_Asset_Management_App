const demoUsers = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' },
  { username: 'manager', password: 'manager123', role: 'manager', name: 'Manager User' },
  { username: 'employee', password: 'employee123', role: 'employee', name: 'Employee User' }
];

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;
  const errorDiv = document.getElementById('loginError');
  
  const user = demoUsers.find(u => 
    u.username === username && 
    u.password === password && 
    u.role === role
  );
  
  if (user) {
    localStorage.setItem('currentUser', JSON.stringify({
      username: user.username,
      name: user.name,
      role: user.role
    }));
    window.location.href = 'dashboard.html';
  } else {
    errorDiv.textContent = 'Invalid credentials or role mismatch. Please check the demo credentials.';
  }
});
