const express = require('express')
const router = express.Router()
const { google } = require('googleapis')
const crypto = require('crypto')
require('dotenv').config()

const oauth2Client = new google.auth.OAuth2(
  process.env.OAUTH_CLIENTID,
  process.env.OAUTH_SECRET,
  'https://carris-metropolitana-api-1.onrender.com/auth/google/callback'
)

router.get('/auth/google', (req, res) => {
  const state = crypto.randomBytes(32).toString('hex')
  req.session.state = state

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    state
  })

  res.redirect(authUrl)
})

router.get('/auth/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query

    if (state !== req.session.state) {
      return res.status(400).send('Invalid state')
    }

    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: 'v2'
    })

    const { data } = await oauth2.userinfo.get()

    const pool = require("../db")
    // Check for an existing user
    const existingUser = await pool.query(`SELECT * FROM users WHERE google_id = $1 OR email = $2`, [data.id, data.email])
    // Create a new user if it doesn't exist
    if (existingUser.rows.length === 0) {
      const newUser = await pool.query(`
        INSERT INTO users (name, google_id, email) VALUES ($1, $2, $3)`,
        [
          data.name,
          data.id,
          data.email
        ])
    }

    req.session.user = {
      id: data.id,
      name: data.name,
      email: data.email
    }

    res.redirect('/')
  } catch (err) {
    console.error(err)
    res.redirect(process.env.CLIENT_URL + '/login-error')
  }
})

module.exports = router