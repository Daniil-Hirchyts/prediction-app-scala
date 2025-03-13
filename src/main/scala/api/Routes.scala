package api

import akka.actor.typed.ActorSystem
import akka.http.scaladsl.model._
import akka.http.scaladsl.server.Directives._
import akka.http.scaladsl.marshallers.sprayjson.SprayJsonSupport
import spray.json._
import scala.concurrent.{ExecutionContextExecutor, Future}
import akka.http.scaladsl.model.Multipart
import akka.stream.scaladsl.FileIO
import akka.stream.Materializer
import java.nio.file.{Paths, Files, Path}
import scala.util.{Try, Success, Failure}

// Import des classes nécessaires depuis les autres packages
import models.ModelManager
import models.GenerateurTexte
import services.FileService

// Définition des formats JSON
trait JsonFormats extends SprayJsonSupport with DefaultJsonProtocol {
  // Classe pour les suggestions
  final case class Suggestion(mot: String, probabilite: Double)
  final case class SuggestionResponse(suggestions: List[Suggestion])

  // Format JSON pour les classes ci-dessus
  implicit val suggestionFormat: RootJsonFormat[Suggestion] = jsonFormat2(
    Suggestion.apply
  )
  implicit val suggestionResponseFormat: RootJsonFormat[SuggestionResponse] =
    jsonFormat1(SuggestionResponse.apply)

  // Format pour les informations de modèle
  implicit val modelInfoFormat: RootJsonFormat[ModelManager.ModelInfo] =
    jsonFormat2(
      ModelManager.ModelInfo.apply
    )
}

// Routes de l'API
class ApiRoutes(implicit
    system: ActorSystem[_],
    mat: Materializer,
    ec: ExecutionContextExecutor
) extends JsonFormats {

  // Route pour les suggestions
  val suggestionsRoute = path("api" / "suggestions") {
    get {
      parameters(
        "texte",
        "taille".as[Int].?(2),
        "nombre".as[Int].?(5),
        "modelId".?
      ) { (texte, taille, nombre, modelIdOpt) =>
        val modelId = modelIdOpt.getOrElse("default")
        val tailleNGramme = taille.max(1).min(3) // Limiter entre 1 et 3
        val modeleSuggestion =
          ModelManager.getSuggestionneur(modelId, tailleNGramme)

        val suggestions =
          if texte.trim.isEmpty then List.empty
          else modeleSuggestion.suggerer(texte, nombre)

        val suggestionResponseObj = SuggestionResponse(
          suggestions.map { case (mot, prob) => Suggestion(mot, prob) }
        )

        complete(suggestionResponseObj)
      }
    }
  }

  // Route pour la génération de texte
  val generateRoute = path("api" / "generer") {
    get {
      parameters(
        "prefixe",
        "tailleNGramme".as[Int].?(3),
        "nombreMots".as[Int].?(50),
        "modelId".?
      ) { (prefixe, tailleNGramme, nombreMots, modelIdOpt) =>
        val modelId = modelIdOpt.getOrElse("default")
        val taille = tailleNGramme.max(1).min(3) // Limiter entre 1 et 3
        val modeleSuggestion =
          ModelManager.getSuggestionneur(modelId, taille)
        val generateur = GenerateurTexte(modeleSuggestion)

        val texteGenere =
          if prefixe.trim.isEmpty then ""
          else generateur.generer(prefixe, nombreMots)

        complete(JsObject("texte" -> JsString(texteGenere)))
      }
    }
  }

  // Route pour obtenir la liste des modèles
  val modelsRoute = path("api" / "models") {
    get {
      val models = ModelManager.getModels()
      complete(JsObject("models" -> models.toJson))
    }
  }

  // Route pour supprimer un modèle
  val deleteModelRoute = path("api" / "models" / Segment) { modelId =>
    delete {
      if (modelId == "default") {
        // Ne pas permettre la suppression du modèle par défaut
        complete(
          StatusCodes.BadRequest -> JsObject(
            "error" -> JsString(
              "Le modèle par défaut ne peut pas être supprimé"
            )
          )
        )
      } else {
        // Essayer de supprimer le modèle
        val result = ModelManager.deleteModel(modelId)
        if (result) {
          complete(
            StatusCodes.OK -> JsObject(
              "status" -> JsString(s"Modèle '$modelId' supprimé avec succès")
            )
          )
        } else {
          complete(
            StatusCodes.NotFound -> JsObject(
              "error" -> JsString(s"Modèle '$modelId' introuvable")
            )
          )
        }
      }
    }
  }

  // Route pour uploader des fichiers
  val uploadRoute = path("api" / "upload") {
    post {
      parameters("modelId".?, "append".as[Boolean].?) {
        (modelIdOpt, appendOpt) =>
          entity(as[Multipart.FormData]) { formData =>
            val modelId = modelIdOpt.getOrElse("default")
            val append = appendOpt.getOrElse(false)

            val uploadFuture = formData.parts
              .mapAsync(1) { part =>
                val fileName = part.filename.getOrElse("unknown")
                if (fileName.endsWith(".txt")) {
                  val tempFile = FileService.createTempFilePath(fileName)
                  part.entity.dataBytes
                    .runWith(FileIO.toPath(tempFile))
                    .map(_ => (fileName, tempFile))
                } else {
                  part.entity.discardBytes()
                  Future.successful((fileName, Paths.get("")))
                }
              }
              .runFold(List.empty[(String, Path)])(_ :+ _)

            onComplete(uploadFuture) { tryResult =>
              tryResult match {
                case Success(files) =>
                  // Traitement des fichiers uploadés
                  val textes = files.flatMap { case (fileName, path) =>
                    if (Files.exists(path)) {
                      val textOption = FileService.readAndCleanTextFile(path)
                      // Nettoyage du fichier temporaire
                      FileService.deleteTempFile(path)
                      textOption
                    } else None
                  }

                  if (textes.nonEmpty) {
                    val texteComplet = textes.mkString(" ")
                    ModelManager.createModel(modelId, texteComplet, append)
                    complete(
                      StatusCodes.OK -> JsObject(
                        "status" -> JsString("Modèle mis à jour avec succès")
                      )
                    )
                  } else {
                    complete(
                      StatusCodes.BadRequest -> JsObject(
                        "status" -> JsString(
                          "Aucun texte valide n'a été extrait des fichiers"
                        )
                      )
                    )
                  }
                case Failure(ex) =>
                  complete(
                    StatusCodes.InternalServerError -> JsObject(
                      "error" -> JsString(
                        s"Erreur lors du traitement des fichiers: ${ex.getMessage}"
                      )
                    )
                  )
              }
            }
          }
      }
    }
  }

  // Regroupement de toutes les routes API
  val routes =
    suggestionsRoute ~ generateRoute ~ modelsRoute ~ deleteModelRoute ~ uploadRoute
}

// Routes pour les pages web statiques
class StaticRoutes {
  val routes =
    // Fichiers statiques
    pathPrefix("static") {
      getFromResourceDirectory("static")
    } ~
      // Pages de l'application
      pathPrefix("app") {
        path("suggestions") {
          getFromResource("static/suggestions.html")
        } ~
          path("generator") {
            getFromResource("static/generator.html")
          } ~
          path("settings") {
            getFromResource("static/settings.html")
          } ~
          pathEndOrSingleSlash {
            getFromResource("static/index.html")
          }
      } ~
      // Redirection de la racine vers /app
      pathEndOrSingleSlash {
        redirect("/app", StatusCodes.PermanentRedirect)
      }
}

// Toutes les routes combinées
object Routes {
  def apply()(implicit
      system: ActorSystem[_],
      mat: Materializer,
      ec: ExecutionContextExecutor
  ) = {
    val apiRoutes = new ApiRoutes().routes
    val staticRoutes = new StaticRoutes().routes

    apiRoutes ~ staticRoutes
  }
}
