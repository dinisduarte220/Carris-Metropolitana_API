// Extract the current line_id from URL
const pathParts = window.location.pathname.split('/')
const lineId = pathParts[3] // Get the 3rd part of the URL (URL Base = /page/lines/:line_id)

addLineToRecents()

// Store current date in YYYYMMDD format
// const date = new Date()
// const currentDate = `${date.getFullYear()}${date.getMonth()}${date.getDay()}` 
let date = new Date()
let currentDate = date.toISOString().split("T")[0].replace(/-/g, '')

// Get and load first pattern from line (To start displaying information)
async function getFirstPattern() {
  try {
    const data = await getAPI("lines/" + lineId)
    // If line exists continue. If not, return to lines page
    if (data && Object.keys(data).length > 0) {
      lineInformationDisplay()
      return data.patterns[0]
    } else {
      window.location.href = '/page/lines'
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as informações da linha: " + lineId)
  }
}
getFirstPattern()

async function addLineToRecents() {
  try {
    const response = await fetch('/storage?storage_id=recent_lines')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch recent lines: ${response.statusText}`)
    }

    let data = await response.json()

    // Move lineId to the first position if it already exists, otherwise add it
    const index = data.indexOf(lineId)
    if (index !== -1) {
      data.splice(index, 1) // Remove the existing lineId
    }
    data.unshift(lineId) // Add it to the beginning of the array

    // Update the recent lines on the server
    const finalRes = await fetch('/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storage_id: 'recent_lines',
        value: data
      })
    })

    if (!finalRes.ok) {
      throw new Error(`[ERROR] Failed to update recent lines: ${finalRes.statusText}`)
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as tuas linhas favoritas")
  }
}

// Line Top Information
async function lineInformationDisplay() {
  // Define current line display (Number and Name)
  const lineNumber = document.getElementById('lineNumber')
  const lineName = document.getElementById('lineName')
  try {
    const data = await getAPI("/lines/" + lineId)

    lineNumber.innerText = lineId
    lineNumber.style.backgroundColor = data.color
    lineName.innerText = data.long_name

    // If line is stored on favorites, change the icon to solid
    const response = await fetch('/storage?storage_id=favorite_lines')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch favorite lines: ${response.statusText}`)
    }
    let data_favorites = await response.json()
    if (data_favorites.includes(lineId)) {
      document.getElementById('favoritesIcon').classList.remove('fa-regular')
      document.getElementById('favoritesIcon').classList.add('fa-solid')
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as informações da linha: " + lineId)
  }
}

// Add / Remove to favorite lines
async function favoriteLines() {
  try {
    const response = await fetch('/storage?storage_id=favorite_lines')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch favorite lines: ${response.statusText}`)
    }

    let data = await response.json()

    if (data.includes(lineId)) {
      // Remove the lineId if it's already a favorite
      data = data.filter(item => item !== lineId)
    } else {
      // Add the lineId if it's not a favorite
      data.push(lineId)
    }
    console.log(data)
    // Update the favorites on the server
    const finalRes = await fetch('/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storage_id: 'favorite_lines',
        value: data
      })
    })

    if (!finalRes.ok) {
      throw new Error(`[ERROR] Failed to update favorite lines: ${finalRes.statusText}`)
    }

    if (data.includes(lineId)) {
      document.getElementById('favoritesIcon').classList.remove('fa-regular')
      document.getElementById('favoritesIcon').classList.add('fa-solid')
    } else {
      document.getElementById('favoritesIcon').classList.add('fa-regular')
      document.getElementById('favoritesIcon').classList.remove('fa-solid')
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as tuas linhas favoritas")
  }
}

// Add to recent lines
function addRecentLine() {

}