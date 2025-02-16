// Extract the current line_id from URL
const pathParts = window.location.pathname.split('/')
const stopId = pathParts[3]
let linesFiltered = []


// Picture in Picture Element
let pipWindow = null

// Check if user wants to receive stop notifications
let receiveNotifications
fetch('/settings')
  .then(response => response.json())
  .then(settings => {
    receiveNotifications = settings.stop_notifications
    updateNotificationIcon() // Call function to update the icon after receiving data
  })
  .catch(error => console.error('[ERROR] Failed to load settings:', error))
// Function to update the icon
function updateNotificationIcon() {
  const iconElement = document.getElementById('notificationsIcon')
  if (receiveNotifications === true) {
    iconElement.className = "fa-solid fa-bell"
  } else {
    iconElement.className = "fa-regular fa-bell"
  }
}

// Check if stop is valid
async function checkStop() {
  try {
    const data = await getAPI("stops/" + stopId)
    // If line exists continue. If not, return to lines page
    if (data && Object.keys(data).length > 0) {
      await loadAllStops()
      stopInformationDisplay()
      addStopToRecents()
    } else {
      window.location.href = '/page/stops'
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as informações da paragem: " + stopId)
  }
}
// Make sure the map is loaded before executing any function
map.on('load', checkStop)


// Deactivate / Reactivate notifications
function toggleNotifications() {
  receiveNotifications = !receiveNotifications

  fetch('/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ stop_notifications: receiveNotifications })
  })
  .then(response => response.json())
  .then(data => {
    console.log('[SUCCESS]', data.message)
    updateNotificationIcon() // Update icon after saving the new state
  })
  .catch(error => console.error('[ERROR] Failed to update settings:', error))
}
// Add to the recent lines
async function addStopToRecents() {
  try {
    const response = await fetch('/storage?storage_id=recent_stops')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch recent stops: ${response.statusText}`)
    }

    let data = await response.json()

    // Move stopId to the first position if it already exists, otherwise add it
    const index = data.indexOf(stopId)
    if (index !== -1) {
      data.splice(index, 1) // Remove the existing stopId
    }
    data.unshift(stopId) // Add it to the beginning of the array

    // Update the recent stops on the server
    const finalRes = await fetch('/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storage_id: 'recent_stops',
        value: data
      })
    })

    if (!finalRes.ok) {
      throw new Error(`[ERROR] Failed to update recent lines: ${finalRes.statusText}`)
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao adicionar esta paragem às tuas paragens recentes")
  }
}

// Add / Remove to favorite stops
async function favoriteStops() {
  try {
    const response = await fetch('/storage?storage_id=favorite_stops')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch favorite stops: ${response.statusText}`)
    }

    let data = await response.json()

    if (data.includes(stopId)) {
      // Remove the stopId if it's already a favorite
      data = data.filter(item => item !== stopId)
    } else {
      // Add the stopId if it's not a favorite
      data.push(stopId)
    }
    // Update the favorites on the server
    const finalRes = await fetch('/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        storage_id: 'favorite_stops',
        value: data
      })
    })

    if (!finalRes.ok) {
      throw new Error(`[ERROR] Failed to update favorite stops: ${finalRes.statusText}`)
    }

    if (data.includes(stopId)) {
      document.getElementById('favoritesIcon').classList.remove('fa-regular')
      document.getElementById('favoritesIcon').classList.add('fa-solid')
    } else {
      document.getElementById('favoritesIcon').classList.add('fa-regular')
      document.getElementById('favoritesIcon').classList.remove('fa-solid')
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as tuas paragens favoritas")
  }
}

// Select stop on the map
function setSelectedStop(lon, lat, stopId) { 
  map.flyTo({
    center: [lon, lat],
    zoom: 15
  })

  if (!map.getLayer("points")) {
    console.error("Layer 'points' not found")
    return
  }

  map.setPaintProperty("points", "circle-color", [
    "case",
    ["==", ["get", "id"], stopId],
    "rgb(150, 150, 150)",
    "#ba7c18"
  ])

  map.setPaintProperty("points", "circle-opacity", [
    "case",
    ["==", ["get", "id"], stopId],
    1,
    0.5
  ])

  map.setPaintProperty("points", "circle-stroke-opacity", [
    "case",
    ["==", ["get", "id"], stopId],
    1,
    0.5
  ])

  map.setPaintProperty("points", "circle-radius", [
    "case",
    ["==", ["get", "id"], stopId],
    8,
    4
  ])
}

// Stop detailes
let linesData = []
async function stopInformationDisplay() {
  const stopName_display = document.getElementById('stopName')
  const stopID_display = document.getElementById('stopID')
  const stopLinesContainer = document.getElementById('stopLines')
  try {
    const stop_data = await getAPI("stops/" + stopId)

    stopName_display.innerText = stop_data.name
    stopID_display.innerText = "#" + stop_data.id
    stopID_display.setAttribute('onclick', `copyText(${stop_data.id})`)

    document.title = `${stop_data.name}`

    // If line is stored on favorites, change the icon to solid
    const response = await fetch('/storage?storage_id=favorite_stops')
    if (!response.ok) {
      throw new Error(`[ERROR] Failed to fetch favorite lines: ${response.statusText}`)
    }
    let data_favorites = await response.json()
    if (data_favorites.includes(stopId)) {
      document.getElementById('favoritesIcon').classList.remove('fa-regular')
      document.getElementById('favoritesIcon').classList.add('fa-solid')
    }

    stopLinesContainer.innerHTML = ""
    linesData = []

    const lines_data = await getAPI("lines")
    const linesMap = new Map(lines_data.map(line => [line.id, line.color]))

    stop_data.lines.forEach(lineId => {
      let lineColor = linesMap.get(lineId)

      let newElement = { line_ID: lineId, line_color: lineColor }
      linesData.push(newElement)

      let newLine = document.createElement('div')
      newLine.setAttribute('class', 'line')
      newLine.setAttribute('id', 'line_' + lineId)
      newLine.setAttribute('onclick', `filterLines(${lineId})`)
      newLine.innerText = lineId
      newLine.style.backgroundColor = lineColor
      stopLinesContainer.appendChild(newLine)
    })

    setSelectedStop(stop_data.lon, stop_data.lat, stopId)
    loadArrivals()
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as informações desta paragem")
  }
}

// Filters
function filterLines(line_id) {
  const linesContainer = document.getElementById('stopLines')
  if (linesFiltered.includes(line_id)) {
    let index = linesFiltered.indexOf(line_id)
    if (index > -1) {
      linesFiltered.splice(index, 1)
    }
  } else {
    linesFiltered.push(line_id)
  }
  // If there are no lines filtered, activate all
  // If 1 or more lines are filtered just show that ones
  if (linesFiltered.length === 0) {
    let allLines = linesContainer.querySelectorAll('.line')
    allLines.forEach(line => {
      line.style.opacity = "1"
    })
  } else {
    let allLines = linesContainer.querySelectorAll('.line')
    allLines.forEach(line => {
      line.style.opacity = ".5"
    })
    linesFiltered.forEach(line => {
      document.getElementById('line_' + line).style.opacity = "1"
    })
  }
}

// Load arrival times
let pastTrips_counter = 0
let pastTrips = []
let realTimeTrips = []
let scheduledTrips = []
let finalTrips = []

async function loadArrivals() {
  const currentUNIX = Math.floor(Date.now() / 1000)
  const pastContainer = document.getElementById('pastTrips')
  const futureContainer = document.getElementById('futureTrips')

  let className, color, arrivalTime, delayType, delayTime
  try {
    const arrival_data = await getAPI(`stops/${stopId}/realtime`)
    arrival_data.forEach(arrival => {
      // Check if arrival is already done (past trip)
      if (arrival.observed_arrival_unix !== null && arrival.estimated_arrival_unix !== null && arrival.estimated_arrival_unix < currentUNIX && arrival.scheduled_arrival_unix < currentUNIX) {
        let lineObj = linesData.find(line => line.line_ID === arrival.line_id)
        color = lineObj ? lineObj.line_color : null
        className = "concluded"
        if (arrival.observed_arrival_unix !== null) {
          console.log(arrival.estimated_arrival)
          arrivalTime = arrival.estimated_arrival.substring(0, 5)
        } else {
          arrivalTime = arrival.scheduled_arrival.substring(0, 5)
        }
        delayTime = null
        delayType = null
        pastTrips.push({ trip: arrival, arrivalTime, color, className, delayTime, delayType })
      }
      // Check if arrival is on real time (already running)
      else if (arrival.observed_arrival_unix === null && arrival.estimated_arrival_unix !== null && arrival.estimated_arrival_unix > currentUNIX) {
        let lineObj = linesData.find(line => line.line_ID === arrival.line_id)
        color = lineObj ? lineObj.line_color : null
        className = "realTime"
        if (Math.floor((arrival.estimated_arrival_unix - currentUNIX) / 60) < 1) {
          arrivalTime = "A chegar"
        } else {
          arrivalTime = Math.floor((arrival.estimated_arrival_unix - currentUNIX) / 60) + " min"
        }
        delayTime = Math.floor((arrival.estimated_arrival_unix - arrival.scheduled_arrival_unix) / 60)
        if (delayTime < 5) {
          delayType = 0
        } else if (delayTime < 10) {
          delayType = 1
        } else {
          delayType = 2
        }
        realTimeTrips.push({ trip: arrival, arrivalTime, color, className, delayTime, delayType })
      }
      // Check if trip is scheduled (future trip)
      else if (arrival.observed_arrival_unix === null && arrival.scheduled_arrival_unix > currentUNIX) {
        let lineObj = linesData.find(line => line.line_ID === arrival.line_id)
        color = lineObj ? lineObj.line_color : null
        className = "scheduled"
        arrivalTime = arrival.scheduled_arrival.substring(0, 5)
        delayTime = null
        delayType = null
        scheduledTrips.push({ trip: arrival, arrivalTime, color, className, delayTime, delayType })
      }
    })

    // Create the DOM elements for each trip
    const createTripElement = (tripData) => {
      const { trip, arrivalTime, color, className, delayTime, delayType } = tripData

      let newArrival = document.createElement('div')
      newArrival.setAttribute('class', `arrivalTime ${className}`)
      newArrival.setAttribute('id', 'trip_' + trip.trip_id)

      let arrivalNumber = document.createElement('div')
      arrivalNumber.setAttribute('class', 'lineNumber')
      arrivalNumber.innerText = trip.line_id
      arrivalNumber.style.backgroundColor = color

      let arrivalName = document.createElement('div')
      arrivalName.setAttribute('class', 'lineName')
      arrivalName.innerText = trip.headsign

      let arrivingTime = document.createElement('div')
      arrivingTime.setAttribute('class', 'arrivingTime')
      if (className === "realTime") {
        let realTimeIcon = document.createElement('div')
        realTimeIcon.setAttribute('class', `realTimeIcon delay_${delayType}`)
        let realTimeDot = document.createElement('div')
        realTimeDot.setAttribute('class', `dot delay_${delayType}`)

        realTimeIcon.appendChild(realTimeDot)
        realTimeIcon.innerText = arrivalTime

        let delayDisplay = document.createElement('div')
        delayDisplay.setAttribute('class', 'delayTime')

        if (delayTime > 3) {
          delayDisplay.innerText = delayTime + " min atrasado"
        }

        arrivingTime.appendChild(realTimeIcon)
        arrivingTime.appendChild(delayDisplay)
      } else {
        let time = document.createElement('div')
        time.setAttribute('class', 'time')
        time.innerHTML = arrivalTime

        arrivingTime.appendChild(time)
      }

      newArrival.appendChild(arrivalNumber)
      newArrival.appendChild(arrivalName)
      newArrival.appendChild(arrivingTime)

      return newArrival
    }

    // Clear the past container and append the last 3 concluded trips
    pastContainer.innerHTML = ''
    pastTrips.slice(-3).forEach(tripData => {
      pastContainer.appendChild(createTripElement(tripData))  // Append last 3 past trips
    })

    // Clear the future container and append real-time first, then scheduled trips
    futureContainer.innerHTML = ''
    realTimeTrips.forEach(tripData => {
      futureContainer.appendChild(createTripElement(tripData))  // Append real-time trips first
    })
    scheduledTrips.forEach(tripData => {
      futureContainer.appendChild(createTripElement(tripData))  // Append scheduled trips after
    })

    setInterval(currentTimeMarker, 500)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as passagens desta paragem")
  }
}


// Current Time Marker
function currentTimeMarker() {
  let date = new Date()
  let currentTime = date.getHours().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + date.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2})
  document.getElementById('currentTimeMarker_text').innerText = currentTime
}