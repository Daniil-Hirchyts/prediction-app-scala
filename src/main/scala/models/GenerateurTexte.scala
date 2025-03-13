package models

import scala.util.Random

class GenerateurTexte(
    val suggestionneur: SuggestionNGramme,
    val random: Random = new Random()
):
  // Sélectionne un mot au hasard en fonction des probabilités
  private def choisirMotSelonProbabilites(
      suggestions: List[(String, Double)]
  ): Option[String] =
    if suggestions.isEmpty then None
    else
      // Calcule la somme des probabilités
      val somme = suggestions.map(_._2).sum

      // Génère un nombre aléatoire entre 0 et la somme
      val valeur = random.nextDouble() * somme

      // Trouve le mot correspondant à cette valeur de façon fonctionnelle
      def trouverMot(
          resteSuggestions: List[(String, Double)],
          cumulActuel: Double
      ): Option[String] =
        resteSuggestions match
          case Nil => None // Ne devrait pas arriver normalement
          case (mot, prob) :: reste =>
            val nouveauCumul = cumulActuel + prob
            if valeur <= nouveauCumul then Some(mot)
            else trouverMot(reste, nouveauCumul)

      val resultat = trouverMot(suggestions, 0.0)
      // Si aucun mot n'a été trouvé, retourner le dernier
      resultat.orElse(suggestions.lastOption.map(_._1))

  // Génère du texte en commençant par un préfixe donné
  def generer(prefixe: String, nombreMots: Int): String =
    if nombreMots <= 0 then prefixe
    else if prefixe == null || prefixe.trim.isEmpty then ""
    else
      val texteActuel = prefixe.trim

      // Fonction récursive auxiliaire
      def genererAide(texte: String, reste: Int): String =
        if reste <= 0 then texte
        else
          choisirMotSelonProbabilites(suggestionneur.suggerer(texte)) match
            case Some(motSuivant) =>
              genererAide(texte + s" $motSuivant", reste - 1)
            case None => texte

      genererAide(texteActuel, nombreMots)
