const startingNav = 1

function bottomBar(page) {
  document.getElementById('display1').style.display = 'none';
  document.getElementById('display2').style.display = 'none';
  document.getElementById('display3').style.display = 'none';
  document.getElementById('display4').style.display = 'none';

  var displayDiv = document.getElementById('display' + page);
  displayDiv.style.display = 'block';

  switch (page) {
    case 1:
      document.title = "Carris Metropolitana - Inicio"
      // home()
      break;

    case 2:
      document.title = "Carris Metropolitana - Linhas"
      // lines()
      break;

    case 3:
      document.title = "Carris Metropolitana - Paragens"
      // stops()
      break;

    case 4:
      document.title = "Carris Metropolitana - Definições"
      // settings()
      break;
  
    default:
      break;
  }

  var novaAba = document.getElementById('page' + page);
  var antigaAba = document.querySelector('.navItem.active');

  antigaAba.classList.remove('active');
  novaAba.classList.add('active');
}

bottomBar(startingNav)