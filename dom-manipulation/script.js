/*************************************************
 * STORAGE KEYS
 *************************************************/
const QUOTE_KEY = "quotesData";
const FILTER_KEY = "selectedCategory";
const SYNC_TIME_KEY = "lastSyncTime";


/*************************************************
 * INITIAL DATA
 *************************************************/
let quotes = JSON.parse(localStorage.getItem(QUOTE_KEY)) || [
  { id: 1, text: "Code is like humor.", category: "Programming", updatedAt: Date.now() },
  { id: 2, text: "Simplicity is the soul of efficiency.", category: "Programming", updatedAt: Date.now() },
  { id: 3, text: "Believe you can and you're halfway there.", category: "Motivation", updatedAt: Date.now() }
];

let selectedCategory = localStorage.getItem(FILTER_KEY) || "all";

/*************************************************
 * DOM REFERENCES
 *************************************************/
const quoteDisplay = document.getElementById("quoteDisplay");
const categoryFilter = document.getElementById("categoryFilter");
const notification = document.getElementById("notification");
const newQuoteBtn = document.getElementById("newQuoteBtn");
const formContainer = document.getElementById("formContainer");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const resolveBtn = document.getElementById("resolveBtn");


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
 * REQUIRED: populateCategories()
 * - Extracts unique categories
 * - Populates dropdown
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
 * REQUIRED: filterQuote()
 * - Filters displayed quotes
 * - Saves selected category to localStorage
 * - Restores on reload
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
    quoteDisplay.textContent = "No quotes found.";
    return;
  }

  filtered.forEach(q => {
    const p = document.createElement("p");
    p.textContent = `"${q.text}"`;
    quoteDisplay.appendChild(p);
  });
}
/*************************************************
 * REQUIRED: addQuote()
 * - Adds new quote
 * - Updates DOM
 * - Updates categories
 *************************************************/
function addQuote() {
  const text = document.getElementById("quoteText").value;
  const category = document.getElementById("quoteCategory").value;

  if (!text || !category) {
    alert("All fields are required");
    return;
  }

  quotes.push({
    id: Date.now(),
    text,
    category,
    updatedAt: Date.now()
  });

  saveQuotes();
  populateCategories();
  filterQuote();
  postQuoteToServer({ text, category });

  notify("New quote added successfully");

  document.getElementById("quoteText").value = "";
  document.getElementById("quoteCategory").value = "";
}

/*************************************************
 * REQUIRED EVENT LISTENER:
 * Show New Quote Button
 *************************************************/
newQuoteBtn.addEventListener("click", () => {
  const available =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  if (available.length === 0) return;

  const random = available[Math.floor(Math.random() * available.length)];
  quoteDisplay.textContent = `"${random.text}"`;
});

/*************************************************
 * REQUIRED: fetchQuotesFromServer()
 * - Fetches data from mock API
 *************************************************/
async function fetchQuotesFromServer() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await response.json();

  return data.map(post => ({
    id: post.id,
    text: post.title,
    category: "Server",
    updatedAt: Date.now()
  }));
}

/*************************************************
 * REQUIRED: postQuoteToServer()
 * - Posts data to mock API
 *************************************************/
async function postQuoteToServer(quote) {
  await fetch("https://jsonplaceholder.typicode.com/posts", {
    method: "POST",
    body: JSON.stringify(quote),
    headers: { "Content-Type": "application/json" }
  });
}

/*************************************************
 * REQUIRED: syncQuotes()
 * - Periodic server sync
 * - Server wins conflict resolution
 * - Updates localStorage
 *************************************************/
async function syncQuotes() {
  const serverQuotes = await fetchQuotesFromServer();
  let updated = false;

  serverQuotes.forEach(serverQuote => {
    const index = quotes.findIndex(q => q.id === serverQuote.id);

    if (index === -1) {
      quotes.push(serverQuote);
      updated = true;
    } else {
      quotes[index] = serverQuote; // server wins
      updated = true;
    }
  });

  if (updated) {
    saveQuotes();
    populateCategories();
    filterQuote();
    notify("Data synced and conflicts resolved using server data");
  }
}

/*************************************************
 * PERIODIC SYNC (Every 30 seconds)
 *************************************************/
setInterval(syncQuotes, 30000);

/*************************************************
 * INITIAL LOAD
 *************************************************/
populateCategories();
filterQuote();

categoryFilter.addEventListener("change", filterQuote);
/*************************************************
 * CATEGORY FILTERING
 *************************************************/
function populateCategories() {
  categoryFilter.innerHTML = "";

  const categories = ["all", ...new Set(quotes.map(q => q.category))];

  categories.forEach(cat => {
    const option = document.createElement("option");
    option.value = cat;
    option.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (cat === selectedCategory) option.selected = true;
    categoryFilter.appendChild(option);
  });
}

function filterQuotes() {
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

/*************************************************
 * RANDOM QUOTE
 *************************************************/
newQuoteBtn.addEventListener("click", () => {
  const available =
    selectedCategory === "all"
      ? quotes
      : quotes.filter(q => q.category === selectedCategory);

  if (available.length === 0) return;

  const random = available[Math.floor(Math.random() * available.length)];
  quoteDisplay.textContent = `"${random.text}"`;

  sessionStorage.setItem("lastQuote", random.text);
});

/*************************************************
 * ADD QUOTE FORM
 *************************************************/
function createAddQuoteForm() {
  const textInput = document.createElement("input");
  textInput.placeholder = "Enter quote text";

  const categoryInput = document.createElement("input");
  categoryInput.placeholder = "Enter quote category";

  const addBtn = document.createElement("button");
  addBtn.textContent = "Add Quote";

  addBtn.addEventListener("click", () => {
    if (!textInput.value || !categoryInput.value) {
      alert("All fields are required!");
      return;
    }

    quotes.push({
      id: Date.now(),
      text: textInput.value,
      category: categoryInput.value,
      updatedAt: Date.now()
    });

    saveQuotes();
    populateCategories();
    filterQuotes();
    notifyUser("New quote added.");

    textInput.value = "";
    categoryInput.value = "";
  });

  formContainer.append(textInput, categoryInput, addBtn);
}

/*************************************************
 * JSON EXPORT
 *************************************************/
exportBtn.addEventListener("click", () => {
  const data = JSON.stringify(quotes, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "quotes.json";
  link.click();

  URL.revokeObjectURL(url);
});

/*************************************************
 * JSON IMPORT
 *************************************************/
importFile.addEventListener("change", event => {
  const reader = new FileReader();

  reader.onload = e => {
    try {
      const imported = JSON.parse(e.target.result);
      quotes.push(...imported);
      saveQuotes();
      populateCategories();
      filterQuotes();
      notifyUser("Quotes imported successfully.");
    } catch {
      alert("Invalid JSON file.");
    }
  };

  reader.readAsText(event.target.files[0]);
});

/*************************************************
 * SERVER SYNC (SIMULATION)
 *************************************************/
async function fetchServerQuotes() {
  const response = await fetch("https://jsonplaceholder.typicode.com/posts?_limit=5");
  const data = await response.json();

  return data.map(post => ({
    id: post.id,
    text: post.title,
    category: "Server",
    updatedAt: Date.now()
  }));
}

function syncQuotes(serverQuotes) {
  const local = [...quotes];

  serverQuotes.forEach(serverQuote => {
    const index = local.findIndex(q => q.id === serverQuote.id);
    if (index === -1) {
      local.push(serverQuote);
    } else {
      local[index] = serverQuote;
      notifyUser("Conflict resolved using server data.");
    }
  });

  quotes = local;
  saveQuotes();
}

setInterval(async () => {
  const serverQuotes = await fetchServerQuotes();
  syncQuotes(serverQuotes);
  populateCategories();
  filterQuotes();
  notifyUser("Data synced with server.");
}, 30000);

/*************************************************
 * MANUAL CONFLICT RESOLUTION
 *************************************************/
resolveBtn.addEventListener("click", async () => {
  if (confirm("Overwrite local data with server data?")) {
    const serverQuotes = await fetchServerQuotes();
    quotes = serverQuotes;
    saveQuotes();
    populateCategories();
    filterQuotes();
    notifyUser("Local data replaced with server data.");
  }
});

/*************************************************
 * INITIAL LOAD
 *************************************************/
populateCategories();
createAddQuoteForm();
filterQuotes();

const lastQuote = sessionStorage.getItem("lastQuote");
if (lastQuote) {
  quoteDisplay.textContent = `"${lastQuote}"`;
}
