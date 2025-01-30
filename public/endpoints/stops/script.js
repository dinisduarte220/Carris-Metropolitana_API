async function searchStop() {
  const searchInput = document.getElementById('searchStop_input').value.toLowerCase()
  const searchResults = document.getElementById('searchResults')
  try {
    const stop_data = await getAPI("stops")
    
    let stopsToDisplay = []

    if (searchInput.length > 2) {
      stopsToDisplay = stop_data.filter(stop => 
        stop.id?.toLowerCase().includes(searchInput) || 
        stop.name?.toLowerCase().includes(searchInput) || 
        stop.locality?.toLowerCase().includes(searchInput)
      )
    }

    if (stopsToDisplay.length > 0) {
      renderStops(stopsToDisplay, searchResults)
      document.getElementById('searchStop_input').classList.add('searchActive')
      searchResults.style.display = "block"
    } else {
      document.getElementById('searchStop_input').classList.remove('searchActive')
      searchResults.style.display = "none"
    }

  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as paragens")
  }
}