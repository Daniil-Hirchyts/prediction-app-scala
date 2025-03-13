document.addEventListener('DOMContentLoaded', () => {
    console.log("Script chargé");

    // Éléments DOM pour les suggestions
    const texteInput = document.getElementById('texte-input');
    const tailleNGram = document.getElementById('taille-ngram');
    const suggestionsContainer = document.querySelector('.suggestions');
    const modelSelect = document.getElementById('model-select');

    // Éléments DOM pour la génération
    const prefixeInput = document.getElementById('prefixe-input');
    const tailleNGramGen = document.getElementById('taille-ngram-gen');
    const nombreMots = document.getElementById('nombre-mots');
    const generateBtn = document.getElementById('generate-btn');
    const generatedTextContainer = document.querySelector('.generated-text');

    // Éléments DOM pour l'auto-suggestion
    const autocompleteInput = document.getElementById('autocomplete-input');
    const autocompleteText = document.getElementById('autocomplete-text');
    const autocompleteSuggestion = document.getElementById('autocomplete-suggestion');
    const autocompleteTailleNGram = document.getElementById('autocomplete-taille-ngram');

    // Éléments DOM pour l'upload de fichiers
    const fileUploadInput = document.getElementById('file-upload');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadStatus = document.getElementById('upload-status');
    const createNewModelCheckbox = document.getElementById('create-new-model');
    const newModelNameInput = document.getElementById('new-model-name');

    // Variables pour l'auto-suggestion
    let currentText = '';
    let suggestionText = '';
    let cursorPosition = 0;
    let isAcceptingSuggestion = false;

    // Variable pour le modèle actuel
    let currentModelId = 'default';

    // Charger les modèles au démarrage
    loadModels();

    // Gestionnaire d'événement pour le changement de modèle
    modelSelect.addEventListener('change', () => {
        currentModelId = modelSelect.value;
        console.log("Modèle sélectionné:", currentModelId);

        // Mise à jour du texte dans l'interface
        const selectedModelNameSpan = document.getElementById('selected-model-name');
        if (selectedModelNameSpan) {
            const selectedOption = modelSelect.options[modelSelect.selectedIndex];
            selectedModelNameSpan.textContent = selectedOption.textContent;
        }

        // Mise à jour des suggestions avec le nouveau modèle
        if (texteInput.value.trim()) {
            obtenirSuggestions(texteInput.value.trim(), tailleNGram.value);
        }

        // Mise à jour de l'auto-suggestion
        if (autocompleteInput.value.trim()) {
            obtenirAutoSuggestion();
        }
    });

    // Gestionnaire d'événements pour l'input de texte (suggestions)
    texteInput.addEventListener('input', debounce(() => {
        const texte = texteInput.value.trim();
        const taille = tailleNGram.value;
        console.log("Input suggestions:", texte, "taille =", taille);

        if (texte) {
            obtenirSuggestions(texte, taille);
        } else {
            suggestionsContainer.innerHTML = '<p>Les suggestions apparaîtront ici</p>';
        }
    }, 300));

    // Gestionnaire d'événements pour le changement de taille de n-gramme (suggestions)
    tailleNGram.addEventListener('change', () => {
        const texte = texteInput.value.trim();
        const taille = tailleNGram.value;
        console.log("Changement de taille n-gram:", taille);

        if (texte) {
            obtenirSuggestions(texte, taille);
        }
    });

    // Gestionnaire d'événements pour cliquer sur une suggestion
    suggestionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('suggestion-item')) {
            const mot = e.target.dataset.mot;
            if (mot) {
                texteInput.value += ` ${mot}`;
                texteInput.focus();
                console.log("Suggestion cliquée:", mot);
                // Déclencher l'événement input pour mettre à jour les suggestions
                const inputEvent = new Event('input', { bubbles: true });
                texteInput.dispatchEvent(inputEvent);
            }
        }
    });

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

    // Gestionnaires d'événements pour l'auto-suggestion
    autocompleteInput.addEventListener('input', debounce(() => {
        updateAutocompleteDisplay();
        obtenirAutoSuggestion();
    }, 100));

    // Interception de la touche Tab pour l'auto-suggestion
    autocompleteInput.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();  
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

    // Gestion de la visibilité du champ de nom de modèle
    if (createNewModelCheckbox) {
        createNewModelCheckbox.addEventListener('change', () => {
            if (newModelNameInput) {
                newModelNameInput.parentElement.style.display =
                    createNewModelCheckbox.checked ? 'block' : 'none';
            }
        });

        // Initialiser l'état
        if (newModelNameInput) {
            newModelNameInput.parentElement.style.display =
                createNewModelCheckbox.checked ? 'block' : 'none';
        }
    }

    // Gestionnaire d'événements pour le bouton d'upload
    uploadBtn.addEventListener('click', async () => {
        const files = fileUploadInput.files;
        if (files.length === 0) {
            uploadStatus.textContent = "Veuillez sélectionner au moins un fichier.";
            uploadStatus.className = "error";
            return;
        }

        uploadStatus.textContent = "Upload en cours...";
        uploadStatus.className = "loading";

        const formData = new FormData();
        for (let file of files) {
            formData.append('files', file);
        }

        let url = '/api/upload';

        // Déterminer le modèle cible
        if (createNewModelCheckbox && createNewModelCheckbox.checked && newModelNameInput && newModelNameInput.value.trim()) {
            // Créer un nouveau modèle
            url += `?modelId=${encodeURIComponent(newModelNameInput.value.trim())}&append=false`;
        } else {
            // Ajouter au modèle sélectionné
            url += `?modelId=${encodeURIComponent(currentModelId)}&append=true`;
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log("Upload response:", data);

            if (response.ok) {
                uploadStatus.textContent = "Fichiers uploadés et modèle mis à jour avec succès.";
                uploadStatus.className = "success";

                // Rafraîchir la liste des modèles
                await loadModels();

                // Sélectionner le nouveau modèle si nous venons de le créer
                if (createNewModelCheckbox && createNewModelCheckbox.checked && newModelNameInput && newModelNameInput.value.trim()) {
                    const newModelId = newModelNameInput.value.trim();
                    currentModelId = newModelId;
                    if (modelSelect.querySelector(`option[value="${newModelId}"]`)) {
                        modelSelect.value = newModelId;
                    }
                    // Réinitialiser le champ de nom de modèle
                    newModelNameInput.value = '';
                    createNewModelCheckbox.checked = false;
                    newModelNameInput.parentElement.style.display = 'none';
                }

                // Réinitialiser le champ de fichier
                fileUploadInput.value = '';
            } else {
                uploadStatus.textContent = `Erreur lors de l'upload: ${data.status || data.error || 'Erreur inconnue'}`;
                uploadStatus.className = "error";
            }
        } catch (error) {
            console.error("Erreur d'upload:", error);
            uploadStatus.textContent = "Erreur lors de l'upload. Vérifiez la console pour plus de détails.";
            uploadStatus.className = "error";
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

    // Fonction pour obtenir des suggestions du serveur (pour le panneau de suggestions)
    async function obtenirSuggestions(texte, taille) {
        try {
            const url = `/api/suggestions?texte=${encodeURIComponent(texte)}&taille=${taille}&modelId=${encodeURIComponent(currentModelId)}`;
            console.log("obtenirSuggestions: appel API avec", url);
            const response = await fetch(url);
            const data = await response.json();
            console.log("obtenirSuggestions: réponse API", data);

            if (data.suggestions && data.suggestions.length > 0) {
                afficherSuggestions(data.suggestions);
            } else {
                suggestionsContainer.innerHTML = '<p>Aucune suggestion trouvée</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la récupération des suggestions:', error);
            suggestionsContainer.innerHTML = '<p>Erreur lors de la récupération des suggestions</p>';
        }
    }

    // Fonction pour générer du texte à partir du serveur
    async function genererTexte(prefixe, taille, nombre) {
        try {
            const url = `/api/generer?prefixe=${encodeURIComponent(prefixe)}&tailleNGramme=${taille}&nombreMots=${nombre}&modelId=${encodeURIComponent(currentModelId)}`;
            console.log("genererTexte: appel API avec", url);
            const response = await fetch(url);
            const data = await response.json();
            console.log("genererTexte: réponse API", data);

            if (data.texte) {
                generatedTextContainer.innerHTML = `<p>${data.texte}</p>`;
            } else {
                generatedTextContainer.innerHTML = '<p>Impossible de générer du texte</p>';
            }
        } catch (error) {
            console.error('Erreur lors de la génération du texte:', error);
            generatedTextContainer.innerHTML = '<p>Erreur lors de la génération du texte</p>';
        }
    }

    // Fonction pour afficher les suggestions
    function afficherSuggestions(suggestions) {
        suggestionsContainer.innerHTML = '';

        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.classList.add('suggestion-item');
            suggestionElement.dataset.mot = suggestion.mot;

            const pourcentage = (suggestion.probabilite * 100).toFixed(1);
            suggestionElement.innerHTML = `${suggestion.mot} <span class="probability">${pourcentage}%</span>`;

            suggestionsContainer.appendChild(suggestionElement);
        });
        console.log("afficherSuggestions: suggestions affichées", suggestions);
    }

    // Fonction pour charger la liste des modèles disponibles
    async function loadModels() {
        try {
            console.log("Chargement des modèles...");
            const response = await fetch('/api/models');
            const data = await response.json();
            console.log("Modèles chargés:", data);

            if (modelSelect) {
                modelSelect.innerHTML = '';

                if (data.models && data.models.length > 0) {
                    data.models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model.id;
                        option.textContent = model.name;
                        modelSelect.appendChild(option);
                    });

                    // Sélectionner le modèle courant
                    if (currentModelId && modelSelect.querySelector(`option[value="${currentModelId}"]`)) {
                        modelSelect.value = currentModelId;
                    } else {
                        // Si le modèle courant n'existe pas, prendre le premier
                        currentModelId = modelSelect.options[0].value;
                    }
                } else {
                    // Ajouter un modèle par défaut si aucun n'est disponible
                    const option = document.createElement('option');
                    option.value = 'default';
                    option.textContent = 'Modèle par défaut';
                    modelSelect.appendChild(option);
                    currentModelId = 'default';
                }

                console.log("Modèle sélectionné:", currentModelId);
            }
        } catch (error) {
            console.error("Erreur lors du chargement des modèles:", error);

            if (modelSelect) {
                modelSelect.innerHTML = '';
                const option = document.createElement('option');
                option.value = 'default';
                option.textContent = 'Modèle par défaut';
                modelSelect.appendChild(option);
                currentModelId = 'default';
            }
        }
    }

    // Fonction utilitaire pour limiter les appels fréquents (debounce)
    function debounce(func, wait) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }
});