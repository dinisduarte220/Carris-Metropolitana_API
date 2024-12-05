let stopsCoords = []
let pointFeatures = []
let map2
let updateInterval, updateInterval_vehicles
let linesFilter = [], lines = [], patterns = [], shapes = [], tempArray_lines = [], trips_realTime = [], times_done = [], times_done_filter = []
let vehiclesLoader = []

// Function to initialize the map for a specific display
document.addEventListener("DOMContentLoaded", function() {
  map2 = new maplibregl.Map({
      container: 'map2',
      style: "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
      center: [-9.0, 38.7],
      zoom: 9
  });
  map2.addControl(new maplibregl.NavigationControl());
  map2.addControl(
    new maplibregl.GeolocateControl({
        positionOptions: {
            enableHighAccuracy: true
        },
        trackUserLocation: true
    })
  );

  paragens()

  // Event listener for clicks on the map to reset the stop points
  map2.on('click', function(e) {
      const features = map2.queryRenderedFeatures(e.point, {
          layers: ['points'] // Only query the stop points layer
      });

      // If no features (stop points) were clicked, reset the styles
      if (!features.length) {
          resetStopPointsStyle();
      }
  });
});

// Function to reset stop point styles
function resetStopPointsStyle() {
    var containerPast = document.getElementById('previousTrips')
    var containerFuture = document.getElementById('futureTrips')
    var containerLines = document.getElementById('containerLinhas')
    map2.setPaintProperty('points', 'circle-opacity', 1);  // Reset opacity
    map2.setPaintProperty('points', 'circle-stroke-opacity', 1);  // Reset stroke opacity
    map2.setPaintProperty('points', 'circle-radius', 3);  // Reset radius
    if (map2.getLayer('pointsbus')) {
        map2.removeLayer('pointsbus')
    }
    vehiclesLoader = []
    while (containerPast.firstChild) {
        containerPast.removeChild(containerPast.firstChild);
    }
    while (containerFuture.firstChild) {
        containerFuture.removeChild(containerFuture.firstChild);
    }
    while (containerLines.firstChild) {
      containerLines.removeChild(containerLines.firstChild);
    }

    // Remover apenas as camadas criadas no loadLines (lineString_*)
    var allLayers = map2.getStyle().layers;
    for (let i = allLayers.length - 1; i >= 0; i--) {
        let layer = allLayers[i].id;
        // Verifica se a camada foi criada dinamicamente no loadLines
        if (layer.startsWith('lineString_') || layer.startsWith('points_')) { // Inclui as camadas de pontos
            map2.removeLayer(layer);
            map2.removeSource(layer);
        }
    }

    if (map2.getLayer('pointsbus')) {
        map2.removeLayer('pointsbus')
    }

    // Reset de containers e outras propriedades
    vehiclesLoader = [];
    while (containerPast.firstChild) {
        containerPast.removeChild(containerPast.firstChild);
    }
    while (containerFuture.firstChild) {
        containerFuture.removeChild(containerFuture.firstChild);
    }
    while (containerLines.firstChild) {
        containerLines.removeChild(containerLines.firstChild);
    }

    document.getElementById('tituloContainerParagens').innerText = "";
    var span = document.createElement('span');
    span.setAttribute('id', 'paragensText');
    span.innerText = "SELECIONE UMA PARAGEM";
    containerFuture.appendChild(span);

    document.getElementById('realTimeMarker').style.display = "none";
    document.getElementById('idParagem').style.display = "none";
    clearInterval(updateInterval);
    clearInterval(updateInterval_vehicles);
}

// TODO
function copiarID(text) {
    navigator.clipboard.writeText(text);
    snackbar("info", "ID copiado")
}

let clickListenerAdded = false; // Add a flag to track if the click listener was already added

function paragens() {
    var resultados = apiCall("stops");

    resultados.then(async function(resultado) {
        await resultado.forEach(elemento => {
            coords = [elemento.lon, elemento.lat];
            pointFeatures.push({
                type: "Feature",
                properties: {
                    id: elemento.id,
                },
                geometry: {
                    type: "Point",
                    coordinates: coords
                }
            });
        });

        const geoJsonPoints = {
            type: "FeatureCollection",
            features: pointFeatures
        };

        map2.on('load', function () {
            // Definir o cursor para 'default' no início
            map2.getCanvas().style.cursor = 'default';

            // Remover camadas anteriores
            if (map2.getLayer("points")) {
                map2.removeLayer("points");
                if (map2.getSource("points")) {
                    map2.removeSource("points");
                }
            }

            // Adicionar a nova fonte e camada
            map2.addSource('points', {
                type: 'geojson',
                data: geoJsonPoints
            });

            map2.addLayer({
                id: 'points',
                type: 'circle',
                source: 'points',
                paint: {
                    'circle-radius': 3,
                    'circle-color': "#ba7c18",
                    'circle-stroke-width': 1,
                    'circle-stroke-color': '#FFFFFF'
                }
            });

            // Eventos de mouse para alterar o cursor
            map2.on('mouseenter', 'points', function () {
                map2.getCanvas().style.cursor = 'pointer';
            });

            map2.on('mouseleave', 'points', function () {
                map2.getCanvas().style.cursor = 'default';
            });

            // Adicionar o evento de clique apenas uma vez
            if (!clickListenerAdded) {
                map2.on('click', 'points', (e) => {
                    const clickedFeature = e.features[0]; // Get the clicked feature
                    const idC = clickedFeature.properties.id; // Extract the id from the clicked feature
                    selecionarParagem(idC); // Call the function with the extracted id
                    clearInterval(updateInterval);
                    clearInterval(updateInterval_vehicles);
                });
                clickListenerAdded = true; // Mark the click listener as added
            }
        });
    }).catch(function(error) {
        snackbar('erro', 'Ocorreu um erro (Detalhes do erro na consola)');
        console.error(error);
    });
}

async function selecionarParagem(id, extra) {
    let stop_title = document.getElementById('tituloContainerParagens')
    let container_lines = document.getElementById('containerLinhas')
    let idParagem = document.getElementById('idParagem')
    idParagem.setAttribute('onclick', `copiarID("${id}")`)
    idParagem.innerText = "# " + id
    idParagem.style.display = "block"

    lines = []
    shapes = []
    patterns = []

    // Pontos Mapa
    const clickedFeature = pointFeatures.find(feature => feature.properties.id === id);
    if (clickedFeature) {
        // Zoom para o ponto clicado e centra o mapa
        map2.flyTo({
            center: clickedFeature.geometry.coordinates,
            zoom: 16,
        });

        // Atualiza o estilo do ponto clicado para aumentar a opacidade
        map2.setPaintProperty('points', 'circle-opacity', [
            'case',
            ['==', ['get', 'id'], id], // Verifica se o id do ponto corresponde ao id clicado
            1, // Opacidade para o ponto clicado
            1 // Opacidade para os outros pontos
        ]);
        map2.setPaintProperty('points', 'circle-stroke-opacity', [
            'case',
            ['==', ['get', 'id'], id], // Verifica se o id do ponto corresponde ao id clicado
            1, // Opacidade para o ponto clicado
            0 // Opacidade para os outros pontos
        ]);
        
        map2.setPaintProperty('points', 'circle-radius', [
            'case',
            ['==', ['get', 'id'], id],
            5, // Maior raio para o ponto clicado
            0  // Raio padrão para os outros pontos
        ]);
        stop_title.innerText = ""
        while (container_lines.firstChild) {
            container_lines.removeChild(container_lines.firstChild)
        }
    }
    // Past Trips
    var containerPast = document.getElementById('previousTrips')
    // Future Trips
    var containerFuture = document.getElementById('futureTrips')
    let times_realTime = [], times_scheduled = [], final_times_future = [], final_times_past = [] // Arrays for passage times (Already Passed / Incoming / Schedules)
    times_done = []
    let newItem, color, newLine
    const currentTime_UNIX = Math.floor(Date.now() / 1000);
    setInterval(() => {
        let realTime = Date.now()
        document.getElementById('realTimeMarker_extra').innerText = new Date(realTime).toLocaleString([], {hour: '2-digit', minute: '2-digit'})
    }, 500);

    try {
        // Show all the lines that this stop receives
        let resultados_paragem = await apiCall(`stops/${id}`)
        patterns = resultados_paragem.patterns
        for (let stop_line of resultados_paragem.lines) {
            let resultados_linha = await apiCall("lines/" + stop_line)
            var lineDiv = document.createElement('div')
            lineDiv.setAttribute("class", "linhaParagem")
            lineDiv.setAttribute("onclick", `filterLine(${stop_line})`)
            lineDiv.innerText = stop_line
            lineDiv.style.backgroundColor = resultados_linha.color
            container_lines.appendChild(lineDiv)
            newLine = {
                "lineID": stop_line,
                "color": resultados_linha.color
            }
            lines.push(newLine)
        }
        stop_title.innerText = resultados_paragem.name

        let resultados_paragem_realTime = await apiCall(`stops/${id}/realtime`)

        // Organize times on the arrays
        for (let result of resultados_paragem_realTime) {
            // Schedule times (XX:XX:XX)
            let observed_time = result.observed_arrival,
            estimated_time = result.estimated_arrival,
            schedule_time = result.scheduled_arrival,
            passage_time, delay_time, delay_type, delay_text
            // Schedule times (miliseconds)
            let observed_time_UNIX = result.observed_arrival_unix,
            estimated_time_UNIX = result.estimated_arrival_unix,
            schedule_time_UNIX = result.scheduled_arrival_unix
            for (let newColor of lines) {
                if (newColor.lineID === result.line_id) {
                    color = newColor.color
                    continue
                }
            }

            // Concluded
            if (observed_time_UNIX !== null || (schedule_time_UNIX < currentTime_UNIX && estimated_time_UNIX < currentTime_UNIX)) {
                passage_time = result.observed_arrival
                if (observed_time === null) {
                    passage_time = result.scheduled_arrival
                }
                newItem = {
                    "color": color,
                    "tripID": result.trip_id,
                    "lineID": result.line_id,
                    "lineName": result.headsign,
                    "time": passage_time.substring(0, 5),
                    "time_text": passage_time.substring(0, 5),
                    "time_UNIX": result.observed_arrival_unix,
                    "type": "concluded",
                    "delay": null,
                    "delay_text": ""
                }
                times_done.push(newItem)
            }
            // Real time
            else if (observed_time_UNIX === null && estimated_time_UNIX !== null) {
                if (result.vehicle_id !== null) {
                    vehiclesLoader.push(result.vehicle_id)
                }
                passage_time = Math.floor((estimated_time_UNIX - currentTime_UNIX) / 60)
                if (passage_time < 1) {
                    passage_time = "A chegar"
                } else {
                    passage_time = passage_time + " min"
                }
                delay_time = Math.floor((schedule_time_UNIX - currentTime_UNIX) / 60)
                if (delay_time < 0) {
                    delay_text = Math.abs(delay_time) + " min atrasado"
                } else if (delay_time > 0) {
                    delay_text = delay_time + " min adiantado"
                } else {
                    delay_text = ""
                }
                if (delay_time < -10) {
                    delay_type = "veryDelayed"
                } else if (delay_time < -5) {
                    delay_type = "delayed"
                } else {
                    delay_type = "realTime"
                }
                newItem = {
                    "color": color,
                    "tripID": result.trip_id,
                    "lineID": result.line_id,
                    "lineName": result.headsign,
                    "time": passage_time,
                    "time_text": result.estimated_arrival.substring(0, 5),
                    "time_UNIX": result.estimated_arrival_unix,
                    "type": delay_type,
                    "delay": delay_time,
                    "delay_text": delay_text
                }
                times_realTime.push(newItem)
                trips_realTime.push(result.trip_id)
            }
            // Scheduled
            else {
                delay_time = Math.floor((schedule_time_UNIX - currentTime_UNIX) / 60)
                if (delay_time < 0) {
                    delay_text = Math.abs(delay_time) + " min atrasado"
                } else {
                    delay_text = null
                }
                newItem = {
                    "color": color,
                    "tripID": result.trip_id,
                    "lineID": result.line_id,
                    "lineName": result.headsign,
                    "time": result.scheduled_arrival.substring(0, 5),
                    "time_text": result.scheduled_arrival.substring(0, 5),
                    "time_UNIX": result.scheduled_arrival_unix,
                    "type": "scheduled",
                    "delay": delay_time,
                    "delay_text": delay_text
                }
                times_scheduled.push(newItem)
                trips_realTime.push(result.trip_id)
            }
        }
        // Remove previous divs if there was any
        while (containerPast.firstChild) {
            containerPast.removeChild(containerPast.firstChild);
        }
        while (containerFuture.firstChild) {
            containerFuture.removeChild(containerFuture.firstChild);
        }
        // Sort the concluded times
        times_done.sort((a, b) => {
			const timeStringA = a.time_text.split(':').join('');
			const timeStringB = b.time_text.split(':').join('');
			return timeStringA - timeStringB;
		});
        // Sort the realTime times
        times_realTime.sort((a, b) => {
			const timeStringA = a.time_text.split(':').join('');
			const timeStringB = b.time_text.split(':').join('');
			return timeStringA - timeStringB;
		});
        // Sort the scheduled times
        times_scheduled.sort((a, b) => {
			const timeStringA = a.time_text.split(':').join('');
			const timeStringB = b.time_text.split(':').join('');
			return timeStringA - timeStringB;
		});

        // Merge the last 3 items from the Concluded array, the full realTime and schedule array together
        final_times_future.push(...times_realTime, ...times_scheduled)
        if (extra === "fullConcluded") {
            final_times_past.push(...times_done)
        } else {
            final_times_past.push(times_done[times_done.length-3], times_done[times_done.length-2], times_done[times_done.length-1])
        }

        // Create div for each time
        for (let passageTimePast of final_times_past) {
            if (passageTimePast === undefined) {
                return
            }
            var passagemDiv = document.createElement('div')
            passagemDiv.setAttribute('class', passageTimePast.type)
            passagemDiv.setAttribute('id', passageTimePast.tripID)
            passagemDiv.classList.add('passagemLista')

            let numLinha = document.createElement('p');
            numLinha.setAttribute('class', "linhaNumero");
            numLinha.innerText = passageTimePast.lineID;
            numLinha.style.backgroundColor = passageTimePast.color;

            let perLinha = document.createElement('p');
            perLinha.setAttribute('class', "linhaPercurso");
            perLinha.innerText = passageTimePast.lineName;

            let textoAtraso = document.createElement('p')
            textoAtraso.setAttribute("class", "textoAtraso")
            textoAtraso.innerText = passageTimePast.delay_text

            let tempoLinha = document.createElement('p');
            tempoLinha.setAttribute('class', "linhaTempoReal")
            tempoLinha.innerHTML = passageTimePast.time

            passagemDiv.appendChild(textoAtraso)
            passagemDiv.appendChild(numLinha)
            passagemDiv.appendChild(perLinha)
            passagemDiv.appendChild(tempoLinha)
            containerPast.appendChild(passagemDiv)
        }

        for (let passageTime of final_times_future) {
            if (passageTime === undefined) {
                return
            }
            var passagemDiv = document.createElement('div')
            passagemDiv.setAttribute('class', passageTime.type)
            passagemDiv.setAttribute('id', passageTime.tripID)
            passagemDiv.setAttribute('onclick', `selecionarTempo(${passageTime.tripID})`)
            passagemDiv.classList.add('passagemLista')

            let numLinha = document.createElement('p');
            numLinha.setAttribute('class', "linhaNumero");
            numLinha.innerText = passageTime.lineID;
            numLinha.style.backgroundColor = passageTime.color;

            let perLinha = document.createElement('p');
            perLinha.setAttribute('class', "linhaPercurso");
            perLinha.innerText = passageTime.lineName;

            let textoAtraso = document.createElement('p')
            textoAtraso.setAttribute("class", "textoAtraso")
            textoAtraso.innerText = passageTime.delay_text

            let tempoLinha = document.createElement('p');
            tempoLinha.setAttribute('class', "linhaTempoReal");
            tempoLinha.innerHTML = passageTime.time
            
            passagemDiv.appendChild(textoAtraso)
            passagemDiv.appendChild(numLinha);
            passagemDiv.appendChild(perLinha);
            passagemDiv.appendChild(tempoLinha);
            containerFuture.appendChild(passagemDiv)
        }
        if (final_times_future.length === 0) {
            var span = document.createElement('span')
            span.setAttribute('id', 'paragensText')
            span.innerText = "FIM DE SERVIÇO"
            span.style.marginTop = "2rem"
            containerFuture.appendChild(span)
        }
        document.getElementById('realTimeMarker').style.display = "block"
        if (updateInterval) clearInterval(updateInterval)
        updateInterval = setInterval(() => updateTimes(id), 10000)
        await loadLines()
        show_vehicles()
    } catch (err) {
        snackbar('erro', 'Ocorreu um erro no servidor')
        console.error(err)
    }
}

// Load Shapes
async function loadShapes() {
    try {
        for (let currentPattern of patterns) {
            let resultados = await apiCall("patterns/" + currentPattern);
            const newItem = {
                color: resultados.color,
                stops: resultados.path,
                shapeID: resultados.shape_id
            };
            shapes.push(newItem)
        }
    } catch (error) {
        snackbar("erro", "Ocorreu um erro no servidor");
        console.error(error);
    }
}

// Store Shapes
async function storeShapes() {
    try {
        for (let currentShape of shapes) {
            let resultados = await apiCall("shapes/" + currentShape.shapeID); // Corrigido para currentShape.shapeID
            const newItem = {
                coords: resultados.geojson.geometry.coordinates,
                stops: currentShape.stops,
                color: currentShape.color // Mantém a cor associada
            };
            tempArray_lines.push(newItem);
        }
    } catch (error) {
        snackbar("erro", "Ocorreu um erro no servidor");
        console.error(error);
    }
}

async function loadLines() {
    tempArray_lines = [];
    let lineStops;

    // Usa await para garantir que as funções assíncronas estão completas antes de prosseguir
    await loadShapes();
    await storeShapes();

    for (let index = 0; index < tempArray_lines.length; index++) {
        let item = tempArray_lines[index];

        // item.coords refere-se às coordenadas da linha (não usadas para os pontos)
        lineStops = item.coords.map(element => {
            return { longitude: element[0], latitude: element[1] };
        });

        // Criar a LineString a partir das coordenadas
        let lineStringGeojson = {
            type: "FeatureCollection",
            features: [{
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: lineStops.map(stop => [stop.longitude, stop.latitude]) // Usa map para coordenadas
                }
            }]
        };

        // console.log(tempArray_lines.length)
        // console.log(index)

        // Cria uma camada única para cada linha
        let lineLayerId = `lineString_${index}`;
        let pointsLayerId = `points_${index}`;

        // Adicionar a LineString ao mapa (linha)
        map2.addSource(lineLayerId, {
            type: "geojson",
            data: lineStringGeojson,
        });

        map2.addLayer({
            id: lineLayerId, // ID único para a linha principal
            type: "line",
            source: lineLayerId,
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
            paint: {
                "line-color": item.color, // Cor original da linha
                "line-width": 4, // Largura da linha principal
            },
        });

        // Adicionar os pontos usando os pontos armazenados no `stops`
        let stopsGeoJson = {
            type: "FeatureCollection",
            features: item.stops.map(stopI => ({
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [stopI.stop.lon, stopI.stop.lat] // Usa as coordenadas dos pontos armazenados
                }
            }))
        };

        // Adicionar os pontos (stops) ao mapa
        map2.addSource(pointsLayerId, {
            type: 'geojson',
            data: stopsGeoJson,
        });

        map2.addLayer({
            id: pointsLayerId,
            type: 'circle',
            source: pointsLayerId,
            paint: {
                'circle-radius': 3,
                'circle-color': item.color,
                'circle-stroke-width': 2,
                'circle-stroke-color': '#FFFFFF'
            }
        });
    }
}

// Function to add realTime vehicles to the map
async function show_vehicles() {
    const currentTime_UNIX = Math.floor(Date.now() / 1000);
    try {
        var resultados = await apiCall("vehicles");
        let pointFeatures = [];
        var image;

        for (let result of resultados) {
            if (!vehiclesLoader.includes(result.id)) {
                continue
            }

            var updated = Math.floor((currentTime_UNIX - result.timestamp) / 60)
            var updated_text
            if (updated === 0) {
                updated_text = "Agora Mesmo"
            } else {
                updated_text = Math.abs(updated) + "min"
            }

            var coords = [result.lon, result.lat];
            pointFeatures.push({
              type: "Feature",
              properties: {
                name: result.id,
                className: "iconBus",
                bearing: result.bearing,
                timeStamp: result.timestamp,
                description: `Line: <b>${result.line_id}</b><br>
                Route: <b>${result.route_id}</b><br>
                Pattern: <b>${result.pattern_id}</b><br>
                State: <b>${result.current_status}</b><br>
                Stop: <b>${result.stop_id}</b><br>
                Last Updated: <b>${updated_text}</b><br>
                Vehicle ID: <b>${result.id}</b>`
              },
              geometry: {
                type: "Point",
                coordinates: coords
              }
            });

            const geoJsonPoints = {
              type: "FeatureCollection",
              features: pointFeatures
            };
    
            if (pointFeatures.length === 0) {
              return;
            }

            const popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                className: "popupBus"
            });

            map2.on('mouseenter', 'pointsbus', (e) => {
                // Change the cursor style as a UI indicator.
                map2.getCanvas().style.cursor = 'pointer';
    
                const coordinates = e.features[0].geometry.coordinates.slice();
                const description = e.features[0].properties.description;
    
                // Ensure that if the map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }
    
                // Populate the popup and set its coordinates
                // based on the feature found.
                popup.setLngLat(coordinates).setHTML(description).addTo(map2);
            });
    
            map2.on('mouseleave', 'pointsbus', () => {
                map2.getCanvas().style.cursor = 'default';
                popup.remove();
            });

            // Remove camada e fonte existentes se existirem
            if (map2.getLayer("pointsbus")) {
              map2.removeLayer("pointsbus");
            }
            if (map2.getSource("pointsbus")) {
              map2.removeSource("pointsbus");
            }

            // Adiciona nova fonte para pontos GeoJSON
            map2.addSource('pointsbus', {
              type: 'geojson',
              data: geoJsonPoints
            });

            // Remove a imagem se já existir
            if (map2.hasImage('bus-icon')) {
              map2.removeImage('bus-icon');
            }

            // Carrega a imagem e adiciona-a
            image = await map2.loadImage('../../IMG/busIcon.png');
            map2.addImage('bus-icon', image.data);

            // Adiciona a camada com a imagem carregada
            map2.addLayer({
              id: 'pointsbus',
              type: 'symbol',
              source: 'pointsbus',
              layout: {
                'icon-image': 'bus-icon',
                'icon-size': ['interpolate', ['linear', 0.5], ['zoom'], 10, 0.05, 20, 0.15],
                'icon-allow-overlap': true,
                'icon-offset': [0, -15],
                'icon-rotate': ['get', 'bearing']
              }
            });

            // Lida com imagens ausentes
            map2.on('styleimagemissing', (e) => {
              console.log(`Image missing: ${e.id}`);
            });
        }
        if (updateInterval_vehicles) clearInterval(updateInterval_vehicles)
            updateInterval_vehicles = setInterval(() => updateTimes_vehicles(), 10000)
    } catch (error) {
        snackbar('erro', "Erro no servidor")
        console.log(error)
    }
}

// Function to update realTime position of the vehicles on the map
async function updateTimes_vehicles() {
    try {
        var resultados = await apiCall("vehicles");

        for (let result of resultados) {
            if (!vehiclesLoader.includes(result.id)) {
                continue;
            }

            var coords = [result.lon, result.lat];
            
            // Verifica se a fonte já existe
            if (map2.getSource("pointsbus")) {
                // Atualiza as coordenadas do ponto existente
                let existingSource = map2.getSource("pointsbus");
                let data = existingSource._data; // Acessa os dados GeoJSON atuais
                
                // Encontra o ponto pelo seu "id" ou "name" e atualiza as coordenadas
                for (let feature of data.features) {
                    if (feature.properties.name === result.id) {
                        feature.geometry.coordinates = coords;
                        feature.properties.bearing = result.bearing;
                        feature.properties.timeStamp = result.timestamp;
                    }
                }

                // Atualiza a fonte com os novos dados GeoJSON
                existingSource.setData(data);

            } else {
                // Se a fonte ainda não existir, cria-a
                let pointFeatures = [];

                pointFeatures.push({
                    type: "Feature",
                    properties: {
                        name: result.id,
                        className: "iconBus",
                        bearing: result.bearing,
                        timeStamp: result.timestamp
                    },
                    geometry: {
                        type: "Point",
                        coordinates: coords
                    }
                });

                const geoJsonPoints = {
                    type: "FeatureCollection",
                    features: pointFeatures
                };

                if (pointFeatures.length > 0) {
                    map2.addSource('pointsbus', {
                        type: 'geojson',
                        data: geoJsonPoints
                    });

                    let image;
                    if (!map2.hasImage('bus-icon')) {
                        image = await map2.loadImage('../../IMG/busIcon.png');
                        map2.addImage('bus-icon', image.data);
                    }

                    map2.addLayer({
                        id: 'pointsbus',
                        type: 'symbol',
                        source: 'pointsbus',
                        layout: {
                            'icon-image': 'bus-icon',
                            'icon-size': ['interpolate', ['linear', 0.5], ['zoom'], 10, 0.05, 20, 0.15],
                            'icon-allow-overlap': true,
                            'icon-offset': [0, -15],
                            'icon-rotate': ['get', 'bearing']
                        }
                    });
                }
            }
        }

        // Atualiza a cada 10 segundos
        if (updateInterval_vehicles) clearInterval(updateInterval_vehicles);
        updateInterval_vehicles = setInterval(() => updateTimes_vehicles(), 10000);
        
    } catch (error) {
        snackbar('erro', "Erro no servidor");
        console.log(error);
    }
}

async function updateTimes(id) {
    var date = new Date();
    var hrs = date.getHours()
    var mnt = date.getMinutes()
    console.log(`
        ::::: UPDATED ::::::

        ID: ${id}
        Hora: ${hrs + ":" + mnt}
        `)
    const currentTime_UNIX = Math.floor(Date.now() / 1000);
    let color
    let realTime = Date.now()
    document.getElementById('realTimeMarker_extra').innerText = new Date(realTime).toLocaleString([], {hour: '2-digit', minute: '2-digit'})

    try {
        let resultados_paragem_realTime = await apiCall(`stops/${id}/realtime`)
        // Organize times on the arrays
        for (let result of resultados_paragem_realTime) {
            var item = document.getElementById(result.trip_id)
            if (!item) {
                continue
            }
            if (!trips_realTime.includes(result.trip_id) && item.classList.contains('concluded')) {
                continue
            }

            // Schedule times (XX:XX:XX)
            let observed_time = result.observed_arrival,
            estimated_time = result.estimated_arrival,
            schedule_time = result.scheduled_arrival,
            passage_time, delay_time, class_type, delay_text
            // Schedule times (miliseconds)
            let observed_time_UNIX = result.observed_arrival_unix,
            estimated_time_UNIX = result.estimated_arrival_unix,
            schedule_time_UNIX = result.scheduled_arrival_unix

            if (observed_time_UNIX !== null || (schedule_time_UNIX < currentTime_UNIX && estimated_time_UNIX < currentTime_UNIX)) {
                var containerPast = document.getElementById('previousTrips')
                for (let newColor of lines) {
                    if (newColor.lineID === result.line_id) {
                        color = newColor.color
                        continue
                    }
                }
                var passagemDiv = document.createElement('div')
                passagemDiv.setAttribute('class', "concluded")
                passagemDiv.classList.add('passagemLista')

                let numLinha = document.createElement('p');
                numLinha.setAttribute('class', "linhaNumero");
                numLinha.innerText = result.line_id;
                numLinha.style.backgroundColor = color;

                let perLinha = document.createElement('p');
                perLinha.setAttribute('class', "linhaPercurso");
                perLinha.innerText = result.headsign;

                let textoAtraso = document.createElement('p')
                textoAtraso.setAttribute("class", "textoAtraso")
                textoAtraso.innerText = ""

                let tempoLinha = document.createElement('p');
                tempoLinha.setAttribute('class', "linhaTempoReal")
                if (result.observed_arrival === null) {
                    tempoLinha.innerHTML = schedule_time.substring(0, 5)
                } else {
                    tempoLinha.innerHTML = observed_time.substring(0, 5)
                }


                passagemDiv.appendChild(textoAtraso)
                passagemDiv.appendChild(numLinha)
                passagemDiv.appendChild(perLinha)
                passagemDiv.appendChild(tempoLinha)
                containerPast.appendChild(passagemDiv)
                // Remove trip from array, to stop updating this time
                let index = trips_realTime.findIndex(result => result.trip_id === result.trip_id);
                if (index !== -1) {
                    trips_realTime.splice(index, 1);
                }
                document.getElementById('futureTrips').removeChild(item)
                document.getElementById('previousTrips').removeChild(document.getElementById('previousTrips').firstChild)
                class_type = "concluded"
            } else if (observed_time_UNIX === null && estimated_time_UNIX !== null) {
                passage_time = Math.floor((estimated_time_UNIX - currentTime_UNIX) / 60)
                if (passage_time < 1) {
                    passage_time = "A Chegar"
                    delay_time = Math.floor((schedule_time_UNIX - currentTime_UNIX) / 60)
                    if (delay_time < 0) {
                        delay_text = Math.abs(delay_time) + " min atrasado"
                    } else if (delay_time > 0) {
                        delay_text = delay_time + " min adiantado"
                    } else {
                        delay_text = ""
                    }
                    if (delay_time < -10) {
                        class_type = "veryDelayed"
                    } else if (delay_time < -5) {
                        class_type = "delayed"
                    } else {
                        class_type = "realTime"
                    }
                } else {
                    passage_time = passage_time + " min"
                    delay_time = Math.floor((schedule_time_UNIX - currentTime_UNIX) / 60)
                    if (delay_time < 0) {
                        delay_text = Math.abs(delay_time) + " min atrasado"
                    } else if (delay_time > 0) {
                        delay_text = delay_time + " min adiantado"
                    } else {
                        delay_text = ""
                    }
                    if (delay_time < -10) {
                        class_type = "veryDelayed"
                    } else if (delay_time < -5) {
                        class_type = "delayed"
                    } else {
                        class_type = "realTime"
                    }
                }
            } else {
                passage_time = schedule_time.substring(0, 5)
                delay_time = Math.floor((schedule_time_UNIX - currentTime_UNIX) / 60)
                if (delay_time < 0) {
                    delay_text = Math.abs(delay_time) + " min atrasado"
                } else {
                    delay_text = ""
                }
                class_type = "scheduled"
                for (let newColor of lines) {
                    if (newColor.lineID === result.line_id) {
                        color = newColor.color
                        continue
                    }
                }
                let newItem = {
                    "color": color,
                    "tripID": result.trip_id,
                    "lineID": result.line_id,
                    "lineName": result.headsign,
                    "time": result.scheduled_arrival.substring(0, 5),
                    "time_text": result.scheduled_arrival.substring(0, 5),
                    "time_UNIX": result.scheduled_arrival_unix,
                    "type": "scheduled",
                    "delay": delay_time,
                    "delay_text": delay_text
                }
                let firstId = times_done_filter[0]
                times_done_filter.pop(times_done_filter[0])
                times_done_filter.push(newItem)
            }
            if (class_type === "scheduled") {
                
            }
            item.className = ""
            item.classList.add("passagemLista", class_type)
            item.querySelector('.linhaTempoReal').className = "linhaTempoReal"
            item.querySelector('.linhaTempoReal').innerHTML = passage_time
            item.querySelector('.textoAtraso').innerText = delay_text
        }
    } catch (err) {
        snackbar('erro', 'Ocorreu um erro no servidor')
        console.error(err)
    }
}

// TODO - Filter option (on each stop be able to chose which lines the user see)

function selecionarTempo(trip_ID) {

    // TO COMPLETE

}
