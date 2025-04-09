// analytics.js - Sistema di tracciamento per i ristoranti con Firebase

// Funzione per registrare una visualizzazione di ristorante
function trackPizzeriaView(ristorante) {
  if (!ristorante || !ristorante.nome) {
    console.error("Dati ristorante non validi", ristorante);
    return;
  }

  console.log(`Visualizzazione registrata per: ${ristorante.nome}`);

  try {
    // Crea un ID sicuro per il ristorante (senza caratteri speciali)
    const ristoranteId = ristorante.nome.replace(/[.#$/[\]]/g, '_');

    // Riferimento al database per le analytics
    const analyticsRef = window.firebaseDB.ref('analytics/' + ristoranteId);

    // Prima otteniamo i dati attuali
    analyticsRef.once('value')
      .then((snapshot) => {
        let currentData = snapshot.val() || {
          totalViews: 0,
          clicksToMaps: 0,
          lastViewed: null
        };

        // Incrementiamo il contatore di visualizzazioni
        currentData.totalViews += 1;
        currentData.lastViewed = new Date().toISOString();

        // Aggiorniamo il database
        analyticsRef.set(currentData)
          .then(() => console.log("Dati analytics salvati in Firebase per:", ristorante.nome))
          .catch(error => console.error("Errore nell'aggiornamento Firebase:", error));
      })
      .catch(error => {
        console.error("Errore nel recupero dati da Firebase:", error);
      });
  } catch (error) {
    console.error('Errore nel tracciamento della visualizzazione:', error);
  }
}

// Funzione per registrare un click su Maps
function trackMapClick(ristorante) {
  if (!ristorante || !ristorante.nome) {
    console.error("Dati ristorante non validi", ristorante);
    return;
  }

  console.log(`Click su Maps registrato per: ${ristorante.nome}`);

  try {
    // Crea un ID sicuro per il ristorante (senza caratteri speciali)
    const ristoranteId = ristorante.nome.replace(/[.#$/[\]]/g, '_');

    // Riferimento al database per le analytics
    const analyticsRef = window.firebaseDB.ref('analytics/' + ristoranteId);

    // Prima otteniamo i dati attuali
    analyticsRef.once('value')
      .then((snapshot) => {
        let currentData = snapshot.val() || {
          totalViews: 0,
          clicksToMaps: 0,
          lastViewed: new Date().toISOString()
        };

        // Incrementiamo il contatore di click
        currentData.clicksToMaps += 1;

        // Aggiorniamo il database
        analyticsRef.set(currentData)
          .then(() => console.log("Click Maps salvato in Firebase per:", ristorante.nome))
          .catch(error => console.error("Errore nell'aggiornamento Firebase:", error));
      })
      .catch(error => {
        console.error("Errore nel recupero dati da Firebase:", error);
      });
  } catch (error) {
    console.error('Errore nel tracciamento del click su Maps:', error);
  }
}

// Funzione per salvare informazioni di base del ristorante se non esistono già
function ensurePizzeriaExists(ristorante) {
  if (!ristorante || !ristorante.nome) {
    console.error("Dati ristorante non validi", ristorante);
    return;
  }

  try {
    // Crea un ID sicuro per il ristorante (senza caratteri speciali)
    const ristoranteId = ristorante.nome.replace(/[.#$/[\]]/g, '_');

    // Riferimento al database per i dati dei ristoranti
    const ristorantiRef = window.firebaseDB.ref('ristoranti/' + ristoranteId);

    // Controlla se il ristorante esiste già
    ristorantiRef.once('value')
      .then((snapshot) => {
        // Se il ristorante non esiste, lo aggiungiamo
        if (!snapshot.exists()) {
          // Estrai solo le informazioni di base
          const ristoranteData = {
            nome: ristorante.nome,
            indirizzo: ristorante.indirizzo || '',
            categoria: ristorante.categoria || '',
            specialita: ristorante.specialita || '',
            valutazione: ristorante.valutazione || 0,
            num_recensioni: ristorante.num_recensioni || 0,
            latitude: ristorante.latitude || 0,
            longitude: ristorante.longitude || 0,
            createdAt: new Date().toISOString()
          };

          // Salva i dati
          ristorantiRef.set(ristoranteData)
            .then(() => console.log("Informazioni ristorante salvate in Firebase:", ristorante.nome))
            .catch(error => console.error("Errore nel salvataggio dati ristorante:", error));
        }
      })
      .catch(error => {
        console.error("Errore nel controllo ristorante esistente:", error);
      });
  } catch (error) {
    console.error('Errore nel salvataggio dati ristorante:', error);
  }
}

// Funzione per verificare la connessione a Firebase
function checkFirebaseConnection() {
  console.log("Verifica connessione Firebase...");
  try {
    const connectedRef = window.firebaseDB.ref('.info/connected');
    connectedRef.on('value', (snap) => {
      if (snap.val() === true) {
        console.log('Connesso a Firebase!');
      } else {
        console.warn('Non connesso a Firebase');
      }
    });
  } catch (error) {
    console.error('Errore nella verifica connessione Firebase:', error);
  }
}

// Esporta le funzioni
window.pizzeriaAnalytics = {
  trackPizzeriaView,
  trackMapClick,
  ensurePizzeriaExists,
  checkFirebaseConnection
};

// Log di inizializzazione
console.log("Sistema di analytics inizializzato con Firebase!");

// Verifica la connessione a Firebase all'avvio
checkFirebaseConnection();