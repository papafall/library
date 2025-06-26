// Theme switching functionality
const themeToggle = document.getElementById("checkbox");
const currentTheme = localStorage.getItem("theme");

// Check for saved theme preference, otherwise use system preference
if (currentTheme) {
  document.documentElement.setAttribute("data-theme", currentTheme);
  if (currentTheme === "dark") {
    themeToggle.checked = true;
  }
} else {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    document.documentElement.setAttribute("data-theme", "dark");
    themeToggle.checked = true;
  }
}

// Theme switch handler
function switchTheme(e) {
  if (e.target.checked) {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
}

themeToggle.addEventListener("change", switchTheme, false);

const myLibrary = [];

// Book constructor
function Book(title, author, pages, read) {
  this.id = crypto.randomUUID();
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
  this.coverUrl = null;
}

// Book prototype method to toggle read status
Book.prototype.toggleRead = function () {
  this.read = !this.read;
};

// Function to fetch book cover
async function fetchBookCover(title, author) {
  try {
    // Clean and encode the search query
    const query = `${title} ${author}`
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, "+");
    const corsProxy = "https://corsproxy.io/?";

    // Try first with title and author
    let apiUrl = `https://openlibrary.org/search.json?q=${query}&limit=1`;
    let response = await fetch(corsProxy + encodeURIComponent(apiUrl));
    let data = await response.json();

    // If no results, try with just the title
    if (!data.docs || data.docs.length === 0) {
      const titleQuery = title.replace(/[^\w\s]/g, "").replace(/\s+/g, "+");
      apiUrl = `https://openlibrary.org/search.json?title=${titleQuery}&limit=1`;
      response = await fetch(corsProxy + encodeURIComponent(apiUrl));
      data = await response.json();
    }

    if (data.docs && data.docs.length > 0) {
      // Try to get the cover ID
      const doc = data.docs[0];
      if (doc.cover_i) {
        return `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
      } else if (doc.key) {
        // If no cover_i, try to get cover from the work's key
        const workUrl = `https://openlibrary.org${doc.key}.json`;
        const workResponse = await fetch(
          corsProxy + encodeURIComponent(workUrl)
        );
        const workData = await workResponse.json();
        if (workData.covers && workData.covers.length > 0) {
          return `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
        }
      }
    }

    // If still no cover found, try an alternative API
    const alternativeApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
    response = await fetch(corsProxy + encodeURIComponent(alternativeApiUrl));
    data = await response.json();

    if (data.items && data.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
      return data.items[0].volumeInfo.imageLinks.thumbnail.replace(
        "zoom=1",
        "zoom=2"
      );
    }

    console.log(`No cover found for: ${title} by ${author}`);
    return null;
  } catch (error) {
    console.error("Error fetching book cover:", error);
    return null;
  }
}

// Function to preload image
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject();
    img.src = url;
  });
}

// Function to add a book to the library
async function addBookToLibrary(title, author, pages, read) {
  const book = new Book(title, author, pages, read);
  const coverUrl = await fetchBookCover(title, author);

  if (coverUrl) {
    try {
      // Verify the image loads correctly
      await preloadImage(coverUrl);
      book.coverUrl = coverUrl;
    } catch (error) {
      console.log(`Failed to load cover image for: ${title}`);
      book.coverUrl = null;
    }
  }

  myLibrary.push(book);
  displayBooks();
}

// Function to remove a book from the library
function removeBook(bookId) {
  const bookCard = document.querySelector(`[data-id="${bookId}"]`);
  if (bookCard) {
    bookCard.style.transform = "scale(0.8)";
    bookCard.style.opacity = "0";

    setTimeout(() => {
      const index = myLibrary.findIndex((book) => book.id === bookId);
      if (index !== -1) {
        myLibrary.splice(index, 1);
        displayBooks();
      }
    }, 300);
  }
}

// Function to create a book card element
function createBookCard(book) {
  const card = document.createElement("div");
  card.classList.add("book-card");
  card.setAttribute("data-id", book.id);

  // Set cover image if available
  if (book.coverUrl) {
    card.style.setProperty("background-image", `url(${book.coverUrl})`);
  }

  card.innerHTML = `
        ${!book.coverUrl ? '<div class="no-cover">📚</div>' : ""}
        <div class="content-wrapper">
            <h3>${book.title}</h3>
            <div class="book-info">
                <p>Author: ${book.author}</p>
                <p>Pages: ${book.pages}</p>
                <p>Status: ${book.read ? "Read" : "Not read yet"}</p>
            </div>
            <div class="book-actions">
                <button onclick="toggleReadStatus('${
                  book.id
                }')" class="toggle-btn ${book.read ? "read" : ""}">${
    book.read ? "Mark as Unread" : "Mark as Read"
  }</button>
                <button class="delete-btn" onclick="removeBook('${
                  book.id
                }')">Remove</button>
            </div>
        </div>
    `;

  // Add animation delay based on position
  const delay = document.querySelectorAll(".book-card").length * 0.1;
  card.style.animationDelay = `${delay}s`;

  return card;
}

// Function to display all books
function displayBooks() {
  const libraryContainer = document.getElementById("libraryContainer");
  libraryContainer.innerHTML = "";

  myLibrary.forEach((book) => {
    const bookCard = createBookCard(book);
    libraryContainer.appendChild(bookCard);
  });
}

// Function to toggle read status with animation
function toggleReadStatus(bookId) {
  const book = myLibrary.find((book) => book.id === bookId);
  const button = document.querySelector(`[data-id="${bookId}"] .toggle-btn`);

  if (book && button) {
    // Add rotation animation
    button.style.transform = "rotateY(180deg)";

    setTimeout(() => {
      book.toggleRead();
      displayBooks();
    }, 300);
  }
}

// Dialog handling with animations
const dialog = document.getElementById("bookDialog");
const newBookBtn = document.getElementById("newBookBtn");
const cancelBtn = document.getElementById("cancelBtn");
const bookForm = document.getElementById("bookForm");
const mainTitle = document.getElementById("mainTitle");

// Add animation to title
document.addEventListener("DOMContentLoaded", () => {
  mainTitle.setAttribute("data-loaded", "true");
});

newBookBtn.addEventListener("click", () => {
  dialog.showModal();
  // Reset form and focus on first input
  bookForm.reset();
  document.getElementById("title").focus();
});

cancelBtn.addEventListener("click", () => {
  closeDialog();
});

// Close dialog when clicking outside
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    closeDialog();
  }
});

function closeDialog() {
  dialog.style.opacity = "0";
  dialog.style.transform = "translateY(-20px)";

  setTimeout(() => {
    dialog.close();
    dialog.style.opacity = "";
    dialog.style.transform = "";
  }, 300);
}

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const author = document.getElementById("author").value.trim();
  const pages = parseInt(document.getElementById("pages").value);
  const read = document.getElementById("read").checked;

  if (title && author && pages > 0) {
    addBookToLibrary(title, author, pages, read);
    closeDialog();
  }
});

// Update sample books to be added asynchronously
async function addSampleBooks() {
  await addBookToLibrary("The Hobbit", "J.R.R. Tolkien", 295, true);
  await addBookToLibrary("1984", "George Orwell", 328, false);
  await addBookToLibrary("Pride and Prejudice", "Jane Austen", 432, true);
}

// Call addSampleBooks when the page loads
document.addEventListener("DOMContentLoaded", () => {
  mainTitle.setAttribute("data-loaded", "true");
  addSampleBooks();
});
