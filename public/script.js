homeFunctions()

// Starting Functions
async function homeFunctions() {
  await getFavorites()
  await nearStops()
  await nearLines()
}

// Enable Drag and Drop of the favortes item
function enableDragAndDrop() {
  const container = document.getElementById('favoriteRoutes_container')
  const deleteButton = document.getElementById('editFavoritesBtn')
  let draggedItem = null
  let touchTimeout = null
  let autoScrollInterval = null

  container.querySelectorAll('.item').forEach(item => {
    item.setAttribute('draggable', 'false') // disable default handle

    // Desktop drag
    item.addEventListener('mousedown', () => item.setAttribute('draggable', 'true'))
    item.addEventListener('dragstart', () => startDrag(item))
    item.addEventListener('dragend', () => {
      endDrag()
      item.setAttribute('draggable', 'false')
    })

    item.addEventListener('dragover', e => e.preventDefault())
    item.addEventListener('drop', e => {
      e.preventDefault()
      if (draggedItem && draggedItem !== item) moveItem(draggedItem, item)
    })

    // Mobile: long press
    item.addEventListener('touchstart', e => {
      touchTimeout = setTimeout(() => {
        startDrag(item)
        item.classList.add('mobile-dragging')
      }, 400)
    })

    item.addEventListener('touchend', e => {
      clearTimeout(touchTimeout)
      stopAutoScroll()
      const touch = e.changedTouches[0]
      const elUnder = document.elementFromPoint(touch.clientX, touch.clientY)
      if (draggedItem && elUnder === deleteButton) {
        draggedItem.remove()
        saveFavoritesOrder()
      }
      if (draggedItem) endDrag()
    })

    item.addEventListener('touchmove', e => {
      if (draggedItem) {
        const touch = e.touches[0]
        const elUnder = document.elementFromPoint(touch.clientX, touch.clientY)

        if (elUnder?.classList.contains('item') && elUnder !== draggedItem) {
          moveItem(draggedItem, elUnder)
        }

        if (elUnder === deleteButton) {
          deleteButton.classList.add('highlight-delete')
        } else {
          deleteButton.classList.remove('highlight-delete')
        }

        handleAutoScroll(touch.clientY)
        e.preventDefault()
      } else {
        clearTimeout(touchTimeout)
      }
    })
  })

  function moveItem(from, to) {
    const allItems = Array.from(container.children)
    const fromIndex = allItems.indexOf(from)
    const toIndex = allItems.indexOf(to)
    if (fromIndex < toIndex) {
      container.insertBefore(from, to.nextSibling)
    } else {
      container.insertBefore(from, to)
    }
    saveFavoritesOrder() // Save new order
  }

  function startDrag(item) {
    draggedItem = item
    item.style.opacity = '0.5'

    deleteButton.style.backgroundColor = "rgba(204, 48, 48, 0.5)"
    deleteButton.style.border = "2px solid rgb(168, 33, 33)"
    deleteButton.innerHTML = '<i class="fa-regular fa-trash-can"></i> Eliminar'
    deleteButton.classList.add('drop-zone')
  }

  function endDrag() {
    if (draggedItem) {
      draggedItem.style.opacity = ''
      draggedItem.classList.remove('mobile-dragging')
    }
    draggedItem = null

    deleteButton.style.backgroundColor = "rgb(75, 75, 75)"
    deleteButton.style.border = "2px solid rgb(125, 125, 125)"
    deleteButton.innerHTML = '<i class="fa-regular fa-square-plus"></i> Editar'
    deleteButton.classList.remove('drop-zone', 'highlight-delete')
  }

  deleteButton.addEventListener('dragover', e => {
    if (draggedItem) {
      e.preventDefault()
      deleteButton.classList.add('highlight-delete')
    }
  })

  deleteButton.addEventListener('dragleave', () => {
    deleteButton.classList.remove('highlight-delete')
  })

  deleteButton.addEventListener('drop', e => {
    e.preventDefault()
    if (draggedItem) {
      draggedItem.remove()
      saveFavoritesOrder()
      endDrag()
    }
  })

  // Auto-scroll when dragging near top/bottom
  function handleAutoScroll(clientY) {
    const rect = container.getBoundingClientRect()
    const threshold = 60
    const speed = 10

    stopAutoScroll()

    if (clientY - rect.top < threshold) {
      autoScrollInterval = setInterval(() => {
        container.scrollTop -= speed
      }, 16)
    } else if (rect.bottom - clientY < threshold) {
      autoScrollInterval = setInterval(() => {
        container.scrollTop += speed
      }, 16)
    }
  }

  function stopAutoScroll() {
    if (autoScrollInterval) {
      clearInterval(autoScrollInterval)
      autoScrollInterval = null
    }
  }
}

// Get favorites and display them on main page
async function getFavorites() {
  try {
    const response = await fetch('/storage')
    const container = document.getElementById('favoriteRoutes_container')

    while (container.firstChild) {
      container.removeChild(container.firstChild)
    }

    if (!response.ok) {
      throw new Error(`[HTTP ${response.status}] Failed to fetch favorites`)
    }

    const favorites = await response.json()
    favorites.forEach(item => {
      if (item.type === "line") {
        let newLine = document.createElement('a')
        newLine.classList.add('item')
        newLine.classList.add('line')
        newLine.setAttribute('href', `/lines/${item.id}`)
        let lineNumber = document.createElement('p')
        lineNumber.setAttribute('class', 'lineID')
        lineNumber.style.backgroundColor = item.color
        lineNumber.innerText = item.id
        let lineName = document.createElement('p')
        lineName.setAttribute('class', 'lineName')
        lineName.innerText = item.text
        // Append number and name to the line DIV
        newLine.appendChild(lineNumber)
        newLine.appendChild(lineName)
        // Append the new line to the main container
        container.appendChild(newLine)
      } else {
        let newStop = document.createElement('a')
        newStop.classList.add('item')
        newStop.classList.add('stop')
        newStop.setAttribute('href', `stops/${item.id}`)
        let stopID = document.createElement('p')
        stopID.setAttribute('class', 'stopID')
        stopID.innerText = "#" + item.id
        let stopName = document.createElement('p')
        stopName.setAttribute('class', 'stopName')
        stopName.innerText = item.text
        // Append ID and name to the stop DIV
        newStop.appendChild(stopID)
        newStop.appendChild(stopName)
        // Append the new line to the main container
        container.appendChild(newStop)
      }
    })
    enableDragAndDrop()
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar os percursos favoritos")
  }
}

async function saveFavoritesOrder() {
  const container = document.getElementById('favoriteRoutes_container')
  const items = container.querySelectorAll('.item')
  const updatedFavorites = []

  items.forEach(item => {
    if (item.classList.contains('line')) {
      updatedFavorites.push({
        type: 'line',
        id: item.querySelector('.lineID').innerText.trim(),
        text: item.querySelector('.lineName').innerText.trim(),
        color: item.querySelector('.lineID').style.backgroundColor
      })
    } else if (item.classList.contains('stop')) {
      updatedFavorites.push({
        type: 'stop',
        id: item.querySelector('.stopID').innerText.trim().replace('#', ''),
        text: item.querySelector('.stopName').innerText.trim()
      })
    }
  })

  try {
    const response = await fetch('/storage', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value: updatedFavorites })
    })

    const result = await response.json()
    if (!response.ok) {
      console.error('[ERROR]', result)
    } else {
      console.log('[SUCCESS] Favorites updated:', result)
    }

  } catch (err) {
    console.error('[ERROR] Failed to update favorites:', err)
  }
}

// Toggle modal visibility
function toggleFavoritesModal() {
  clearFavoritesSections()
  const modal = document.getElementById('modalFavorites')
  if (window.getComputedStyle(modal).display === "none") {
    modal.style.display = "block"
  } else {
    modal.style.display = "none"
  }
}

// Change between line and stop
function changeType() {
  clearFavoritesSections()
  const favoriteType = document.getElementById('favoriteType')
  const typeIndicator = document.getElementById('typeIndicator')
  let types = favoriteType.querySelectorAll('.type')
  let divs = document.getElementById('modalFavorites').querySelectorAll('.divType')
  
  if (types[0].classList.contains('active')) {
    types[0].classList.remove('active')
    types[1].classList.add('active')
    types[0].setAttribute('onclick', 'changeType()')
    types[1].removeAttribute('onclick')
    typeIndicator.style.left = 'calc(50% - 3px)'
    divs[0].classList.remove('active')
    divs[1].classList.add('active')
  } else {
    types[1].classList.remove('active')
    types[0].classList.add('active')
    types[1].setAttribute('onclick', 'changeType()')
    types[0].removeAttribute('onclick')
    typeIndicator.style.left = '3px'
    divs[1].classList.remove('active')
    divs[0].classList.add('active')
  }
}

// Search Lines/Stops
async function searchLine(searchText) {
  const container = document.getElementById('favoritesLinesContainer')
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
  try {
    const lines_data = await getAPI("lines")
    let linesToDisplay

    if (searchText.length > 0) {
      linesToDisplay = lines_data.filter(line => 
        line.id.toLowerCase().includes(searchText) || 
        line.long_name.toLowerCase().includes(searchText)
      )
    } else {
      let newMsg = document.createElement('div')
      newMsg.setAttribute('class', 'errorMsg')
      newMsg.innerText = "PESQUISE UMA LINHA"
      document.getElementById('btnAddLineToFavorites').setAttribute('disabled', '')
      container.appendChild(newMsg)
      return
    }

    if (!linesToDisplay.length > 0) {
      let newMsg = document.createElement('div')
      newMsg.setAttribute('class', 'errorMsg')
      newMsg.innerText = "PESQUISE UMA LINHA"
      document.getElementById('btnAddLineToFavorites').setAttribute('disabled', '')
      container.appendChild(newMsg)
      return
    }

    linesToDisplay.forEach(line => {
      let newLine = document.createElement('a')
      newLine.classList.add('item')
      newLine.classList.add('line')
      newLine.setAttribute('id', `item_${line.id}`)
      newLine.setAttribute('onclick', `selectLine("item_${line.id}")`)
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

    selectLine()
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as linhas")
  }
}
async function searchStop(searchText) {
  const container = document.getElementById('favoritesStopsContainer')
  while (container.firstChild) {
    container.removeChild(container.firstChild)
  }
  try {
    const stops_data = await getAPI("stops")
    let stopsToDisplay

    if (searchText.length > 3) {
      stopsToDisplay = stops_data.filter(stop => 
        stop.id?.toLowerCase().includes(searchText) || 
        stop.name?.toLowerCase().includes(searchText) || 
        stop.locality?.toLowerCase().includes(searchText)
      )
      while (container.firstChild) {
        container.removeChild(container.firstChild)
      }
    } else {
      let newMsg = document.createElement('div')
      newMsg.setAttribute('class', 'errorMsg')
      newMsg.innerText = "PESQUISE UMA PARAGEM"
      document.getElementById('btnAddStopToFavorites').setAttribute('disabled', '')
      container.appendChild(newMsg)
      return
    }

    if (stopsToDisplay.length === 0) {
      let newMsg = document.createElement('div')
      newMsg.setAttribute('class', 'errorMsg')
      newMsg.innerText = "PESQUISE UMA PARAGEM"
      document.getElementById('btnAddLineToFavorites').setAttribute('disabled', '')
      container.appendChild(newMsg)
      return
    }

    stopsToDisplay.forEach(stop => {
      let newStop = document.createElement('a')
      newStop.classList.add('item')
      newStop.classList.add('stop')
      newStop.setAttribute('id', `item_${stop.id}`)
      newStop.setAttribute('onclick', `selectStop("item_${stop.id}")`)
      let stopID = document.createElement('p')
      stopID.setAttribute('class', 'stopID')
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

    selectStop()
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as paragens")
  }
}

// Function to select item to add to favorites
function selectLine(itemID) {
  let itemDIV
  if (!itemID) {
    itemDIV = document.getElementById('modalFavorites').querySelectorAll('.item')[0]
  } else {
    itemDIV = document.getElementById(itemID)
  }
  const items = document.getElementById('favoritesLinesContainer').querySelectorAll('.item.selected')

  if (items && itemDIV) {
    items.forEach(item => {
      item.classList.remove('selected')
    })
    itemDIV.classList.add('selected')

    document.getElementById('btnAddLineToFavorites').removeAttribute('disabled')
  }
}
function selectStop(itemID) {
  let itemDIV
  if (!itemID) {
    itemDIV = document.getElementById('modalFavorites').querySelectorAll('.item')[0]
  } else {
    itemDIV = document.getElementById(itemID)
  }
  const items = document.getElementById('favoritesStopsContainer').querySelectorAll('.item.selected')
  if (items && itemDIV) {
    items.forEach(item => {
      item.classList.remove('selected')
    })
    itemDIV.classList.add('selected')

    document.getElementById('btnAddStopToFavorites').removeAttribute('disabled')
  }
}

// Clear Favorites input and items on container
function clearFavoritesSections() {
  const linesContainer = document.getElementById('favoritesLinesContainer')
  const stopsContainer = document.getElementById('favoritesStopsContainer')

  while (linesContainer.firstChild) {
    linesContainer.removeChild(linesContainer.firstChild)
  }
  while (stopsContainer.firstChild) {
    stopsContainer.removeChild(stopsContainer.firstChild)
  }

  let newMsgLines = document.createElement('div')
  newMsgLines.setAttribute('class', 'errorMsg')
  newMsgLines.innerText = "PESQUISE UMA LINHA"
  document.getElementById('btnAddLineToFavorites').setAttribute('disabled', '')
  linesContainer.appendChild(newMsgLines)

  let newMsgStops = document.createElement('div')
  newMsgStops.setAttribute('class', 'errorMsg')
  newMsgStops.innerText = "PESQUISE UMA PARAGEM"
  document.getElementById('btnAddStopToFavorites').setAttribute('disabled', '')
  stopsContainer.appendChild(newMsgStops)

  let modal = document.getElementById('modalFavorites')
  let inputs = modal.querySelectorAll('input')

  inputs.forEach(input => {
    input.value = ""
  })
}

// Add the item to favorites
async function addFavorite(type) {
  let value

  if (type === "line") {
    let container = document.getElementById('favoritesLinesContainer')
    let activeLine = container.querySelector('.item.selected')
    let lineID = activeLine.querySelector('.lineID').innerText.trim()
    let lineColor = activeLine.querySelector('.lineID').style.backgroundColor
    let lineName = activeLine.querySelector('.lineName').innerText.trim()

    value = {
      type: "line",
      id: lineID,
      text: lineName,
      color: lineColor
    }

  } else {
    let container = document.getElementById('favoritesStopsContainer')
    let activeStop = container.querySelector('.item.selected')
    let stopID = activeStop.querySelector('.stopID').innerText.trim()
    let stopName = activeStop.querySelector('.stopName').innerText.trim()
    let stopID_split = stopID.split('#')

    value = {
      type: "stop",
      id: stopID_split[1],
      text: stopName
    }
  }

  try {
    const response = await fetch('/storage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ value })
    })

    const result = await response.json()
    if (!response.ok) {
      console.error('[ERROR]', result)
    } else {
      console.log('[SUCCESS]', result)
    }

  } catch (err) {
    console.error('[ERROR] Failed to upload favorite:', err)
  }

  toggleFavoritesModal()
  getFavorites()
}

// Near Stops
async function nearStops() {
  let stopsContainer = document.getElementById('recentStops_container')
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async function (position) {
      const latitude = position.coords.latitude
      const longitude = position.coords.longitude

      let nearestStops = [] // Store the 5 nearest stops
      try {
        const stop_data = await getAPI("stops")

        let count = 0
        stop_data.forEach(stop => {
          const lon = stop.lon
          const lat = stop.lat
          const distance = haversineDistance(latitude, longitude, lat, lon)
          if (distance > 0.5) return
          count++
          nearestStops.push({ ...stop, distance })
        })

        console.log(count)

        nearestStops.sort((a, b) => a.distance - b.distance)
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