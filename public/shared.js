// All the shared functions between files

// API Calls
async function getAPI(endpoint) {
  const fullURL = "https://api.carrismetropolitana.pt/v1/" + endpoint
  return fetch(fullURL)
  .then(response => {
    if (!response.ok) {
      if (response.status === 404 || response.status === 400) {
        return {}
      }
      throw new Error('[ERROR] Something wrong as occurred with the network')
    }
    return response.json()
  })
  .catch(error => Promise.reject(error.message))
}

// Display lines on container
function renderLines(lines, container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
  lines.forEach(line => {
    let newLine = document.createElement('a')
    newLine.classList.add('item')
    newLine.classList.add('line')
    newLine.setAttribute('href', `/lines/` + line.id)
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
    let newStop = document.createElement('a')
    newStop.classList.add('item')
    newStop.classList.add('stop')
    newStop.setAttribute('href', `/stops/` + stop.id)
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