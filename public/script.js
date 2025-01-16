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
function homeFunctions() {

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