const express = require('express');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();


// Function to check if the user exists
const doesExist = (username) => {
  let userswithsamename = users.filter((user) => {
    return user.username === username;
  });
  return userswithsamename.length > 0;
};

public_users.post("/register", (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username && password) {
    if (!doesExist(username)) {
      users.push({ "username": username, "password": password });
      return res.status(200).json({ message: "User successfully registered. Now you can login" });
    } else {
      return res.status(404).json({ message: "User already exists!" });
    }
  }
  return res.status(404).json({ message: "Unable to register user." });
});

public_users.get('/', async function (req, res) {
  try {
    const getBooksFromDB = new Promise((resolve, reject) => {
      resolve(books); 
    });

    const booksData = await getBooksFromDB;

    res.status(200).send(JSON.stringify(booksData, null, 4));
    
  } catch (error) {
    res.status(500).json({ message: "Error fetching books" });
  }
});

// Get book details based on ISBN
public_users.get('/isbn/:isbn', async function (req, res) {
  const isbn = req.params.isbn;
  
  try {
    // 1. Создаем наш асинхронный "запрос к БД"
    const getBookFromDB = new Promise((resolve, reject) => {
      const book = books[isbn];
      
      if (book) {
        // Если книга есть, "выполняем обещание" успешно
        resolve(book); 
      } else {
        // Если книги нет, "нарушаем обещание" (выдаем ошибку)
        reject(new Error("Book not found")); 
      }
    });

    // 2. Ждем результат. 
    // Если Promise сделает resolve(), в переменную 'foundBook' попадет книга, и мы пойдем дальше.
    // Если Promise сделает reject(), выполнение ОСТАНОВИТСЯ ЗДЕСЬ и мгновенно прыгнет в блок catch!
    const foundBook = await getBookFromDB;

    // 3. Отправляем успешный ответ
    return res.status(200).json(foundBook);
    
  } catch (error) {
    // 4. Сюда мы попадем только если сработал reject() внутри Promise
    return res.status(404).json({ message: "Book not found for the provided ISBN." });
  }
});

// Get book details based on author
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author;
  const allbooks = Object.values(books);
  let booksbyauthor = allbooks.filter((book) => book.author === author);
  if (booksbyauthor.length > 0) {
    res.send(JSON.stringify(booksbyauthor, null, 4));
  } else {
    res.status(404).json({ message: "Books written by this author are not found." });
  }
});

// Get all books based on title
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title;
  const allbooks = Object.values(books);
  let booksbytitle = allbooks.filter((book) => book.title === title);
  if (booksbytitle.length > 0) {
    res.send(JSON.stringify(booksbytitle, null, 4));
  } else {
    res.status(404).json({ message: "A book by this title is not found." });
  }
});

//  Get book review
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    const bookReviews = book.reviews;

    if (Object.keys(bookReviews).length > 0) {
      return res.status(200).json(bookReviews);
    } else {
      return res.status(200).json({ message: "This book has no reviews yet." });
    }
    
  } else {
    return res.status(404).json({ message: "Book not found for the provided ISBN." });
  }
});

module.exports.general = public_users;
