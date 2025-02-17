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

  loadArrivals()
}

// Current Time Marker
function currentTimeMarker() {
  let date = new Date()
  let currentTime = date.getHours().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + date.getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2})
  document.getElementById('currentTimeMarker_text').innerText = currentTime
}
// Intervals
let updateInterval, currentTimeInterval
// Load Arrivals for the stop
let realTime_trips = [], scheduled_trips = [], future_trips = [], past_trips = [], tripsToBeUpdated = []
async function loadArrivals(fullList) {
  document.getElementById('fullPastTrips').style.display = "block"
  var pastTrips_container = document.getElementById('pastTrips')
  var futureTrips_container = document.getElementById('futureTrips')
  let concluded_arrivals = [], realTime_arrivals = [], scheduled_arrivals = []
  realTime_trips = [], scheduled_trips = [], future_trips = [], past_trips = [], tripsToBeUpdated = []
  let color, arrivingTime, delayTime, delayType, delayText

  const currentUNIX = Math.floor(Date.now() / 1000);
  try {
    let arrivals_data = await getAPI(`stops/${stopId}/realtime`)
    arrivals_data.forEach(arrival => {
      if (linesFiltered.length > 0 && !linesFiltered.includes(Number(arrival.line_id))) {
        return
      }
      let colorIndex = linesData.findIndex(line => line.line_ID === arrival.line_id)
      color = linesData[colorIndex].line_color

      // Concluded arrivals
      if (arrival.observed_arrival_unix !== null || (arrival.scheduled_arrival_unix < currentUNIX && arrival.estimated_arrival_unix < currentUNIX)) {
        if (arrival.observed_arrival_unix !== null) {
          arrivingTime = arrival.observed_arrival
        } else {
          arrivingTime = arrival.scheduled_arrival
        }

        let newArrival = {
          "color": color,
          "tripID": arrival.trip_id,
          "lineID": arrival.line_id,
          "lineName": arrival.headsign,
          "time": arrivingTime.substring(0, 5),
          "type": "concluded",
          "delayType": null,
          "delayTime": ""
        }

        concluded_arrivals.push(newArrival)
      }
      // Real Time arrivals - Already running
      else if (arrival.observed_arrival_unix === null && arrival.estimated_arrival_unix !== null && arrival.estimated_arrival_unix > currentUNIX) {
        if (Math.floor((arrival.estimated_arrival_unix - currentUNIX) / 60) < 1) {
          arrivingTime = "A Chegar"
        } else {
          arrivingTime = Math.floor((arrival.estimated_arrival_unix - currentUNIX) / 60) + " min"
        }
        delayTime = Math.floor((arrival.estimated_arrival_unix - arrival.scheduled_arrival_unix) / 60)

        if (delayTime < 5) {
          delayType = 0
        } else if (delayTime < 10) {
          delayType = 1
        } else {
          delayType = 2
        }

        let newArrival = {
          "color": color,
          "tripID": arrival.trip_id,
          "lineID": arrival.line_id,
          "lineName": arrival.headsign,
          "time": arrivingTime,
          "type": "realTime",
          "delayType": delayType || 0,
          "delayTime": delayTime
        }

        realTime_arrivals.push(newArrival)
        realTime_trips.push(newArrival)
        tripsToBeUpdated.push(arrival.trip_id)
      }
      // Scheduled Arrivals / Real Time unavailable
      else {
        arrivingTime = arrival.scheduled_arrival
        let newArrival = {
          "color": color,
          "tripID": arrival.trip_id,
          "lineID": arrival.line_id,
          "lineName": arrival.headsign,
          "time": arrivingTime.substring(0, 5),
          "type": "scheduled",
          "delayType": null,
          "delayTime": ""
        }

        scheduled_arrivals.push(newArrival)
        scheduled_trips.push(newArrival)
        tripsToBeUpdated.push(arrival.trip_id)
      }
    })
    while (pastTrips_container.firstChild) {
      pastTrips_container.removeChild(pastTrips_container.firstChild);
    }
    while (futureTrips_container.firstChild) {
      futureTrips_container.removeChild(futureTrips_container.firstChild);
    }
    
    // Sort arrivals (Concluded > Real Time > Scheduled)
    concluded_arrivals.sort((a, b) => {
      const timeStringA = a.time.split(':').join('');
      const timeStringB = b.time.split(':').join('');
      return timeStringA - timeStringB;
    });
    realTime_arrivals.sort((a, b) => {
      const getMinutes = (time) => {
        if (time === "A Chegar") return -1 // Prioritize "A Chegar" at the top
        if (time.includes("min")) return parseInt(time) // Extracts the number from "X min"
        
        let [hours, minutes] = time.split(":").map(Number) // Handles normal HH:MM format
        return hours * 60 + minutes
      }
      
      return getMinutes(a.time) - getMinutes(b.time)
    })
    scheduled_arrivals.sort((a, b) => {
      const timeStringA = a.time.split(':').join('');
      const timeStringB = b.time.split(':').join('');
      return timeStringA - timeStringB;
    });
    // Create the final trips list - 3 Previous Trips + Real Time + Scheduled
    future_trips.push(...realTime_arrivals, ...scheduled_arrivals)
    // If the user wants to see the full previous trips list
    if (fullList) {
      past_trips.push(...concluded_arrivals)
      document.getElementById('fullPastTrips').innerText = "Esconder as viagens passadas"
      document.getElementById('fullPastTrips').setAttribute('onclick', 'loadArrivals()')
    } else {
      let startIndex = Math.max(0, concluded_arrivals.length - 3) // Ensure it doesn't go negative
      past_trips.push(...concluded_arrivals.slice(startIndex))
      document.getElementById('fullPastTrips').innerText = "Ver viagens passadas"
      document.getElementById('fullPastTrips').setAttribute('onclick', 'loadArrivals(true)')
    }
    past_trips.forEach(trip => {
      let newArrival = document.createElement('div')
      newArrival.setAttribute('class', `arrivalTime ${trip.type}`)
      newArrival.setAttribute('id', 'trip_' + trip.tripID)

      let arrivalNumber = document.createElement('div')
      arrivalNumber.setAttribute('class', 'lineNumber')
      arrivalNumber.innerText = trip.lineID
      arrivalNumber.style.backgroundColor = trip.color

      let arrivalName = document.createElement('div')
      arrivalName.setAttribute('class', 'lineName')
      arrivalName.innerText = trip.lineName

      let arrivingTime = document.createElement('div')
      arrivingTime.setAttribute('class', 'arrivingTime')

      if (trip.type === "realTime") {
        let realTimeIcon = document.createElement('div')
        realTimeIcon.setAttribute('class', `realTimeIcon delay_${trip.delayType}`)

        let realTimeDot = document.createElement('div')
        realTimeDot.setAttribute('class', `dot delay_${trip.delayType}`)

        realTimeIcon.appendChild(realTimeDot)

        let arrivalTimeDiv = document.createElement('div')
        arrivalTimeDiv.setAttribute('class', 'arrivalTimeText')
        arrivalTimeDiv.innerText = trip.time
        realTimeIcon.appendChild(arrivalTimeDiv)

        let delayDisplay = document.createElement('div')
        delayDisplay.setAttribute('class', 'delayTime')

        if (trip.delayTime > 3) {
          delayDisplay.innerText = trip.delayTime + " min atrasado"
        }

        arrivingTime.appendChild(realTimeIcon)
        arrivingTime.appendChild(delayDisplay)
      } else {
        let time = document.createElement('div')
        time.setAttribute('class', 'time')
        time.innerHTML = trip.time

        arrivingTime.appendChild(time)
      }

      newArrival.appendChild(arrivalNumber)
      newArrival.appendChild(arrivalName)
      newArrival.appendChild(arrivingTime)

      pastTrips_container.appendChild(newArrival)
    })
    
    document.getElementById('currentTimeMarker').style.display = "block"

    future_trips.forEach(trip => {
      let newArrival = document.createElement('div')
      newArrival.setAttribute('class', `arrivalTime ${trip.type}`)
      newArrival.setAttribute('id', 'trip_' + trip.tripID)

      let arrivalNumber = document.createElement('div')
      arrivalNumber.setAttribute('class', 'lineNumber')
      arrivalNumber.innerText = trip.lineID
      arrivalNumber.style.backgroundColor = trip.color

      let arrivalName = document.createElement('div')
      arrivalName.setAttribute('class', 'lineName')
      arrivalName.innerText = trip.lineName

      let arrivingTime = document.createElement('div')
      arrivingTime.setAttribute('class', 'arrivingTime')

      if (trip.type === "realTime") {
        let realTimeIcon = document.createElement('div')
        realTimeIcon.setAttribute('class', `realTimeIcon delay_${trip.delayType}`)

        let realTimeDot = document.createElement('div')
        realTimeDot.setAttribute('class', `dot delay_${trip.delayType}`)

        realTimeIcon.appendChild(realTimeDot)

        let arrivalTimeDiv = document.createElement('div')
        arrivalTimeDiv.setAttribute('class', 'arrivalTimeText')
        arrivalTimeDiv.innerText = trip.time
        realTimeIcon.appendChild(arrivalTimeDiv)

        let delayDisplay = document.createElement('div')
        delayDisplay.setAttribute('class', 'delayTime')

        if (trip.delayTime > 3) {
          delayDisplay.innerText = trip.delayTime + " min atrasado"
        }

        arrivingTime.appendChild(realTimeIcon)
        arrivingTime.appendChild(delayDisplay)
      } else {
        let time = document.createElement('div')
        time.setAttribute('class', 'time')
        time.innerHTML = trip.time

        arrivingTime.appendChild(time)
      }

      newArrival.appendChild(arrivalNumber)
      newArrival.appendChild(arrivalName)
      newArrival.appendChild(arrivingTime)

      futureTrips_container.appendChild(newArrival)
    })
    if (future_trips.length === 0 && past_trips.length > 0) {
      // End of Day Text
      var span = document.createElement('span')
      span.setAttribute('id', 'EOD_Text')
      span.innerText = "FIM DE SERVIÇO"
      span.style.marginTop = "2rem"
      futureTrips_container.appendChild(span)
    }
    if (past_trips.length === 0 && future_trips.length > 0) {
      // End of Day Text
      var span = document.createElement('span')
      span.setAttribute('id', 'EOD_Text')
      span.innerText = "INICIO DO DIA"
      span.style.marginTop = "2rem"
      pastTrips_container.appendChild(span)
      document.getElementById('fullPastTrips').style.display = "none"
    }
    if (past_trips.length === 0 && future_trips.length === 0) {
      // End of Day Text
      var span = document.createElement('span')
      span.setAttribute('id', 'EOD_Text')
      span.innerText = "SEM VIAGENS HOJE"
      span.style.marginTop = "2rem"
      futureTrips_container.appendChild(span)
      document.getElementById('currentTimeMarker').style.display = "none"
      document.getElementById('fullPastTrips').style.display = "none"
    }

    if (currentTimeInterval) clearInterval(currentTimeInterval)
      currentTimeInterval = setInterval(() => currentTimeMarker(), 500)
    if (updateInterval) clearInterval(updateInterval)
      updateInterval = setInterval(() => updateArrivals(), 15000)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as passagens desta paragem")
  }
}

async function updateArrivals() {
  console.log(`

      :::::::::: ARRIVALS UPDATED ::::::::::

      Stop ID: ${stopId}
      Time: ${new Date().getHours().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + new Date().getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + new Date().getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2})}
      Trips: ${tripsToBeUpdated.length}
      
  `)
  const currentUNIX = Math.floor(Date.now() / 1000);
  const pastTrips_container = document.getElementById('pastTrips')
  const futureTrips_container = document.getElementById('futureTrips')
  try {
    let arrivals_data = await getAPI(`stops/${stopId}/realtime`)
    arrivals_data.forEach(arrival => {
      const item = document.getElementById('trip_' + arrival.trip_id)
      // Only continue if item exists and its a future trip
      if (!item || (!tripsToBeUpdated.includes(arrival.trip_id) && item.classList.contains('concluded'))) {
        return
      }
      if (arrival.observed_arrival_unix !== null || (arrival.scheduled_arrival_unix < currentUNIX && arrival.estimated_arrival_unix < currentUNIX)) {
        let arrivingTime = item.querySelector('.arrivingTime')
        let delayTime = item.querySelector('.arrivingTime .delayTime')
        let time = document.createElement('div')
        time.setAttribute('class', 'time')
        if (arrival.observed_arrival_unix !== null) {
          time.innerHTML = arrival.observed_arrival.substring(0, 5)
        } else {
          time.innerHTML = arrival.scheduled_arrival.substring(0, 5)
        }
        arrivingTime.innerHTML = ""
        arrivingTime.appendChild(time)
        if (delayTime) {
          delayTime.innerHTML = ""
        }
        let indexPast = tripsToBeUpdated.indexOf(arrival.trip_id)
        if (indexPast !== -1) {
          tripsToBeUpdated.splice(indexPast, 1);
        }
        futureTrips_container.removeChild(item)
        pastTrips_container.appendChild(item)
        pastTrips_container.removeChild(pastTrips_container.firstChild)
        item.setAttribute('class', 'arrivalTime concluded')
      } else if (arrival.observed_arrival_unix === null && arrival.estimated_arrival_unix !== null) {
        let arrivingTime = item.querySelector('.arrivingTime')
        let existingRealTimeIcon = arrivingTime.querySelector('.realTimeIcon')
        
        if (!existingRealTimeIcon) {
          arrivingTime.innerHTML = ""
        }
        let passageTime, delayTime, delayType
        if (Math.floor((arrival.estimated_arrival_unix - currentUNIX) / 60) < 1) {
          passageTime = "A Chegar"
        } else {
          passageTime = Math.floor((arrival.estimated_arrival_unix - currentUNIX) / 60) + " min"
        }
        delayTime = Math.floor((arrival.estimated_arrival_unix - arrival.scheduled_arrival_unix) / 60)
        if (delayTime < 5) {
          delayType = 0
        } else if (delayTime < 10) {
          delayType = 1
        } else {
          delayType = 2
        }
        let arrivalTimeDiv, delayDisplay
        
        if (existingRealTimeIcon) {
          // Update existing elements
          arrivalTimeDiv = existingRealTimeIcon.querySelector('.arrivalTimeText')
          delayDisplay = arrivingTime.querySelector('.delayTime')
        } else {
          // Clear only if there's no realTimeIcon to avoid duplicates
          arrivingTime.innerHTML = ""
        
          // Create new elements
          existingRealTimeIcon = document.createElement('div')
          existingRealTimeIcon.setAttribute('class', `realTimeIcon delay_${delayType}`)
        
          let realTimeDot = document.createElement('div')
          realTimeDot.setAttribute('class', `dot delay_${delayType}`)
          existingRealTimeIcon.appendChild(realTimeDot)
        
          arrivalTimeDiv = document.createElement('div')
          arrivalTimeDiv.setAttribute('class', 'arrivalTimeText')
          existingRealTimeIcon.appendChild(arrivalTimeDiv)
        
          delayDisplay = document.createElement('div')
          delayDisplay.setAttribute('class', 'delayTime')
        
          arrivingTime.appendChild(existingRealTimeIcon)
          arrivingTime.appendChild(delayDisplay)
        }
        
        // Update values
        arrivalTimeDiv.innerText = passageTime
        delayDisplay.innerText = delayTime > 3 ? `${delayTime} min atrasado` : ""
        item.setAttribute('class', 'arrivalTime realTime')
      } else {
        let arrivingTime = item.querySelector('.arrivingTime .time')
        if (arrivingTime) {
          arrivingTime.innerHTML = arrival.scheduled_arrival.substring(0, 5)
        }
        item.setAttribute('class', 'arrivalTime scheduled')
      }
    })
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao atualizar as passagens desta paragem")
  }
}