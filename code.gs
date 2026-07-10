/*
 * ======================================================
 * GVBLEUAZUR2 V2
 * Serveur Google Apps Script
 * ======================================================
 */

const SH_ADHERENTS = "ADHERENTS";
const SH_PLANNING = "PLANNING";
const SH_PRESENCES = "PRESENCES";


/**
 * Vérification de l'API
 */
function doGet() {

  return ContentService
    .createTextOutput("GVBLEUAZUR2 API OK")
    .setMimeType(ContentService.MimeType.TEXT);

}


/**
 * Réception d'un QR Code
 * Exemple reçu :
 * {
 *   "qr":"GVB|1548"
 * }
 */
function doPost(e) {

  try {

    const data = JSON.parse(e.postData.contents);

    if (!data.qr) {
      return reponse(false,"QR Code absent");
    }

    const morceaux = data.qr.split("|");

    if (morceaux.length != 2 || morceaux[0] != "GVB") {
      return reponse(false,"QR Code non reconnu");
    }

    const id = morceaux[1];

    const resultat = enregistrerPresence(id);

    return ContentService
      .createTextOutput(JSON.stringify(resultat))
      .setMimeType(ContentService.MimeType.JSON);

  }

  catch(err){

    return reponse(false,err.toString());

  }

}


/**
 * Réponse JSON
 */
function reponse(ok,message){

  return ContentService
    .createTextOutput(JSON.stringify({
      success:ok,
      message:message
    }))
    .setMimeType(ContentService.MimeType.JSON);

}



/**
 * Enregistre la présence
 */
function enregistrerPresence(idAdherent) {

  const classeur = SpreadsheetApp.getActiveSpreadsheet();
//---------------------------------------------------
// Recherche adhérent
//---------------------------------------------------

const feuilleAdherents = classeur.getSheetByName(SH_ADHERENTS);

const adherents = feuilleAdherents
      .getDataRange()
      .getValues();

let adherent = null;
let ligneAdherent = -1;

for (let i = 1; i < adherents.length; i++) {

    if (String(adherents[i][0]) === String(idAdherent)) {

        adherent = adherents[i];
        ligneAdherent = i + 1;
        break;

    }

}

if (adherent == null) {

    return {
        success: false,
        message: "Adhérent introuvable"
    };

}



  //---------------------------------------------------
  // Date
  //---------------------------------------------------

  const maintenant=new Date();

  const date=Utilities.formatDate(
      maintenant,
      Session.getScriptTimeZone(),
      "dd/MM/yyyy"
  );

  const heure=Utilities.formatDate(
      maintenant,
      Session.getScriptTimeZone(),
      "HH:mm"
  );

  const jours=[
      "DIMANCHE",
      "LUNDI",
      "MARDI",
      "MERCREDI",
      "JEUDI",
      "VENDREDI",
      "SAMEDI"
  ];

  const jour=jours[maintenant.getDay()];


  //---------------------------------------------------
  // Planning
  //---------------------------------------------------

  const feuillePlanning=classeur.getSheetByName(SH_PLANNING);

  const planning=feuillePlanning
        .getDataRange()
        .getValues();

let sport = "";
let salle = "";
let responsable = "";
let coursTrouve = false;

for (let i = 1; i < planning.length; i++) {

    if (planning[i][0] != jour)
        continue;

    const debut = Utilities.formatDate(
        planning[i][1],
        Session.getScriptTimeZone(),
        "HH:mm"
    );

    const fin = Utilities.formatDate(
        planning[i][2],
        Session.getScriptTimeZone(),
        "HH:mm"
    );

    if (heure >= debut && heure < fin) {

        sport = planning[i][3];
        salle = planning[i][4];
        responsable = planning[i][5];

        coursTrouve = true;

        break;

    }

}

if (!coursTrouve) {

    return {

        success: false,

        message: "Aucun cours n'est actuellement en cours."

    };

}


//---------------------------------------------------
// Vérification doublon
//---------------------------------------------------

const feuillePresences = classeur.getSheetByName(SH_PRESENCES);

const presences = feuillePresences.getDataRange().getValues();

let dejaPresent = false;

for (let i = 1; i < presences.length; i++) {

    const datePresence = Utilities.formatDate(
        new Date(presences[i][0]),
        Session.getScriptTimeZone(),
        "dd/MM/yyyy"
    );

if (
    datePresence === date &&
    String(presences[i][2]).trim().toUpperCase() === jour &&
    String(presences[i][3]) === String(adherent[0]) &&
    String(presences[i][6]).trim().toUpperCase() === String(sport).trim().toUpperCase()
) 
{

    dejaPresent = true;
    break;

}

}


if (dejaPresent) {

    return {

        success: false,

        nom: adherent[1],

        prenom: adherent[2],

        sport: sport,

        message: "Présence déjà enregistrée pour ce cours."

    };

}
//---------------------------------------------------
// Gestion abonnement / carte
//---------------------------------------------------

const typeAbonnement = String(adherent[3] || "").toUpperCase();

let solde = adherent[4];

if (typeAbonnement === "CARTE10") {

    solde = Number(solde);

    if (isNaN(solde)) {

        solde = 10;

    }

    // On décrémente toujours, même si le solde est à 0
    solde--;

    feuilleAdherents
        .getRange(ligneAdherent, 5)
        .setValue(solde);

}
//---------------------------------------------------
// Présence
//---------------------------------------------------

feuillePresences.appendRow([

    date,
    heure,
    jour,
    adherent[0],
    adherent[1],
    adherent[2],
    sport,
    salle,
    responsable

]);
  //---------------------------------------------------
  // Réponse
  //---------------------------------------------------

  return {

      success:true,

      id:adherent[0],

      nom:adherent[1],

      prenom:adherent[2],

      sport:sport,

      salle:salle,

      responsable:responsable,
      type:typeAbonnement,

solde:solde,

      message:
          "Bienvenue "
          +adherent[2]
          +" "
          +adherent[1]

  };

}
function genererQRCodes() {

  const feuille = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("ADHERENTS");

  const derniereLigne = feuille.getLastRow();

  for (let ligne = 2; ligne <= derniereLigne; ligne++) {

    const id = feuille.getRange(ligne, 1).getDisplayValue().trim();

    if (id !== "") {

      feuille.getRange(ligne, 6).setValue("GVB|" + id);

    }

  }

  SpreadsheetApp.getUi().alert("Les QR Codes ont été générés.");

}
