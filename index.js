require('rootpath')();
const express = require('express');
const app = express();
const morgan = require('morgan');
const cors = require('cors');
app.use(express.json());

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
    }
    res.send(result)
  });
});


app.get('/seats', (req, res) => {
    con.query(`SELECT Seat_ID from ticket WHERE Session_ID = (SELECT Session_ID from session WHERE Session_time = '${req.query.session}') &&  Film_ID = '${req.query.filmId}' && Date = '${req.query.date[0]}'`,
        function (err, result, fields) {
        if (err) {
            console.log(err)
        }
        con.query(`SELECT * FROM seat`, function (err, remainSeats, fields) {
            if (err) {
                console.log(err)
            }
            const selectedSeats = result.map(x => x.Seat_ID);
            const lastSeats = remainSeats.filter((el, index) => (
                 !selectedSeats.includes(el.Seat_ID)
            ));
           res.send(lastSeats);
        })
    })
});

app.get('/sessions-date', (req, res) => {
  con.query("SELECT DISTINCT DATE_FORMAT(Date, \"%Y-%m-%d\") FROM sessionfilmconnection", function (err, result, fields) {
    if (err) {
      console.log(err)
    }
    res.send(result)
  });
});

app.get('/carusel-images', (req, res) => {
  con.query("SELECT Image FROM films", function (err, result, fields) {
    if (err) throw err;
    res.send(result)
  });
});

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
    const film = films.find(x => x);
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

app.put('/book-ticket', async (req, res) => {
  const Uid = Math.floor(1000 + Math.random() * 9000);
  let customerId = null;
  await con.query(
`INSERT INTO customers ( Name, Surname, Customer_Code, phone ) VALUES ('${req.body.params.firstName}', '${req.body.params.lastName}', '${Uid}', '${req.body.params.phone}')`,function (err, customer, fields) {
    if (err) {
      console.log(err);
    }
    customerId = customer.insertId;
    let sessionId = null;
       con.query(
          `SELECT Session_ID from session WHERE Session_time = '${req.body.params.session}'`, function (err, id, fields) {
             if (err) {
                console.log(err);
             }
             sessionId = id[0].Session_ID;
             req.body.params.seat.forEach(id => (
                con.query(
                `INSERT INTO ticket  ( Session_ID, Seat_ID, Cost, Selected, Customer_ID, Film_ID, Date ) 
                  VALUES ( '${sessionId}', '${id}', '20$', '1', '${customerId}', '${req.body.params.filmId}', '${req.body.params.date[0]}' )`,function (err, ticket, fields) {
                    if (err) {
                        console.log(err);
                       }
                     }
                   )
               ));
               res.send(`${Uid}`);
          }
      );
  }
)});

const port = process.env.NODE_ENV === 'production' ? 80 : 3030;

const hostname = '127.0.0.1';

const server = app.listen(port, hostname, () => {
    console.log('Example app listening on port', + port)
});