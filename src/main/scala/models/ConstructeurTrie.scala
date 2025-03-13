package models

class ConstructeurTrie:
  def construire[T](donnees: Map[String, Probabilites[T]]): Trie[T] =
    // Création d'un Trie vide avec explicitation complète des types
    val triVide = Trie[T](Map.empty[Char, Trie[T]], None)
    donnees.foldLeft(triVide) { case (trie, (mot, probs)) =>
      trie.inserer(mot, probs)
    }
