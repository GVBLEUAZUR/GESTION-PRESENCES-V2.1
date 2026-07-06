/*
=====================================================
GESTION PRÉSENCES V2.2
Scanner QR Code
=====================================================
*/

let scanner = null;
let scannerActif = false;
let scanEnCours = false;

document.addEventListener("DOMContentLoaded", () => {

    document
        .getElementById("btnScanner")
        .addEventListener("click", lancerScanner);

});


async function lancerScanner() {

    if (scannerActif) return;

    scanEnCours = false;

    const message = document.getElementById("message");
    message.innerHTML = "Ouverture de la caméra...";

    scanner = new Html5Qrcode("reader");

    try {

        await scanner.start(

            {
                facingMode: "environment"
            },

            {
                fps: 10,
                qrbox: 250
            },

            lectureQRCode

        );

        scannerActif = true;

    }

    catch (erreur) {

        message.innerHTML =
            "Erreur caméra :<br><br>" + erreur;

    }

}


async function lectureQRCode(code) {

    if (scanEnCours) {
        return;
    }

    scanEnCours = true;

    const message = document.getElementById("message");

    message.innerHTML =
        "QR Code détecté :<br><br><b>" + code + "</b>";

    try {

        if (scanner) {

            await scanner.stop();

            scanner.clear();

            scannerActif = false;

        }

        const reponse = await fetch(CONFIG.API_URL, {

            method: "POST",

            body: JSON.stringify({
                qr: code
            })

        });

        const resultat = await reponse.json();

        message.innerHTML +=
            "<br><br><span style='color:green'>" +
            resultat.message +
            "</span>";

    }

    catch (erreur) {

        message.innerHTML +=
            "<br><br><span style='color:red'>Erreur de communication avec le serveur</span>";

        console.error(erreur);

    }

    finally {

        scanEnCours = false;

    }

}