// Extract the current line_id from URL
const pathParts = window.location.pathname.split('/')
const lineId = pathParts[3] // Get the 3rd part of the URL (URL Base = /page/lines/:line_id)
let patternId

addLineToRecents()

// Store current date in YYYYMMDD format
// const date = new Date()
// const currentDate = `${date.getFullYear()}${date.getMonth()}${date.getDay()}` 
let date = new Date()
let currentDate = date.toISOString().split("T")[0].replace(/-/g, '') // Date for the pattern selector
let formatedDate = date.toISOString().split("T")[0] // Date for the date selector
document.getElementById("date_input").value = formatedDate

// Get and load first pattern from line (To start displaying information)
async function checkLine() {
  try {
    const data = await getAPI("lines/" + lineId)
    // If line exists continue. If not, return to lines page
    if (data && Object.keys(data).length > 0) {
      lineInformationDisplay()
    } else {
      window.location.href = '/page/lines'
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as informações da linha: " + lineId)
  }
}
checkLine()

// Add to the recent lines
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

// Custom Select Menus
function select(menu_id) {
  let selectMenu = document.getElementById(menu_id + '_selectMenu')
  let selectOptions = document.getElementById(menu_id + '_selectOptions')

  if (selectMenu.classList.contains('open')) {
    selectOptions.style.display = "none"
    selectMenu.classList.remove('open')
  } else {
    selectMenu.classList.add('open')
    selectOptions.style.display = "block"
  }
}

// Set current date at date selector
async function loadRoutes() {
  try {
    const data = await getAPI("lines/" + lineId)
    const patternsDiv = document.getElementById('pattern_selectOptions')

    // Clear previous content if needed
    while (patternsDiv.firstChild) {
      patternsDiv.removeChild(patternsDiv.firstChild)
    }

    let routes = data.routes
    let routeLetter = 'A'.charCodeAt(0) // Start with ASCII value of 'A'
    let firstPatternSet = false // Flag to set the active pattern text only once

    for (const route of routes) {
      const route_data = await getAPI("routes/" + route)

      // Add the route header with a letter
      let newRoute = document.createElement('div')
      newRoute.setAttribute('class', 'newRoute')
      newRoute.innerText = `${String.fromCharCode(routeLetter)} - ${route_data.long_name}`
      patternsDiv.appendChild(newRoute)
      routeLetter++

      // Fetch and add patterns for the route
      let patterns = route_data.patterns
      for (const pattern of patterns) {
        const pattern_data = await getAPI("patterns/" + pattern)
        let newPattern = document.createElement('div')
        newPattern.setAttribute('class', 'newPattern')
        newPattern.setAttribute('id', 'newPattern_' + pattern_data.id)
        newPattern.setAttribute('onclick', `selectPattern("${pattern_data.id}")`)
        newPattern.innerText = pattern_data.headsign
        patternsDiv.appendChild(newPattern)

        // Set the first pattern as activePatternDisplay
        if (!firstPatternSet) {
          patternId = pattern_data.id
          selectPattern(patternId)
          firstPatternSet = true
        }
      }
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as rotas / sentidos para esta linha")
  }
}
loadRoutes()

async function selectPattern(pattern_id) {
  const activePatternDisplay = document.getElementById('activePatternText')
  // If there was another active pattern, remove the class and change it to the new pattern
  let activePattern = document.querySelector('.newPattern.active')
  if (activePattern) {
    activePattern.classList.remove('active')
    // Close patterns select menu, just if its not the first time loading (To avoid opening the select menu when the first pattern is selected)
    select('pattern')
  }
  let newActivePattern = document.getElementById('newPattern_' + pattern_id)
  newActivePattern.classList.add('active')
  // Change active pattern name on select menu
  try {
    const data = await getAPI("patterns/" + pattern_id)
    activePatternDisplay.innerText = data.headsign
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as rotas / sentidos para esta linha")
  }
  // Store current pattern for future uses
  patternId = pattern_id
  loadStops()
}

// Load stops for the active pattern
async function loadStops() {
  try {
    const data = await getAPI("patterns/" + patternId)
    document.getElementById('stopsBorder').style.backgroundColor = data.color
    // Set and clear the stops container
    const stopsContainer = document.getElementById('stopsContainer')
    while (stopsContainer.firstChild) {
      stopsContainer.removeChild(stopsContainer.firstChild)
    }

    let stops = data.path
    stops.forEach(stop => {
      let newStop = document.createElement('div')
      newStop.setAttribute('class', 'newStop')
      newStop.setAttribute('id', 'newStop_' + stop.stop.id)
      newStop.setAttribute('onclick', `selectStop(${stop.stop.id})`)

      let stopName = document.createElement('p')
      stopName.setAttribute('class', 'stopName')
      stopName.innerText = stop.stop.name

      newStop.appendChild(stopName)

      stopsContainer.appendChild(newStop)
    });
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as paragens desta linha")
  }
}