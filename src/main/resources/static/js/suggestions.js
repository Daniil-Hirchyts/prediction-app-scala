document.addEventListener('DOMContentLoaded', () => {
    // Éléments DOM pour les suggestions
    const texteInput = document.getElementById('texte-input');
    const tailleNGram = document.getElementById('taille-ngram');
    const suggestionsContainer = document.querySelector('.suggestions');

    // Si ces éléments n'existent pas sur cette page, sortir
    if (!texteInput || !tailleNGram || !suggestionsContainer) return;

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

    // Gestionnaire d'événements pour le changement de taille de n-gramme
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

    // Réagir au changement de modèle
    document.addEventListener('modelChanged', () => {
        if (texteInput.value.trim()) {
            obtenirSuggestions(texteInput.value.trim(), tailleNGram.value);
        }
    });

    // Fonction pour obtenir des suggestions du serveur
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
});