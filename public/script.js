homeFunctions()

// Starting Functions
async function homeFunctions() {
  await nearStops()
  await nearLines()
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

// Near Stops
async function nearStops() {
  let stopsContainer = document.getElementById('recentStops_container')
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async function (position) {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      console.log(`Latitude: ${latitude}, Longitude: ${longitude}`)

      let nearestStops = [] // Store the 5 nearest stops
      try {
        const stop_data = await getAPI("stops")

        stop_data.forEach(stop => {
          const lon = stop.lon
          const lat = stop.lat
          const distance = haversineDistance(latitude, longitude, lat, lon)
          nearestStops.push({ ...stop, distance })
        })

        // Sort stops by distance and keep the 5 closest
        nearestStops.sort((a, b) => a.distance - b.distance)
        nearestStops = nearestStops.slice(0, 10)

        console.log("Nearest Stops:", nearestStops)
        // Display filtered stops
        renderStops(nearestStops, stopsContainer)
      } catch (error) {
        console.error(error.message)
        snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as paragens perto de si")
      }
    }, function () {
      snackbar("fa-solid fa-triangle-exclamation", "Não foi possível obter a sua localização")
    })
  } else {
    snackbar("fa-solid fa-triangle-exclamation", "O serviço de GeoLocation não está disponível")
  }
}

// Haversine formula to calculate distance between two coordinates
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371 // Earth radius (Km)
  const toRad = angle => (angle * Math.PI) / 180

  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // Distance (Km)
}

async function nearLines() {
  let linesContainer = document.getElementById('recentLines_container')
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async function (position) {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude
      console.log(`Latitude: ${latitude}, Longitude: ${longitude}`)

      let nearestStops = []
      let uniqueLineIds = new Set()
      let nearestLines = []

      try {
        const stop_data = await getAPI("stops")

        stop_data.forEach(stop => {
          const lon = stop.lon
          const lat = stop.lat
          const distance = haversineDistance(latitude, longitude, lat, lon)
          nearestStops.push({ ...stop, distance })
        })

        // Sort stops by distance and keep the 10 closest
        nearestStops.sort((a, b) => a.distance - b.distance)
        nearestStops = nearestStops.slice(0, 10)

        for (const stop of nearestStops) {
          for (const line of stop.lines) {
            if (!uniqueLineIds.has(line)) {
              uniqueLineIds.add(line)
              try {
                const line_data = await getAPI("lines/" + line)
                nearestLines.push(line_data)
              } catch (error) {
                console.error(`Erro ao obter dados da linha ${line}:`, error.message)
              }
            }
          }
        }

        console.log("Nearest Lines:", nearestLines)
        // Display the unique nearest lines
        renderLines(nearestLines, linesContainer)
      } catch (error) {
        console.error(error.message)
        snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as linhas perto de si")
      }
    }, function () {
      snackbar("fa-solid fa-triangle-exclamation", "Não foi possível obter a sua localização")
    })
  } else {
    snackbar("fa-solid fa-triangle-exclamation", "O serviço de GeoLocation não está disponível")
  }
}