document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM pour l'auto-suggestion
    const autocompleteInput = document.getElementById('autocomplete-input');
    const autocompleteText = document.getElementById('autocomplete-text');
    const autocompleteSuggestion = document.getElementById('autocomplete-suggestion');
    const autocompleteTailleNGram = document.getElementById('autocomplete-taille-ngram');

    // Si ces éléments n'existent pas sur cette page, sortir
    if (!autocompleteInput || !autocompleteText || !autocompleteSuggestion) return;

    // Variables pour l'auto-suggestion
    let currentText = '';
    let suggestionText = '';
    let cursorPosition = 0;
    let isAcceptingSuggestion = false;

    // Gestionnaires d'événements pour l'auto-suggestion
    autocompleteInput.addEventListener('input', debounce(() => {
        updateAutocompleteDisplay();
        obtenirAutoSuggestion();
    }, 100));

    // Interception de la touche Tab pour l'auto-suggestion
    autocompleteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();  // Empêche systématiquement le comportement par défaut de la touche Tab
            if (suggestionText) {
                console.log("Tab pressed, accepting suggestion:", suggestionText);
                accepterSuggestion();
            } else {
                console.log("Tab pressed but aucune suggestion n'est disponible.");
            }
        }
    });

    autocompleteTailleNGram.addEventListener('change', () => {
        obtenirAutoSuggestion();
    });

    // Réagir au changement de modèle
    document.addEventListener('modelChanged', () => {
        if (autocompleteInput.value.trim()) {
            obtenirAutoSuggestion();
        }
    });

    // Fonction pour accepter la suggestion courante
    function accepterSuggestion() {
        if (suggestionText) {
            console.log("accepterSuggestion: suggestion avant acceptation =", suggestionText);
            isAcceptingSuggestion = true;

            // Si nous sommes au milieu d'un mot
            if (!currentText.endsWith(' ') && currentText.trim() !== '') {
                const textBeforeCursor = currentText.substring(0, cursorPosition);
                const textAfterCursor = currentText.substring(cursorPosition);

                // Trouver le début du mot actuel
                const lastSpaceBeforeCursor = textBeforeCursor.lastIndexOf(' ');
                const currentWordStart = lastSpaceBeforeCursor === -1 ? 0 : lastSpaceBeforeCursor + 1;

                // Remplacer le mot partiel par le mot complet suggéré
                if (cursorPosition === currentText.length || textAfterCursor.startsWith(' ')) {
                    const currentWordPart = textBeforeCursor.substring(currentWordStart);
                    const firstSuggestion = suggestionText.trim().split(' ')[0];
                    const textBeforeWord = textBeforeCursor.substring(0, currentWordStart);
                    autocompleteInput.value = textBeforeWord + firstSuggestion + ' ' + textAfterCursor;
                    console.log("accepterSuggestion: remplacement du mot partiel par", firstSuggestion);
                }
            } else {
                // Si nous sommes à la fin d'un mot ou au début du texte
                const firstSuggestion = suggestionText.trim().split(' ')[0];
                autocompleteInput.value = currentText + firstSuggestion + ' ';
                console.log("accepterSuggestion: ajout de suggestion =", firstSuggestion);
            }

            // Mettre à jour l'affichage et obtenir de nouvelles suggestions
            updateAutocompleteDisplay();
            obtenirAutoSuggestion();

            isAcceptingSuggestion = false;
        }
    }

    // Fonction pour mettre à jour l'affichage de l'auto-suggestion
    function updateAutocompleteDisplay() {
        currentText = autocompleteInput.value;
        cursorPosition = autocompleteInput.selectionStart;

        // Mettre à jour l'élément texte pour maintenir l'alignement
        autocompleteText.textContent = currentText;

        // Effacer la suggestion si le texte change manuellement
        if (!isAcceptingSuggestion) {
            autocompleteSuggestion.textContent = '';
            suggestionText = '';
        }
        console.log("updateAutocompleteDisplay:", { currentText, cursorPosition });
    }

    // Fonction pour obtenir l'auto-suggestion du serveur
    async function obtenirAutoSuggestion() {
        try {
            if (!currentText.trim()) {
                autocompleteSuggestion.textContent = '';
                suggestionText = '';
                console.log("obtenirAutoSuggestion: texte vide");
                return;
            }

            const taille = autocompleteTailleNGram.value;
            const url = `/api/suggestions?texte=${encodeURIComponent(currentText.trim())}&taille=${taille}&nombre=3&modelId=${encodeURIComponent(currentModelId)}`;

            console.log("obtenirAutoSuggestion: appel API avec", url);
            const response = await fetch(url);
            const data = await response.json();
            console.log("obtenirAutoSuggestion: réponse API", data);

            if (data.suggestions && data.suggestions.length > 0) {
                // Si le dernier caractère est un espace, ajouter la suggestion après
                if (currentText.endsWith(' ') || currentText === '') {
                    suggestionText = '';
                    for (let i = 0; i < Math.min(3, data.suggestions.length); i++) {
                        suggestionText += (i === 0 ? ' ' : ' ') + data.suggestions[i].mot;
                    }
                    autocompleteSuggestion.textContent = suggestionText;
                    console.log("obtenirAutoSuggestion: suggestion ajoutée en fin de texte =", suggestionText);
                } else {
                    // Sinon, vérifier si nous sommes au milieu d'un mot
                    const textBeforeCursor = currentText.substring(0, cursorPosition);
                    const textAfterCursor = currentText.substring(cursorPosition);

                    // Si nous sommes à la fin du texte ou qu'il y a un espace après le curseur
                    if (cursorPosition === currentText.length || textAfterCursor.startsWith(' ')) {
                        const lastSpaceBeforeCursor = textBeforeCursor.lastIndexOf(' ');
                        const currentWordStart = lastSpaceBeforeCursor === -1 ? 0 : lastSpaceBeforeCursor + 1;
                        const currentWordPart = textBeforeCursor.substring(currentWordStart);

                        // Vérifier si une suggestion commence par le mot actuel
                        for (const suggestion of data.suggestions) {
                            if (suggestion.mot.startsWith(currentWordPart) && currentWordPart.length > 0) {
                                // Ajouter la partie manquante du mot comme suggestion
                                suggestionText = suggestion.mot.substring(currentWordPart.length);

                                // Ajouter les mots supplémentaires (jusqu'à 2 de plus)
                                let additionalSuggestions = '';
                                for (let i = 1; i < Math.min(3, data.suggestions.length); i++) {
                                    additionalSuggestions += ' ' + data.suggestions[i].mot;
                                }

                                autocompleteSuggestion.textContent = suggestionText + additionalSuggestions;
                                console.log("obtenirAutoSuggestion: suggestion partielle trouvée", { currentWordPart, suggestionText, additionalSuggestions });
                                return;
                            }
                        }
                    }
                    autocompleteSuggestion.textContent = '';
                    suggestionText = '';
                    console.log("obtenirAutoSuggestion: aucune correspondance trouvée pour le mot courant");
                }
            } else {
                autocompleteSuggestion.textContent = '';
                suggestionText = '';
                console.log("obtenirAutoSuggestion: pas de suggestions retournées");
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des auto-suggestions:', error);
            autocompleteSuggestion.textContent = '';
            suggestionText = '';
        }
    }
});