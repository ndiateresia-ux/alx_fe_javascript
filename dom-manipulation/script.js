/*************************************************
 * STORAGE KEYS
 *************************************************/
const QUOTES_KEY = "quotes";
const CATEGORY_KEY = "selectedCategory";

/*************************************************
 * QUOTES ARRAY
 *************************************************/
let quotes = JSON.parse(localStorage.getItem(QUOTES_KEY)) || [
  { text: "Code is like humor.", category: "Programming" },
  { text: "Simplicity is the soul of efficiency.", category: "Programming" },
  { text: "Believe you can and you're halfway there.", category: "Motivation" }
];

/*************************************************
 * SELECTED CATEGORY
 *************************************************/
let selectedCategory = localStorage.getItem(CATEGORY_KEY) || "all";

/*************************************************
 * DOM ELEMENTS
 *************************************************/
const quoteDisplay = document.getElementById("quoteDisplay");
const newQuoteBtn = document.getElementById("newQuote");
const categoryFilter = document.getElementById("categoryFilter");
const addQuoteBtn = document.getElementById("addQuoteBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const notification = document.getElementById("notification");
const syncBtn = document.getElementById("syncBtn");
const resolveBtn = document.getElementById("resolveBtn");

/*************************************************
 * SAVE QUOTES TO LOCAL STORAGE
 *************************************************/
function saveQuotes() {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

/*************************************************
 * DISPLAY RANDOM QUOTE
 *************************************************/
function displayRandomQuote() {
  const filteredQuotes =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  if (filteredQuotes.length === 0) {
    quoteDisplay.textContent = "No quotes available.";
    return;
  }

  const randomQuote =
    filteredQuotes[Math.floor(Math.random() * filteredQuotes.length)];

  quoteDisplay.textContent = `"${randomQuote.text}"`;
  sessionStorage.setItem("lastViewedQuote", randomQuote.text);
}

newQuoteBtn.addEventListener("click", displayRandomQuote);

/*************************************************
 * ADD QUOTE
 *************************************************/
function addQuote() {
  const text = document.getElementById("newQuoteText").value;
  const category = document.getElementById("newQuoteCategory").value;

  if (!text || !category) {
    alert("All fields are required.");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  filterQuotes();
  notify("Quote added successfully.");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

addQuoteBtn.addEventListener("click", addQuote);

/*************************************************
 * POPULATE CATEGORIES
 *************************************************/
function populateCategories() {
  categoryFilter.innerHTML = "";

  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat;
    categoryFilter.appendChild(option);
  });

  const savedCategory = localStorage.getItem(CATEGORY_KEY);
  if (savedCategory) categoryFilter.value = savedCategory;
}

/*************************************************
 * FILTER QUOTES
 *************************************************/
function filterQuotes() {
  selectedCategory = categoryFilter.value;
  localStorage.setItem(CATEGORY_KEY, selectedCategory);

  const filtered =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  quoteDisplay.innerHTML = "";
  filtered.forEach(q => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}"`;
    quoteDisplay.appendChild(p);
  });
}

categoryFilter.addEventListener("change", filterQuotes);

/*************************************************
 * EXPORT TO JSON FILE
 *************************************************/
function exportToJsonFile() {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quotes.json";
  a.click();
  URL.revokeObjectURL(url);
}

exportBtn.addEventListener("click", exportToJsonFile);

/*************************************************
 * IMPORT FROM JSON FILE
 *************************************************/
function importFromJsonFile(event) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    filterQuotes();
    notify("Quotes imported successfully.");
  };
  reader.readAsText(event.target.files[0]);
}

importFile.addEventListener("change", importFromJsonFile);

/*************************************************
 * FETCH QUOTES FROM SERVER
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
 * POST QUOTES TO SERVER
 *************************************************/
async function postQuoteToServer(quote) {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote)
  });
}

/*************************************************
 * SYNC QUOTES
 *************************************************/
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  serverQuotes.forEach(sq => {
    if (!quotes.some(q => q.text === sq.text && q.category === sq.category)) {
      quotes.push(sq);
    }
  });

  saveQuotes();
  populateCategories();
  filterQuotes();
  notify("Data synced with server.");
}

syncBtn.addEventListener("click", syncQuotes);

/*************************************************
 * NOTIFICATION HELPER
 *************************************************/
function notify(message) {
  notification.textContent = message;
  setTimeout(() => (notification.textContent = ""), 4000);
}

/*************************************************
 * INITIAL LOAD
 *************************************************/
populateCategories();
filterQuotes();

const lastQuote = sessionStorage.getItem("lastViewedQuote");
if (lastQuote) {
  quoteDisplay.textContent = `"${lastQuote}"`;
}
