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
  await recentLines()
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
        message: '[ERRO] Ocorreu um erro ao carregar as linhas favoritas'
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

// Display lines on container
function renderLines(lines, container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
  lines.forEach(line => {
    let newLine = document.createElement('div')
    newLine.classList.add('item')
    newLine.setAttribute('onclick', `seeDetails(${line.id})`)
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

// SnackBar Notifications
let timer
const snackbarTime = 5000 // 5 Seconds
function snackbar(icon, text) {
  let div = document.getElementById('snackbar')
  if (!icon || !text) {
    return
  } else {
    if (timer) {
      clearTimeout(timer)
    }
    div.style.animation = "snackbar_anim .5s ease"
    div.style.display = "block"
    setTimeout(() => {
      div.style.animation = "snackbar_anim_out .5s ease"
    }, snackbarTime - 500); // Add out animation 500ms before removing the snackbar
    timer = setTimeout(() => {
      div.style.display = "none"
    }, snackbarTime);
    div.innerHTML = `<i class="${icon}"></i> ${text}`
  }
}
// snackbar("fa-regular fa-bell", "Snackbar")  ->  Example call for snackbar