/*
=====================================================
GESTION PRÉSENCES V2.1
Scanner QR Code
=====================================================
*/

let scanner = null;
let scannerActif = false;

document.addEventListener("DOMContentLoaded", () => {

    const bouton = document.getElementById("btnScanner");

    bouton.addEventListener("click", lancerScanner);

});


async function lancerScanner() {

    if (scannerActif) return;

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

    const message = document.getElementById("message");

    message.innerHTML =
        "QR Code détecté :<br><br><b>" + code + "</b>";

    if (scanner) {

        await scanner.stop();

        scanner.clear();

        scannerActif = false;

    }

}