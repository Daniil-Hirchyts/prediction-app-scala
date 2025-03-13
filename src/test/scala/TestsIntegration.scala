import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class TestsIntegration extends AnyFlatSpec with Matchers {
  "L'intégration des n-grammes" should "fonctionner correctement" in {
    val texte =
      "le chat noir mange le poisson le chat noir dort bien le soir le chat noir joue avec la balle"

    // Configuration pour unigrammes
    val tailleNGramme = 1
    val analyseur = AnalyseurTexte(tailleNGramme)
    val constructeur = ConstructeurTrie()

    val probabilites = analyseur.preparerPourTrie(texte)
    val trie = constructeur.construire(probabilites)

    val suggestionneur = SuggestionNGramme(trie, tailleNGramme)

    // Vérification avec un mot présent dans le texte
    val suggestions = suggestionneur.suggerer("le")
    suggestions.length should be >= 1

    // Vérifier que les suggestions contiennent au moins un des mots attendus
    val motsAttendus = Set("chat", "poisson", "soir")
    suggestions
      .map(_._1)
      .toSet should contain atLeastOneOf ("chat", "poisson", "soir")
  }

  it should "permettre d'utiliser différentes tailles de n-grammes" in {
    val texte =
      "le chat noir mange le poisson le chat noir dort bien le soir le chat blanc joue avec la balle"

    // Test avec bigrammes
    val analyseur2 = AnalyseurTexte(2)
    val probabilites2 = analyseur2.preparerPourTrie(texte)
    val trie2 = ConstructeurTrie().construire(probabilites2)
    val suggestionneur2 = SuggestionNGramme(trie2, 2)

    val suggestions2 = suggestionneur2.suggerer("le chat")
    suggestions2.headOption.map(_._1) shouldBe Some("noir")

    // Test avec trigrammes
    val analyseur3 = AnalyseurTexte(3)
    val probabilites3 = analyseur3.preparerPourTrie(texte)
    val trie3 = ConstructeurTrie().construire(probabilites3)
    val suggestionneur3 = SuggestionNGramme(trie3, 3)

    // Avec trigrammes, "le chat noir" devrait suggérer "mange" ou "dort"
    val suggestions3 = suggestionneur3.suggerer("le chat noir")
    suggestions3.map(_._1).toSet should contain atLeastOneOf ("mange", "dort")
  }
}
