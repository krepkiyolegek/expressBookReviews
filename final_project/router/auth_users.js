const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username) => { //returns boolean
  //write code to check is the username is valid
}

const authenticatedUser = (username, password) => {
  let validusers = users.filter((user) => {
    return (user.username === username && user.password === password);
  });
  // Return true if any valid user is found, otherwise false
  if (validusers.length > 0) {
    return true;
  } else {
    return false;
  }
}

//only registered users can login
regd_users.post("/login", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  // Check if username or password is missing
  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in" });
  }

  // Authenticate user
  if (authenticatedUser(username, password)) {
    // Generate JWT access token
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });

    // Store access token and username in session
    req.session.authorization = {
      accessToken, username
    }
    return res.status(200).send({ message: "User successfully logged in" });
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    const username = req.session.authorization.username;
    const review = req.query.review || req.body.review;

    if (!review) {
      return res.status(400).json({ message: "Review text is required." });
    }

    // --- МАГИЯ JAVASCRIPT ---
    // Если у пользователя 'username' уже было ревью - оно перезапишется.
    // Если не было - оно добавится.
    // Никаких .push() и .filter()!
    book.reviews[username] = review;

    const bookReviews = Object.values(book.reviews);

    return res.status(200).json({
        message: `The review for the book with ISBN ${isbn} has been added/updated successfully.`,
        //reviews: book.reviews // Можем вернуть обновленный список ревью для этой книги
    });
  } else {
    return res.status(404).json({ message: "Book not found for the provided ISBN." });
  }
});

regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    const username = req.session.authorization.username;
    if (book.reviews[username]) {
      delete book.reviews[username];
      return res.status(200).json({
        message: `The review for the book with ISBN ${isbn} written by ${username} has been deleted successfully.`,
    });
    } else {
      return res.status(404).json({ message: "Review not found for this user." });
    }
  } else {
    return res.status(404).json({ message: "Book not found for the provided ISBN." });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
