// Resident Sign-up page logic

let selectedItem = null; // { itemNumber, itemName }
let takenItems = {}; // itemNumber -> { tower, flat }

function el(id) { return document.getElementById(id); }

function renderMenu() {
  const container = el("menuContainer");
  container.innerHTML = "";

  const grid = document.createElement("div");
  grid.className = "menu-grid";

  PRASADAM_ITEMS.forEach((item) => {
    const taken = takenItems[item.n];
    const isSelected = selectedItem && selectedItem.itemNumber === item.n;

    const div = document.createElement("div");
    div.className = "menu-item" + (taken ? " taken" : "") + (isSelected ? " selected" : "");
    div.dataset.itemNumber = item.n;

    const numSpan = document.createElement("span");
    numSpan.className = "num";
    numSpan.textContent = "#" + item.n;
    div.appendChild(numSpan);

    const nameSpan = document.createElement("span");
    nameSpan.textContent = item.name;
    div.appendChild(nameSpan);

    if (taken) {
      const flatSpan = document.createElement("span");
      flatSpan.className = "taken-flat";
      flatSpan.textContent = "Taken · " + taken.tower + "-" + taken.flat;
      div.appendChild(flatSpan);
    } else {
      div.addEventListener("click", () => selectItem(item.n, item.name));
    }

    grid.appendChild(div);
  });

  container.appendChild(grid);
}

function renderCountdown() {
  const takenCount = Object.keys(takenItems).length;
  const displayCount = Math.min(takenCount, PRASADAM_TARGET);
  const pct = Math.min((takenCount / PRASADAM_TARGET) * 100, 100);

  const countEl = el("countdownCount");
  const barEl = el("countdownBarFill");
  if (countEl) countEl.textContent = displayCount + " out of " + PRASADAM_TARGET + " allotted";
  if (barEl) barEl.style.width = pct + "%";
}

function selectItem(itemNumber, itemName) {
  selectedItem = { itemNumber, itemName };
  const banner = el("selectedBanner");
  banner.textContent = "✅ You selected: #" + itemNumber + " " + itemName;
  banner.classList.add("show");
  renderMenu();
}

async function loadTakenItems() {
  try {
    const res = await fetch(API_URL + "?action=list", { method: "GET" });
    const data = await res.json();
    takenItems = {};
    if (data.ok) {
      data.submissions.forEach((s) => {
        takenItems[s.itemNumber] = { tower: s.tower, flat: s.flat };
      });
    }
  } catch (err) {
    console.error("Failed to load taken items", err);
  }
  renderMenu();
  renderCountdown();
}

function showStatus(msg, type) {
  const box = el("statusMsg");
  box.textContent = msg;
  box.className = "status-msg " + type;
}

function clearStatus() {
  const box = el("statusMsg");
  box.className = "status-msg";
  box.textContent = "";
}

el("submissionForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  clearStatus();

  const name = el("name").value.trim();
  const mobile = el("mobile").value.trim();
  const tower = el("tower").value;
  const flat = el("flat").value.trim();

  if (!name || !mobile || !tower || !flat) {
    showStatus("Please fill in all fields.", "error");
    return;
  }
  if (!/^[0-9]{10}$/.test(mobile)) {
    showStatus("Please enter a valid 10-digit mobile number.", "error");
    return;
  }
  if (!selectedItem) {
    showStatus("Please select a Prasadam item from the menu below before submitting.", "error");
    return;
  }

  const submitBtn = el("submitBtn");
  submitBtn.disabled = true;
  submitBtn.textContent = "Submitting...";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      body: JSON.stringify({
        name,
        mobile,
        tower,
        flat,
        itemNumber: selectedItem.itemNumber,
        itemName: selectedItem.itemName,
      }),
    });
    const data = await res.json();

    if (data.ok) {
      showStatus("🙏 " + data.message + " Jai Ganesh!", "success");
      el("submissionForm").reset();
      selectedItem = null;
      el("selectedBanner").classList.remove("show");
      await loadTakenItems();
    } else {
      showStatus(data.error || "Something went wrong. Please try again.", "error");
      // Refresh menu in case the item just got taken by someone else
      await loadTakenItems();
    }
  } catch (err) {
    showStatus("Network error. Please check your connection and try again.", "error");
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Submit My Prasadam Pledge";
  }
});

// Init
renderMenu();
loadTakenItems();
setInterval(loadTakenItems, 20000); // refresh availability every 20s
