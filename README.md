# Library Project

A sophisticated library management application that demonstrates advanced JavaScript concepts including Object Constructors, DOM manipulation, API integration, and modern UI/UX practices.

## Features

- Smart book search with auto-complete functionality
- Automatic book cover fetching from OpenLibrary and Google Books APIs
- Add new books with comprehensive details:
  - Title and author
  - Page count
  - Genre
  - Description
  - Read status
  - Book cover image
- Remove books from the library with smooth animation
- Toggle read status for each book with visual feedback
- Dark/Light theme support with system preference detection and local storage
- Book count tracking
- Responsive design that works on all screen sizes
- Modern UI with:
  - Card-based layout
  - Smooth animations and transitions
  - Modal dialog for book addition
  - Clean and intuitive interface
- Unique IDs for each book using crypto.randomUUID()
- Error handling for failed API requests
- Fallback cover images when API fetching fails

## Technologies Used

- HTML5 with semantic elements
- CSS3
  - Grid and Flexbox for layout
  - CSS Variables for theming
  - Smooth transitions and animations
- JavaScript (ES6+)
  - Async/Await for API calls
  - Local Storage for theme persistence
  - Modern DOM manipulation
  - Dialog Element for Modal Form
- External APIs
  - OpenLibrary API for book data and covers
  - Google Books API as fallback
- CORS Proxy for API requests

## Getting Started

1. Clone the repository
2. Open index.html in your browser
3. Start adding your books!
4. Toggle between dark and light themes using the theme switch

## Live Demo

Visit the [live demo](https://papafall.github.io/library/) to try it out!

## Features in Detail

### Book Search

- Real-time search suggestions as you type
- Fetches comprehensive book details from OpenLibrary
- Automatic genre detection from book subjects
- Smart description extraction

### Book Management

- Add books manually or through search
- Remove books with smooth fade-out animation
- Toggle read status with persistent storage
- Visual feedback for all user actions

### Theme System

- Automatic system theme detection
- Manual theme toggle with persistent preference
- Smooth transitions between themes
