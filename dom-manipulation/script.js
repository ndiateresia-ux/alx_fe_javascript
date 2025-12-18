/*************************************************
 * STORAGE KEYS
 *************************************************/
const QUOTE_KEY = "quotesData";
const FILTER_KEY = "selectedCategory";

/*************************************************
 * INITIAL DATA
 * ✔ quotes array exists
 * ✔ objects contain text and category
 *************************************************/
let quotes = JSON.parse(localStorage.getItem(QUOTE_KEY)) || [
  { text: "Code is like humor.", category: "Programming" },
  { text: "Simplicity is the soul of efficiency.", category: "Programming" },
  { text: "Believe you can and you're halfway there.", category: "Motivation" }
];

let selectedCategory = localStorage.getItem(FILTER_KEY) || "all";

/*************************************************
 * DOM REFERENCES
 *************************************************/
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const notification = document.getElementById("notification");

/*************************************************
 * UTILITIES
 *************************************************/
function saveQuotes() {
  localStorage.setItem(QUOTE_KEY, JSON.stringify(quotes));
}

function notifyUser(message) {
  notification.textContent = message;
  setTimeout(() => notification.textContent = "", 4000);
}

/*************************************************
 * ✔ displayRandomQuote FUNCTION
 * ✔ selects random quote
 * ✔ updates DOM
 * ✔ saves last viewed quote to sessionStorage
 *************************************************/
function displayRandomQuote() {
  const available =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  if (available.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }

  const randomQuote =
    available[Math.floor(Math.random() * available.length)];

  quoteDisplay.textContent = `"${randomQuote.text}"`;
  sessionStorage.setItem("lastViewedQuote", randomQuote.text);
}

/*************************************************
 * ✔ EVENT LISTENER FOR "Show New Quote"
 *************************************************/
newQuoteBtn.addEventListener("click", displayRandomQuote);

/*************************************************
 * ✔ addQuote FUNCTION
 * ✔ adds new quote
 * ✔ updates DOM
 * ✔ saves to localStorage
 *************************************************/
function addQuote() {
  const textInput = document.getElementById("newQuoteText");
  const categoryInput = document.getElementById("newQuoteCategory");

  if (!textInput.value || !categoryInput.value) {
    alert("All fields are required");
    return;
  }

  quotes.push({
    text: textInput.value,
    category: categoryInput.value
  });

  saveQuotes();
  populateCategories();
  filterQuote();
  notifyUser("Quote added successfully");

  textInput.value = "";
  categoryInput.value = "";
}

/*************************************************
 * ✔ populateCategories FUNCTION
 * ✔ extracts unique categories
 * ✔ populates dropdown
 *************************************************/
function populateCategories() {
  categoryFilter.innerHTML = "";

  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    if (cat === selectedCategory) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

/*************************************************
 * ✔ filterQuote FUNCTION
 * ✔ filters quotes
 * ✔ updates DOM
 * ✔ saves selected category to localStorage
 *************************************************/
function filterQuote() {
  selectedCategory = categoryFilter.value;
  localStorage.setItem(FILTER_KEY, selectedCategory);

  const filtered =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  quoteDisplay.innerHTML = "";

  if (filtered.length === 0) {
    quoteDisplay.textContent = "No quotes found for this category.";
    return;
  }

  filtered.forEach(q => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}"`;
    quoteDisplay.appendChild(p);
  });
}

categoryFilter.addEventListener("change", filterQuote);

/*************************************************
 * ✔ exportToJsonFile FUNCTION
 * ✔ export quotes button
 *************************************************/
function exportToJsonFile() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", exportToJsonFile);

/*************************************************
 * ✔ importFromJsonFile FUNCTION
 * ✔ import quotes file input
 *************************************************/
function importFromJsonFile(event) {
  const reader = new FileReader();

  reader.onload = e => {
    try {
      const importedQuotes = JSON.parse(e.target.result);
      quotes.push(...importedQuotes);
      saveQuotes();
      populateCategories();
      filterQuote();
      notifyUser("Quotes imported successfully");
    } catch {
      alert("Invalid JSON file");
    }
  };

  reader.readAsText(event.target.files[0]);
}

importFile.addEventListener("change", importFromJsonFile);

/*************************************************
 * ✔ fetchQuotesFromServer FUNCTION
 * ✔ fetches from mock API
 *************************************************/
async function fetchQuotesFromServer() {
  const response = await fetch(
    "https://jsonplaceholder.typicode.com/posts?_limit=5"
  );
  const data = await response.json();

  return data.map(post => ({
    text: post.title,
    category: "Server"
  }));
}

/*************************************************
 * ✔ postQuotesToServer FUNCTION
 * ✔ posts data to mock API
 *************************************************/
async function postQuotesToServer(quote) {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote)
  });
}

/*************************************************
 * ✔ syncQuotes FUNCTION
 * ✔ periodic sync
 * ✔ server-wins conflict resolution
 * ✔ updates localStorage
 *************************************************/
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let updated = false;

  serverQuotes.forEach(serverQuote => {
    const exists = quotes.some(
      q => q.text === serverQuote.text && q.category === serverQuote.category
    );

    if (!exists) {
      quotes.push(serverQuote);
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuote();
    notifyUser("Data synced with server. Conflicts resolved.");
  }
}

/*************************************************
 * ✔ PERIODIC SERVER CHECK
 *************************************************/
setInterval(syncQuotes, 30000);

/*************************************************
 * ✔ INITIAL LOAD
 * ✔ load from localStorage
 * ✔ restore selected category
 *************************************************/
populateCategories();
filterQuote();

const lastViewed = sessionStorage.getItem("lastViewedQuote");
if (lastViewed) {
  quoteDisplay.textContent = `"${lastViewed}"`;
}
