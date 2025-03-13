package services

import java.nio.file.{Files, Path, Paths}
import java.io.File
import scala.util.{Try, Success, Failure}
import scala.io.Source

object FileService {
  private val tempDir = Paths.get("temp")

  // Créer le répertoire temp s'il n'existe pas
  if (!Files.exists(tempDir)) {
    Try(Files.createDirectory(tempDir))
  }

  // Lire le contenu d'un fichier texte
  def readTextFile(path: Path): Try[String] = Try {
    val source = Source.fromFile(path.toFile)
    try {
      source.getLines().mkString(" ")
    } finally {
      source.close()
    }
  }

  // Nettoyer le texte pour le traitement
  def cleanText(text: String): String = {
    text.toLowerCase.replaceAll("[^a-z ]", "")
  }

  // Vérifier si un chemin est un fichier texte
  def isTxtFile(path: Path): Boolean = {
    path.toString.toLowerCase.endsWith(".txt")
  }

  // Créer un nom de fichier temporaire
  def createTempFilePath(originalName: String): Path = {
    tempDir.resolve(s"temp_${System.currentTimeMillis()}_$originalName")
  }

  // Supprimer un fichier temporaire
  def deleteTempFile(path: Path): Unit = {
    Try(Files.deleteIfExists(path))
  }

  // Lire et nettoyer un fichier texte
  def readAndCleanTextFile(path: Path): Option[String] = {
    readTextFile(path) match {
      case Success(content) =>
        val cleanedText = cleanText(content)
        if (cleanedText.nonEmpty) Some(cleanedText) else None
      case Failure(_) => None
    }
  }
}
