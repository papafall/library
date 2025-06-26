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
function Book(title, author, pages, genre, description, read) {
  this.id = crypto.randomUUID();
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.genre = genre;
  this.description = description;
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
        const coverUrl = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
        // Verify the cover URL is valid
        try {
          await preloadImage(coverUrl);
          return coverUrl;
        } catch (error) {
          console.log(`Cover image failed to load for: ${title}`);
        }
      } else if (doc.key) {
        // If no cover_i, try to get cover from the work's key
        const workUrl = `https://openlibrary.org${doc.key}.json`;
        const workResponse = await fetch(
          corsProxy + encodeURIComponent(workUrl)
        );
        const workData = await workResponse.json();
        if (workData.covers && workData.covers.length > 0) {
          const coverUrl = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
          try {
            await preloadImage(coverUrl);
            return coverUrl;
          } catch (error) {
            console.log(`Work cover image failed to load for: ${title}`);
          }
        }
      }
    }

    // If still no cover found, try an alternative API
    const alternativeApiUrl = `https://www.googleapis.com/books/v1/volumes?q=${query}&maxResults=1`;
    response = await fetch(corsProxy + encodeURIComponent(alternativeApiUrl));
    data = await response.json();

    if (data.items && data.items[0]?.volumeInfo?.imageLinks?.thumbnail) {
      const coverUrl = data.items[0].volumeInfo.imageLinks.thumbnail.replace(
        "zoom=1",
        "zoom=2"
      );
      try {
        await preloadImage(coverUrl);
        return coverUrl;
      } catch (error) {
        console.log(`Alternative cover image failed to load for: ${title}`);
      }
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
async function addBookToLibrary(
  title,
  author,
  pages,
  genre,
  description,
  read,
  coverUrl = null
) {
  const book = new Book(title, author, pages, genre, description, read);
  book.coverUrl = coverUrl;
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
function createBookElement(book) {
  const bookContainer = document.createElement("div");
  bookContainer.classList.add("book-container");

  const bookCard = document.createElement("div");
  bookCard.classList.add("book-card");
  bookCard.dataset.id = book.id;

  const coverImg = document.createElement("img");
  coverImg.classList.add("book-cover");
  coverImg.src = book.coverUrl || "default-cover.jpg";
  coverImg.alt = `${book.title} cover`;

  const readToggle = document.createElement("button");
  readToggle.classList.add("read-toggle");
  if (book.read) readToggle.classList.add("read");
  readToggle.innerHTML = book.read ? "✓" : "";
  readToggle.title = book.read ? "Mark as unread" : "Mark as read";
  readToggle.onclick = () => toggleReadStatus(book.id);

  const deleteBtn = document.createElement("button");
  deleteBtn.classList.add("delete-btn");
  deleteBtn.innerHTML = "×";
  deleteBtn.title = "Delete book";
  deleteBtn.onclick = () => removeBook(book.id);

  const bookInfo = document.createElement("div");
  bookInfo.classList.add("book-info");

  const titleElement = document.createElement("h3");
  titleElement.classList.add("book-title");
  titleElement.textContent = book.title;

  const authorElement = document.createElement("p");
  authorElement.classList.add("book-author");
  authorElement.textContent = `by ${book.author}`;

  const genreElement = document.createElement("div");
  genreElement.classList.add("book-details");
  genreElement.textContent = book.genre || "Uncategorized";

  if (book.description) {
    const descriptionElement = document.createElement("p");
    descriptionElement.classList.add("book-description");
    descriptionElement.textContent = book.description;
    bookInfo.appendChild(descriptionElement);
  }

  bookInfo.appendChild(titleElement);
  bookInfo.appendChild(authorElement);
  bookInfo.appendChild(genreElement);

  bookCard.appendChild(coverImg);
  bookCard.appendChild(readToggle);
  bookCard.appendChild(deleteBtn);
  bookCard.appendChild(bookInfo);

  const permanentTitle = document.createElement("div");
  permanentTitle.classList.add("permanent-title");
  permanentTitle.textContent = book.title;

  bookContainer.appendChild(bookCard);
  bookContainer.appendChild(permanentTitle);

  return bookContainer;
}

// Function to display all books
function displayBooks() {
  const libraryContainer = document.getElementById("libraryContainer");
  libraryContainer.innerHTML = "";

  // Update book count
  const bookCount = document.getElementById("bookCount");
  bookCount.textContent = myLibrary.length;

  myLibrary.forEach((book) => {
    const bookContainer = createBookElement(book);
    libraryContainer.appendChild(bookContainer);
  });
}

// Function to toggle read status with animation
function toggleReadStatus(bookId) {
  const book = myLibrary.find((book) => book.id === bookId);
  const button = document.querySelector(`[data-id="${bookId}"] .read-toggle`);

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
const searchResults = document.getElementById("searchResults");
const searchQuery = document.getElementById("searchQuery");

// Add animation to title
document.addEventListener("DOMContentLoaded", () => {
  mainTitle.setAttribute("data-loaded", "true");
  addSampleBooks();
});

newBookBtn.addEventListener("click", () => {
  dialog.showModal();
  searchQuery.value = "";
  searchResults.innerHTML = "";
  searchQuery.focus();
});

// Close dialog when clicking outside
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) {
    dialog.close();
    searchQuery.value = "";
    searchResults.innerHTML = "";
  }
});

// Update sample books to be added asynchronously
async function addSampleBooks() {
  // First, fetch all covers
  const hobbitCover = await fetchBookCover("The Hobbit", "J.R.R. Tolkien");
  const nineteenEightyCover = await fetchBookCover("1984", "George Orwell");
  const prideCover = "https://covers.openlibrary.org/b/id/12645114-L.jpg"; // Known working cover
  const duneCover = await fetchBookCover("Dune", "Frank Herbert"); // Fetch Dune cover dynamically

  // Then add books with their covers
  await addBookToLibrary(
    "The Hobbit",
    "J.R.R. Tolkien",
    295,
    "Fantasy",
    "A fantasy novel about the adventures of Bilbo Baggins.",
    true,
    hobbitCover
  );
  await addBookToLibrary(
    "1984",
    "George Orwell",
    328,
    "Science Fiction",
    "A dystopian novel about totalitarian surveillance society.",
    false,
    nineteenEightyCover
  );
  await addBookToLibrary(
    "Pride and Prejudice",
    "Jane Austen",
    432,
    "Romance",
    "A romantic novel about the Bennet sisters in 19th century England.",
    true,
    prideCover
  );
  await addBookToLibrary(
    "Dune",
    "Frank Herbert",
    412,
    "Science Fiction",
    "A science fiction masterpiece about a desert planet, political intrigue, and a young heir's journey to power.",
    false,
    duneCover
  );
}

// Debounce function to limit API calls
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Debounced search function
const debouncedSearch = debounce(searchBooks, 300);

// Add input event listener
searchQuery.addEventListener("input", (e) => {
  const query = e.target.value.trim();

  // Clear results if query is empty
  if (!query) {
    searchResults.innerHTML = "";
    return;
  }

  // Show loading state immediately
  searchResults.innerHTML = '<div class="loading">Searching...</div>';

  // Call debounced search
  debouncedSearch(query);
});

async function searchBooks(query) {
  if (!query) {
    searchResults.innerHTML = "";
    return;
  }

  try {
    const cleanQuery = query.replace(/[^\w\s]/g, "").replace(/\s+/g, "+");
    const corsProxy = "https://corsproxy.io/?";
    const apiUrl = `https://openlibrary.org/search.json?q=${cleanQuery}&limit=5`;

    const response = await fetch(corsProxy + encodeURIComponent(apiUrl));
    const data = await response.json();

    if (!data.docs || data.docs.length === 0) {
      searchResults.innerHTML =
        '<div class="no-results">No books found. Try a different search.</div>';
      return;
    }

    searchResults.innerHTML = data.docs
      .map(
        (book) => `
      <div class="search-result" data-book='${JSON.stringify(book)}'>
        <img src="${
          book.cover_i
            ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
            : "placeholder-image.jpg"
        }" 
             alt="${book.title}" 
             onerror="this.src='https://via.placeholder.com/60x90?text=No+Cover'">
        <div class="search-result-info">
          <div class="search-result-title">${book.title}</div>
          <div class="search-result-author">by ${
            book.author_name ? book.author_name[0] : "Unknown Author"
          }</div>
          <div class="search-result-details">
            ${
              book.first_publish_year
                ? `Published: ${book.first_publish_year}`
                : ""
            }
          </div>
        </div>
      </div>
    `
      )
      .join("");

    // Add click handlers to search results
    document.querySelectorAll(".search-result").forEach((result) => {
      result.addEventListener("click", () =>
        selectBook(JSON.parse(result.dataset.book))
      );
    });
  } catch (error) {
    console.error("Error searching books:", error);
    searchResults.innerHTML =
      '<div class="error">An error occurred while searching. Please try again.</div>';
  }
}

async function selectBook(book) {
  // Show loading state
  const selectedResult = document.querySelector(
    `[data-book='${JSON.stringify(book)}']`
  );
  if (selectedResult) {
    selectedResult.innerHTML =
      '<div class="loading">Adding book to library...</div>';
  }

  try {
    const corsProxy = "https://corsproxy.io/?";
    let pageCount = book.number_of_pages_median;
    let description = "";
    let subjects = book.subject || [];
    let coverUrl = null;

    // If we have a work ID, fetch more detailed information
    if (book.key) {
      const workUrl = `https://openlibrary.org${book.key}.json`;
      const workResponse = await fetch(corsProxy + encodeURIComponent(workUrl));
      const workData = await workResponse.json();

      if (workData.description) {
        const rawDesc =
          typeof workData.description === "string"
            ? workData.description
            : workData.description.value || "";
        description = extractBriefDescription(rawDesc);
      }

      if (workData.number_of_pages) {
        pageCount = workData.number_of_pages;
      }

      if (workData.subjects) {
        subjects = subjects.concat(workData.subjects);
      }

      if (workData.covers && workData.covers.length > 0) {
        coverUrl = `https://covers.openlibrary.org/b/id/${workData.covers[0]}-L.jpg`;
      }
    }

    // Try to get cover from the search result if not found in work data
    if (!coverUrl && book.cover_i) {
      coverUrl = `https://covers.openlibrary.org/b/id/${book.cover_i}-L.jpg`;
    }

    // If we have an ISBN, try to get even more detailed information
    if (!description && book.isbn && book.isbn[0]) {
      const isbnUrl = `https://openlibrary.org/isbn/${book.isbn[0]}.json`;
      const isbnResponse = await fetch(corsProxy + encodeURIComponent(isbnUrl));
      const isbnData = await isbnResponse.json();

      if (isbnData.description && !description) {
        const rawDesc =
          typeof isbnData.description === "string"
            ? isbnData.description
            : isbnData.description.value || "";
        description = extractBriefDescription(rawDesc);
      }

      if (isbnData.number_of_pages) {
        pageCount = isbnData.number_of_pages;
      }

      if (isbnData.subjects) {
        subjects = subjects.concat(isbnData.subjects);
      }
    }

    // If still no description, try Google Books API
    if (!description && book.title) {
      try {
        const googleQuery = `${book.title} ${
          book.author_name ? book.author_name[0] : ""
        }`.replace(/\s+/g, "+");
        const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${googleQuery}&maxResults=1`;
        const googleResponse = await fetch(
          corsProxy + encodeURIComponent(googleUrl)
        );
        const googleData = await googleResponse.json();

        if (googleData.items && googleData.items[0]?.volumeInfo?.description) {
          description = extractBriefDescription(
            googleData.items[0].volumeInfo.description
          );
        }

        // Use Google Books cover as fallback if no cover found
        if (
          !coverUrl &&
          googleData.items &&
          googleData.items[0]?.volumeInfo?.imageLinks?.thumbnail
        ) {
          coverUrl =
            googleData.items[0].volumeInfo.imageLinks.thumbnail.replace(
              "zoom=1",
              "zoom=2"
            );
        }
      } catch (error) {
        console.error("Error fetching from Google Books:", error);
      }
    }

    // If still no description, create one from available information
    if (!description) {
      const elements = [];
      if (book.first_publish_year)
        elements.push(`Published in ${book.first_publish_year}`);
      if (subjects.length > 0) {
        const mainSubject = subjects[0].replace(/^[a-z]/, (c) =>
          c.toUpperCase()
        );
        elements.push(mainSubject);
      }
      description =
        elements.length > 0
          ? `A ${elements.join(", ")} book.`
          : `A ${determineGenreFromSubjects(subjects)} book.`;
    }

    // Determine genre from subjects
    subjects = subjects.map((s) =>
      typeof s === "string" ? s.toLowerCase() : ""
    );
    const genreMap = {
      fiction: "Fiction",
      "general fiction": "Fiction",
      "non-fiction": "Non-fiction",
      nonfiction: "Non-fiction",
      mystery: "Mystery",
      detective: "Mystery",
      crime: "Mystery",
      fantasy: "Fantasy",
      "high fantasy": "Fantasy",
      "science fiction": "Science Fiction",
      "sci-fi": "Science Fiction",
      sf: "Science Fiction",
      biography: "Biography",
      autobiography: "Biography",
      memoir: "Biography",
      romance: "Romance",
      "love stories": "Romance",
      historical: "Historical",
      history: "Historical",
      horror: "Horror",
      terror: "Horror",
      "self-help": "Self-help",
      "self help": "Self-help",
      "personal development": "Self-help",
      adventure: "Adventure",
      thriller: "Thriller",
      suspense: "Thriller",
      poetry: "Poetry",
      drama: "Drama",
      classics: "Classics",
      philosophy: "Philosophy",
      psychology: "Psychology",
      religion: "Religion",
      spirituality: "Religion",
    };

    // Try to find a matching genre
    let foundGenre = determineGenreFromSubjects(subjects);

    // Add book to library
    await addBookToLibrary(
      book.title,
      book.author_name ? book.author_name[0] : "Unknown Author",
      pageCount || 0,
      foundGenre,
      description,
      false, // Default to unread
      coverUrl
    );

    // Clear search and close dialog
    searchResults.innerHTML = "";
    searchQuery.value = "";
    dialog.close();
  } catch (error) {
    console.error("Error adding book:", error);
    if (selectedResult) {
      selectedResult.innerHTML =
        '<div class="error">Error adding book. Please try again.</div>';
    }
  }
}

// Helper function to extract a brief description
function extractBriefDescription(text) {
  if (!text) return "";

  // Remove HTML tags if present
  text = text.replace(/<[^>]*>/g, "");

  // Try to get the first sentence
  const firstSentence = text.match(/^[^.!?]+[.!?]/);
  if (firstSentence) {
    return firstSentence[0].trim();
  }

  // If no clear sentence, take the first 100 characters and add ellipsis
  if (text.length > 100) {
    const truncated = text.substring(0, 100).trim();
    // Try to end at a word boundary
    const lastSpace = truncated.lastIndexOf(" ");
    return lastSpace > 80
      ? truncated.substring(0, lastSpace) + "..."
      : truncated + "...";
  }

  return text.trim();
}

// Helper function to determine genre from subjects
function determineGenreFromSubjects(subjects) {
  const genreMap = {
    fiction: "Fiction",
    "general fiction": "Fiction",
    "non-fiction": "Non-fiction",
    nonfiction: "Non-fiction",
    mystery: "Mystery",
    detective: "Mystery",
    crime: "Mystery",
    fantasy: "Fantasy",
    "high fantasy": "Fantasy",
    "science fiction": "Science Fiction",
    "sci-fi": "Science Fiction",
    sf: "Science Fiction",
    biography: "Biography",
    autobiography: "Biography",
    memoir: "Biography",
    romance: "Romance",
    "love stories": "Romance",
    historical: "Historical",
    history: "Historical",
    horror: "Horror",
    terror: "Horror",
    "self-help": "Self-help",
    "self help": "Self-help",
    "personal development": "Self-help",
    adventure: "Adventure",
    thriller: "Thriller",
    suspense: "Thriller",
    poetry: "Poetry",
    drama: "Drama",
    classics: "Classics",
    philosophy: "Philosophy",
    psychology: "Psychology",
    religion: "Religion",
    spirituality: "Religion",
  };

  // Try to find a matching genre
  for (const [key, value] of Object.entries(genreMap)) {
    if (subjects.some((s) => s.includes(key))) {
      return value;
    }
  }

  return "Fiction"; // Default to Fiction if no match found
}

// Remove the search button since we don't need it anymore
const searchBtn = document.getElementById("searchBtn");
if (searchBtn) {
  searchBtn.remove();
}
