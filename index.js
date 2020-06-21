require('rootpath')();
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');

app.use(cors());

const mysql = require('mysql');

const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'cinema'
});

app.get('/sessions', (req, res) => {
  con.query(`SELECT Session_time
  FROM session
  INNER JOIN sessionfilmconnection 
  ON session.Session_ID = sessionfilmconnection.Session_ID  
  WHERE sessionfilmconnection.Film_ID = ${req.query.id}
  && sessionfilmconnection.Date = "${req.query.date[0]}"
  `, function (err, result, fields) {
    if (err) {
      console.log(err)
    };
    res.send(result)
  });
});


app.get('/seats', (req, res) => {
  con.query("SELECT * FROM seat", function (err, result, fields) {
    if (err) {
      console.log(err)
    };
    res.send(result)
  });
});

app.get('/sessions-date', (req, res) => {
  con.query("SELECT DISTINCT DATE_FORMAT(Date, \"%Y-%m-%d\") FROM sessionfilmconnection", function (err, result, fields) {
    if (err) {
      console.log(err)
    };
    res.send(result)
  });
});

app.get('/carusel-images', (req, res) => {
  con.query("SELECT Image FROM films", function (err, result, fields) {
    if (err) throw err;
    res.send(result)
  });
})

app.get('/films', (req, res) => {
  if (req.query.search){
    con.query(`SELECT * FROM films WHERE Film_title LIKE '${req.query.search}'`, function (err, films, fields) {
      res.send(films || []);
    });
  } else {
    con.query("SELECT Film_ID, Film_title, Image FROM films", function (err, films, fields) {
      if (err) throw err;
      res.send(films)
    });
  }
});

app.get('/single-film', (req, res) => {
  con.query(`SELECT * FROM films WHERE Film_ID = ${req.query.id}`, function (err, films, fields) {
    if (err) throw err;
    const film = films.find(x => x)
    res.send(film) 
 });
});

app.get('/single-film-actors', (req, res) => {
  con.query(`SELECT Actor_name
    FROM actors
    INNER JOIN filmactorconnection
    ON actors.Actor_ID = filmactorconnection.Actor_ID 
    WHERE filmactorconnection.Film_ID = ${req.query.id}`, function (err, filmActor, fields) {
      if (err) throw err;
      res.send(filmActor)
  });
});

app.get('/single-film-genre', (req, res) => {
  con.query(`SELECT Genre_name
    FROM genre
    INNER JOIN filmgenreconnection
    ON genre.Genre_ID = filmgenreconnection.Genre_ID 
    WHERE filmgenreconnection.Film_ID = ${req.query.id}`, function (err, filmGenre, fields) {
      if (err) throw err;
      res.send(filmGenre)
  });
});

app.post('/book-ticket', (req, res) => {
  console.log('req', req)
})

const port = process.env.NODE_ENV === 'production' ? 80 : 3030;

const hostname = '127.0.0.1'

const server = app.listen(port, hostname, () => {
    console.log('Example app listening on port', + port)
});