document.getElementById("signupForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const userType = document.getElementById("userType").value;
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const location = document.getElementById("location").value.trim();

  if (!userType || !name || !email || !password || !location) {
    showMessage("Please fill in all fields.", "danger");
    return;
  }

  // Simulate successful registration
  showMessage(`Welcome, ${name}! You’ve registered as a ${userType}.`, "success");

  // Reset form
  document.getElementById("signupForm").reset();
});

function showMessage(msg, type) {
  const messageDiv = document.getElementById("message");
  messageDiv.innerHTML = `<div class="alert alert-${type}">${msg}</div>`;
}
