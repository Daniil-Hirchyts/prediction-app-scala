import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class TestsSuggestionNGramme extends AnyFlatSpec with Matchers {
  "SuggestionNGramme" should "extraire correctement le contexte pour les bigrammes" in {
    val trie = Trie[String]()
    val suggestionneur = SuggestionNGramme(trie, 2)

    suggestionneur.extraireContexte("le chat noir") shouldBe "chat noir"
    suggestionneur.extraireContexte("chat") shouldBe "chat"
    suggestionneur.extraireContexte("") shouldBe ""
    suggestionneur.extraireContexte(null) shouldBe ""
  }

  it should "extraire correctement le contexte pour les trigrammes" in {
    val trie = Trie[String]()
    val suggestionneur = SuggestionNGramme(trie, 3)

    suggestionneur.extraireContexte(
      "le chat noir mange"
    ) shouldBe "chat noir mange"
    suggestionneur.extraireContexte("le chat") shouldBe "le chat"
    suggestionneur.extraireContexte("chat") shouldBe "chat"
  }

  it should "suggérer correctement les mots suivants" in {
    // Création d'un Trie avec des données de test
    val probsMap1 = Map("mange" -> 0.7, "dort" -> 0.3)
    val probsMap2 = Map("vite" -> 0.8, "lentement" -> 0.2)

    val trie = Trie[String]()
      .inserer("chat noir", Probabilites(probsMap1))
      .inserer("chat blanc", Probabilites(probsMap2))

    val suggestionneur = SuggestionNGramme(trie, 2)

    // La phrase "le chat noir" devrait extraire le contexte "chat noir"
    val suggestions = suggestionneur.suggerer("chat noir")

    suggestions.length shouldBe 2
    suggestions(0) shouldBe ("mange", 0.7)
    suggestions(1) shouldBe ("dort", 0.3)
  }

  it should "retourner une liste vide pour un contexte inconnu" in {
    val trie = Trie[String]()
    val suggestionneur = SuggestionNGramme(trie, 3)

    suggestionneur.suggerer("contexte inconnu") shouldBe List.empty
  }
}
