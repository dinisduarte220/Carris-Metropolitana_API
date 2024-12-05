let mainLink = "https://api.carrismetropolitana.pt/"
let lineStops = []
let busCoords = []
let map

// API Call
function apiCall(extraEndPoint) {
  return new Promise((resolve, reject) => {
    let fullURL = mainLink + extraEndPoint
    $.ajax({
      method: "GET",
      url: fullURL,
      success: function (result) {
        resolve(result)
      },
      error: function ajaxError(jqXHR) {
        reject(jqXHR.responseText)
      },
    })
  })
}

// Linhas - API

function linhas() {
  let resultados = apiCall("lines")
  let favoritosArray = JSON.parse(localStorage.getItem("favoritos")) || []
  let cont = document.getElementById("linhasContainer")
  let input = document
    .getElementById("input_Procura_linhas")
    .value.toLowerCase()

  resultados
    .then(function (result) {
      while (cont.firstChild) {
        cont.removeChild(cont.firstChild)
      }

      result.forEach((element) => {
        if (
          element.short_name.toLowerCase().includes(input) ||
          element.long_name.toLowerCase().includes(input)
        ) {
          let div = document.createElement("div")
          div.setAttribute("class", "linhaDiv")

          if (element.color === "#ED1944") {
            let novaCor = "#C61D23"
          } else {
            novaCor = element.color
          }

          let linhaNumero = document.createElement("p")
          linhaNumero.setAttribute("class", "linhaNumero")
          linhaNumero.style.backgroundColor = novaCor
          linhaNumero.innerText = element.short_name

          let linhaPercurso = document.createElement("p")
          linhaPercurso.setAttribute("class", "linhaPercurso")
          linhaPercurso.innerText = element.long_name

          // Butoes Linha
          let botoesExtraLinha = document.createElement("div")
          botoesExtraLinha.setAttribute("class", "botoesExtra")

          let detalhesBtn = document.createElement("p")
          detalhesBtn.setAttribute("id", "favoritosBtn_icon")
          detalhesBtn.setAttribute("title", "Detalhes da linha")
          detalhesBtn.setAttribute(
            "onclick",
            'verDetalhes("' + element.short_name + '")'
          )
          detalhesBtn.innerHTML = '<i class="fa-regular fa-file-lines"></i>'

          let favoritoBtn = document.createElement("p")
          favoritoBtn.setAttribute("id", "favoritosBtn_icon")
          favoritoBtn.setAttribute("title", "Adicionar aos favoritos")
          favoritoBtn.setAttribute(
            "onclick",
            'favorito(event, "' + element.id + '")'
          )

          if (favoritosArray.includes(element.id)) {
            favoritoBtn.innerHTML = '<i class="fa-solid fa-heart"></i>'
          } else {
            favoritoBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'
          }

          botoesExtraLinha.appendChild(favoritoBtn)
          botoesExtraLinha.appendChild(detalhesBtn)
          div.appendChild(linhaNumero)
          div.appendChild(linhaPercurso)
          div.appendChild(botoesExtraLinha)
          cont.appendChild(div)
        }
      })
    })
    .catch(function (error) {
      snackbar("erro", "Ocorreu um erro no servidor")
      console.error(error)
    })
}

function btnRecentes() {
  let icon = document.getElementById("btnVerRecentes")

  let input = document.getElementById("input_Procura_linhas")

  if (icon.classList.contains("aberto")) {
    icon.classList.remove("aberto")
    input.removeAttribute("disabled")
    linhas()
  } else {
    icon.classList.add("aberto")
    input.value = ""
    input.setAttribute("disabled", "")
    verRecentes()
  }
}

function verRecentes() {
  let lastLines = JSON.parse(localStorage.getItem("historico_linhas")) || []
  let resultados = apiCall("lines")
  let cont = document.getElementById("linhasContainer")

  resultados
    .then(function (result) {
      while (cont.firstChild) {
        cont.removeChild(cont.firstChild)
      }

      if (lastLines.length === 0) {
        let errorMSG = document.createElement("span")
        errorMSG.innerText = "Sem linhas recentes"
        errorMSG.setAttribute("class", "erroMsg")
        cont.appendChild(errorMSG)
        return
      }

      result.forEach((element) => {
        if (lastLines.includes(element.id)) {
          let div = document.createElement("div")
          div.setAttribute("class", "linhaDiv")

          if (element.color === "#ED1944") {
            let novaCor = "#C61D23"
          } else {
            novaCor = element.color
          }

          let linhaNumero = document.createElement("p")
          linhaNumero.setAttribute("class", "linhaNumero")
          linhaNumero.style.backgroundColor = novaCor
          linhaNumero.innerText = element.short_name

          let linhaPercurso = document.createElement("p")
          linhaPercurso.setAttribute("class", "linhaPercurso")
          linhaPercurso.innerText = element.long_name

          // Botoes Linha
          let botoesExtraLinha = document.createElement("div")
          botoesExtraLinha.setAttribute("class", "botoesExtra")

          let detalhesBtn = document.createElement("p")
          detalhesBtn.setAttribute("id", "favoritosBtn_icon")
          detalhesBtn.setAttribute("title", "Detalhes da linha")
          detalhesBtn.setAttribute(
            "onclick",
            'verDetalhes("' + element.short_name + '")'
          )
          detalhesBtn.innerHTML = '<i class="fa-regular fa-file-lines"></i>'

          let favoritoBtn = document.createElement("p")
          favoritoBtn.setAttribute("id", "favoritosBtn_icon")
          favoritoBtn.setAttribute("title", "Adicionar aos favoritos")
          favoritoBtn.setAttribute(
            "onclick",
            'favorito(event, "' + element.id + '")'
          )
          favoritoBtn.innerHTML = '<i class="fa-regular fa-heart"></i>'

          botoesExtraLinha.appendChild(favoritoBtn)
          botoesExtraLinha.appendChild(detalhesBtn)
          div.appendChild(linhaNumero)
          div.appendChild(linhaPercurso)
          div.appendChild(botoesExtraLinha)
          cont.appendChild(div)
        }
      })
    })
    .catch(function (error) {
      snackbar("erro", "Ocorreu um erro no servidor")
      console.error(error)
    })
}

function btnFavoritos() {
  let icon = document.getElementById("btnVerFavoritos")

  let input = document.getElementById("input_Procura_linhas")

  if (icon.classList.contains("aberto")) {
    icon.classList.remove("aberto")
    icon.innerHTML = '<i class="fa-regular fa-heart"></i> Favoritos'
    input.removeAttribute("disabled")
    linhas()
  } else {
    icon.innerHTML = '<i class="fa-solid fa-heart"></i> Favoritos'
    icon.classList.add("aberto")
    input.value = ""
    input.setAttribute("disabled", "")
    verFavoritos()
  }
}

// See favorites stored on localStorage
function verFavoritos() {
  let resultados = apiCall("lines")
  let favoritosArray = JSON.parse(localStorage.getItem("favoritos")) || []
  let cont = document.getElementById("linhasContainer")

  resultados
    .then(function (result) {
      while (cont.firstChild) {
        cont.removeChild(cont.firstChild)
      }
      result.forEach((element) => {
        if (favoritosArray.includes(element.id)) {
          let div = document.createElement("div")
          div.setAttribute("class", "linhaDiv")

          if (element.color === "#ED1944") {
            let novaCor = "#C61D23"
          } else {
            novaCor = element.color
          }

          let linhaNumero = document.createElement("p")
          linhaNumero.setAttribute("class", "linhaNumero")
          linhaNumero.style.backgroundColor = novaCor
          linhaNumero.innerText = element.short_name

          let linhaPercurso = document.createElement("p")
          linhaPercurso.setAttribute("class", "linhaPercurso")
          linhaPercurso.innerText = element.long_name

          // Botoes Linha
          let botoesExtraLinha = document.createElement("div")
          botoesExtraLinha.setAttribute("class", "botoesExtra")

          let detalhesBtn = document.createElement("p")
          detalhesBtn.setAttribute("id", "favoritosBtn_icon")
          detalhesBtn.setAttribute("title", "Detalhes da linha")
          detalhesBtn.setAttribute(
            "onclick",
            'verDetalhes("' + element.short_name + '")'
          )
          detalhesBtn.innerHTML = '<i class="fa-regular fa-file-lines"></i>'

          let favoritoBtn = document.createElement("p")
          favoritoBtn.setAttribute("id", "favoritosBtn_icon")
          favoritoBtn.setAttribute("title", "Remover dos favoritos")
          favoritoBtn.setAttribute(
            "onclick",
            'favorito2(event, "' + element.id + '")'
          )
          favoritoBtn.innerHTML = '<i class="fa-solid fa-heart"></i>'

          botoesExtraLinha.appendChild(favoritoBtn)
          botoesExtraLinha.appendChild(detalhesBtn)
          div.appendChild(linhaNumero)
          div.appendChild(linhaPercurso)
          div.appendChild(botoesExtraLinha)
          cont.appendChild(div)
        }
      })
    })
    .catch(function (error) {
      snackbar("erro", "Ocorreu um erro no servidor")
      console.error(error)
    })
}

async function verDetalhes(id) {
  let cont = document.getElementById("detalhesLinha")
  let contAntigo = document.getElementById("display1")
  let bottomBar = document.getElementById("bottomBar")

  if (window.getComputedStyle(cont).display === "none") {
    try {
      await detalhesLinha(id)
      let lastLines = JSON.parse(localStorage.getItem("historico_linhas")) || []
      if (!lastLines.includes(id)) {
        lastLines.push(id)
        localStorage.setItem("historico_linhas", JSON.stringify(lastLines))
      }
    } catch (error) {
      console.error(error)
    }
  } else {
    fecharParametros()
    linhas()
    cont.style.display = "none"
    contAntigo.style.display = "block"
    bottomBar.style.display = "block"
  }
}

// Carregar detalhes para uma linha especifica
async function detalhesLinha(id) {
  let startTime = performance.now()
  let resultados = await apiCall("lines/" + id)
  let tituloNumero = document.getElementById("numeroTitulo")
  let tituloPercurso = document.getElementById("percursoTitulo")

  try {
    tituloNumero.innerText = resultados.short_name
    tituloNumero.style.backgroundColor = resultados.color
    tituloPercurso.innerText = resultados.long_name

    let dataAtual = new Date()
    let dataFormatada = dataAtual.toISOString().split("T")[0]
    document.getElementById("dataDetalhes").value = dataFormatada
    document
      .getElementById("dataDetalhes")
      .setAttribute("onclick", 'selecionarHora("' + +'")')

    let routeSelecionada = resultados.routes[0]

    await rotas(id)
    await selecionarRota(routeSelecionada)

    let endTime = performance.now()
    let responseTime = endTime - startTime

    console.log(
      "Tempo de resposta: " + responseTime.toFixed(2) + " milisegundos"
    )
  } catch (error) {
    snackbar("erro", "Ocorreu um erro no servidor")
    console.error(error)
  }
}

async function carregarAutocarros(pattern) {
  const fetchAndDisplayBuses = async () => {
    let resultados = await apiCall("vehicles")
    let pointFeatures = []
    let image

    try {
      resultados.forEach((result) => {
        if (result.pattern_id.trim() === pattern.trim()) {
          let coords = [result.lon, result.lat]
          pointFeatures.push({
            type: "Feature",
            properties: {
              name: result.id,
              className: "iconBus",
              bearing: result.bearing,
            },
            geometry: {
              type: "Point",
              coordinates: coords,
            },
          })
        }
      })

      const geoJsonPoints = {
        type: "FeatureCollection",
        features: pointFeatures,
      }

      if (pointFeatures.length === 0) {
        return
      }

      // Remove camada e fonte existentes se existirem
      if (map.getLayer("pointsbus")) {
        map.removeLayer("pointsbus")
      }
      if (map.getSource("pointsbus")) {
        map.removeSource("pointsbus")
      }

      // Adiciona nova fonte para pontos GeoJSON
      map.addSource("pointsbus", {
        type: "geojson",
        data: geoJsonPoints,
      })

      // Remove a imagem se já existir
      if (map.hasImage("bus-icon")) {
        map.removeImage("bus-icon")
      }

      // Carrega a imagem e adiciona-a
      image = await map.loadImage("../../IMG/busIcon.png")
      map.addImage("bus-icon", image.data)

      // Adiciona a camada com a imagem carregada
      map.addLayer({
        id: "pointsbus",
        type: "symbol",
        source: "pointsbus",
        layout: {
          "icon-image": "bus-icon",
          "icon-size": [
            "interpolate",
            ["linear", 0.5],
            ["zoom"],
            10,
            0.05,
            20,
            0.15,
          ],
          "icon-allow-overlap": true,
          "icon-offset": [0, -15],
          "icon-rotate": ["get", "bearing"],
        },
      })

      // Lida com imagens ausentes
      map.on("styleimagemissing", (e) => {
        console.log(`Image missing: ${e.id}`)
      })
    } catch (error) {
      snackbar("erro", "Ocorreu um erro no servidor")
      console.error(error)
    }
  }

  // Chamada inicial para buscar e exibir autocarros
  await fetchAndDisplayBuses()

  // Define um intervalo para atualizar os dados a cada 30 segundos
  const intervalId = setInterval(fetchAndDisplayBuses, 30000)

  // Opcional: Retorna o ID do intervalo se precisar cancelá-lo mais tarde
  return intervalId
}

// Load stops, passing times, etc of the current line
async function carregarParagens(linha, rota, pattern, data, hora, trip) {
  fecharParametros()

  let shapeID
  let cont = document.getElementById("detalhesLinha")
  let contAntigo = document.getElementById("display1")
  let bottomBar = document.getElementById("bottomBar")
  let favoritosButton = document.getElementById("btnVerFavoritos")
  let contParagens = document.getElementById("paragensContainer")
  let contHorasPassagem = document.getElementById("horasPassagemContainer")
  let borda = document.getElementById("borda")
  let paragensCount = 0

  try {
    // Espera pelos resultados e resultados em tempo real
    const result = await apiCall("patterns/" + pattern)
    const resultados_tempoReal = await apiCall(
      "patterns/" + pattern + "/realtime"
    )

    // Limpar elementos filhos existentes
    while (contParagens.firstChild)
      contParagens.removeChild(contParagens.firstChild)
    while (contHorasPassagem.firstChild)
      contHorasPassagem.removeChild(contHorasPassagem.firstChild)

    let lineStops = []
    let pointFeatures = []
    shapeID = result.shape_id

    // Utilizar for loop para iterar sobre cada paragem
    for (let paragem of result.path) {
      let div = document.createElement("div")
      div.setAttribute(
        "onclick",
        'selecionarParagem_LINHAS("' + paragem.stop.id + '")'
      )
      div.setAttribute("class", "paragem")
      div.innerText = paragem.stop.name

      let coords = [paragem.stop.lon, paragem.stop.lat]

      pointFeatures.push({
        type: "Feature",
        properties: { name: paragem.stop.name },
        geometry: { type: "Point", coordinates: coords },
      })

      let divFacilities = document.createElement("div")
      divFacilities.setAttribute("class", "facilitiesContainer")

      for (let element of paragem.stop.facilities) {
        let icon = document.createElement("i")
        switch (element) {
          case "school":
            icon.classList.add("fa-solid", "fa-graduation-cap")
            icon.setAttribute("title", "Escola")
            break
          case "subway":
            icon.classList.add("fa-solid", "fa-m")
            icon.setAttribute("title", "Metro")
            break
          case "train":
            icon.classList.add("fa-solid", "fa-train")
            icon.setAttribute("title", "Comboio")
            break
          case "hospital":
            icon.classList.add("fa-solid", "fa-circle-h")
            icon.setAttribute("title", "Hospital")
            break
        }
        divFacilities.appendChild(icon)
      }

      let divNextPassages = document.createElement("div")
      divNextPassages.setAttribute("class", "proximasPassagens")
      div.appendChild(divFacilities)
      contParagens.appendChild(div)
      paragensCount++
    }

    // Recolher informações da linha e desenhar o trajeto no mapa
    let shapeInfo = await apiCall("shapes/" + shapeID)
    lineStops = shapeInfo.geojson.geometry.coordinates.map((element) => {
      return { longitude: element[0], latitude: element[1] }
    })

    let lineStringGeojson = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: lineStops.map((stop) => [
              stop.longitude,
              stop.latitude,
            ]),
          },
        },
      ],
    }

    if (map.getLayer("lineString")) {
      map.removeLayer("lineString")
      map.removeSource("lineString")
    }
    map.addSource("lineString", { type: "geojson", data: lineStringGeojson })

    map.addLayer({
      id: "lineString",
      type: "line",
      source: "lineString",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": result.color, "line-width": 4 },
    })

    const allCoordinates = lineStringGeojson.features[0].geometry.coordinates
    const latitudes = allCoordinates.map((coord) => coord[1])
    const longitudes = allCoordinates.map((coord) => coord[0])
    const centerLatitude = (Math.max(...latitudes) + Math.min(...latitudes)) / 2
    const centerLongitude =
      (Math.max(...longitudes) + Math.min(...longitudes)) / 2
    const center = [centerLongitude, centerLatitude]

    const bounds = new maplibregl.LngLatBounds()
    allCoordinates.forEach((coord) => bounds.extend(coord))

    map.fitBounds(bounds, { padding: 50, animate: false })
    const idealZoom = map.getZoom() + 0.5
    map.jumpTo({ center: center, zoom: idealZoom })

    // Adicionar pontos ao mapa
    const geoJsonPoints = {
      type: "FeatureCollection",
      features: pointFeatures,
    }
    if (map.getLayer("points")) {
      map.removeLayer("points")
      if (map.getSource("points")) map.removeSource("points")
    }
    map.addSource("points", { type: "geojson", data: geoJsonPoints })

    map.addLayer({
      id: "points",
      type: "circle",
      source: "points",
      paint: {
        "circle-radius": 3,
        "circle-color": result.color,
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
      },
    })

    // Adicionar horários de passagem
    if (trip === null) {
      while (document.getElementById("horas_optionSelect").firstChild) {
        document
          .getElementById("horas_optionSelect")
          .removeChild(document.getElementById("horas_optionSelect").firstChild)
      }
      let div = document.createElement("div")
      div.setAttribute("class", "noHoursDisplay")
      contHorasPassagem.appendChild(div)
    } else {
      for (let element of result.trips) {
        console.log()
        if (element.id === trip) {
          for (let element2 of element.schedule) {
            let div = document.createElement("div")
            div.setAttribute("class", "horaPassagem")
            div.innerText = element2.arrival_time.substring(0, 5)
            contHorasPassagem.appendChild(div)
          }
        }
      }
    }

    borda.style.backgroundColor = result.color
    selecionarParagem_LINHAS(result.path[0].stop.id)

    // Debugging
    console.log(
      `Linha: ${linha}\nRota: ${rota}\nPattern: ${pattern}\nTrip: ${trip}\nData: ${data}\nParagens Carregadas: ${paragensCount}`
    )

    contAntigo.style.display = "none"
    cont.style.display = "block"
    bottomBar.style.display = "none"

    favoritosButton.classList.remove("aberto")
    favoritosButton.innerHTML = '<i class="fa-regular fa-heart"></i> Favoritos'
    document.getElementById("input_Procura_linhas").removeAttribute("disabled")

    carregarAutocarros(pattern)
  } catch (error) {
    snackbar("erro", "Ocorreu um erro (Detalhes do erro na consola)")
    console.error(error)
  }
}

// Select stop, show schedule for that stop
function selecionarParagem_LINHAS(id) {
  let data = localStorage.getItem("data")
  let pattern = localStorage.getItem("pattern")
  let resultados = apiCall("patterns/" + pattern)
  let horarios = []
  let cont = document.getElementById("horarioParagem")
  let tituloHorario = document.getElementById("tituloHorario")
  let paragemResultados = apiCall("stops/" + id)

  paragemResultados.then((resultado) => {
    tituloHorario.innerText = "Paragem - " + resultado.name
  })

  resultados.then((result) => {
    while (cont.firstChild) {
      cont.removeChild(cont.firstChild)
    }

    let legenda = document.createElement("ul")
    legenda.setAttribute("class", "horario-legenda")

    let legendaLi = document.createElement("li")
    legendaLi.innerText = "Hora"
    legenda.appendChild(legendaLi)
    let legendaLi2 = document.createElement("li")
    legendaLi2.innerText = "Min."
    legenda.appendChild(legendaLi2)

    cont.appendChild(legenda)

    result.trips.forEach((trip) => {
      if (trip.dates.includes(data)) {
        trip.schedule.forEach((schedule) => {
          if (schedule.stop_id === id) {
            horarios.push(schedule.arrival_time.substring(0, 5))
            horarios.sort((a, b) => {
              const timeA = parseArrivalTime(a)
              const timeB = parseArrivalTime(b)
              return timeA - timeB
            })
          }
        })
      }
    })

    let horariosTamanho = horarios.length
    let horasVerificadas = []

    if (horariosTamanho === 0) {
      document.getElementById("horarioParagemCont").style.display = "none"
    } else {
      document.getElementById("horarioParagemCont").style.display = "block"
    }

    for (let i = 0; i < horariosTamanho; i++) {
      let horaCorrente = horarios[i].substring(0, 2)

      if (!horasVerificadas.includes(horaCorrente)) {
        horasVerificadas.push(horaCorrente)

        let ul = document.createElement("ul")
        ul.setAttribute("class", "horario-tempo")

        let liHora = document.createElement("li")
        liHora.innerText = horaCorrente

        ul.appendChild(liHora)

        for (let j = 0; j < horariosTamanho; j++) {
          if (horarios[j].substring(0, 2) == horaCorrente) {
            let liMinuto = document.createElement("li")
            liMinuto.innerText = horarios[j].substring(3, 5)

            ul.appendChild(liMinuto)
          }
        }
        cont.appendChild(ul)
      }
    }
  })

  function parseArrivalTime(arrivalTime) {
    const timeParts = arrivalTime.split(":")
    const hours = parseInt(timeParts[0])
    const minutes = parseInt(timeParts[1])
    const adjustedHours = hours >= 4 ? hours - 24 : hours
    return adjustedHours * 60 + minutes
  }
}

// Select which time the user wants to see details for
async function selecionarHora(horaClick) {
  let linha = localStorage.getItem("linha")
  let rota = localStorage.getItem("rota")
  let pattern = localStorage.getItem("pattern")
  let data = localStorage.getItem("data")
  let horaSimples, horaAtual
  let resultados = apiCall("patterns/" + pattern)
  let display = document.getElementById("textoSelectHoras")
  let horaSelect = document.getElementById("horas_optionSelect")

  resultados.then((result) => {
    try {
      const tripsForSelectedDate = result.trips.filter((element) =>
        element.dates.includes(data)
      )
      let isFirstHoraSet = false
      let lastItem = null
      let itemCounter = 0
      let date = new Date()
      horaAtual = `${date.getHours()}${date
        .getMinutes()
        .toString()
        .padStart(2, "0")}`

      if (tripsForSelectedDate.length === 0) {
        display.innerText = "--:--"
        carregarParagens(linha, rota, pattern, data, horaClick, null)
      } else {
        if (horaClick != null) {
          tripsForSelectedDate.forEach((element) => {
            if (
              element.dates.includes(data) &&
              element.schedule[0].arrival_time.substring(0, 5) == horaClick
            ) {
              display.innerText = horaClick.substring(0, 5)
              carregarParagens(
                linha,
                rota,
                pattern,
                data,
                horaClick,
                element.id
              )
            }
          })
        } else {
          while (horaSelect.firstChild) {
            horaSelect.removeChild(horaSelect.firstChild)
          }

          tripsForSelectedDate.sort((a, b) => {
            const timeA = parseArrivalTime(a.schedule[0].arrival_time)
            const timeB = parseArrivalTime(b.schedule[0].arrival_time)
            return timeA - timeB
          })

          let firstHourOfDay = null
          let selectedHourForCarregarParagens = null

          tripsForSelectedDate.forEach((element) => {
            lastItem = tripsForSelectedDate.length
            itemCounter++

            let hora = element.schedule[0].arrival_time
            horaSimples = hora.substring(0, 2) + ":" + hora.substring(3, 5)
            let horaTemp = hora.substring(0, 2) + hora.substring(3, 5)
            let horaID = "hora_" + hora.substring(0, 2) + hora.substring(3, 5)

            if (!firstHourOfDay) {
              firstHourOfDay = horaSimples
            }

            const parsedHoraTemp = parseInt(horaTemp, 10)
            const parsedHoraAtual = parseInt(horaAtual, 10)
            const adjustedHoraTemp =
              parsedHoraTemp < 400 ? parsedHoraTemp + 2400 : parsedHoraTemp

            if (adjustedHoraTemp > parsedHoraAtual && !isFirstHoraSet) {
              display.innerText = horaSimples
              selectedHourForCarregarParagens = horaSimples
              isFirstHoraSet = true

              // Automatically call the function with the displayed hour
              carregarParagens(
                linha,
                rota,
                pattern,
                data,
                selectedHourForCarregarParagens,
                element.id
              )
            }
            if (itemCounter == lastItem && !isFirstHoraSet) {
              display.innerText = firstHourOfDay
              selectedHourForCarregarParagens = firstHourOfDay
              isFirstHoraSet = true

              // Automatically call the function with the first hour of the day
              carregarParagens(
                linha,
                rota,
                pattern,
                data,
                selectedHourForCarregarParagens,
                element.id
              )
            }

            // Create the div and append the hour
            let div = document.createElement("div")
            div.setAttribute("class", "hora")
            div.setAttribute("id", horaID)

            let novaHora = document.createElement("span")
            novaHora.setAttribute(
              "onclick",
              'selecionarHora("' + horaSimples + '")'
            )
            novaHora.innerText = horaSimples

            div.appendChild(novaHora)
            horaSelect.appendChild(div)
          })
        }
      }
    } catch (error) {
      snackbar("erro", "Ocorreu um erro no servidor")
      console.error(error)
    }
  })

  function parseArrivalTime(arrivalTime) {
    const timeParts = arrivalTime.split(":")
    const hours = parseInt(timeParts[0])
    const minutes = parseInt(timeParts[1])
    const adjustedHours = hours < 4 ? hours + 24 : hours
    return adjustedHours * 60 + minutes
  }
}

document.addEventListener("DOMContentLoaded", function () {
  map = new maplibregl.Map({
    container: "map",
    style:
      "https://api.jawg.io/styles/jawg-dark.json?access-token=zyLDUYMkhQ8nsbh3NFInHcUxLoxFUPjIVXadZWrhSSKlG9LRXFceIrP4vMErY9dy",
    center: [-9.0, 38.7],
    zoom: 9,
  })
  maplibregl.setRTLTextPlugin(
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.min.js",
    null,
    true
  )
})

// Select date
function selecionarDia() {
  let data = document.getElementById("dataDetalhes").value
  let dataTransformada = data.replace(/-/g, "")

  localStorage.setItem("data", dataTransformada) //   AAAAMMDD (Ex: 20240101)
  selecionarHora()
}

// Select Direction
function selecionarSentido(id) {
  let resultados = apiCall("patterns/" + id)
  let display = document.getElementById("textoSelectSentido")

  resultados.then(function (result) {
    try {
      display.innerText = result.headsign

      localStorage.setItem("linha", result.line_id) //   XXXX  (1001)
      localStorage.setItem("rota", result.route_id) //   XXXX_X  (1001_0)
      localStorage.setItem("pattern", result.id) //      XXXX_X_X  (1001_0_1)

      selecionarDia()
    } catch (error) {
      snackbar("erro", "Ocorreu um erro (Detalhes do erro na consola)")
      console.error(error)
    }
  })
}

// Select Route
async function selecionarRota(id) {
  let resultados = apiCall("routes/" + id)
  let display = document.getElementById("textoSelectRota")
  let sentidoSelect = document.getElementById("sentido_optionSelect")

  resultados.then(function (result) {
    try {
      while (sentidoSelect.firstChild) {
        sentidoSelect.removeChild(sentidoSelect.firstChild)
      }
      result.patterns.forEach((element, index) => {
        let resultadosPatterns = apiCall("patterns/" + element)
        resultadosPatterns.then(function (resultPattern) {
          let div = document.createElement("div")
          div.setAttribute("class", "sentido")

          let novoSentido = document.createElement("span")
          novoSentido.setAttribute(
            "onclick",
            'selecionarSentido("' + resultPattern.id + '")'
          )
          novoSentido.innerText = resultPattern.headsign

          div.appendChild(novoSentido)
          sentidoSelect.appendChild(div)

          if (index === 0) {
            selecionarSentido(resultPattern.id)
            display.innerText = result.long_name
          }
        })
      })
    } catch (error) {
      snackbar("erro", "Ocorreu um erro (Detalhes do erro na consola)")
      console.error(error)
    }
  })
}

// Load all the routes for a line
async function rotas(id) {
  let cont = document.getElementById("rota_optionSelect")
  let index = 0

  while (cont.firstChild) {
    cont.removeChild(cont.firstChild)
  }

  try {
    let resultados = apiCall("lines/" + id)
    resultados.then(function (result) {
      result.routes.forEach((element) => {
        let resultadosRoutes = apiCall("routes/" + element)

        resultadosRoutes.then(function (resultRoute) {
          let div = document.createElement("div")
          div.setAttribute("class", "sentido")

          let noletota = document.createElement("span")
          noletota.setAttribute(
            "onclick",
            'selecionarRota("' + resultRoute.id + '")'
          )
          noletota.innerText = resultRoute.long_name

          if (index === 0) {
            document.getElementById("textoSelectRota").innerText =
              resultRoute.long_name
          }

          div.appendChild(noletota)
          cont.appendChild(div)

          index++
        })
      })
    })
  } catch (error) {
    snackbar("erro", "Ocorreu um erro (Detalhes do erro na consola)")
    console.error(error)
  }
}

// Custom select menus
function select(menu) {
  let menuOp = document.getElementById(menu + "_optionSelect")
  let icon = document.querySelector("#" + menu + "_iconSelect i")

  if (window.getComputedStyle(menuOp).display === "none") {
    menuOp.style.display = "block"
    icon.style.transform = "rotate(180deg)"
  } else {
    menuOp.style.display = "none"
    icon.style.transform = "rotate(0deg)"
  }
}

// Add / Remove favorites
function favorito(event, id, extra) {
  event.stopPropagation()
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || []
  let index = favoritos.indexOf(id)
  if (index === -1) {
    favoritos.push(id)
    snackbar("favoritosAdd", id + " - Linha adicionada aos favoritos")
  } else {
    favoritos.splice(index, 1)
    snackbar("favoritosRem", id + " - Linha removida aos favoritos")
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos))
  linhas()
}

function favorito2(event, id) {
  event.stopPropagation()
  let favoritos = JSON.parse(localStorage.getItem("favoritos")) || []
  let index = favoritos.indexOf(id)
  if (index === -1) {
    favoritos.push(id)
    snackbar("favoritosAdd", id + " - Linha adicionada aos favoritos")
  } else {
    favoritos.splice(index, 1)
    snackbar("favoritosRem", id + " - Linha removida aos favoritos")
  }

  localStorage.setItem("favoritos", JSON.stringify(favoritos))
  verFavoritos()
}

// Reset select menus
function fecharParametros() {
  document.getElementById("sentido_optionSelect").style.display = "none"
  document.getElementById("rota_optionSelect").style.display = "none"
  document.getElementById("horas_optionSelect").style.display = "none"
  document.querySelector("#sentido_iconSelect i").style.transform =
    "rotate(0deg)"
  document.querySelector("#rota_iconSelect i").style.transform = "rotate(0deg)"
  document.querySelector("#horas_iconSelect i").style.transform = "rotate(0deg)"
}
