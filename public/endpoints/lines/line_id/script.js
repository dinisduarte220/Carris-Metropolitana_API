// Extract the current line_id from URL
const pathParts = window.location.pathname.split('/')
const lineId = pathParts[2]

function getQueryParams() {
  const params = new URLSearchParams(window.location.search)
  return {
      pattern: params.get('pattern'),
      active_stop: params.get('active_stop'),
      date: params.get('date')
  }
}

const params = getQueryParams()
console.log(params)
let patternId, stopId // Store the active pattern and stop
let tripId // Store trip ID
let debugMode = false

// Picture in Picture Element
let pipWindow = null

// Check if the user wants to receive line notifications
let receiveNotifications
fetch('/settings')
  .then(response => response.json())
  .then(settings => {
    receiveNotifications = settings.line_notifications
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


// Store current date in YYYYMMDD format
let date = new Date()
let currentDate = date.toISOString().split("T")[0].replace(/-/g, '') // Date for the pattern selector
let formatedDate = date.toISOString().split("T")[0] // Date for the date selector
document.getElementById("date_input").value = formatedDate

// Check if line is valid
async function checkLine() {
  try {
    const data = await getAPI("lines/" + lineId)
    // If line exists continue. If not, return to lines page
    if (data && Object.keys(data).length > 0) {
      addLineToRecents()
      lineInformationDisplay()
    } else {
      window.location.href = '/lines'
    }
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as informações da linha: " + lineId)
  }
}
checkLine()

// Deactivate / Reactivate notifications
function toggleNotifications() {
  receiveNotifications = !receiveNotifications

  fetch('/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ line_notifications: receiveNotifications })
  })
  .then(response => response.json())
  .then(data => {
    console.log('[SUCCESS]', data.message)
    updateNotificationIcon() // Update icon after saving the new state
  })
  .catch(error => console.error('[ERROR] Failed to update settings:', error))
}
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
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao adicionar esta linha às tuas linhas recentes")
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

    document.title = `${lineId} - ${data.long_name}`

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
let pointFeatures = []
let allStops = []
async function loadStops() {
  stopId = ""
  if (pipWindow) {
    pipWindow.close()
    pipWindow = null
    document.getElementById('pipIcon').className = "fa-regular fa-clone"
  }
  let firstStopSet = false
  let stopsCoords = []
  pointFeatures = []
  if (map.getLayer("points")) {
    map.removeLayer("points")
    if (map.getSource("points")) map.removeSource("points")
  }
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
      allStops.push(stop.stop.id)
      let coords = [stop.stop.lon, stop.stop.lat]
      pointFeatures.push({
        type: "Feature",
        properties: {
          name: stop.stop.name,
          id: stop.stop.id,
          description: `Name: <b>${stop.stop.name}</b><br>
            ID: <b>${stop.stop.id}</b><br>`
        },
        geometry: { type: "Point", coordinates: coords },
      })
      let newStop = document.createElement('div')
      newStop.setAttribute('class', 'newStop')
      newStop.setAttribute('id', 'newStop_' + stop.stop.id)
      newStop.setAttribute('onclick', `selectStop("${stop.stop.id}")`)

      let stopName = document.createElement('p')
      stopName.setAttribute('class', 'stopName')
      stopName.innerText = stop.stop.name

      newStop.appendChild(stopName)

      stopsContainer.appendChild(newStop)
          // Select the first stop, for the schedule to appear
      if (!firstStopSet) {
        firstStopSet = true
        // stopId = stop.stop.id
        // selectStop(stop.stop.id)
      }
    });
    // Make the route load first to avoid stop points to be set below the line
    await loadRoute(data.shape_id, data.color)
    const geoJsonPoints = {
      type: "FeatureCollection",
      features: pointFeatures,
    }
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "popupStop",
    })
    if (debugMode) {
      map.on('mouseenter', 'points', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const coordinates = e.features[0].geometry.coordinates.slice()
        const description = e.features[0].properties.description
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360
        }
        popup.setLngLat(coordinates).setHTML(description).addTo(map)
      })
      map.on('mouseleave', 'points', () => {
        map.getCanvas().style.cursor = 'default'
        popup.remove()
      });
    }
    map.addSource("points", { type: "geojson", data: geoJsonPoints })

    map.addLayer({
      id: "points",
      type: "circle",
      source: "points",
      paint: {
        "circle-radius": 3,
        "circle-color": data.color,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    })
    // Onclick function to select the wanted stop on the list
    map.on('click', 'points', (e) => {
      const stopId = e.features[0].properties.id
      selectStop(stopId)
      // window.location.href = "#newStop_" + stopId
    })

    // Change the cursor to a pointer when hovering over the points
    map.on('mouseenter', 'points', () => {
      map.getCanvas().style.cursor = 'pointer'
    })

    map.on('mouseleave', 'points', () => {
      map.getCanvas().style.cursor = ''
    })
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as paragens desta linha")
  }
}

let updateInterval_stop
async function selectStop(stop_id) {
  try {
    const stopDiv = document.getElementById('newStop_' + stop_id)
    const stopsContainer = document.getElementById('stopsContainer')

    let schedules = [], trips = []

    const dateSelected = document.getElementById('date_input').value
    let changedDate = dateSelected.replace(/-/g, '')
    const data = await getAPI("patterns/" + patternId)
    data.trips.forEach(trip => {
      if (trip.dates.includes(changedDate)) {
        trip.schedule.forEach(scheduleItem => {
          if (scheduleItem.stop_id === stop_id) {
            schedules.push(scheduleItem.arrival_time.substring(0, 5))
            schedules.sort((a, b) => {
              const timeA = parseArrivalTime(a)
              const timeB = parseArrivalTime(b)
              return timeA - timeB
            })
            trips.push(trip.id)
          }
        })
      }
    })

    // Create a new timetable for the selected stop
    let scheduleContainer = document.createElement('div')
    scheduleContainer.setAttribute('class', 'timeTable')

    let texts = document.createElement("ul")
    texts.setAttribute("class", "timeTable_indicators")

    let hoursText = document.createElement("li")
    hoursText.innerText = "Hora"
    texts.appendChild(hoursText)
    let minutesText = document.createElement("li")
    minutesText.innerText = "Min."
    texts.appendChild(minutesText)

    scheduleContainer.appendChild(texts)

    // Create timetable
    let verifiedHours = []
    for (let i = 0; i < schedules.length; i++) {
      let currentTime = schedules[i].substring(0, 2)

      if (!verifiedHours.includes(currentTime)) {
        verifiedHours.push(currentTime)

        let ul = document.createElement("ul")
        ul.setAttribute("class", "timeTable_times")

        let hour = document.createElement("li")
        hour.innerText = currentTime

        ul.appendChild(hour)

        for (let j = 0; j < schedules.length; j++) {
          if (schedules[j].substring(0, 2) === currentTime) {
            let minute = document.createElement("li")
            minute.innerText = schedules[j].substring(3, 5)
            minute.setAttribute('onclick', `markTime("${trips[j]}")`)

            if (trips[j] === tripId) {
              minute.classList.add('marked')
            }

            ul.appendChild(minute)
          }
        }
        scheduleContainer.appendChild(ul)
      }
    }
    // Just show next arrivals if the selected date is for the current day
    let hasArrivals = false
    // Display next arrivals (real time / scheduled)
    let arrivalTimes = document.createElement('div')
    arrivalTimes.setAttribute('class', 'arrivalTimes')
    let arrivalTimes_icon = document.createElement('i')
    arrivalTimes_icon.setAttribute('class', 'fa-regular fa-clock')
    arrivalTimes.appendChild(arrivalTimes_icon)
    if (changedDate === currentDate) {
      let scheduledTimesCounter = 0
      try {
        const realTime_data = await getAPI(`patterns/${patternId}/realtime`)
        const currentUNIX = Math.floor(Date.now() / 1000)

        realTime_data.forEach(realTime => {
          if (realTime.observed_arrival === null && realTime.estimated_arrival !== null && realTime.estimated_arrival_unix > currentUNIX && realTime.stop_id === stop_id) {
            let newRealTime = document.createElement('p')
            newRealTime.setAttribute('class', 'realTime')
            newRealTime.setAttribute('id', "arrivalTime_" + realTime.trip_id)
            let arrivalTime = Math.floor((realTime.estimated_arrival_unix - currentUNIX) / 60)
            if (arrivalTime < 1) {
              newRealTime.innerText = "A chegar"
            } else {
              newRealTime.innerText = arrivalTime + " min"
            }
            arrivalTimes.appendChild(newRealTime)
            hasArrivals = true
          } else if (realTime.observed_arrival === null && realTime.estimated_arrival === null && realTime.scheduled_arrival_unix > currentUNIX && realTime.stop_id === stop_id && scheduledTimesCounter < 3) {
            let newScheduleTime = document.createElement('p')
            newScheduleTime.setAttribute('class', 'scheduleTime')
            newScheduleTime.setAttribute('id', "arrivalTime_" + realTime.trip_id)
            // Handle hours after 24h
            let rawTime = realTime.scheduled_arrival
            let hours = parseInt(rawTime.substring(0, 2)) % 24
            let minutes = rawTime.substring(3, 5)
            let normalizedTime = `${hours.toString().padStart(2, '0')}:${minutes}`
            scheduledTimesCounter++
            newScheduleTime.innerText = normalizedTime
            arrivalTimes.appendChild(newScheduleTime)
            hasArrivals = true
          }
        })
      } catch (error) {
        console.error(error.message)
        snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as próximas passagens nesta paragem")
      }
    }

    if (updateInterval_stop) clearInterval(updateInterval_stop);
        updateInterval_stop = setInterval(() => updateStopArrivals(stop_id), 10000);
    // Remove all existing schedules in the stops container
    const previousSchedules = stopsContainer.querySelectorAll('.newStop .timeTable')
    const previousScheduleTitles = stopsContainer.querySelectorAll('.newStop .scheduleTitle')
    const previousStopDetails = stopsContainer.querySelectorAll('.newStop .stopDetails')
    const previousArrivalTimes = stopsContainer.querySelectorAll('.newStop .arrivalTimes')
    const previousArrivalTimesTitle = stopsContainer.querySelectorAll('.newStop .arrivalTimesTitle')
    previousArrivalTimes.forEach(schedule => schedule.remove())
    previousArrivalTimesTitle.forEach(schedule => schedule.remove())
    previousSchedules.forEach(schedule => schedule.remove())
    previousScheduleTitles.forEach(schedule => schedule.remove())
    previousStopDetails.forEach(schedule => schedule.remove())
    // Add next arrival times
    if (hasArrivals) {
      let arrivalTimesTitle = document.createElement('p')
      arrivalTimesTitle.setAttribute('class', 'arrivalTimesTitle')
      arrivalTimesTitle.innerHTML = 'Próximas passagens:'
      stopDiv.appendChild(arrivalTimesTitle)
      stopDiv.appendChild(arrivalTimes)
    }
    // Add the new schedule
    let scheduleTitle = document.createElement('p')
    scheduleTitle.setAttribute('class', 'scheduleTitle')
    scheduleTitle.innerHTML = "Horário para esta paragem:"
    stopDiv.appendChild(scheduleTitle)
    stopDiv.appendChild(scheduleContainer)

    let stopDetails = document.createElement('a')
    stopDetails.setAttribute('class', 'stopDetails')
    stopDetails.setAttribute('href', '/stops/' + stop_id)
    stopDetails.setAttribute('target', '_blank')
    stopDetails.setAttribute('rel', 'noopener noreferrer')
    stopDetails.innerHTML = 'Ver paragem <i class="fa-solid fa-arrow-up-right-from-square"></i>'
    stopDiv.appendChild(stopDetails)

    const clickedFeature = pointFeatures.find(feature => feature.properties.id === stop_id);
    if (clickedFeature) {
      // Zoom and center to the select stop
      map.flyTo({
          center: clickedFeature.geometry.coordinates,
          zoom: 14,
      })
      // Selected stop styling
      map.setPaintProperty('points', 'circle-color', [
        'case',
        ['==', ['get', 'id'], stop_id],
        'rgb(150, 150, 150)',
        data.color
      ])
      map.setPaintProperty('points', 'circle-opacity', [
          'case',
          ['==', ['get', 'id'], stop_id],
          1,
          1
      ])
      map.setPaintProperty('points', 'circle-stroke-opacity', [
          'case',
          ['==', ['get', 'id'], stop_id],
          1,
          1
      ])
      map.setPaintProperty('points', 'circle-radius', [
          'case',
          ['==', ['get', 'id'], stop_id],
          6,
          3
      ])
    }
    stopDiv.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
    stopId = stop_id
    updatePipArrivals()
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar o horário para esta paragem")
  }
}
// Update Real Times
let notifiedBuses = new Set(); // Set to track notified buses

async function updateStopArrivals(id) {
  const currentUNIX = Math.floor(Date.now() / 1000)

  try {
    const data = await getAPI(`patterns/${patternId}/realtime`)
    data.forEach(dataItem => {
      let item = document.getElementById('arrivalTime_' + dataItem.trip_id)
      if (!item) {
        return
      }
      if (item.classList.contains('done')) {
        return
      }
      if (dataItem.stop_id !== id) {
        return
      }

      // Check if bus has passed
      if (dataItem.observed_arrival_unix !== null && dataItem.scheduled_arrival_unix < currentUNIX && dataItem.estimated_arrival_unix < currentUNIX) {
        item.remove()
        console.log("ITEM REMOVED", dataItem.trip_id)
      }
      // Check if it's still realTime and update minutes
      else if (dataItem.observed_arrival_unix === null && dataItem.estimated_arrival_unix !== null && dataItem.estimated_arrival_unix > currentUNIX && !item.classList.contains('scheduleTime')) {
        let arrivalTime = Math.floor((dataItem.estimated_arrival_unix - currentUNIX) / 60)
        // If arriving time is less than 1 minute, show a incoming message. If its greater, show the remaining minutes till arrival
        if (arrivalTime < 1) {
          item.innerText = "A chegar"
          // Notify the user of the incoming vehicle
          if ('Notification' in window && Notification.permission === 'granted' && receiveNotifications === true) {
            // Trigger notification only once
            if (!notifiedBuses.has(dataItem.trip_id)) {
              notifiedBuses.add(dataItem.trip_id)
              new Notification(`🚍 ${dataItem.line_id} - ${dataItem.headsign}`, {
                body: 'O autocarro está perto!'
              })
            }
          } else if (Notification.permission !== 'denied' && receiveNotifications === true) {
            Notification.requestPermission().then(permission => {
              if (permission === 'granted' && !notifiedBuses.has(dataItem.trip_id)) {
                notifiedBuses.add(dataItem.trip_id)
                new Notification(`🚍 ${dataItem.line_id} - ${dataItem.headsign}`, {
                  body: 'O autocarro está perto!'
                })
              }
            })
          }
        } else {
          item.innerText = arrivalTime + " min"
        }
      }
      // Check if scheduled time is now a real-time and trigger notification if necessary
      else if (dataItem.observed_arrival_unix === null && dataItem.estimated_arrival_unix !== null && dataItem.scheduled_arrival_unix > currentUNIX && item.classList.contains('scheduleTime')) {
        let arrivalTime = Math.floor((dataItem.estimated_arrival_unix - currentUNIX) / 60)
        if (arrivalTime < 1) {
          item.innerText = "A chegar"
        } else {
          item.innerText = arrivalTime + " min"
        }
        item.classList.remove('scheduleTime')
        item.classList.add('realTime')
      } else {
        return
      }

    })
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao atualizar as próximas passagens")
  }
}
// Sort schedule times
function parseArrivalTime(arrivalTime) {
  const timeParts = arrivalTime.split(":")
  const hours = parseInt(timeParts[0])
  const minutes = parseInt(timeParts[1])
  // If the schedule time is between 00am and 04am, set it to the end of the day and not to be considered like a "morning" time
  const adjustedHours = hours >= 4 ? hours - 24 : hours
  return adjustedHours * 60 + minutes
}

// Mark times - To see the arriving time on other stops
function markTime(trip) {
  // If the trip matches the stored trip, remove it (for the user to remove the mark)
  if (tripId === trip) {
    tripId = ""
  } else {
    tripId = trip
  }
}

// Line Map
var map = new maplibregl.Map({
  container: "map",
  style: "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
  center: [-9.0, 38.7],
  zoom: 9,
});

// Load Map Route
async function loadRoute(shape_id, color) {
  try {
    const data = await getAPI("shapes/" + shape_id)
    const lineCoords = data.geojson.geometry.coordinates
    // Remove all existing line layers
    if (map.getLayer("lineString")) {
      map.removeLayer("lineString")
      map.removeSource("lineString")
    }

    const lineStringGeojson = {
      type: "FeatureCollection",
      features: [{
        type: "Feature",
        geometry: {
          type: "LineString",
          coordinates: lineCoords
        }
      }]
    }

    // Add new source and layer for the line
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

    // Calculate bounds and center for the new route
    const allCoordinates = lineStringGeojson.features[0].geometry.coordinates
    const latitudes = allCoordinates.map((coord) => coord[1])
    const longitudes = allCoordinates.map((coord) => coord[0])
    const centerLatitude = (Math.max(...latitudes) + Math.min(...latitudes)) / 2
    const centerLongitude = (Math.max(...longitudes) + Math.min(...longitudes)) / 2

    const bounds = new maplibregl.LngLatBounds()
    allCoordinates.forEach((coord) => bounds.extend(coord))

    map.fitBounds(bounds, { padding: 50, animate: true })
    // const idealZoom = map.getZoom()
    // const center = [centerLongitude, centerLatitude]
    // map.jumpTo({ center: center, zoom: idealZoom })

    loadVehicles()
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar a linha no mapa")
  }
}

let updateInterval_vehicles
async function loadVehicles() {
  // Remove previous vehicles layer, if exists
  if (map.getLayer("pointsbus")) {
    map.removeLayer("pointsbus")
  }
  // Remove previous vehicles source, if exists
  if (map.getSource("pointsbus")) {
    map.removeSource("pointsbus")
  }
  const dateSelected = document.getElementById('date_input').value
  let changedDate = dateSelected.replace(/-/g, '')
  if (changedDate !== currentDate) {
    return
  }
  try {
    const vehicle_data = await getAPI("vehicles")
    let pointFeatures = []
    vehicle_data.forEach(vehicle => {
      if (vehicle.pattern_id === patternId) {
        let coords = [vehicle.lon, vehicle.lat]
        pointFeatures.push({
          type: "Feature",
          properties: {
            name: vehicle.id,
            className: "iconBus",
            bearing: vehicle.bearing,
            timeStamp: vehicle.timestamp,
            description: `Line: <b>${vehicle.line_id}</b><br>
            Route: <b>${vehicle.route_id}</b><br>
            Pattern: <b>${vehicle.pattern_id}</b><br>
            State: <b>${vehicle.current_status}</b><br>
            Stop: <b>${vehicle.stop_id}</b><br>
            Vehicle ID: <b>${vehicle.id}</b>`
          },
          geometry: {
            type: "Point",
            coordinates: coords
          }
        });

        // Get previous stop ID
        const currentStopID = allStops.indexOf(vehicle.stop_id)
        let stopDIV

        // Add a bus icon to the stop list, to visually represent the position of the vehicle based on the line.
        if (currentStopID > 0 && vehicle.current_status !== "STOPPED_AT") {
          stopDIV = document.getElementById('newStop_' + allStops[currentStopID-1])
        } else {
          stopDIV = document.getElementById('newStop_' + vehicle.stop_id)
        }
        let busIcon = document.createElement('i')
        busIcon.setAttribute('class', 'busIcon fa-solid fa-bus')
        if (stopDIV) {
          stopDIV.appendChild(busIcon)
          if (debugMode) {
            console.log(`BUS Icon at: ${vehicle.stop_id} (${currentStopID + 1})`)
          }
        }
      }
    })
    const geoJsonPoints = {
      type: "FeatureCollection",
      features: pointFeatures,
    }
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "popupBus"
    });
    map.on('mouseenter', 'pointsbus', (e) => {
      map.getCanvas().style.cursor = 'pointer';
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.description;
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }
      // Populate the popup and set its coordinates
      // based on the feature found.
      popup.setLngLat(coordinates).setHTML(description).addTo(map);
    });
    map.on('mouseleave', 'pointsbus', () => {
      map.getCanvas().style.cursor = 'default';
      popup.remove();
    });
    // Adds a new source for GeoJSON points
    map.addSource("pointsbus", {
      type: "geojson",
      data: geoJsonPoints,
    })
    // Remove duplicated images
    if (map.hasImage("bus-icon")) {
      map.removeImage("bus-icon")
    }
    // Load and add the vehicle image
    image = await map.loadImage("../../../IMG/busIcon.png")
    map.addImage("bus-icon", image.data)
    // Adds a layer with the image
    map.addLayer({
      id: "pointsbus",
      type: "symbol",
      source: "pointsbus",
      layout: {
        "icon-image": "bus-icon",
        "icon-size": [
          "interpolate",
          ["linear", 0.5],
          ["zoom"],
          10,
          0.05,
          20,
          0.15,
        ],
        "icon-allow-overlap": true,
        "icon-offset": [0, -15],
        "icon-rotate": ["get", "bearing"],
      },
    })
    // Missing images handler
    map.on("styleimagemissing", (e) => {
      console.log(`Image missing: ${e.id}`)
    })
    if (updateInterval_vehicles) clearInterval(updateInterval_vehicles)
      updateInterval_vehicles = setInterval(() => updateTimes_vehicles(), 10000)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar os veiculos desta linha")
  }
}

async function updateTimes_vehicles() {
  try {
    const vehicle_data = await getAPI("vehicles");

    // Clear all vehicle icons on map before load the new positions
    const allBusIcons = document.querySelectorAll('.busIcon');
    allBusIcons.forEach(busIcon => busIcon.remove());

    const source = map.getSource("pointsbus");
    if (source) {
      const data = source._data;

      // Remove vehicles that have completed the line
      data.features = data.features.filter(f => 
        vehicle_data.some(vehicle => vehicle.id === f.properties.name)
      );

      vehicle_data.forEach(vehicle => {
        if (vehicle.pattern_id === patternId) {
          const coords = [vehicle.lon, vehicle.lat];

          const feature = data.features.find(f => f.properties.name === vehicle.id);
          if (feature) {
            // Update vehicle properties
            feature.geometry.coordinates = coords;
            feature.properties.bearing = vehicle.bearing;
            feature.properties.timeStamp = vehicle.timestamp;
            feature.properties.description = `Line: <b>${vehicle.line_id}</b><br>
              Route: <b>${vehicle.route_id}</b><br>
              Pattern: <b>${vehicle.pattern_id}</b><br>
              State: <b>${vehicle.current_status}</b><br>
              Stop: <b>${vehicle.stop_id}</b><br>
              Vehicle ID: <b>${vehicle.id}</b>`;
          } else {
            // If the vehicle is not on the map, add it
            data.features.push({
              type: "Feature",
              geometry: { type: "Point", coordinates: coords },
              properties: {
                name: vehicle.id,
                bearing: vehicle.bearing,
                timeStamp: vehicle.timestamp,
                description: `Line: <b>${vehicle.line_id}</b><br>
                  Route: <b>${vehicle.route_id}</b><br>
                  Pattern: <b>${vehicle.pattern_id}</b><br>
                  State: <b>${vehicle.current_status}</b><br>
                  Stop: <b>${vehicle.stop_id}</b><br>
                  Vehicle ID: <b>${vehicle.id}</b>`
              }
            });
          }

          // Add the bus icon at the stops list
          if (vehicle.current_status !== "COMPLETED") {
            // Get next stop ID
            const currentStopID = allStops.indexOf(vehicle.stop_id)
            let stopDIV
            // If the vehicle is at the first stop or stopped at a stop, make it show on that stop
            // If the vehicle is not on the first stop or stopped at a stop, make it show the previous stop
            if (currentStopID > 0 && vehicle.current_status !== "STOPPED_AT") {
              stopDIV = document.getElementById('newStop_' + allStops[currentStopID-1])
            } else {
              stopDIV = document.getElementById('newStop_' + vehicle.stop_id)
            }
            if (stopDIV) {
              let busIcon = document.createElement('i');
              busIcon.setAttribute('class', 'busIcon fa-solid fa-bus');
              busIcon.setAttribute('data-bus-id', vehicle.id);
              stopDIV.appendChild(busIcon);
              if (debugMode) {
                console.log(`

                  :::::::::: BUS ICONS ::::::::::
            
                  Stop ID: ${stopId}
                  Stop Sequence: ${currentStopID + 1}
                  Time: ${new Date().getHours().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + new Date().getMinutes().toLocaleString(undefined, {minimumIntegerDigits: 2}) + ":" + new Date().getSeconds().toLocaleString(undefined, {minimumIntegerDigits: 2})}
                  
                `)
              }
            }
          }
        }
      });

      source.setData(data);
    }
  } catch (error) {
    snackbar("erro", "Erro no servidor");
    console.log(error);
  }
}

// Picture in Picture
async function togglePictureInPicture() {
  let pipIcon = document.getElementById('pipIcon')
  if (!stopId) {
    snackbar("fa-solid fa-triangle-exclamation", "Esta função necessita de uma paragem selecionada")
    return
  }
  const dateSelected = document.getElementById('date_input').value
  let changedDate = dateSelected.replace(/-/g, '')
  if (changedDate !== currentDate) {
    snackbar("fa-solid fa-triangle-exclamation", "Não é possível usar esta função com a data selecionada")
    return
  }
  // Close PIP if it exists
  if (pipWindow) {
    pipWindow.close()
    pipWindow = null
    pipIcon.className = "fa-regular fa-clone"
    return
  }

  pipIcon.className = "fa-solid fa-clone"

  let pipOptions = {
    width: 350,
    height: 100
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
  setInterval(updatePipArrivals, 10000)

  // Listen for visibility change to keep updating PiP when the tab is not active
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && pipWindow) {
      updatePipArrivals() // Update when tab becomes active
    }
  })
}

function updatePipArrivals() {
  if (!pipWindow) return

  let arrivalContainer = pipWindow.document.getElementById('pip_arrivals')
  if (!arrivalContainer) return

  arrivalContainer.innerHTML = ""

  let arrivals = document.querySelectorAll('.realTime, .scheduleTime')
  arrivals = Array.from(arrivals).slice(0, 3) // Get only the first 3 arrivals

  arrivals.forEach(arrival => {
    let newArrival = document.createElement('p')
    newArrival.setAttribute('class', arrival.classList.contains('realTime') ? 'pipArrivalTime realTime' : 'pipArrivalTime')
    newArrival.innerText = arrival.innerText
    arrivalContainer.appendChild(newArrival)
  })
}