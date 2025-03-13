import akka.actor.typed.ActorSystem
import akka.actor.typed.scaladsl.Behaviors
import akka.http.scaladsl.Http
import scala.concurrent.ExecutionContextExecutor
import scala.io.StdIn
import akka.stream.Materializer
import api.Routes
import models.ModelManager

object WebApp {

  @main def serverMain(): Unit = {
    ModelManager.loadAllModels()

    // Création du système d'acteurs
    implicit val system: ActorSystem[Nothing] =
      ActorSystem(Behaviors.empty, "predictionTexteSysteme")

    // Contexte d'exécution implicite requis pour futures
    implicit val executionContext: ExecutionContextExecutor =
      system.executionContext

    // Materializer requis pour les streams Akka
    implicit val materializer: Materializer = Materializer(system)

    // Création des routes
    val routes = Routes()

    // Démarrage du serveur HTTP
    val bindingFuture = Http().newServerAt("localhost", 8080).bind(routes)

    println(s"Serveur démarré à http://localhost:8080/")
    println(s"Appuyez sur RETURN pour arrêter...")

    // Attente de la commande d'arrêt
    StdIn.readLine()

    // Arrêt propre du serveur
    bindingFuture
      .flatMap(_.unbind())
      .onComplete(_ => {
        println("Serveur arrêté")
        system.terminate()
      })
  }
}
