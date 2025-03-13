package models

case class Trie[T](
    enfants: Map[Char, Trie[T]] = Map.empty[Char, Trie[T]],
    valeur: Option[Probabilites[T]] = None
):
  def inserer(mot: String, probs: Probabilites[T]): Trie[T] =
    if mot == null || mot.trim.isEmpty then
      throw IllegalArgumentException("Le mot ne peut pas être null ou vide")
    if probs == null then
      throw IllegalArgumentException(
        "Les probabilités ne peuvent pas être null"
      )

    insererAide(mot.toLowerCase.trim, 0, probs)

  private def insererAide(
      mot: String,
      index: Int,
      probs: Probabilites[T]
  ): Trie[T] =
    if index == mot.length then
      // Fin du mot atteinte, on enregistre les probabilités
      Trie(enfants, Some(probs))
    else
      // Traitement caractère par caractère
      val caractere = mot(index)
      // Utilisation du constructeur avec type explicite
      val enfantActuel =
        enfants.getOrElse(caractere, Trie[T](Map.empty[Char, Trie[T]], None))
      val enfantMisAJour = enfantActuel.insererAide(mot, index + 1, probs)
      val enfantsMisAJour = enfants + (caractere -> enfantMisAJour)
      Trie(enfantsMisAJour, valeur)

  def trouver(prefixe: String): Option[Probabilites[T]] =
    if prefixe == null then None
    else trouverAide(prefixe.toLowerCase.trim, 0)

  private def trouverAide(
      prefixe: String,
      index: Int
  ): Option[Probabilites[T]] =
    if index == prefixe.length then valeur
    else
      enfants.get(prefixe(index)) match
        case Some(enfant) => enfant.trouverAide(prefixe, index + 1)
        case None         => None

  def obtenirPlusProbables(prefixe: String, n: Int = 3): List[(T, Double)] =
    trouver(prefixe) match
      case Some(probs) => probs.plusProbables(n)
      case None        => List.empty
