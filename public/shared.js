// All the shared functions between files

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

// Display lines on container
function renderLines(lines, container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
  lines.forEach(line => {
    let newLine = document.createElement('a')
    newLine.classList.add('item')
    newLine.classList.add('line')
    newLine.setAttribute('href', `/page/lines/` + line.id)
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