// Committee (Admin) view logic

let allSubmissions = [];
let currentPassword = "";

function el(id) { return document.getElementById(id); }

el("loginBtn").addEventListener("click", login);
el("adminPassword").addEventListener("keydown", (e) => {
  if (e.key === "Enter") login();
});

async function login() {
  const password = el("adminPassword").value.trim();
  const loginStatus = el("loginStatus");
  loginStatus.className = "status-msg";

  if (!password) {
    loginStatus.className = "status-msg error";
    loginStatus.textContent = "Please enter the committee password.";
    return;
  }

  el("loginBtn").disabled = true;
  el("loginBtn").textContent = "Checking...";

  try {
    const res = await fetch(API_URL + "?action=admin&password=" + encodeURIComponent(password));
    const data = await res.json();

    if (data.ok) {
      currentPassword = password;
      allSubmissions = data.submissions;
      el("loginCard").style.display = "none";
      el("dashboard").style.display = "block";
      renderDashboard();
    } else {
      loginStatus.className = "status-msg error";
      loginStatus.textContent = data.error || "Invalid password.";
    }
  } catch (err) {
    loginStatus.className = "status-msg error";
    loginStatus.textContent = "Network error. Please try again.";
  } finally {
    el("loginBtn").disabled = false;
    el("loginBtn").textContent = "View Submissions";
  }
}

async function refreshData() {
  if (!currentPassword) return;
  el("refreshBtn").textContent = "Refreshing...";
  try {
    const res = await fetch(API_URL + "?action=admin&password=" + encodeURIComponent(currentPassword));
    const data = await res.json();
    if (data.ok) {
      allSubmissions = data.submissions;
      renderDashboard();
    }
  } catch (err) {
    console.error(err);
  } finally {
    el("refreshBtn").textContent = "↻ Refresh Data";
  }
}

el("refreshBtn").addEventListener("click", refreshData);
el("searchBox").addEventListener("input", renderDashboard);

function renderDashboard() {
  const query = (el("searchBox").value || "").toLowerCase();

  const filtered = allSubmissions.filter((s) => {
    if (!query) return true;
    return (
      String(s.name).toLowerCase().includes(query) ||
      String(s.mobile).toLowerCase().includes(query) ||
      String(s.tower).toLowerCase().includes(query) ||
      String(s.flat).toLowerCase().includes(query) ||
      String(s.itemName).toLowerCase().includes(query) ||
      String(s.itemNumber).includes(query)
    );
  });

  el("statSubmitted").textContent = allSubmissions.length;
  el("statRemaining").textContent = Math.max(108 - allSubmissions.length, 0);
  el("statResidents").textContent = new Set(allSubmissions.map((s) => s.mobile)).size;

  const tbody = el("adminTableBody");
  tbody.innerHTML = "";

  filtered
    .slice()
    .sort((a, b) => a.itemNumber - b.itemNumber)
    .forEach((s, idx) => {
      const tr = document.createElement("tr");
      const ts = s.timestamp ? new Date(s.timestamp).toLocaleString() : "";
      tr.innerHTML =
        "<td>" + (idx + 1) + "</td>" +
        "<td>" + ts + "</td>" +
        "<td>" + escapeHtml(s.name) + "</td>" +
        "<td>" + escapeHtml(s.mobile) + "</td>" +
        "<td>" + escapeHtml(s.tower) + "</td>" +
        "<td>" + escapeHtml(s.flat) + "</td>" +
        "<td>#" + s.itemNumber + "</td>" +
        "<td>" + escapeHtml(s.itemName) + "</td>";
      tbody.appendChild(tr);
    });
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : String(str);
  return div.innerHTML;
}
