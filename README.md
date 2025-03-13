# Prédiction de Texte

Une application de prédiction et génération de texte basée sur les n-grammes, développée en Scala 3.

## Présentation

Cette application utilise des modèles statistiques basés sur les n-grammes pour analyser des textes et générer des prédictions de mots. Elle propose plusieurs fonctionnalités :

- **Suggestions de mots** en temps réel pendant la saisie
- **Génération automatique de texte** à partir d'un préfixe
- **Création et gestion de modèles** de prédiction personnalisés
- **Interface web** moderne et responsive

L'application fonctionne en analysant des textes pour identifier les probabilités qu'un mot donné suive une séquence de mots particulière (n-gramme). Ces probabilités sont stockées dans une structure de données efficace (Trie) pour permettre des suggestions rapides.

## Fonctionnalités

### 1. Écriture avec autosuggestion

L'application propose des suggestions en temps réel pendant que vous écrivez. Les suggestions sont adaptées au contexte et peuvent être acceptées d'un simple appui sur la touche Tab.

### 2. Suggestions de mots

Pour une séquence de mots donnée, l'application propose les mots les plus susceptibles de suivre, avec leur probabilité.

### 3. Génération de texte

À partir d'un préfixe, l'application peut générer un texte complet qui suit les mêmes patterns statistiques que les textes utilisés pour l'apprentissage.

### 4. Gestion des modèles

Créez, sélectionnez et supprimez différents modèles de prédiction adaptés à vos besoins :
- Créez un modèle pour un style d'écriture spécifique
- Entraînez les modèles avec vos propres textes
- Basculez facilement entre différents modèles

## Technologies utilisées

- **Scala 3** - Langage de programmation principal
- **Akka HTTP** - Serveur web et API REST
- **Akka Streams** - Traitement asynchrone des flux de données
- **HTML5/CSS3/JavaScript** - Interface utilisateur
- **SBT** - Gestion de build et de dépendances

## Utilisation

### Créer un nouveau modèle

1. Accédez à l'onglet "Paramètres"
2. Sélectionnez "Créer un nouveau modèle"
3. Donnez un nom à votre modèle
4. Uploadez un ou plusieurs fichiers .txt
5. Cliquez sur "Uploader et Apprendre"

### Générer du texte

1. Accédez à l'onglet "Générateur"
2. Saisissez un préfixe (par exemple "alice was")
3. Choisissez la taille du n-gramme et le nombre de mots
4. Cliquez sur "Générer"

### Utiliser les suggestions

1. Accédez à l'onglet "Suggestions"
2. Commencez à écrire dans le champ de texte
3. Cliquez sur une suggestion pour l'ajouter à votre texte

## Performances et limites

- L'application fonctionne mieux avec des modèles entraînés sur de grands volumes de texte.
- Les n-grammes de taille 3 (trigrammes) offrent généralement le meilleur équilibre entre précision des prédictions et variété du texte généré.
- La génération de texte est purement statistique et ne garantit pas un contenu grammaticalement correct ou sémantiquement cohérent.

## Structure du projet

```
projet_4_scala/
├── src/
│   ├── main/
│   │   ├── scala/
│   │   │   ├── Main.scala                    # Point d'entrée principal
│   │   │   ├── api/
│   │   │   │   └── Routes.scala              # Routes API REST
│   │   │   ├── models/
│   │   │   │   ├── AnalyseurTexte.scala      # Analyse des n-grammes
│   │   │   │   ├── ConstructeurTrie.scala    # Construction des tries
│   │   │   │   ├── GenerateurTexte.scala     # Génération de texte
│   │   │   │   ├── ModelManager.scala        # Gestion des modèles
│   │   │   │   ├── Probabilites.scala        # Calcul des probabilités
│   │   │   │   ├── SuggestionNGramme.scala   # Suggestion basée sur n-grammes
│   │   │   │   └── Trie.scala                # Structure de données Trie
│   │   │   └── services/
│   │   │       └── FileService.scala         # Gestion des fichiers
│   │   └── resources/
│   │       ├── logback.xml                   # Configuration de logging
│   │       └── static/                       # Ressources web statiques
│   │           ├── index.html                # Page d'accueil
│   │           ├── suggestions.html          # Page de suggestions
│   │           ├── generator.html            # Page de génération de texte
│   │           ├── settings.html             # Page de paramètres
│   │           ├── css/
│   │           │   ├── style.css             # Styles principaux
│   │           │   └── navbar.css            # Styles pour la navigation
│   │           └── js/
│   │               ├── shared.js             # Code JS partagé
│   │               ├── autocomplete.js       # Autocomplétion
│   │               ├── suggestions.js        # Suggestions de mots
│   │               ├── generator.js          # Génération de texte
│   │               └── settings.js           # Gestion des modèles
└── build.sbt                                 # Configuration SBT
```
Le projet est organisé en plusieurs classes, chacune ayant une responsabilité spécifique :

### Structures de données

#### `Probabilites`

Classe générique qui stocke les probabilités associées à des éléments.

```scala
case class Probabilites[T](donnees: Map[T, Double] = Map.empty)
```

- **Fonctions** :
    - `plusProbables(n: Int): List[(T, Double)]` : Retourne les n éléments les plus probables (avec les probabilités les plus élevées).

#### `Trie`

Structure de données en arbre permettant de stocker et de rechercher efficacement des mots et leurs données associées.

```scala
case class Trie[T](
    enfants: Map[Char, Trie[T]] = Map.empty[Char, Trie[T]],
    valeur: Option[Probabilites[T]] = None
)
```

- **Fonctions** :
    - `inserer(mot: String, probs: Probabilites[T]): Trie[T]` : Insère un mot avec ses probabilités associées et retourne un nouveau Trie.
    - `trouver(prefixe: String): Option[Probabilites[T]]` : Recherche un préfixe dans le Trie et retourne ses probabilités associées s'il existe.
    - `obtenirPlusProbables(prefixe: String, n: Int = 3): List[(T, Double)]` : Recherche un préfixe et retourne les n éléments les plus probables associés.

### Analyse de texte

#### `AnalyseurTexte`

Classe responsable de l'analyse de texte pour en extraire des probabilités de séquences de mots.

```scala
class AnalyseurTexte(tailleNGramme: Int = 2)
```

- **Fonctions** :
    - `compterNGrammes(texte: String): Map[List[String], Map[String, Int]]` : Compte les occurrences de mots suivants pour chaque n-gramme dans le texte.
    - `calculerProbabilites(comptages: Map[List[String], Map[String, Int]]): Map[List[String], Probabilites[String]]` : Convertit les comptages en probabilités.
    - `analyserTexte(texte: String): Map[List[String], Probabilites[String]]` : Analyse un texte complet pour extraire les probabilités.
    - `preparerPourTrie(texte: String): Map[String, Probabilites[String]]` : Prépare les probabilités pour être stockées dans un Trie.

#### `ConstructeurTrie`

Classe utilitaire pour construire un Trie à partir de données de probabilités.

```scala
class ConstructeurTrie
```

- **Fonctions** :
    - `construire[T](donnees: Map[String, Probabilites[T]]): Trie[T]` : Construit un Trie à partir d'une carte de probabilités.

### Suggestion et génération de texte

#### `SuggestionNGramme`

Classe qui utilise un Trie pour suggérer des mots suivants en fonction d'un contexte.

```scala
class SuggestionNGramme(val trie: Trie[String], val tailleNGramme: Int)
```

- **Fonctions** :
    - `extraireContexte(phrase: String): String` : Extrait le contexte approprié d'une phrase pour former la clé de recherche.
    - `suggerer(phrase: String, n: Int = 3): List[(String, Double)]` : Suggère les n mots les plus probables pouvant suivre la phrase donnée.

#### `GenerateurTexte`

Classe qui génère automatiquement du texte en utilisant un suggestionneur.

```scala
class GenerateurTexte(val suggestionneur: SuggestionNGramme, val random: Random = new Random())
```

- **Fonctions** :
    - `choisirMotSelonProbabilites(suggestions: List[(String, Double)]): Option[String]` : Sélectionne un mot au hasard en fonction des probabilités.
    - `generer(prefixe: String, nombreMots: Int): String` : Génère du texte automatiquement à partir d'un préfixe initial.


## Licence

Ce projet est distribué sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Auteur

HIRCHYTS Daniil

---

*Ce projet a été développé dans le cadre d'un cours sur la programmation fonctionnelle en Scala.*