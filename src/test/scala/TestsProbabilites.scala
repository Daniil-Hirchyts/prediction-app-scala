import org.scalatest.flatspec.AnyFlatSpec
import org.scalatest.matchers.should.Matchers

class TestsProbabilites extends AnyFlatSpec with Matchers {
  "Une Probabilites" should "retourner les éléments les plus probables" in {
    val probs =
      Probabilites(Map("chien" -> 0.7, "chat" -> 0.3, "oiseau" -> 0.2))
    val resultat = probs.plusProbables(2)
    resultat shouldBe List(("chien", 0.7), ("chat", 0.3))
  }

  it should "lancer une exception pour n non positif" in {
    val probs = Probabilites(Map("test" -> 1.0))
    an[IllegalArgumentException] should be thrownBy {
      probs.plusProbables(0)
    }
    an[IllegalArgumentException] should be thrownBy {
      probs.plusProbables(-1)
    }
  }
}
