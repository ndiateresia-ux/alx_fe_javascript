/*************************************************
 * STORAGE KEYS
 *************************************************/
const QUOTES_KEY = "quotes";
const CATEGORY_KEY = "selectedCategory";

/*************************************************
 * INITIAL QUOTES
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
 * SAVE TO LOCAL STORAGE
 *************************************************/
function saveQuotes() {
  localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));
}

/*************************************************
 * NOTIFICATION
 *************************************************/
function notify(message) {
  notification.textContent = message;
  setTimeout(() => (notification.textContent = ""), 4000);
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

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const randomQuote = filteredQuotes[randomIndex];

  quoteDisplay.textContent = `"${randomQuote.text}"`;
  sessionStorage.setItem("lastViewedQuote", randomQuote.text);
  notify(`Displayed a random quote from ${randomQuote.category}`);
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

  const newQuote = { text, category };
  quotes.push(newQuote);

  saveQuotes();
  populateCategories();
  filterQuotes();
  notify("New quote added successfully.");

  document.getElementById("newQuoteText").value = "";
  document.getElementById("newQuoteCategory").value = "";

  postQuoteToServer(newQuote);
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
 * EXPORT TO JSON
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
 * IMPORT FROM JSON
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
 * FETCH / POST SERVER QUOTES
 *************************************************/
async function fetchQuotesFromServer() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await response.json();
  return data.map(post => ({ text: post.title, category: "Server" }));
}

async function postQuoteToServer(quote) {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(quote)
  });
}

/*************************************************
 * SYNC QUOTES WITH SERVER
 *************************************************/
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let updated = false;

  serverQuotes.forEach(sq => {
    const index = quotes.findIndex(q => q.text === sq.text && q.category === sq.category);
    if (index === -1) {
      quotes.push(sq);
      updated = true;
    } else {
      quotes[index] = sq;
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuotes();
    notify("Quotes synced with server. Conflicts resolved.");
  }
}

syncBtn.addEventListener("click", syncQuotes);
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
