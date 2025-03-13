import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class TestsTrie extends AnyFlatSpec with Matchers {
  "Un Trie" should "stocker des mots et leurs probabilités" in {
    val trie = Trie[String]()
    val probsMap = Map("chien" -> 0.7, "chat" -> 0.3)
    val probs = Probabilites(probsMap)
    val trieMisAJour = trie.inserer("bonjour", probs)
    val resultat = trieMisAJour.trouver("bonjour")
    resultat shouldBe Some(probs)
  }

  it should "retourner None pour les mots inexistants" in {
    val trie = Trie[String]()
    val resultat = trie.trouver("inexistant")
    resultat shouldBe None
  }

  it should "être insensible à la casse" in {
    val trie = Trie[String]()
    val probs = Probabilites(Map("monde" -> 1.0))
    val trieMisAJour = trie.inserer("Bonjour", probs)
    val resultat = trieMisAJour.trouver("bonjour")
    resultat shouldBe Some(probs)
    val resultatMajuscule = trieMisAJour.trouver("BONJOUR")
    resultatMajuscule shouldBe Some(probs)
  }

  it should "gérer correctement les préfixes" in {
    val trie = Trie[String]()
    val probs1 = Probabilites(Map("monde" -> 0.8, "tous" -> 0.2))
    val probs2 = Probabilites(Map("ami" -> 0.6, "voisin" -> 0.4))
    val trieMisAJour = trie.inserer("bonjour", probs1).inserer("aide", probs2)
    trieMisAJour.trouver("bonjour") shouldBe Some(probs1)
    trieMisAJour.trouver("aide") shouldBe Some(probs2)
    trieMisAJour.trouver("bon") shouldBe None
  }

  it should "gérer gracieusement les entrées nulles et vides" in {
    val trie = Trie[String]()
    trie.trouver(null) shouldBe None
    trie.trouver("") shouldBe None
    an[IllegalArgumentException] should be thrownBy {
      trie.inserer(null, Probabilites(Map("test" -> 1.0)))
    }
    an[IllegalArgumentException] should be thrownBy {
      trie.inserer("", Probabilites(Map("test" -> 1.0)))
    }
    an[IllegalArgumentException] should be thrownBy {
      trie.inserer("test", null)
    }
  }

  it should "maintenir l'immuabilité" in {
    val trie = Trie[String]()
    val probs1 = Probabilites(Map("chien" -> 0.7))
    val probs2 = Probabilites(Map("chat" -> 0.3))
    val trieMisAJour1 = trie.inserer("animal", probs1)
    val trieMisAJour2 = trieMisAJour1.inserer("creature", probs2)
    trie.trouver("animal") shouldBe None
    trie.trouver("creature") shouldBe None
    trieMisAJour1.trouver("animal") shouldBe Some(probs1)
    trieMisAJour1.trouver("creature") shouldBe None
    trieMisAJour2.trouver("animal") shouldBe Some(probs1)
    trieMisAJour2.trouver("creature") shouldBe Some(probs2)
  }

  "obtenirPlusProbables" should "renvoyer les mots suivants les plus probables" in {
    val trie = Trie[String]()
    val probs = Probabilites(
      Map("chien" -> 0.7, "chat" -> 0.3, "oiseau" -> 0.2, "poisson" -> 0.1)
    )
    val trieMisAJour = trie.inserer("animal", probs)
    val resultat = trieMisAJour.obtenirPlusProbables("animal", 2)
    resultat shouldBe List(("chien", 0.7), ("chat", 0.3))
  }

  it should "renvoyer moins d'éléments s'il n'y a pas assez de probabilités" in {
    val trie = Trie[String]()
    val probs = Probabilites(Map("chien" -> 0.7))
    val trieMisAJour = trie.inserer("animal", probs)
    val resultat = trieMisAJour.obtenirPlusProbables("animal", 3)
    resultat shouldBe List(("chien", 0.7))
  }

  it should "retourner une liste vide pour les mots inexistants" in {
    val trie = Trie[String]()
    val resultat = trie.obtenirPlusProbables("inexistant")
    resultat shouldBe List.empty
  }
}
