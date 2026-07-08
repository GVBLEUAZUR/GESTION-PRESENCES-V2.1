/*
=====================================================
GESTION PRÉSENCES V3.1.1
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

    message.innerHTML = "📷 Ouverture de la caméra...";

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
            "<div class='erreur'>❌ Impossible d'accéder à la caméra.<br><br>" +
            erreur +
            "</div>";

    }

}

async function lectureQRCode(code) {

    if (scanEnCours) return;

    scanEnCours = true;

    const message = document.getElementById("message");

    message.innerHTML = `
        <div class="attente">
            🔍 QR Code détecté
            <br><br>
            <small>${code}</small>
        </div>
    `;

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

        if (resultat.success) {
message.innerHTML = `
    <div class="confirmation">

        <h2>✅ PRÉSENCE VALIDÉE</h2>

        <h3>${resultat.prenom} ${resultat.nom}</h3>

        <p><strong>Activité :</strong> ${resultat.sport || "-"}</p>

        ${
            resultat.type === "CARTE10"
            ? `<p><strong>🎟 Carte 10 séances</strong></p>
               <p><strong>Séances restantes :</strong> ${resultat.solde}</p>`
            : `<p><strong>⭐ Abonnement</strong></p>`
        }

        <p>${resultat.message}</p>

    </div>
`;

        } else {

            message.innerHTML = `
                <div class="erreur">
                    <h2>❌ ERREUR</h2>

                    <p>${resultat.message}</p>
                </div>
            `;

        }

        setTimeout(() => {

            message.innerHTML = `
                <div class="pret">
                    📷<br><br>
                    Prêt pour un nouveau scan
                </div>
            `;

        }, 9000);

    }

    catch (erreur) {

        message.innerHTML = `
            <div class="erreur">
                ❌ Erreur de communication avec le serveur
            </div>
        `;

        console.error(erreur);

    }

    finally {

        scanEnCours = false;

    }

}