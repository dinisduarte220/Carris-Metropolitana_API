// Extract the current line_id from URL
const pathParts = window.location.pathname.split('/')
const stopId = pathParts[2]
let linesFiltered = []

// Picture in Picture Element
let pipWindow = null

// DEBUG Mode
let debugMode = false

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
    // If Stop exists continue. If not, return to stops page
    if (data && Object.keys(data).length > 0) {
      await loadAllStops()
      stopInformationDisplay()
      addStopToRecents()
    } else {
      window.location.href = '/stops'
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
let updateInterval, currentTimeInterval, vehiclesUpdateInterval
// Load Arrivals for the stop
let realTime_trips = [], scheduled_trips = [], future_trips = [], past_trips = [], tripsToBeUpdated = [], vehiclesToBeUpdated = []
let fullArrivalsList = false
let pastTripsToShow = 1
async function loadArrivals(fullList) {
  document.getElementById('fullPastTrips').style.display = "block"
  var pastTrips_container = document.getElementById('pastTrips')
  var futureTrips_container = document.getElementById('futureTrips')
  let concluded_arrivals = [], realTime_arrivals = [], scheduled_arrivals = []
  realTime_trips = [], scheduled_trips = [], future_trips = [], past_trips = [], tripsToBeUpdated = []
  let color, arrivingTime, delayTime, delayType, delayText

  const currentUNIX = Math.floor(Date.now() / 1000);
    try {
      const stop_data = await getAPI("stops/" + stopId)
    if (map.getLayer("pointsbus")) {
      map.removeLayer("pointsbus")
      map.removeSource("pointsbus")
    }
    if (map.hasImage("bus-icon")) {
      map.removeImage("bus-icon")
    }  
    if (map.getLayer("lineString")) {
      map.removeLayer("lineString")
      map.removeSource("lineString")
    }
    setSelectedStop(stop_data.lon, stop_data.lat, stopId)
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
          let timeParts = arrival.observed_arrival.split(":")
          let hours = parseInt(timeParts[0])
          let minutes = timeParts[1]
          if (hours >= 24) {
            hours -= 24
          }
          arrivingTime = `${hours.toString().padStart(2, "0")}:${minutes}`
        } else {
          let timeParts = arrival.scheduled_arrival.split(":")
          let hours = parseInt(timeParts[0])
          let minutes = timeParts[1]
          if (hours >= 24) {
            hours -= 24
          }
          arrivingTime = `${hours.toString().padStart(2, "0")}:${minutes}`
        }

        let newArrival = {
          "color": color,
          "tripID": arrival.trip_id,
          "vehicleID": arrival.vehicle_id,
          "patternID": arrival.pattern_id,
          "lineID": arrival.line_id,
          "lineName": arrival.headsign,
          "time": arrivingTime,
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
          "vehicleID": arrival.vehicle_id,
          "patternID": arrival.pattern_id,
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
        vehiclesToBeUpdated.push(arrival.vehicle_id)
      }
      // Scheduled Arrivals / Real Time unavailable
      else {
        let timeParts = arrival.scheduled_arrival.split(":")
        let hours = parseInt(timeParts[0])
        let minutes = timeParts[1]
        if (hours >= 24) {
          hours = hours - 24
        }
        arrivingTime = `${hours.toString().padStart(2, "0")}:${minutes}`
        let newArrival = {
          "color": color,
          "tripID": arrival.trip_id,
          "vehicleID": arrival.vehicle_id,
          "patternID": arrival.pattern_id,
          "lineID": arrival.line_id,
          "lineName": arrival.headsign,
          "time": arrivingTime,
          "type": "scheduled",
          "delayType": null,
          "delayTime": ""
        }

        scheduled_arrivals.push(newArrival)
        scheduled_trips.push(newArrival)
        tripsToBeUpdated.push(arrival.trip_id)
        vehiclesToBeUpdated.push(arrival.vehicle_id)
      }
    })
    while (pastTrips_container.firstChild) {
      pastTrips_container.removeChild(pastTrips_container.firstChild);
    }
    while (futureTrips_container.firstChild) {
      futureTrips_container.removeChild(futureTrips_container.firstChild);
    }
    
    // Sort arrivals (Concluded > Real Time > Scheduled)
    const getSortableMinutes = (time) => {
      if (time === "A Chegar") return -1 // Prioritize "A Chegar" at the top
      if (time.includes("min")) return parseInt(time) // Extracts the number from "X min"
    
      let [hours, minutes] = time.split(":").map(Number)
    
      // If the time is between 00 and 04 am, its still on the current day
      if (hours < 4) {
        hours += 24
      }
    
      return hours * 60 + minutes
    }
    
    concluded_arrivals.sort((a, b) => getSortableMinutes(a.time) - getSortableMinutes(b.time))
    realTime_arrivals.sort((a, b) => getSortableMinutes(a.time) - getSortableMinutes(b.time))
    scheduled_arrivals.sort((a, b) => getSortableMinutes(a.time) - getSortableMinutes(b.time))
    // Create the final trips list - 3 Previous Trips + Real Time + Scheduled
    future_trips.push(...realTime_arrivals, ...scheduled_arrivals)
    // If the user wants to see the full previous trips list
    if (fullList) {
      fullArrivalsList = true
      past_trips.push(...concluded_arrivals)
      document.getElementById('fullPastTrips').innerText = "Esconder as viagens passadas"
      document.getElementById('fullPastTrips').setAttribute('onclick', 'loadArrivals()')
    } else {
      fullArrivalsList = false
      let startIndex = Math.max(0, concluded_arrivals.length - pastTripsToShow) // Use the variable here
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

      let arrivalInfo = document.createElement('div')
      arrivalInfo.setAttribute('class', 'arrivalInfo')
      arrivalInfo.appendChild(arrivalNumber)
      arrivalInfo.appendChild(arrivalName)
      arrivalInfo.appendChild(arrivingTime)

      newArrival.appendChild(arrivalInfo)

      pastTrips_container.appendChild(newArrival)
    })
    
    document.getElementById('currentTimeMarker').style.display = "block"

    future_trips.forEach(trip => {
      let newArrival = document.createElement('div')
      newArrival.setAttribute('class', `arrivalTime ${trip.type}`)
      newArrival.setAttribute('id', 'trip_' + trip.tripID)
      newArrival.onclick = () => {
        selectTrip(trip.tripID, trip.patternID, trip.color, trip.vehicleID)
      }

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
      let arrivalInfo = document.createElement('div')
      arrivalInfo.setAttribute('class', 'arrivalInfo')
      arrivalInfo.appendChild(arrivalNumber)
      arrivalInfo.appendChild(arrivalName)
      arrivalInfo.appendChild(arrivingTime)

      newArrival.appendChild(arrivalInfo)

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

let notifiedBuses = new Set()
async function updateArrivals() {
  if (debugMode) {
    console.log(`

      :::::::::: ARRIVALS UPDATED ::::::::::

      Stop ID: ${stopId}
      Time: ${new Date().getHours().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + new Date().getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + new Date().getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2})}
      Trips: ${tripsToBeUpdated.length}
      
    `)
  }
  const currentUNIX = Math.floor(Date.now() / 1000);
  const pastTrips_container = document.getElementById('pastTrips')
  const futureTrips_container = document.getElementById('futureTrips')
  try {
    const stop_data = await getAPI("stops/" + stopId)
    let arrivals_data = await getAPI(`stops/${stopId}/realtime`)
    arrivals_data.forEach(arrival => {
      const item = document.getElementById('trip_' + arrival.trip_id)
      // Only continue if item exists and its a future trip
      if (!item || (!tripsToBeUpdated.includes(arrival.trip_id) && item.classList.contains('concluded'))) {
        return
      }
      if (arrival.observed_arrival_unix !== null || (arrival.estimated_arrival_unix !== null && arrival.estimated_arrival_unix < currentUNIX && arrival.scheduled_arrival_unix < currentUNIX)) {
        let arrivingTime = item.querySelector('.arrivingTime')
        let delayTime = item.querySelector('.arrivingTime .delayTime')
        let time = document.createElement('div')
        time.setAttribute('class', 'time')
        if (arrival.observed_arrival_unix !== null) {
          let timeParts = arrival.observed_arrival.split(":")
          let hours = parseInt(timeParts[0])
          let minutes = timeParts[1]
          if (hours >= 24) {
            hours -= 24
          }
          time.innerHTML = `${hours.toString().padStart(2, "0")}:${minutes}`
        } else {
          let timeParts = arrival.scheduled_arrival.split(":")
          let hours = parseInt(timeParts[0])
          let minutes = timeParts[1]
          if (hours >= 24) {
            hours -= 24
          }
          time.innerHTML = `${hours.toString().padStart(2, "0")}:${minutes}`
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
        if (fullArrivalsList === false) {
          pastTrips_container.removeChild(pastTrips_container.firstChild)
        }
        if (item.classList.contains('active')) {
          if (map.getLayer("pointsbus")) {
            map.removeLayer("pointsbus")
            map.removeSource("pointsbus")
          }
          if (map.hasImage("bus-icon")) {
            map.removeImage("bus-icon")
          }  
          if (map.getLayer("lineString")) {
            map.removeLayer("lineString")
            map.removeSource("lineString")
          }
        }
        if (item.classList.contains('active')) {
          setSelectedStop(stop_data.lon, stop_data.lat, stop_data.id)
        }
        item.setAttribute('class', 'arrivalTime concluded')
        item.setAttribute('onclick', '')
        let allExtraInfo = item.querySelectorAll('.extraInfo');
        allExtraInfo.forEach(item => {
          item.remove();
        });
      } else if (arrival.observed_arrival_unix === null && arrival.estimated_arrival_unix !== null && arrival.estimated_arrival_unix > currentUNIX) {
        let arrivingTime = item.querySelector('.arrivingTime')
        let existingRealTimeIcon = arrivingTime.querySelector('.realTimeIcon')
        
        if (!existingRealTimeIcon) {
          arrivingTime.innerHTML = ""
        }
        let passageTime, delayTime, delayType
        if (Math.floor((arrival.estimated_arrival_unix - currentUNIX) / 60) < 1) {
          passageTime = "A Chegar"
          // If there is an active trip (User selected) only show notifications for that trip. Otherwise show for all the incoming arrivals
          let activeTrip = document.querySelectorAll('.arrivalTime.active')
          let activeTripId = activeTrip.length > 0 ? activeTrip[0].getAttribute('id')?.replace('trip_', '') : null
          if (
            (activeTrip.length === 0) ||
            (activeTripId && arrival.trip_id === activeTripId)
          ) {
            if ('Notification' in window && Notification.permission === 'granted' && receiveNotifications === true) {
              // Trigger notification only once
              if (!notifiedBuses.has(arrival.trip_id)) {
                notifiedBuses.add(arrival.trip_id)
                new Notification(`🚍 ${arrival.line_id} - ${arrival.headsign}`, {
                  body: `O autocarro está perto de ${stop_data.name} !`
                })
              }
            } else if (Notification.permission !== 'denied' && receiveNotifications === true) {
              Notification.requestPermission().then(permission => {
                if (permission === 'granted' && !notifiedBuses.has(arrival.trip_id)) {
                  notifiedBuses.add(arrival.trip_id)
                  new Notification(`🚍 ${arrival.line_id} - ${arrival.headsign}`, {
                    body: `O autocarro está perto de ${stop_data.name} !`
                  })
                }
              })
            }
          }
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
        let color = window.getComputedStyle(item.querySelector('.lineNumber')).backgroundColor
        item.onclick = () => {
          selectTrip(arrival.trip_id, arrival.pattern_id, color, arrival.vehicle_id)
        }
        if (item.classList.contains('active')) {
          item.setAttribute('class', 'arrivalTime realTime active')
        } else {
          item.setAttribute('class', 'arrivalTime realTime')
        }
        let newEstimateTime = item.querySelector('.newEstimateTime')
        if (newEstimateTime) {
          if (arrival.estimated_arrival !== null) {
            let timeParts = arrival.estimated_arrival.split(":")
            let hours = parseInt(timeParts[0])
            if (hours >= 24) {
              hours -= 24
            }
            let formattedHours = String(hours).padStart(2, '0')
            
            newEstimateTime.innerText = "Chegada Estimada: " + formattedHours + arrival.estimated_arrival.substring(2, 8)
          } else {
            newEstimateTime.innerText = "Chegada Estimada: " + arrival.estimated_arrival
          }
        }
      } else {
        let arrivingTime = item.querySelector('.arrivingTime .time')
        if (arrivingTime) {
          let timeParts = arrival.scheduled_arrival.split(":")
          let hours = parseInt(timeParts[0])
          let minutes = timeParts[1]
          if (hours >= 24) {
            hours = hours - 24
          }
          arrivingTime.innerHTML = `${hours.toString().padStart(2, "0")}:${minutes}`
        }
        let color = window.getComputedStyle(item.querySelector('.lineNumber')).backgroundColor
        item.onclick = () => {
          selectTrip(arrival.trip_id, arrival.pattern_id, color, arrival.vehicle_id)
        }
        if (item.classList.contains('active')) {
          item.setAttribute('class', 'arrivalTime scheduled active')
        } else {
          item.setAttribute('class', 'arrivalTime scheduled')
        }
      }
    })

    // Sort the future trips container
    const futureTrips = Array.from(futureTrips_container.children)

    futureTrips.forEach(trip => {
      const time = trip.querySelector('.arrivalTimeText')?.innerText || trip.querySelector('.time')?.innerText
      
      const getTimeInMinutes = (time) => {
        if (time === "A Chegar") return -1 // Highest priority
        if (time.includes("min")) return parseInt(time) // Extract number
        const [hours, minutes] = time.split(":").map(Number)
        // Treat times between 00:00 and 04:00 as being after 24:00
        const adjustedHours = (hours < 4) ? hours + 24 : hours
        return adjustedHours * 60 + minutes
      }
    
      const type = trip.classList.contains('realTime') ? 1 : 2
      const timeValue = getTimeInMinutes(time)
    
      // Set CSS order based on type & time
      trip.style.order = `${type}${String(timeValue).padStart(4, '0')}`
    })
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao atualizar as passagens desta paragem")
  }
}

let lineStringGeojson
async function selectTrip(trip_id, pattern_id, color, vehicle_id) {
  try {
    const activePatternDisplay = document.getElementById('activePatternText')

    if (debugMode) {
      console.log(`Trip ID: ${trip_id}\nVehicle ID: ${vehicle_id}\nPattern ID: ${pattern_id}`)
    }
    let allExtraInfo = document.querySelectorAll('.extraInfo');
    allExtraInfo.forEach(item => {
      item.remove(); // Remove only the .extraInfo element, not the tripDiv
    });
    // Change the trip status to active (If is already active, remove it)
    const tripDiv = document.getElementById(`trip_${trip_id}`)
    if (tripDiv.classList.contains('active')) {
      tripDiv.classList.remove('active')
      if (map.getLayer("lineString")) {
        map.removeLayer("lineString")
        map.removeSource("lineString")
      }
      if (map.getLayer("pointsbus")) {
        map.removeLayer("pointsbus")
        map.removeSource("pointsbus")
      }
      if (map.hasImage("bus-icon")) {
        map.removeImage("bus-icon")
      }
      const stop_data = await getAPI("stops/" + stopId)
      setSelectedStop(stop_data.lon, stop_data.lat, stop_data.id)
    } else {
      const activeTrip = document.querySelectorAll('.arrivalTime.active')
      activeTrip.forEach(trip => {
        trip.classList.remove('active')
      })
      const pattern_data = await getAPI(`patterns/${pattern_id}`)
      let shape_id = pattern_data.shape_id
      const shape_data = await getAPI(`shapes/${shape_id}`)
      const lineCoords = shape_data.geojson.geometry.coordinates
  
      if (map.getLayer("lineString")) {
        map.removeLayer("lineString")
        map.removeSource("lineString")
      }
  
      lineStringGeojson = {
        type: "FeatureCollection",
        features: [{
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: lineCoords
          }
        }]
      }
  
      map.addSource("lineString", {
        type: "geojson",
        data: lineStringGeojson
      })
  
      map.addLayer({
        id: "lineString",
        type: "line",
        source: "lineString",
        layout: {
          "line-cap": "round",
          "line-join": "round"
        },
        paint: {
          "line-color": color,
          "line-width": 4
        }
      })
      let vehicle_data = await getAPI("vehicles")
      vehicle_data = vehicle_data.find(vehicle => vehicle.id === vehicle_id)
      if (!vehicle_id || vehicle_id === null || !vehicle_data) {
        const allCoordinates = lineStringGeojson.features[0].geometry.coordinates
  
        const bounds = new maplibregl.LngLatBounds()
        allCoordinates.forEach((coord) => bounds.extend(coord))
  
        map.fitBounds(bounds, { padding: 50, animate: true })
        if (map.hasImage("bus-icon")) {
          map.removeImage("bus-icon")
        }
      } else {

        if (!vehicle_data) {
          snackbar("fa-solid fa-triangle-exclamation", "Veículo não encontrado")
          return
        }

        if (map.getLayer("pointsbus")) {
          map.removeLayer("pointsbus")
          map.removeSource("pointsbus")
        }

        const busCoords = [vehicle_data.lon, vehicle_data.lat]
        const stop_data = await getAPI("stops/" + stopId)
        const stopCoords = [stop_data.lon, stop_data.lat]

        const geoJsonPoints = {
          type: "FeatureCollection",
          features: [{
            type: "Feature",
            properties: {
              name: vehicle_data.id,
              className: "iconBus",
              bearing: vehicle_data.bearing,
              timeStamp: vehicle_data.timestamp,
              description: `Line: <b>${vehicle_data.line_id}</b><br>
              Route: <b>${vehicle_data.route_id}</b><br>
              Pattern: <b>${vehicle_data.pattern_id}</b><br>
              State: <b>${vehicle_data.current_status}</b><br>
              Stop: <b>${vehicle_data.stop_id}</b><br>
              Vehicle ID: <b>${vehicle_data.id}</b>`
            },
            geometry: { type: "Point", coordinates: busCoords }
          }]
        }

        map.addSource("pointsbus", { type: "geojson", data: geoJsonPoints })

        if (map.hasImage("bus-icon")) {
          map.removeImage("bus-icon")
        }

        const image = await map.loadImage("../../../IMG/busIcon.png")
        map.addImage("bus-icon", image.data)

        map.addLayer({
          id: "pointsbus",
          type: "symbol",
          source: "pointsbus",
          layout: {
            "icon-image": "bus-icon",
            "icon-size": ["interpolate", ["linear", 0.5], ["zoom"], 10, 0.05, 20, 0.15],
            "icon-allow-overlap": true,
            "icon-offset": [0, -15],
            "icon-rotate": ["get", "bearing"]
          }
        })

        const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: false, className: "popupBus" })
        map.on('mouseenter', 'pointsbus', (e) => {
          map.getCanvas().style.cursor = 'pointer'
          const coordinates = e.features[0].geometry.coordinates.slice()
          const description = e.features[0].properties.description
          while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
          }
          popup.setLngLat(coordinates).setHTML(description).addTo(map)
        })
        map.on('mouseleave', 'pointsbus', () => {
          map.getCanvas().style.cursor = 'default'
          popup.remove()
        })

        // Adjusting zoom to fit both bus and selected stop
        const bounds = new maplibregl.LngLatBounds()
        bounds.extend(busCoords)
        bounds.extend(stopCoords)
        map.fitBounds(bounds, { padding: 65, animate: true, maxZoom: 17 })

        if (vehiclesUpdateInterval) clearInterval(vehiclesUpdateInterval)
          vehiclesUpdateInterval = setInterval(() => updateVehicle(vehicle_id), 15000)
      }
      tripDiv.classList.add('active')
      map.moveLayer("points")
      if (map.getLayer("pointsbus")) {
        map.moveLayer("pointsbus")
      }

    // Show the estimated Time (HH:MM), Scheduled Time (HH:MM) and Next Arrival for this line
    const realtime_data = await getAPI(`/stops/${stopId}/realtime`)
    let thisArrival = realtime_data.find(item => item.trip_id === trip_id);
    let nextArrival

    if (thisArrival) {
      // Check if estimated arrival exists
      if (thisArrival.estimated_arrival_unix !== null) {
        const thisArrivalTime = thisArrival.estimated_arrival_unix;
    
        nextArrival = realtime_data
          .filter(item => item.line_id === thisArrival.line_id && item.trip_id !== thisArrival.trip_id &&
                          (item.estimated_arrival_unix > thisArrivalTime || item.scheduled_arrival_unix > thisArrivalTime))
          .sort((a, b) => {
            // First compare estimated arrival times
            const aArrivalTime = a.estimated_arrival_unix !== null ? a.estimated_arrival_unix : a.scheduled_arrival_unix;
            const bArrivalTime = b.estimated_arrival_unix !== null ? b.estimated_arrival_unix : b.scheduled_arrival_unix;
    
            return aArrivalTime - bArrivalTime; // Sort by earliest arrival
          })[0];
      } else {
        const thisArrivalTime = thisArrival.scheduled_arrival_unix;
    
        nextArrival = realtime_data
          .filter(item => item.line_id === thisArrival.line_id && 
                          item.scheduled_arrival_unix > thisArrivalTime)
          .sort((a, b) => a.scheduled_arrival_unix - b.scheduled_arrival_unix)[0];
      }
    }

    let extraInfo = document.createElement('div')
    extraInfo.setAttribute('class', 'extraInfo')

    let newEstimateTime = document.createElement('p')
    newEstimateTime.setAttribute('class', 'newEstimateTime')
    
    if (thisArrival.estimated_arrival !== null) {
      let timeParts = thisArrival.estimated_arrival.split(":")
      let hours = parseInt(timeParts[0])
      if (hours >= 24) {
        hours -= 24
      }
      let formattedHours = String(hours).padStart(2, '0')
      
      newEstimateTime.innerText = "Chegada Estimada: " + formattedHours + thisArrival.estimated_arrival.substring(2, 8)
    } else {
      newEstimateTime.innerText = "Chegada Estimada: " + thisArrival.estimated_arrival
    }
    
    let newScheduleTime = document.createElement('p')
    newScheduleTime.setAttribute('class', 'newScheduleTime')
    
    if (thisArrival.scheduled_arrival !== null) {
      let timeParts2 = thisArrival.scheduled_arrival.split(":")
      let hours2 = parseInt(timeParts2[0])
      if (hours2 >= 24) {
        hours2 -= 24
      }
      let formattedHours2 = String(hours2).padStart(2, '0')
      
      newScheduleTime.innerText = "Chegada Agendada: " + formattedHours2 + thisArrival.scheduled_arrival.substring(2, 8)
    } else {
      newScheduleTime.innerText = "Chegada Agendada: " + thisArrival.scheduled_arrival
    }


    let routeDetails = document.createElement('a')
    routeDetails.setAttribute('class', 'routeDetails')
    routeDetails.setAttribute('href', `/lines/${thisArrival.line_id}?pattern=${thisArrival.pattern_id}&active_stop=${stopId}`)
    routeDetails.setAttribute('onclick', `event.stopPropagation()`)
    routeDetails.setAttribute('target', '_blank')
    routeDetails.innerHTML = 'Ver percurso <i class="fa-solid fa-arrow-up-right-from-square"></i>'

    extraInfo.appendChild(newEstimateTime)
    extraInfo.appendChild(newScheduleTime)
    if (nextArrival) {
      let newNextArrival = document.createElement('p')
      newNextArrival.setAttribute('class', 'newNextArrival')
      let colorIndex = linesData.findIndex(line => line.line_ID === nextArrival.line_id)
      arrivalColor = linesData[colorIndex].line_color
      newNextArrival.setAttribute('onclick', `event.stopPropagation(); selectTrip('${nextArrival.trip_id}', '${nextArrival.pattern_id}', '${arrivalColor}', '${nextArrival.vehicle_id ?? ""}')`);
  
      if (nextArrival.estimated_arrival !== null) {
        newNextArrival.innerText = "Próxima passagem: " + nextArrival.estimated_arrival.substring(0, 5)
      } else {
        newNextArrival.innerText = "Próxima passagem: " + nextArrival.scheduled_arrival.substring(0, 5)
      }
      extraInfo.appendChild(newNextArrival)
    }
    extraInfo.appendChild(routeDetails)

    tripDiv.appendChild(extraInfo)
    tripDiv.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    }

  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar a rota ou o veiculo para esta passagem")
  }
}

async function updateVehicle(vehicle_id) {
  try {
    let vehicle_data = await getAPI("vehicles")
    vehicle_data = vehicle_data.find(vehicle => vehicle.id === vehicle_id)

    const busCoords = [vehicle_data.lon, vehicle_data.lat]
    const stop_data = await getAPI("stops/" + stopId)
    const stopCoords = [stop_data.lon, stop_data.lat]

    const source = map.getSource("pointsbus");
    if (source) {
      const data = source._data;
      const coords = [vehicle_data.lon, vehicle_data.lat];
      const feature = data.features.find(f => f.properties.name === vehicle_data.id);
      if (feature) {
        // Update vehicle properties
        feature.geometry.coordinates = coords;
        feature.properties.bearing = vehicle_data.bearing;
        feature.properties.timeStamp = vehicle_data.timestamp;
        feature.properties.description = `Line: <b>${vehicle_data.line_id}</b><br>
          Route: <b>${vehicle_data.route_id}</b><br>
          Pattern: <b>${vehicle_data.pattern_id}</b><br>
          State: <b>${vehicle_data.current_status}</b><br>
          Stop: <b>${vehicle_data.stop_id}</b><br>
          Vehicle ID: <b>${vehicle_data.id}</b>`;
      } else {
        // If the vehicle is not on the map, add it
        data.features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: coords },
          properties: {
            name: vehicle_data.id,
            bearing: vehicle_data.bearing,
            timeStamp: vehicle_data.timestamp,
            description: `Line: <b>${vehicle_data.line_id}</b><br>
              Route: <b>${vehicle_data.route_id}</b><br>
              Pattern: <b>${vehicle_data.pattern_id}</b><br>
              State: <b>${vehicle_data.current_status}</b><br>
              Stop: <b>${vehicle_data.stop_id}</b><br>
              Vehicle ID: <b>${vehicle_data.id}</b>`
          }
        });
      }
      source.setData(data);

      const bounds = new maplibregl.LngLatBounds()
      bounds.extend(busCoords)
      bounds.extend(stopCoords)
      map.fitBounds(bounds, { padding: 65, animate: true, maxZoom: 17 })
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao atualizar os autocarros")
  }
}

async function toggleDebug() {
  debugMode = !debugMode
  snackbar("fa-solid fa-bug", "DEBUG Mode: " + debugMode)
  fetch('/log', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ message: 'DEBUG Mode: ' + debugMode }),
  })
    .then(response => response.text())
    .catch(error => console.error('Error:', error));
}

// Picture in Picture
async function togglePictureInPicture() {
  let pipIcon = document.getElementById('pipIcon')
  // Close PIP if it exists
  if (pipWindow) {
    pipWindow.close()
    pipWindow = null
    pipIcon.className = "fa-regular fa-clone"
    return
  }

  pipIcon.className = "fa-solid fa-clone"
  let pipOptions = {
    width: 450,
    height: 230
  }
  pipWindow = await documentPictureInPicture.requestWindow(pipOptions)
  let style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = "style.css"
  pipWindow.document.head.append(style);
  let style2 = document.createElement("link");
  style2.rel = "stylesheet";
  style2.href = "../../../style.css"
  pipWindow.document.head.append(style2);

  pipWindow.addEventListener("pagehide", () => {
    pipWindow = null
    pipIcon.className = "fa-regular fa-clone"
  })

  let pipContainer = document.createElement('div')
  pipContainer.setAttribute('class', 'pipContainer')
  pipContainer.style.display = 'flex'
  pipContainer.style.flexDirection = 'column'
  pipContainer.style.alignItems = 'center'
  pipContainer.style.justifyContent = 'center'
  pipContainer.style.height = '100%'

  let arrivingTimes = document.createElement('h3')
  arrivingTimes.setAttribute('class', 'pipTitle')
  arrivingTimes.innerText = "Próximas chegadas"

  let arrivalContainer = document.createElement('div')
  arrivalContainer.setAttribute('class', 'pipStopsContainer')
  arrivalContainer.setAttribute('id', 'pip_arrivals')

  pipContainer.appendChild(arrivingTimes)
  pipContainer.appendChild(arrivalContainer)

  pipWindow.document.body.appendChild(pipContainer)

  updatePipArrivals()
  setInterval(updatePipArrivals, 15000)

  // Listen for visibility change to keep updating PiP when the tab is not active
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && pipWindow) {
      updatePipArrivals()
    }
  })
}

function updatePipArrivals() {
  if (!pipWindow) return

  let arrivalContainer = pipWindow.document.getElementById('pip_arrivals')
  if (!arrivalContainer) return

  arrivalContainer.innerHTML = ""

  let arrivals = document.querySelectorAll('.arrivalTime.realTime, .arrivalTime.scheduled')
  arrivals = Array.from(arrivals).slice(0, 3)

  arrivals.forEach(arrival => {
    let pipItem = document.createElement('div')
    pipItem.setAttribute('class', 'pipArrivalTime')
    if (arrival.classList.contains('realTime')) {
      pipItem.classList.add('realTime')
    }

    let lineNumber = document.createElement('div')
    lineNumber.setAttribute('class', 'lineNumber')
    lineNumber.innerText = arrival.querySelector('.lineNumber')?.innerText || ''
    lineNumber.style.backgroundColor = window.getComputedStyle(arrival.querySelector('.lineNumber')).backgroundColor

    let lineName = document.createElement('div')
    lineName.setAttribute('class', 'lineName')
    lineName.innerText = arrival.querySelector('.lineName')?.innerText || ''

    let arrivingTime = document.createElement('div')
    arrivingTime.setAttribute('class', 'arrivingTime')
    arrivingTime.innerText = arrival.querySelector('.arrivalTimeText')?.innerText || arrival.querySelector('.time')?.innerText || '' // Only get the time, excluding delay

    if (arrival.classList.contains('realTime')) {
      let realTimeIcon = document.createElement('div')
      realTimeIcon.setAttribute('class', `realTimeIcon`)

      let realTimeDot = document.createElement('div')
      realTimeDot.setAttribute('class', `dot`)

      realTimeIcon.appendChild(realTimeDot)
      arrivingTime.prepend(realTimeIcon) // Add the icon before the time text
    }

    pipItem.appendChild(lineNumber)
    pipItem.appendChild(lineName)
    pipItem.appendChild(arrivingTime)

    arrivalContainer.appendChild(pipItem)
  })
}
