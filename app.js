// Array di ristoranti a Genova
const ristorantiGenova = [
  {
    nome: "Trattoria Da Mario",
    indirizzo: "Via Canneto il Lungo 29r, Genova",
    categoria: "Trattoria",
    specialita: "Pansoti al sugo di noci",
    valutazione: 4.5,
    num_recensioni: 186,
    linkGoogle: "https://maps.app.goo.gl/uiYyJVC5EzqqpZ2c6",
    latitude: 44.408686,
    longitude: 8.949915
  },
  {
    nome: "Ristorante Il Genovese",
    indirizzo: "Via Galata 35R, Genova",
    categoria: "Ristorante",
    specialita: "Trenette al pesto",
    valutazione: 3.7,
    num_recensioni: 1164,
    linkGoogle: "https://maps.app.goo.gl/sXnuqWrfoYEsLNUa7",
    latitude: 44.407077,
    longitude: 8.952112
  },
  {
    nome: "Osteria del Raviolo",
    indirizzo: "Vico Falamonica 9R, Genova",
    categoria: "Osteria",
    specialita: "Ravioli alla genovese",
    valutazione: 4.3,
    num_recensioni: 237,
    linkGoogle: "https://maps.app.goo.gl/example3",
    latitude: 44.403580,
    longitude: 8.956233
  }
];

// Raggio di ricerca in metri
const SEARCH_RADIUS = 1000; // 1000 metri (1 km)

// Funzione per ottenere la posizione dell'utente
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La geolocalizzazione non è supportata da questo browser"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      position => {
        console.log("Posizione utente ottenuta:", position.coords);
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
      },
      error => {
        console.error("Errore di geolocalizzazione:", error);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error("L'utente ha negato il permesso di geolocalizzazione"));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error("Informazioni sulla posizione non disponibili"));
            break;
          case error.TIMEOUT:
            reject(new Error("Timeout nella richiesta di posizione"));
            break;
          default:
            reject(new Error("Errore sconosciuto nella geolocalizzazione"));
            break;
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

// Funzione per calcolare la distanza tra due punti usando la formula di Haversine
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Raggio della Terra in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c * 1000; // Distanza in metri
  return distance;
}

// Funzione per trovare i ristoranti nel raggio specificato
function findNearbyRistoranti(userLocation, ristoranti, radius) {
  const nearbyRistoranti = [];

  console.log("Cercando ristoranti nel raggio di", radius, "metri");
  console.log("Posizione utente:", userLocation);
  console.log("Numero di ristoranti da controllare:", ristoranti.length);

  // Estrai le coordinate dalla posizione utente
  const { latitude: userLat, longitude: userLon } = userLocation;

  // Itera attraverso tutti i ristoranti
  ristoranti.forEach(ristorante => {
    // Ottieni le coordinate del ristorante
    const ristoranteLat = ristorante.latitude;
    const ristoranteLon = ristorante.longitude;

    // Calcola la distanza tra l'utente e il ristorante
    const distance = calculateDistance(userLat, userLon, ristoranteLat, ristoranteLon);

    console.log(`Ristorante ${ristorante.nome} a ${Math.round(distance)} metri di distanza`);

    // Se il ristorante è entro il raggio specificato, aggiungilo all'elenco
    if (distance <= radius) {
      nearbyRistoranti.push({
        ...ristorante,
        distance: Math.round(distance) // Arrotonda la distanza
      });
    }
  });

  console.log("Ristoranti trovati nelle vicinanze:", nearbyRistoranti.length);

  // Ordina i ristoranti per distanza
  return nearbyRistoranti.sort((a, b) => a.distance - b.distance);
}

// Funzione per richiedere il permesso di inviare notifiche push
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Questo browser non supporta le notifiche desktop');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    console.log("Permesso notifiche:", permission);
    return permission === 'granted';
  } catch (error) {
    console.error('Errore nella richiesta di permesso per le notifiche:', error);
    return false;
  }
}

// Funzione per inviare una notifica all'utente
function sendNotification(title, options) {
  if (!('Notification' in window)) {
    console.log('Questo browser non supporta le notifiche desktop');
    return;
  }

  if (Notification.permission === 'granted') {
    return new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        return new Notification(title, options);
      }
    });
  }
}

// Funzione principale per trovare i ristoranti vicini e inviare notifiche
async function findNearbyRistorantiAndNotify() {
  try {
    // Mostra un indicatore di caricamento
    document.getElementById('loadingIndicator').style.display = 'block';
    document.getElementById('errorContainer').style.display = 'none';

    console.log("Avvio ricerca ristoranti nelle vicinanze...");

    // Richiedi il permesso per le notifiche
    const notificationPermissionGranted = await requestNotificationPermission();

    // Ottieni la posizione dell'utente
    let userLocation;
    try {
      userLocation = await getUserLocation();
    } catch (geoError) {
      console.error("Errore di geolocalizzazione:", geoError);

      // Mostra tutti i ristoranti direttamente
      const allRistoranti = ristorantiGenova.map(ristorante => ({
        ...ristorante,
        distance: "N/D"  // Distanza non disponibile
      }));

      // Nascondi l'indicatore di caricamento
      document.getElementById('loadingIndicator').style.display = 'none';

      // Mostra un messaggio di errore
      displayError("Non è stato possibile ottenere la tua posizione. Vengono mostrati tutti i ristoranti.");

      // Visualizza tutti i ristoranti
      displayNearbyRistoranti(allRistoranti);

      // Ritorna per evitare di eseguire il resto della funzione
      return allRistoranti;
    }

    // Trova i ristoranti nelle vicinanze usando il raggio definito (1000 metri)
    const nearbyRistoranti = findNearbyRistoranti(userLocation, ristorantiGenova, SEARCH_RADIUS);

    // Nascondi l'indicatore di caricamento
    document.getElementById('loadingIndicator').style.display = 'none';

    // Se non ci sono ristoranti nel raggio, mostra tutti i ristoranti
    if (nearbyRistoranti.length === 0) {
      console.log("Nessun ristorante trovato nel raggio specificato, mostro tutti i ristoranti");
      const allRistoranti = ristorantiGenova.map(ristorante => ({
        ...ristorante,
        distance: "N/D"  // Distanza non disponibile
      }));
      displayNearbyRistoranti(allRistoranti);
      displayError(`Nessun ristorante trovato nel raggio di ${SEARCH_RADIUS / 1000} km. Vengono mostrati tutti i ristoranti disponibili.`);
      return allRistoranti;
    }

    // Aggiorna l'interfaccia utente con i risultati
    displayNearbyRistoranti(nearbyRistoranti);

    // Se ci sono ristoranti nelle vicinanze e l'utente ha concesso il permesso, invia una notifica
    if (nearbyRistoranti.length > 0 && notificationPermissionGranted) {
      const options = {
        body: `Ci sono ${nearbyRistoranti.length} ristoranti entro ${SEARCH_RADIUS / 1000} km dalla tua posizione!`,
        icon: '/icons/restaurant-icon.png'
      };

      sendNotification('Ristoranti nelle vicinanze', options);
    }

    return nearbyRistoranti;
  } catch (error) {
    console.error('Errore nel trovare i ristoranti vicini:', error);

    // Nascondi l'indicatore di caricamento
    document.getElementById('loadingIndicator').style.display = 'none';

    displayError(error.message);

    // Mostra comunque tutti i ristoranti se c'è un errore
    console.log("Mostro tutti i ristoranti a causa dell'errore");
    const allRistoranti = ristorantiGenova.map(ristorante => ({
      ...ristorante,
      distance: "N/D"  // Distanza non disponibile
    }));
    displayNearbyRistoranti(allRistoranti);

    return allRistoranti;
  }
}

// Funzione per visualizzare i ristoranti nelle vicinanze sull'interfaccia utente
function displayNearbyRistoranti(ristoranti) {
  const container = document.getElementById('nearbyPizzerieContainer');

  if (!container) {
    console.error('Container per i ristoranti vicini non trovato');
    return;
  }

  // Pulisci il contenitore
  container.innerHTML = '';

  if (ristoranti.length === 0) {
    container.innerHTML = '<p class="no-results">Nessun ristorante trovato nel raggio di ' + (SEARCH_RADIUS / 1000) + ' km.</p>';
    return;
  }

  // Crea un elemento per ogni ristorante
  ristoranti.forEach(ristorante => {
    const ristoranteElement = document.createElement('div');
    ristoranteElement.className = 'pizzeria-card';
    ristoranteElement.innerHTML = `
      <h3>${ristorante.nome}</h3>
      <p>${ristorante.indirizzo}</p>
      <p>Categoria: ${ristorante.categoria}</p>
      <p>Specialità: ${ristorante.specialita}</p>
      <p>Valutazione: ${ristorante.valutazione}/5 (${ristorante.num_recensioni} recensioni)</p>
      <p>Distanza: ${ristorante.distance} metri</p>
      <a href="#" data-link="${ristorante.linkGoogle}" class="maps-link">Visualizza su Maps</a>
    `;

    // Importante: prima assicuriamoci che il ristorante esista nel database
    if (window.pizzeriaAnalytics) {
      window.pizzeriaAnalytics.ensurePizzeriaExists(ristorante);
    }

    // Traccia la visualizzazione del ristorante 
    // Importante: Aggiungiamo un ritardo per assicurarci che analytics.js sia caricato
    setTimeout(() => {
      if (window.pizzeriaAnalytics) {
        console.log("Tracciamento visualizzazione ristorante:", ristorante.nome);
        window.pizzeriaAnalytics.trackPizzeriaView(ristorante);
      } else {
        console.error("Modulo analytics non trovato!");
      }
    }, 100);

    // Aggiungi event listener per il click su Maps
    const mapsLink = ristoranteElement.querySelector('.maps-link');
    mapsLink.addEventListener('click', function(e) {
      e.preventDefault();

      // Traccia il click su Maps
      if (window.pizzeriaAnalytics) {
        console.log("Tracciamento click su Maps per:", ristorante.nome);
        window.pizzeriaAnalytics.trackMapClick(ristorante);
      }

      // Apri il link in una nuova finestra
      window.open(this.getAttribute('data-link'), '_blank');
    });

    container.appendChild(ristoranteElement);
  });

  // Notifica utente che i dati sono tracciati
  const noticeElement = document.createElement('div');
  noticeElement.style.marginTop = '20px';
  noticeElement.style.padding = '10px';
  noticeElement.style.backgroundColor = '#E8F5E9';
  noticeElement.style.color = '#2E7D32';
  noticeElement.style.borderRadius = '4px';
  noticeElement.style.fontSize = '14px';
  noticeElement.textContent = 'Le interazioni con i ristoranti vengono tracciate per fini analitici.';
  container.appendChild(noticeElement);
}

// Funzione per visualizzare un messaggio di errore
function displayError(message) {
  const container = document.getElementById('errorContainer');

  if (!container) {
    console.error('Container per gli errori non trovato');
    return;
  }

  container.textContent = message;
  container.style.display = 'block';

  // Nascondi il messaggio dopo 5 secondi
  setTimeout(() => {
    container.style.display = 'none';
  }, 5000);
}

// Funzione per mostrare errore su geolocalizzazione e procedere comunque
function handleGeoError() {
  displayError("Non è stato possibile ottenere la tua posizione. Verranno mostrati tutti i ristoranti disponibili.");

  // Mostra tutti i ristoranti
  const allRistoranti = ristorantiGenova.map(ristorante => ({
    ...ristorante,
    distance: "N/D"  // Distanza non disponibile
  }));

  displayNearbyRistoranti(allRistoranti);
}

// Inizializza l'app quando la pagina è caricata
document.addEventListener('DOMContentLoaded', () => {
  console.log("Pagina caricata, inizializzazione app...");
  console.log("Raggio di ricerca impostato a:", SEARCH_RADIUS, "metri");

  // Aggiungi event listener al pulsante per cercare manualmente
  const searchButton = document.getElementById('findNearbyPizzerieButton');

  if (searchButton) {
    console.log("Pulsante di ricerca trovato, aggiunto event listener");
    searchButton.addEventListener('click', findNearbyRistorantiAndNotify);
  } else {
    console.error("Pulsante di ricerca non trovato!");
  }

  // Avvia automaticamente la ricerca all'avvio dell'applicazione
  setTimeout(() => {
    try {
      findNearbyRistorantiAndNotify().catch(err => {
        console.error("Errore durante la ricerca automatica:", err);
        handleGeoError();
      });
    } catch (e) {
      console.error("Eccezione durante l'avvio:", e);
      handleGeoError();
    }
  }, 1000);
});