package models

class SuggestionNGramme(val trie: Trie[String], val tailleNGramme: Int):

  // Extrait le contexte à partir d'une phrase pour la suggestion
  def extraireContexte(phrase: String): String =
    if phrase == null || phrase.trim.isEmpty then ""
    else
      val mots =
        phrase.split("\\s+").filter(_.nonEmpty).map(_.toLowerCase).toList

      // Si la phrase contient moins de mots que la taille du n-gramme
      if mots.length < tailleNGramme then
        mots.mkString(" ") // Utiliser tous les mots disponibles
      else
        // Prendre exactement les n derniers mots pour former un n-gramme complet
        mots.takeRight(tailleNGramme).mkString(" ")

  // Obtient les suggestions les plus probables pour une phrase incomplète
  def suggerer(phrase: String, n: Int = 3): List[(String, Double)] =
    val contexte = extraireContexte(phrase)
    trie.obtenirPlusProbables(contexte, n)
