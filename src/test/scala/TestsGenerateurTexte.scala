import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers
import scala.util.Random

class TestsGenerateurTexte extends AnyFlatSpec with Matchers {
  "GenerateurTexte" should "générer du texte en utilisant les suggestions" in {
    // Création d'un mock pour le suggestionneur
    val mockSuggestionneur = new SuggestionNGramme(Trie[String](), 2) {
      override def suggerer(
          phrase: String,
          n: Int = 3
      ): List[(String, Double)] =
        List(("test", 1.0))
    }

    val generateur = GenerateurTexte(
      mockSuggestionneur,
      new Random(42)
    ) // Seed fixe pour prévisibilité

    val resultat = generateur.generer("début", 3)
    resultat shouldBe "début test test test"
  }

  it should "arrêter la génération si aucune suggestion n'est disponible" in {
    // Création d'un mock pour le suggestionneur qui retourne une liste vide
    val mockSuggestionneur = new SuggestionNGramme(Trie[String](), 2) {
      override def suggerer(
          phrase: String,
          n: Int = 3
      ): List[(String, Double)] =
        if phrase == "début" then List(("unique", 1.0)) else List.empty
    }

    val generateur = GenerateurTexte(mockSuggestionneur)

    val resultat = generateur.generer("début", 10)
    resultat shouldBe "début unique"
  }

  it should "respecter le nombre de mots demandé" in {
    // Création d'un mock pour le suggestionneur
    val mockSuggestionneur = new SuggestionNGramme(Trie[String](), 2) {
      override def suggerer(
          phrase: String,
          n: Int = 3
      ): List[(String, Double)] =
        List(("mot", 1.0))
    }

    val generateur = GenerateurTexte(mockSuggestionneur)

    // Demande de 5 mots
    val resultat = generateur.generer("début", 5)
    resultat.split("\\s+").length shouldBe 6 // le préfixe + 5 mots générés
  }

  it should "gérer correctement les entrées nulles ou vides" in {
    val mockSuggestionneur = new SuggestionNGramme(Trie[String](), 2) {
      override def suggerer(
          phrase: String,
          n: Int = 3
      ): List[(String, Double)] =
        List(("mot", 1.0))
    }

    val generateur = GenerateurTexte(mockSuggestionneur)

    generateur.generer(null, 5) shouldBe ""
    generateur.generer("", 5) shouldBe ""
    generateur.generer("début", 0) shouldBe "début"
    generateur.generer("début", -1) shouldBe "début"
  }
}
