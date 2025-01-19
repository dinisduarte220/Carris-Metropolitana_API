loadAllLines()

// Load all the lines
async function loadAllLines() {
  let linesContainer = document.getElementById('linesContainer')
  try {
    // Get all lines from Carris Metropolitana API
    const allLines = await getAPI('lines')
    // Display lines
    renderLines(allLines, linesContainer)
  } catch (error) {
    console.error(error.message)
    res.status(500).json({
        icon: 'fa-solid fa-triangle-exclamation',
        message: '[ERRO] Ocorreu um erro ao carregar as paragens recentes'
    })
  }
}