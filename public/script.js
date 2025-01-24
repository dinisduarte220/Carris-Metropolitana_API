homeFunctions()

// Starting Functions
async function homeFunctions() {
  await favoriteLines()
  await favoriteStops()
  await recentLines()
  await recentStops()
}

// Favorite Lines
async function favoriteLines() {
  let mainContainer = document.getElementById('favoriteLines')
  let linesContainer = document.getElementById('favLines_container')
  let containerMessage = mainContainer.querySelector('.errorMsg')
  containerMessage.style.display = "none"
  try {
    const response = await fetch('/storage?storage_id=favorite_lines')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch favorite lines: ${response.statusText}`)
    }
    const data = await response.json()
    // If no favorite lines are stored -> show a no lines message on the container
    if (data.length == 0) {
      containerMessage.style.display = "block"
      return
    }
    // Get all lines from Carris Metropolitana API
    const allLines = await getAPI('lines')
    // Just use the lines stored on favorites
    const favoriteLinesData = allLines.filter(line => data.includes(line.id))
    // Display filtered lines
    renderLines(favoriteLinesData, linesContainer)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as tuas linhas favoritas")
  }
}

// Recent Lines
async function recentLines() {
  let mainContainer = document.getElementById('recentLines')
  let linesContainer = document.getElementById('recentLines_container')
  let containerMessage = mainContainer.querySelector('.errorMsg')
  containerMessage.style.display = "none"
  try {
    const response = await fetch('/storage?storage_id=recent_lines')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch recent lines: ${response.statusText}`)
    }
    const data = await response.json()
    // If no recent lines are stored -> show a no lines message on the container
    if (data.length == 0) {
      containerMessage.style.display = "block"
      return
    }
    // Get all lines from Carris Metropolitana API
    const allLines = await getAPI('lines')
    // Just use the lines stored on recents
    const recentLinesData = allLines.filter(line => data.includes(line.id))
    // Display filtered lines
    renderLines(recentLinesData, linesContainer)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as linhas recentes")
  }
}

// Favorite Stops
async function favoriteStops() {
  let mainContainer = document.getElementById('favoriteStops')
  let stopsContainer = document.getElementById('favStops_container')
  let containerMessage = mainContainer.querySelector('.errorMsg')
  containerMessage.style.display = "none"
  try {
    const response = await fetch('/storage?storage_id=favorite_stops')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch favorite stops: ${response.statusText}`)
    }
    const data = await response.json()
    // If no recent stops are stored -> show a no stops message on the container
    if (data.length == 0) {
      containerMessage.style.display = "block"
      return
    }
    // Get all stops from Carris Metropolitana API
    const allStops = await getAPI('stops')
    // Just use the stops stored on recents
    const favoriteStopsData = allStops.filter(stop => data.includes(stop.id))
    // Display filtered stops
    renderStops(favoriteStopsData, stopsContainer)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as tuas paragens favoritas")
  }
}

// Recent Stops
async function recentStops() {
  let mainContainer = document.getElementById('recentStops')
  let stopsContainer = document.getElementById('recentStops_container')
  let containerMessage = mainContainer.querySelector('.errorMsg')
  containerMessage.style.display = "none"
  try {
    const response = await fetch('/storage?storage_id=recent_stops')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch recent stops: ${response.statusText}`)
    }
    const data = await response.json()
    // If no recent stops are stored -> show a no stops message on the container
    if (data.length == 0) {
      containerMessage.style.display = "block"
      return
    }
    // Get all stops from Carris Metropolitana API
    const allStops = await getAPI('stops')
    // Just use the stops stored on recents
    const favoriteStopsData = allStops.filter(stop => data.includes(stop.id))
    // Display filtered stops
    renderStops(favoriteStopsData, stopsContainer)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as paragens recentes")
  }
}