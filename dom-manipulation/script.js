let quotes = [];
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");

// -------------------------
// Load quotes from storage
// -------------------------
function loadQuotes() {
  const stored = localStorage.getItem("quotes");
  quotes = stored ? JSON.parse(stored) : [
    { text: "Believe you can and you're halfway there.", category: "Motivation" },
    { text: "Simplicity is the soul of efficiency.", category: "Productivity" },
    { text: "Code is like humor. When you have to explain it, it’s bad.", category: "Programming" }
  ];

  saveQuotes();
  populateCategories();

  // Restore last displayed quote
  const lastQuote = sessionStorage.getItem("lastQuote");
  if (lastQuote) {
    quoteDisplay.textContent = lastQuote;
  }
}

// -------------------------
// Save quotes
// -------------------------
function saveQuotes() {
  localStorage.setItem("quotes", JSON.stringify(quotes));
}

// -------------------------
// Show Random Quote
// -------------------------
function showRandomQuote() {
  let filtered = filterCurrentQuotes();
  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }

  const random = filtered[Math.floor(Math.random() * filtered.length)];
  const displayText = `${random.text} — (${random.category})`;

  quoteDisplay.textContent = displayText;

  // Save last viewed quote
  sessionStorage.setItem("lastQuote", displayText);
}

// Event Listener Check ✔
document.getElementById("newQuote").addEventListener("click", showRandomQuote);

// -------------------------
// Add a quote
// -------------------------
function addQuote() {
  const text = document.getElementById("newQuoteText").value.trim();
  const category = document.getElementById("newQuoteCategory").value.trim();

  if (!text || !category) {
    alert("Please enter both quote and category.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();

  showRandomQuote(); // refresh UI

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

// -------------------------
// Populate categories
// -------------------------
function populateCategories() {
  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  categoryFilter.innerHTML = categories
    .map(cat => `<option value="${cat}">${cat}</option>`)
    .join("");

  // Restore saved category
  const saved = localStorage.getItem("selectedCategory");
  if (saved) categoryFilter.value = saved;
}

// -------------------------
// Filtering logic
// -------------------------
function filterCurrentQuotes() {
  const selected = categoryFilter.value;
  return selected === "all"
    ? quotes
    : quotes.filter(q => q.category === selected);
}

function filterQuote() {
  localStorage.setItem("selectedCategory", categoryFilter.value);
  showRandomQuote();
}

// Listen for filter change
categoryFilter.addEventListener("change", filterQuote);

// -------------------------
// Export JSON
// -------------------------
function exportToJsonFile() {
  const blob = new Blob([JSON.stringify(quotes, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
}

document.getElementById("exportQuotes").addEventListener("click", exportToJsonFile);

// -------------------------
// Import JSON
// -------------------------
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = e => {
    const imported = JSON.parse(e.target.result);

    // Merge & avoid duplicates
    imported.forEach(q => {
      if (!quotes.some(existing => existing.text === q.text)) {
        quotes.push(q);
      }
    });

    saveQuotes();
    populateCategories();
    showRandomQuote();

    alert("Quotes imported successfully!");
  };

  reader.readAsText(event.target.files[0]);
}

document.getElementById("importQuotes").addEventListener("change", importFromJsonFile);

// -------------------------
// Mock API Calls
// -------------------------
async function fetchQuotesFromServer() {
  // Mock API response
  return new Promise(resolve => {
    setTimeout(() => {
      resolve([
        { text: "Stay hungry, stay foolish.", category: "Motivation" },
        { text: "Programs must be written for people to read.", category: "Programming" }
      ]);
    }, 500);
  });
}

async function postQuotesToServer(newQuotes) {
  return new Promise(resolve => {
    setTimeout(() => resolve({ status: "success", uploaded: newQuotes.length }), 500);
  });
}

// -------------------------
// Sync logic
// -------------------------
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  let updated = false;

  serverQuotes.forEach(serverQ => {
    if (!quotes.some(localQ => localQ.text === serverQ.text)) {
      quotes.push(serverQ);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    notifyUpdate("New quotes synced from server!");
  }

  // Push unsynced local quotes
  const unsynced = quotes.filter(
    q => !serverQuotes.some(sq => sq.text === q.text)
  );

  if (unsynced.length > 0) {
    await postQuotesToServer(unsynced);
  }
}

// -------------------------
// Notification UI
// -------------------------
function notifyUpdate(msg) {
  const box = document.getElementById("updateNotice");
  box.textContent = msg;
  box.style.display = "block";
  setTimeout(() => (box.style.display = "none"), 3000);
}

// Run sync every 20 seconds
setInterval(syncQuotes, 20000);

// Run initial load
loadQuotes();
showRandomQuote();
