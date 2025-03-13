package models

class AnalyseurTexte(tailleNGramme: Int = 2):
  // Vérifie si la taille du n-gramme est valide
  if tailleNGramme < 1 then
    throw IllegalArgumentException("La taille du n-gramme doit être au moins 1")

  // Compte les occurrences de mots suivants pour chaque n-gramme dans le texte
  def compterNGrammes(texte: String): Map[List[String], Map[String, Int]] =
    if texte == null || texte.trim.isEmpty then Map.empty
    else
      val mots =
        texte.split("\\s+").filter(_.nonEmpty).map(_.toLowerCase).toList

      if mots.length < tailleNGramme + 1 then Map.empty
      else
        // Création des groupes de n+1 mots consécutifs
        val groupes = mots.sliding(tailleNGramme + 1).toList

        // Utilisation de foldLeft pour accumuler les comptages
        groupes.foldLeft(Map.empty[List[String], Map[String, Int]]) {
          case (acc, groupe) =>
            // Le n-gramme est composé des n premiers mots du groupe
            val nGramme = groupe.take(tailleNGramme)
            // Le mot suivant est le dernier mot du groupe
            val motSuivant = groupe.last

            // Récupération des comptages actuels pour ce n-gramme
            val comptagesActuels =
              acc.getOrElse(nGramme, Map.empty[String, Int])
            // Mise à jour du comptage pour le mot suivant
            val comptagesMisAJour = comptagesActuels.updated(
              motSuivant,
              comptagesActuels.getOrElse(motSuivant, 0) + 1
            )
            // Mise à jour de l'accumulateur avec le nouveau comptage
            acc + (nGramme -> comptagesMisAJour)
        }

  // Calcule les probabilités à partir des comptages
  def calculerProbabilites(
      comptages: Map[List[String], Map[String, Int]]
  ): Map[List[String], Probabilites[String]] =
    comptages.foldLeft(Map.empty[List[String], Probabilites[String]]) {
      case (acc, (nGramme, comptagesMots)) =>
        val total = comptagesMots.values.sum.toDouble

        val probsMap = comptagesMots.foldLeft(Map.empty[String, Double]) {
          case (probAcc, (motSuivant, comptage)) =>
            probAcc + (motSuivant -> (comptage.toDouble / total))
        }

        acc + (nGramme -> Probabilites(probsMap))
    }

  // Analyse un texte pour extraire les probabilités de n-grammes
  def analyserTexte(texte: String): Map[List[String], Probabilites[String]] =
    val comptages = compterNGrammes(texte)
    calculerProbabilites(comptages)

  // Convertit les n-grammes en clés de type String pour être utilisés dans un Trie

  def convertirNGrammesEnCles(
      probsNGrammes: Map[List[String], Probabilites[String]]
  ): Map[String, Probabilites[String]] =
    probsNGrammes.map { case (nGramme, probs) =>
      // Convertit la liste de mots en une seule chaîne avec un séparateur
      val cle = nGramme.mkString(" ")
      (cle, probs)
    }

  // Prépare les probabilités pour être stockées dans un Trie
  def preparerPourTrie(texte: String): Map[String, Probabilites[String]] =
    val probsNGrammes = analyserTexte(texte)
    convertirNGrammesEnCles(probsNGrammes)
