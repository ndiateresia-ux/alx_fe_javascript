/*************************************************
 * STORAGE KEYS
 *************************************************/
const QUOTE_KEY = "quotes";
const FILTER_KEY = "categoryFilter";

/*************************************************
 * QUOTES ARRAY (REQUIRED)
 * ✔ text
 * ✔ category
 *************************************************/
let quotes = JSON.parse(localStorage.getItem(QUOTE_KEY)) || [
  { text: "Code is like humor.", category: "Programming" },
  { text: "Simplicity is the soul of efficiency.", category: "Programming" },
  { text: "Believe you can and you're halfway there.", category: "Motivation" }
];

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
 * LOCAL STORAGE
 *************************************************/
function saveQuotes() {
  localStorage.setItem(QUOTE_KEY, JSON.stringify(quotes));
}

/*************************************************
 * ✔ displayRandomQuote
 * ✔ random selection
 * ✔ DOM update
 * ✔ sessionStorage
 *************************************************/
function displayRandomQuote() {
  if (quotes.length === 0) return;

  const randomIndex = Math.floor(Math.random() * quotes.length);
  const quote = quotes[randomIndex];

  quoteDisplay.textContent = `"${quote.text}"`;
  sessionStorage.setItem("lastViewedQuote", quote.text);
}

/*************************************************
 * ✔ EVENT LISTENER — Show New Quote
 *************************************************/
newQuoteBtn.addEventListener("click", displayRandomQuote);

/*************************************************
 * ✔ addQuote
 * ✔ updates array
 * ✔ updates DOM
 * ✔ saves to localStorage
 *************************************************/
function addQuote() {
  const text = document.getElementById("newQuoteText").value;
  const category = document.getElementById("newQuoteCategory").value;

  if (!text || !category) {
    alert("Please fill in all fields");
    return;
  }

  quotes.push({ text, category });
  saveQuotes();
  populateCategories();
  filterQuotes();

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";
}

/*************************************************
 * ✔ populateCategories
 * ✔ unique categories
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

  const saved = localStorage.getItem(FILTER_KEY);
  if (saved) categoryFilter.value = saved;
}

/*************************************************
 * ✔ filterQuotes
 * ✔ filtering logic
 * ✔ DOM update
 * ✔ localStorage save
 *************************************************/
function filterQuotes() {
  const selected = categoryFilter.value;
  localStorage.setItem(FILTER_KEY, selected);

  quoteDisplay.innerHTML = "";

  const filtered =
    selected === "all"
      ? quotes
      : quotes.filter(q => q.category === selected);

  filtered.forEach(q => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}"`;
    quoteDisplay.appendChild(p);
  });
}

categoryFilter.addEventListener("change", filterQuotes);

/*************************************************
 * ✔ exportToJsonFile
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
 * ✔ importFromJsonFile
 *************************************************/
function importFromJsonFile(event) {
  const reader = new FileReader();

  reader.onload = function (e) {
    const importedQuotes = JSON.parse(e.target.result);
    quotes.push(...importedQuotes);
    saveQuotes();
    populateCategories();
    filterQuotes();
  };

  reader.readAsText(event.target.files[0]);
}

importFile.addEventListener("change", importFromJsonFile);

/*************************************************
 * ✔ fetchQuotesFromServer
 * ✔ mock API
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
 * ✔ post quotes to server (mock)
 *************************************************/
async function postQuotesToServer(quote) {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote)
  });
}

/*************************************************
 * ✔ syncQuotes
 * ✔ conflict resolution (server wins)
 * ✔ localStorage update
 *************************************************/
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();

  serverQuotes.forEach(sq => {
    if (!quotes.some(q => q.text === sq.text)) {
      quotes.push(sq);
    }
  });

  saveQuotes();
  populateCategories();
  filterQuotes();
  notification.textContent = "Data synced with server";
}

setInterval(syncQuotes, 30000);

/*************************************************
 * INITIAL LOAD
 *************************************************/
populateCategories();
filterQuotes();

const lastQuote = sessionStorage.getItem("lastViewedQuote");
if (lastQuote) {
  quoteDisplay.textContent = `"${lastQuote}"`;
}
