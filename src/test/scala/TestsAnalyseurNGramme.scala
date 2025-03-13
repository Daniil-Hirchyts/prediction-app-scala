import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class TestsAnalyseurNGramme extends AnyFlatSpec with Matchers {
  "AnalyseurTexte avec n-grammes" should "compter correctement les paires de mots (bigrammes)" in {
    val analyseur = AnalyseurTexte(2) // bigrammes
    val texte = "le chat noir mange le poisson le chat noir dort"

    val comptages = analyseur.compterNGrammes(texte)

    comptages(List("le", "chat")) shouldBe Map("noir" -> 2)
    comptages(List("chat", "noir")) shouldBe Map("mange" -> 1, "dort" -> 1)
    comptages(List("noir", "mange")) shouldBe Map("le" -> 1)
    comptages(List("mange", "le")) shouldBe Map("poisson" -> 1)
    comptages(List("le", "poisson")) shouldBe Map("le" -> 1)
    comptages(List("poisson", "le")) shouldBe Map("chat" -> 1)
  }

  it should "compter correctement les triplets de mots (trigrammes)" in {
    val analyseur = AnalyseurTexte(3) // trigrammes
    val texte = "le chat noir mange le poisson le chat noir dort bien le soir"

    val comptages = analyseur.compterNGrammes(texte)

    // Vérification des triplets spécifiques au lieu de compter
    comptages(List("le", "chat", "noir")) shouldBe Map(
      "mange" -> 1,
      "dort" -> 1
    )
    comptages(List("chat", "noir", "mange")) shouldBe Map("le" -> 1)
    comptages(List("noir", "mange", "le")) shouldBe Map("poisson" -> 1)
    comptages(List("mange", "le", "poisson")) shouldBe Map("le" -> 1)
    comptages(List("le", "poisson", "le")) shouldBe Map("chat" -> 1)
    comptages(List("poisson", "le", "chat")) shouldBe Map("noir" -> 1)
    comptages(List("chat", "noir", "dort")) shouldBe Map("bien" -> 1)
    comptages(List("noir", "dort", "bien")) shouldBe Map("le" -> 1)
    comptages(List("dort", "bien", "le")) shouldBe Map("soir" -> 1)
  }

  it should "calculer correctement les probabilités pour les n-grammes" in {
    val analyseur = AnalyseurTexte(2) // bigrammes
    val comptages = Map(
      List("le", "chat") -> Map("noir" -> 2, "blanc" -> 1),
      List("chat", "noir") -> Map("mange" -> 1, "dort" -> 1)
    )

    val probabilites = analyseur.calculerProbabilites(comptages)

    probabilites(List("le", "chat")).donnees("noir") shouldBe 2.0 / 3.0
    probabilites(List("le", "chat")).donnees("blanc") shouldBe 1.0 / 3.0
    probabilites(List("chat", "noir")).donnees("mange") shouldBe 0.5
    probabilites(List("chat", "noir")).donnees("dort") shouldBe 0.5
  }

  it should "convertir correctement les n-grammes en clés pour le trie" in {
    val analyseur = AnalyseurTexte(3) // trigrammes
    val probsMap = Map("suivant" -> 1.0)
    val probs = Probabilites(probsMap)

    val probsNGrammes = Map(
      List("le", "chat", "noir") -> probs,
      List("chat", "noir", "mange") -> probs
    )

    val clesPourTrie = analyseur.convertirNGrammesEnCles(probsNGrammes)

    clesPourTrie.size shouldBe 2
    clesPourTrie("le chat noir") shouldBe probs
    clesPourTrie("chat noir mange") shouldBe probs
  }

  it should "gérer le texte vide ou null" in {
    val analyseur = AnalyseurTexte(2)

    analyseur.compterNGrammes("") shouldBe Map.empty
    analyseur.compterNGrammes(null) shouldBe Map.empty

    analyseur.analyserTexte("") shouldBe Map.empty
    analyseur.analyserTexte(null) shouldBe Map.empty
  }

  it should "gérer le texte trop court pour former des n-grammes" in {
    val analyseur = AnalyseurTexte(3) // trigrammes

    // Texte avec seulement 2 mots, insuffisant pour un trigramme + mot suivant
    analyseur.compterNGrammes("mot unique") shouldBe Map.empty
    analyseur.analyserTexte("deux mots") shouldBe Map.empty
  }

  it should "lancer une exception pour une taille de n-gramme invalide" in {
    an[IllegalArgumentException] should be thrownBy {
      AnalyseurTexte(0)
    }

    an[IllegalArgumentException] should be thrownBy {
      AnalyseurTexte(-1)
    }
  }
}
