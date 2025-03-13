package models

case class Probabilites[T](donnees: Map[T, Double] = Map.empty):
  def plusProbables(n: Int): List[(T, Double)] =
    if n <= 0 then
      throw IllegalArgumentException("Le nombre d'éléments doit être positif")
    donnees.toList.sortBy(-_._2).take(n)
