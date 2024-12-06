const startNav = 1
// 1 - Linhas
// 2 - Paragens
// 3 - Atualizações / Desenvolvimentos

// SNACKBAR

function snackbar(tipo, texto, duracao) {

    if (duracao === "longa") {
  
      tempo = "8000"
  
    } else {
  
      tempo = "5000"
  
    }
  
    switch (tipo) {
      case "erro":
        icon = '<i class="fa-solid fa-triangle-exclamation"></i>'
        break;
        
      case "aviso":
        icon = '<i class="fa-solid fa-bell"></i>'
        break;
        
      case "info":
        icon = '<i class="fa-solid fa-circle-exclamation"></i>'
        break;
      
      case "sucesso":
        icon = '<i class="fa-regular fa-circle-check"></i>'
        break;
      
      case "favoritosAdd":
        icon = '<i class="fa-solid fa-heart-circle-plus"></i>'
        break;
  
        case "favoritosRem":
          icon = '<i class="fa-solid fa-heart-circle-minus"></i>'
          break;
  
      default:
        break
      }
  
    var snackId = 0
  
    var div = document.createElement('div')
    div.setAttribute('class', 'snackbar')
    div.setAttribute('id', 'snackbar_' + snackId + 1)
  
    var icon_d = document.createElement('span')
    icon_d.setAttribute('class', 'icon_snackbar')
    icon_d.innerHTML = icon
  
    var texto_d = document.createElement('span')
    texto_d.setAttribute('class', 'texto_snackbar')
    texto_d.innerText = texto
  
    div.appendChild(icon_d)
    div.appendChild(texto_d)
  
    document.getElementById('snackContainer').appendChild(div)
  
    setTimeout(() => {
  
      div.style.animation = "snack_anim_fora .5s"
      
    }, tempo - 500);
  
    setTimeout(() => {
  
      div.style.animation = "snack_anim .5s"
      
      document.getElementById('snackContainer').removeChild(div)
  
    }, tempo);
}

function modal() {

  var lS = localStorage.getItem('naoMostrarNovamente_ModalAviso') || 'true'
  var modal = document.getElementById('modalAviso')

  if (lS === 'true') {
    modal.style.display = 'none'
  } else {
    modal.style.display = 'block'
  }

  bottomBar(startNav)
}

function fecharModal() {

  var cb = document.getElementById('modalCheckBox').checked
  var modal = document.getElementById('modalAviso')

  localStorage.setItem('naoMostrarNovamente_ModalAviso', cb.toString())

  modal.style.display = 'none'

}

// BOTTOM BAR

function bottomBar(aba) {
  // Get the corresponding display div
  var displayDiv = document.getElementById('display' + aba);

  // Set all display divs to be hidden
  document.getElementById('display1').style.display = 'none';
  document.getElementById('display2').style.display = 'none';
  document.getElementById('display3').style.display = 'none';

  // Show the selected display div
  displayDiv.style.display = 'block';

  switch (aba) {
    case 1:
      document.title = "Carris Metropolitana - Linhas"
      linhas()
      break;

    case 2:
      document.title = "Carris Metropolitana - Paragens"
      paragens()
      break;

    case 3:
      document.title = "Carris Metropolitana - Desenvolvimento"
      veiculos()
      break;
  
    default:
      break;
  }

  // Update the active button in the bottom bar
  var novaAba = document.getElementById('aba' + aba);
  var antigaAba = document.querySelector('button.ativo');

  antigaAba.classList.remove('ativo');
  novaAba.classList.add('ativo');
}