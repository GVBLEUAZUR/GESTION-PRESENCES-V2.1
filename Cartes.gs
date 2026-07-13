 /*
 * ======================================================
 * GVBLEUAZUR2
 * Version : V3.4
 * Gestion des cartes adhérents
 *
 * Cartes.gs
 * ======================================================
 */

/**
 * Crée automatiquement les cartes de réserve
 */
function creerCartesReserve() {

  const feuille = SpreadsheetApp
    .getActiveSpreadsheet()
    .getSheetByName("ADHERENTS");

  const donnees = feuille.getDataRange().getValues();

  // Liste des ID déjà présents
  const idsExistants = [];

  for (let i = 1; i < donnees.length; i++) {

    idsExistants.push(String(donnees[i][0]).trim());

  }

  let cartesCreees = 0;

  for (let i = 1; i <= 28; i++) {

    const id = "C" + ("000" + i).slice(-3);

    if (idsExistants.indexOf(id) !== -1) {
      continue;
    }

    feuille.appendRow([
      id,
      "DISPONIBLE",
      "CARTE",
      "CARTE10",
      10,
      ""
    ]);

    cartesCreees++;

  }

  SpreadsheetApp.getUi().alert(
    cartesCreees +
    " carte(s) de réserve créée(s)."
  );


  
}
/**
 * Génère automatiquement les QR Codes
 * pour tous les adhérents.
 */
function genererQRCodes() {

  const feuille = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("ADHERENTS");

  const derniereLigne = feuille.getLastRow();

  let compteur = 0;

  for (let ligne = 2; ligne <= derniereLigne; ligne++) {

    const id = feuille
        .getRange(ligne, 1)
        .getDisplayValue()
        .trim();

    if (id === "")
      continue;

    feuille
        .getRange(ligne, 6)
        .setValue("GVB|" + id);

    compteur++;

  }

  SpreadsheetApp.getUi().alert(
      compteur + " QR Codes générés."
  );

}
/**
 * Affiche la carte d'un adhérent
 */
function afficherCarte(ligne) {

  const feuille = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("ADHERENTS");

  const nom = feuille.getRange(ligne, 2).getDisplayValue().trim();
  const prenom = feuille.getRange(ligne, 3).getDisplayValue().trim();
  const qrCode = feuille.getRange(ligne, 6).getDisplayValue().trim();

  const modele = HtmlService.createTemplateFromFile("CartesImpression");

  modele.nomComplet = prenom + " " + nom;
  modele.qrCode = qrCode;

  const html = modele
      .evaluate()
      .setWidth(420)
      .setHeight(320);

  SpreadsheetApp.getUi().showModalDialog(
      html,
      "Carte GVBLEUAZUR2"
  );

}


/**
 * Test
 */
function afficherCarteTest() {

  afficherCarte(2);

}

/**
 * Prépare l'impression des cartes abonnements
 * (sans imprimer)
 */
function preparerImpressionAbonnements() {

  const feuille = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("ADHERENTS");

  const donnees = feuille.getDataRange().getValues();

  let nbCartes = 0;

  for (let i = 1; i < donnees.length; i++) {

    const type = String(donnees[i][3]).trim().toUpperCase();
    const imprime = String(donnees[i][6]).trim().toUpperCase();

    if (type === "ABONNEMENT" && imprime !== "OUI") {
      nbCartes++;
    }

  }

  const ui = SpreadsheetApp.getUi();

  const reponse = ui.prompt(
    "Préparation de l'impression",
    "Première étiquette libre (1 à 14) :",
    ui.ButtonSet.OK_CANCEL
  );

  if (reponse.getSelectedButton() !== ui.Button.OK) {
    return;
  }

  const premiereEtiquette = Number(reponse.getResponseText());

  if (
      isNaN(premiereEtiquette) ||
      premiereEtiquette < 1 ||
      premiereEtiquette > 14
  ) {

    ui.alert(
      "Veuillez saisir un nombre compris entre 1 et 14."
    );

    return;
  }

  const placesPremiereFeuille = 15 - premiereEtiquette;

  let nbPlanches = 1;

  if (nbCartes > placesPremiereFeuille) {

    nbPlanches += Math.ceil(
      (nbCartes - placesPremiereFeuille) / 14
    );

  }

  const reponseConfirmation = ui.alert(
      "Préparation de l'impression",
      nbCartes + " carte(s) seront imprimées.\n\n" +
      "Première étiquette : " + premiereEtiquette + "\n" +
      "Planche(s) nécessaire(s) : " + nbPlanches + "\n\n" +
      "Les cartes déjà imprimées ne seront pas réimprimées.\n\n" +
      "Continuer ?",
      ui.ButtonSet.YES_NO
  );

  if (reponseConfirmation !== ui.Button.YES) {
    return;
  }

  ui.alert(
      "Très bien.\n\n" +
      "La génération des planches sera la prochaine étape."
  );
 }
 /**
 * Aperçu d'une planche A4
 */
function afficherPlancheTest() {

  const html = HtmlService
      .createHtmlOutputFromFile("PlancheCartes")
      .setWidth(900)
      .setHeight(700);

  SpreadsheetApp.getUi()
      .showModalDialog(html, "Planche d'impression GVBLEUAZUR2");

}

/**
 * Prépare la liste des cartes à imprimer
 */
function cartes_PreparerDonnees() {

  const feuille = SpreadsheetApp
      .getActiveSpreadsheet()
      .getSheetByName("ADHERENTS");

  const donnees = feuille.getDataRange().getValues();

  const cartes = [];

  for (let i = 1; i < donnees.length; i++) {

    const type = String(donnees[i][3]).trim().toUpperCase();
    const imprime = String(donnees[i][6]).trim().toUpperCase();

    if ((type === "ABONNEMENT" || type === "CARTE10") && imprime !== "OUI") {

      cartes.push({

        ligne: i + 1,
        id: donnees[i][0],
        nomComplet: donnees[i][2] + " " + donnees[i][1],
        qrCode: "GVB|" + donnees[i][0]

      });

    }

  }


return cartes;

}
/**
 * Affiche la première carte automatiquement
 */
function afficherPremiereCarte() {

  const cartes = cartes_PreparerDonnees();

  if (cartes.length === 0) {

    SpreadsheetApp.getUi().alert(
      "Aucune carte à imprimer."
    );

    return;
  }

  const ui = SpreadsheetApp.getUi();

  const reponse = ui.prompt(
    "Impression des cartes",
    "Première étiquette disponible (1 à 14) :",
    ui.ButtonSet.OK_CANCEL
  );

  if (reponse.getSelectedButton() != ui.Button.OK) {
    return;
  }

  const premiereEtiquette = Number(reponse.getResponseText());

  if (isNaN(premiereEtiquette) ||
      premiereEtiquette < 1 ||
      premiereEtiquette > 14) {

    ui.alert("Veuillez saisir un nombre entre 1 et 14.");

    return;
  }

  const planche = cartes_PreparerPlanche(cartes, premiereEtiquette);

 

  const modele = HtmlService.createTemplateFromFile("PlancheCartes");

  modele.cartes = planche;
  modele.premiereEtiquette = premiereEtiquette;

  const html = modele
      .evaluate()
      .setWidth(900)
      .setHeight(700);

  ui.showModalDialog(
      html,
      "Première carte"
  );
}
/**
 * Prépare une planche de 14 emplacements
 */
function cartes_PreparerPlanche(cartes, premiereEtiquette) {

  const planche = new Array(14).fill(null);

  let position = premiereEtiquette - 1;

  for (let i = 0; i < cartes.length && position < 14; i++) {

    planche[position] = cartes[i];

    position++;

  }

  return planche;

}