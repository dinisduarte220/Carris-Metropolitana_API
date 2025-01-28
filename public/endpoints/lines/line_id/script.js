// Extract the current line_id from URL
const pathParts = window.location.pathname.split('/')
const lineId = pathParts[3] // Get the 3rd part of the URL (URL Base = /page/lines/:line_id)
let patternId, stopId // Store the active pattern and stop
let tripId // Store trip ID

addLineToRecents()

// Store current date in YYYYMMDD format
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
  let firstStopSet = false
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
      newStop.setAttribute('onclick', `selectStop("${stop.stop.id}")`)

      let stopName = document.createElement('p')
      stopName.setAttribute('class', 'stopName')
      stopName.innerText = stop.stop.name

      newStop.appendChild(stopName)

      stopsContainer.appendChild(newStop)
          // Select the first stop, for the schedule to appear
      if (!firstStopSet) {
        stopId = stop.stop.id
        firstStopSet = true
        selectStop(stop.stop.id)
      }
    });
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
    const previousArrivalTimes = stopsContainer.querySelectorAll('.newStop .arrivalTimes')
    const previousArrivalTimesTitle = stopsContainer.querySelectorAll('.newStop .arrivalTimesTitle')
    previousArrivalTimes.forEach(schedule => schedule.remove())
    previousArrivalTimesTitle.forEach(schedule => schedule.remove())
    previousSchedules.forEach(schedule => schedule.remove())
    previousScheduleTitles.forEach(schedule => schedule.remove())
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
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar o horário para esta paragem")
  }
}
// Update Real Times
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

      // Check if bus as passed
      if (dataItem.observed_arrival_unix !== null && dataItem.scheduled_arrival_unix < currentUNIX && dataItem.estimated_arrival_unix < currentUNIX) {
        item.remove()
        console.log("ITEM REMOVED", dataItem.trip_id)
      }
      // Check if its still realTime and update minutes
      else if (dataItem.observed_arrival_unix === null && dataItem.estimated_arrival_unix !== null && dataItem.estimated_arrival_unix > currentUNIX && !item.classList.contains('scheduleTime')) {
        let arrivalTime = Math.floor((dataItem.estimated_arrival_unix - currentUNIX) / 60)
        if (arrivalTime < 1) {
          item.innerText = "A chegar"
        } else {
          item.innerText = arrivalTime + " min"
        }
        console.log("ITEM UPDATED")
      }
      // Check if scheduled time is now a real Time
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

// Stops real time

// async function realTime() {
//   try {
//     const data = getAPI(`patterns/${patternId}/realtime`)

//     data.forEach(time => {

//     })
//   } catch (error) {
//     console.error(error.message)
//     snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro no tempo real")
//   }
// }

// Line Map
var map = new maplibregl.Map({
  container: "map",
  style: "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
  center: [-9.0, 38.7],
  zoom: 9,
});