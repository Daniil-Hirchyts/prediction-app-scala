document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM pour la génération
    const prefixeInput = document.getElementById('prefixe-input');
    const tailleNGramGen = document.getElementById('taille-ngram-gen');
    const nombreMots = document.getElementById('nombre-mots');
    const generateBtn = document.getElementById('generate-btn');
    const generatedTextContainer = document.querySelector('.generated-text');

    // Si ces éléments n'existent pas sur cette page, sortir
    if (!prefixeInput || !tailleNGramGen || !nombreMots || !generateBtn || !generatedTextContainer) return;

    // Gestionnaire d'événements pour le bouton de génération
    generateBtn.addEventListener('click', () => {
        const prefixe = prefixeInput.value.trim();
        const taille = tailleNGramGen.value;
        const nombre = nombreMots.value;
        console.log("Génération de texte: prefixe =", prefixe, "taille =", taille, "nombre =", nombre);

        if (prefixe) {
            genererTexte(prefixe, taille, nombre);
        } else {
            generatedTextContainer.innerHTML = '<p>Veuillez entrer un préfixe</p>';
        }
    });

    // Fonction pour générer du texte à partir du serveur
    async function genererTexte(prefixe, taille, nombre) {
        try {
            // Afficher un indicateur de chargement
            generatedTextContainer.innerHTML = '<p>Génération en cours...</p>';

            const url = `/api/generer?prefixe=${encodeURIComponent(prefixe)}&tailleNGramme=${taille}&nombreMots=${nombre}&modelId=${encodeURIComponent(currentModelId)}`;
            console.log("genererTexte: appel API avec", url);
            const response = await fetch(url);
            const data = await response.json();
            console.log("genererTexte: réponse API", data);

            if (data.texte) {
                // Formater le texte généré pour une meilleure lisibilité
                const formattedText = data.texte
                    .replace(/\./g, '.<br>')
                    .replace(/\?/g, '?<br>')
                    .replace(/!/g, '!<br>');

                generatedTextContainer.innerHTML = `<p>${formattedText}</p>`;
            } else {
                generatedTextContainer.innerHTML = '<p>Impossible de générer du texte</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la génération du texte:', error);
            generatedTextContainer.innerHTML = '<p>Erreur lors de la génération du texte</p>';
        }
    }
});