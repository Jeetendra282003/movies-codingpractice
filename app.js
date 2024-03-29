const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const app = express()
app.use(express.json())
const databasePath = path.join(__dirname, 'moviesData.db')
let db = null

const intializeDbAndServer = async (request, response) => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

intializeDbAndServer()

const convertMovieNameToPascalCase = dbObject => {
  return {
    movieName: dbObject.movie_name,
  }
}

app.get('/movies/', async (request, response) => {
  const getAllMovieQuery = `SELECT movie_name FROM movie;`
  const moviesArray = await db.all(getAllMovieQuery)
  response.send(
    moviesArray.map(moviename => convertMovieNameToPascalCase(moviename)),
  )
})

app.post('/movies/', async (request, response) => {
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const movieQuery = `INSERT INTO movie (director_id,movie_name,lead_actor) VALUES (${directorId},'${movieName}','${leadActor}');`
  const dbResponse = await db.run(movieQuery)
  response.send('Movie Successfully Added')
})

const covertDbObjectToResponseObject = dbObject => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  }
}

app.get('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const getMovieQuery = `SELECT * FROM movie WHERE movie_id=${movieId};`
  const movie = await db.get(getMovieQuery)
  console.log(movieId)
  response.send(covertDbObjectToResponseObject(movie))
})

app.put('/movies/:movieId', async (request, response) => {
  const {movieId} = request.params
  const movieDetails = request.body
  const {directorId, movieName, leadActor} = movieDetails
  const updatedQuery = `UPDATE movie SET director_id=${directorId},movie_name='${movieName}',lead_actor='${leadActor}' WHERE movie_id=${movieId};`
  await db.run(updatedQuery)
  response.send('Movie Details Updated')
})

app.delete('/movies/:movieId/', async (request, response) => {
  const {movieId} = request.params
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id=${movieId};`
  await db.run(deleteMovieQuery)
  response.send('Movie Removed')
})

const convertDirectorDetailsToPascalCase = dbObject => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  }
}

app.get('/directors/', async (request, response) => {
  const getAllDirectorsQuery = `SELECT * FROM director;`
  const moviesArray = await db.all(getAllDirectorsQuery)
  response.send(
    moviesArray.map(director => convertDirectorDetailsToPascalCase(director)),
  )
})

app.get('directors/:directorId/movies/', async (request, response) => {
  const {directorId} = request.params
  const getDirectorMovieQuery = `SELECT movie_name FROM movie WHERE director_id=${directorId};`
  const movies = await db.all(getDirectorMovieQuery)
  response.send(movies.map(eachmovie => ({movieName: eachmovie.movie_name})))
})

module.exports = app
