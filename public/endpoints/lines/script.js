loadAllLines()

// Load all the lines
async function loadAllLines() {
  let linesContainer = document.getElementById('linesContainer')
  let searchInput = document.getElementById('searchLine_input').value.toLowerCase()
  try {
    // Get all lines from Carris Metropolitana API
    const allLines = await getAPI("lines")
    let linesToDisplay
    if (searchInput.length > 0) {
      linesToDisplay = allLines.filter(line => 
        line.id.toLowerCase().includes(searchInput) || 
        line.long_name.toLowerCase().includes(searchInput)
      )
    } else {
      linesToDisplay = allLines
    }
    // Display lines
    renderLines(linesToDisplay, linesContainer)
  } catch (error) {
    console.error(error.message)
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as linhas")
  }
}