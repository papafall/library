const myLibrary = [];

// Book constructor
function Book(title, author, pages, read) {
  this.id = crypto.randomUUID();
  this.title = title;
  this.author = author;
  this.pages = pages;
  this.read = read;
}

// Book prototype method to toggle read status
Book.prototype.toggleRead = function () {
  this.read = !this.read;
};

// Function to add a book to the library
function addBookToLibrary(title, author, pages, read) {
  const book = new Book(title, author, pages, read);
  myLibrary.push(book);
  displayBooks();
}

// Function to remove a book from the library
function removeBook(bookId) {
  const index = myLibrary.findIndex((book) => book.id === bookId);
  if (index !== -1) {
    myLibrary.splice(index, 1);
    displayBooks();
  }
}

// Function to create a book card element
function createBookCard(book) {
  const card = document.createElement("div");
  card.classList.add("book-card");
  card.setAttribute("data-id", book.id);

  card.innerHTML = `
        <h3>${book.title}</h3>
        <div class="book-info">
            <p>Author: ${book.author}</p>
            <p>Pages: ${book.pages}</p>
            <p>Status: ${book.read ? "Read" : "Not read yet"}</p>
        </div>
        <div class="book-actions">
            <button onclick="toggleReadStatus('${book.id}')">${
    book.read ? "Mark as Unread" : "Mark as Read"
  }</button>
            <button class="delete-btn" onclick="removeBook('${
              book.id
            }')">Remove</button>
        </div>
    `;

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

// Function to toggle read status
function toggleReadStatus(bookId) {
  const book = myLibrary.find((book) => book.id === bookId);
  if (book) {
    book.toggleRead();
    displayBooks();
  }
}

// Dialog handling
const dialog = document.getElementById("bookDialog");
const newBookBtn = document.getElementById("newBookBtn");
const cancelBtn = document.getElementById("cancelBtn");
const bookForm = document.getElementById("bookForm");

newBookBtn.addEventListener("click", () => {
  dialog.showModal();
});

cancelBtn.addEventListener("click", () => {
  dialog.close();
  bookForm.reset();
});

bookForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const author = document.getElementById("author").value;
  const pages = parseInt(document.getElementById("pages").value);
  const read = document.getElementById("read").checked;

  addBookToLibrary(title, author, pages, read);

  dialog.close();
  bookForm.reset();
});

// Add some sample books to start with
addBookToLibrary("The Hobbit", "J.R.R. Tolkien", 295, true);
addBookToLibrary("1984", "George Orwell", 328, false);
addBookToLibrary("Pride and Prejudice", "Jane Austen", 432, true);
