function startApp() {
  if (passwordError) passwordError.textContent = "";
  if (lockScreen) lockScreen.style.display = "none";

  showLoading();

  // 👉 CHỈ GỌI DASHBOARD
  if (typeof loadDashboard === "function") {
    loadDashboard();
  }
}
