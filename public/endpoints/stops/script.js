// Extract the current line_id from URL
const pathParts = window.location.pathname.split('/')
const stopId = pathParts[3]
if (stopId) {
  selectStop(stopId)
}

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

// Load all stops on the map
async function loadAllStops() {
  let pointFeatures = []
  try {
    const stops_data = await getAPI("stops")
    stops_data.forEach(stop => {
      coords = [stop.lon, stop.lat]
      pointFeatures.push({
          type: "Feature",
          properties: {
              id: stop.id,
          },
          geometry: {
              type: "Point",
              coordinates: coords
          }
      })
  })
  const geoJsonPoints = {
    type: "FeatureCollection",
    features: pointFeatures,
  }
  map.addSource("points", { type: "geojson", data: geoJsonPoints })
  map.addLayer({
    id: "points",
    type: "circle",
    source: "points",
    paint: {
      'circle-radius': 3,
      'circle-color': "#ba7c18",
      'circle-stroke-width': 1,
      'circle-stroke-color': '#FFFFFF'
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
    snackbar("fa-solid fa-triangle-exclamation", "Ocorreu um erro ao carregar as paragens no mapa")
  }
}

// Stops Map
var map = new maplibregl.Map({
  container: "map",
  style: "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
  center: [-9.0, 38.7],
  zoom: 9,
});

map.addControl(new maplibregl.NavigationControl());
map.addControl(
  new maplibregl.GeolocateControl({
      positionOptions: {
          enableHighAccuracy: true
      },
      trackUserLocation: true
  })
)
// Make sure map is loaded before loading the stops
map.on('load', loadAllStops)