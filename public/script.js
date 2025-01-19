homeFunctions()

// API Calls
async function getAPI(endpoint) {
  const fullURL = "https://api.carrismetropolitana.pt/" + endpoint
  return fetch(fullURL)
  .then(response => {
    if (!response.ok) {
      throw new Error('[ERROR] Something wrong as occurred with the network')
    }
    return response.json()
  })
  .catch(error => Promise.reject(error.message))
}

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
    res.status(500).json({
        icon: 'fa-solid fa-triangle-exclamation',
        message: '[ERRO] Ocorreu um erro ao carregar as tuas linhas favoritas'
    })
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
    res.status(500).json({
        icon: 'fa-solid fa-triangle-exclamation',
        message: '[ERRO] Ocorreu um erro ao carregar as linhas recentes'
    })
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
    res.status(500).json({
        icon: 'fa-solid fa-triangle-exclamation',
        message: '[ERRO] Ocorreu um erro ao carregar as tuas paragens favoritas'
    })
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
    res.status(500).json({
        icon: 'fa-solid fa-triangle-exclamation',
        message: '[ERRO] Ocorreu um erro ao carregar as paragens recentes'
    })
  }
}

// Display lines on container
function renderLines(lines, container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
  lines.forEach(line => {
    let newLine = document.createElement('div')
    newLine.classList.add('item')
    newLine.classList.add('line')
    newLine.setAttribute('onclick', `seeLineDetails(${line.id})`)
    let lineNumber = document.createElement('p')
    lineNumber.setAttribute('class', 'lineID')
    lineNumber.style.backgroundColor = line.color
    lineNumber.innerText = line.id
    let lineName = document.createElement('p')
    lineName.setAttribute('class', 'lineName')
    lineName.innerText = line.long_name
    // Append number and name to the line DIV
    newLine.appendChild(lineNumber)
    newLine.appendChild(lineName)
    // Append the new line to the main container
    container.appendChild(newLine)
  });
}
// Display stops on container
function renderStops(stops, container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
  stops.forEach(stop => {
    let newStop = document.createElement('div')
    newStop.classList.add('item')
    newStop.classList.add('stop')
    newStop.setAttribute('onclick', `seeStopDetails(${stop.id})`)
    let stopID = document.createElement('p')
    stopID.setAttribute('class', 'stopID')
    stopID.setAttribute('onclick', `event.stopPropagation(); copyText("${stop.id}")`)
    stopID.innerText = "#" + stop.id
    let stopName = document.createElement('p')
    stopName.setAttribute('class', 'stopName')
    stopName.innerText = stop.name
    // Append ID and name to the stop DIV
    newStop.appendChild(stopID)
    newStop.appendChild(stopName)
    // Append the new line to the main container
    container.appendChild(newStop)
  });
}

// Copy Text
function copyText(text) {
  navigator.clipboard.writeText(text);
  snackbar("fa-regular fa-copy", "Texto copiado")
}

// SnackBar Notifications
let timer, timer_out
const snackbarTime = 5000 // 5 Seconds
function snackbar(icon, text) {
  let div = document.getElementById('snackbar')
  if (!icon || !text) {
    return
  } else {
    if (timer || timer_out) {
      clearTimeout(timer)
      clearTimeout(timer_out)
      div.style.display = "none"
      void div.offsetWidth
    }
    div.style.animation = "snackbar_anim .5s ease"
    div.style.display = "block"
    timer_out = setTimeout(() => {
      div.style.animation = "snackbar_anim_out .5s ease"
    }, snackbarTime - 500); // Add out animation 500ms before removing the snackbar
    timer = setTimeout(() => {
      div.style.display = "none"
    }, snackbarTime);
    div.innerHTML = `<i class="${icon}"></i> ${text}`
  }
}
// snackbar("fa-regular fa-bell", "Snackbar")  ->  Example call for snackbar