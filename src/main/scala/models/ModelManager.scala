package models

import java.nio.file.{Files, Path, Paths}
import java.io._
import scala.util.{Try, Success, Failure}
import scala.jdk.CollectionConverters._

// Classes pour la sérialisation des modèles
case class ModelData(
    id: String,
    name: String,
    suggessionneurs: Map[Int, SuggestionNGrammeData]
) extends Serializable

case class SuggestionNGrammeData(
    tailleNGramme: Int,
    trie: TrieData[String]
) extends Serializable

case class TrieData[T](
    enfants: Map[Char, TrieData[T]],
    valeur: Option[ProbabilitesData[T]]
) extends Serializable

case class ProbabilitesData[T](
    donnees: Map[String, Double]
) extends Serializable

// Conversion entre objets mémoire et données sérialisables
object Conversions {
  def suggessionNGrammeToData(s: SuggestionNGramme): SuggestionNGrammeData =
    SuggestionNGrammeData(
      s.tailleNGramme,
      trieToData(s.trie)
    )

  def trieToData[T](t: Trie[T]): TrieData[T] =
    TrieData(
      t.enfants.view.mapValues(trieToData(_)).toMap,
      t.valeur.map(probsToData(_))
    )

  def probsToData[T](p: Probabilites[T]): ProbabilitesData[T] =
    ProbabilitesData(
      p.donnees.map { case (key, value) =>
        (key.toString, value)
      }
    )

  def dataToSuggessionNGramme(data: SuggestionNGrammeData): SuggestionNGramme =
    new SuggestionNGramme(
      dataToTrie(data.trie),
      data.tailleNGramme
    )

  def dataToTrie[T](data: TrieData[T]): Trie[T] =
    Trie(
      data.enfants.view.mapValues(dataToTrie(_)).toMap,
      data.valeur.map(dataToProbs(_))
    )

  def dataToProbs[T](data: ProbabilitesData[T]): Probabilites[T] =
    Probabilites(
      data.donnees.map { case (key, value) =>
        (key.asInstanceOf[T], value)
      }
    )
}

object ModelManager {
  // Informations sur le modèle (pour l'API)
  case class ModelInfo(id: String, name: String)

  private var models: Map[String, Map[Int, SuggestionNGramme]] = Map.empty
  private val modelsDir = Paths.get("models")

  // Créer le répertoire des modèles s'il n'existe pas
  if (!Files.exists(modelsDir)) {
    Try(Files.createDirectory(modelsDir))
  }

  // Initialiser le modèle par défaut
  val defaultModelId = "default"
  if (!models.contains(defaultModelId)) {
    createDefaultModel()
  }

  // Liste des modèles disponibles
  def getModels(): List[ModelInfo] = {
    val modelInfos =
      models.keys.map(id => ModelInfo(id, s"Modèle $id")).toList
    if (modelInfos.isEmpty) {
      List(ModelInfo(defaultModelId, "Modèle par défaut"))
    } else {
      modelInfos
    }
  }

  // Obtenir un modèle spécifique
  def getModel(modelId: String): Option[Map[Int, SuggestionNGramme]] = {
    if (!models.contains(modelId) && modelId == defaultModelId) {
      createDefaultModel()
    }
    models.get(modelId)
  }

  // Supprimer un modèle
  def deleteModel(modelId: String): Boolean = {
    if (modelId == defaultModelId) {
      // Ne pas permettre la suppression du modèle par défaut
      return false
    }

    // Supprimer le fichier du modèle
    val modelFile = modelsDir.resolve(s"${modelId}.dat")
    val fileDeleted = Try(Files.deleteIfExists(modelFile)).getOrElse(false)

    // Supprimer le modèle de la mémoire
    val modelExists = models.contains(modelId)
    if (modelExists) {
      models = models - modelId
      println(s"Modèle $modelId supprimé de la mémoire")
    }

    // Retourner vrai si le modèle existait en mémoire ou si le fichier a été supprimé
    modelExists || fileDeleted
  }

  // Obtenir un suggestionneur pour une taille de n-gramme donnée
  def getSuggestionneur(
      modelId: String,
      tailleNGramme: Int
  ): SuggestionNGramme = {
    val model = getModel(modelId).getOrElse(getModel(defaultModelId).get)
    model.getOrElse(
      tailleNGramme,
      model.getOrElse(1, createDefaultSuggestionneur(1))
    )
  }

  // Créer un modèle à partir de texte
  def createModel(
      modelId: String,
      texte: String,
      append: Boolean = false
  ): Unit = {
    val newModel = (1 to 3).map { tailleNGramme =>
      val analyseur = AnalyseurTexte(tailleNGramme)
      val probabilites = analyseur.preparerPourTrie(texte)
      val trie = ConstructeurTrie().construire(probabilites)
      val suggestionneur = SuggestionNGramme(trie, tailleNGramme)

      (tailleNGramme, suggestionneur)
    }.toMap

    if (append && models.contains(modelId)) {
      models = models.updated(modelId, newModel)
    } else {
      models = models.updated(modelId, newModel)
    }
    saveModel(modelId)
  }

  // Créer le modèle par défaut
  private def createDefaultModel(): Unit = {
    val texteExemple =
      "Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it."

    val texte = texteExemple.toLowerCase.replaceAll("[^a-z ]", "")
    createModel(defaultModelId, texte)
  }

  // Créer un suggestionneur par défaut pour une taille donnée
  private def createDefaultSuggestionneur(
      tailleNGramme: Int
  ): SuggestionNGramme = {
    val texteExemple = "alice was beginning to read a book"
    val texte = texteExemple.toLowerCase.replaceAll("[^a-z ]", "")

    val analyseur = AnalyseurTexte(tailleNGramme)
    val probabilites = analyseur.preparerPourTrie(texte)
    val trie = ConstructeurTrie().construire(probabilites)

    SuggestionNGramme(trie, tailleNGramme)
  }

  // Sauvegarder un modèle
  def saveModel(modelId: String): Unit = {
    Try {
      val modelFile = modelsDir.resolve(s"${modelId}.dat")
      val model = models.get(modelId).map { ngrams =>
        val modelData = ModelData(
          modelId,
          s"Modèle $modelId",
          ngrams.map { case (taille, suggessionneur) =>
            (taille, Conversions.suggessionNGrammeToData(suggessionneur))
          }
        )

        val oos = new ObjectOutputStream(new FileOutputStream(modelFile.toFile))
        try {
          oos.writeObject(modelData)
        } finally {
          oos.close()
        }
      }
    } match {
      case Success(_) => println(s"Modèle $modelId sauvegardé avec succès")
      case Failure(e) =>
        println(
          s"Erreur lors de la sauvegarde du modèle $modelId: ${e.getMessage}"
        )
    }
  }

  // Charger tous les modèles
  def loadAllModels(): Unit = {
    // Supprimer d'abord tous les fichiers de modèle existants pour éviter des erreurs de chargement
    if (Files.exists(modelsDir)) {
      Try {
        Files.list(modelsDir).iterator().asScala.foreach { path =>
          Files.deleteIfExists(path)
        }
      }.recover { case e =>
        println(
          s"Erreur lors de la suppression des modèles existants: ${e.getMessage}"
        )
      }
    }

    // Créer le modèle par défaut puisque tous les modèles ont été supprimés
    createDefaultModel()
  }
}
