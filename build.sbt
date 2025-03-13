val scala3Version = "3.3.1"
val AkkaVersion = "2.8.0"
val AkkaHttpVersion = "10.5.2"
val LogbackVersion = "1.2.11"

lazy val root = project
  .in(file("."))
  .settings(
    name := "projet",
    version := "0.1.0",
    scalaVersion := scala3Version,
    scalacOptions ++= Seq(
      "-explain",
      "-explain-types",
      "-feature",
      "-deprecation"
    ),

    // Définir la classe principale par défaut pour sbt run
    Compile / mainClass := Some("main"),
    libraryDependencies ++= Seq(
      // Akka dependencies
      "com.typesafe.akka" %% "akka-actor-typed" % AkkaVersion,
      "com.typesafe.akka" %% "akka-stream" % AkkaVersion,
      "com.typesafe.akka" %% "akka-http" % AkkaHttpVersion,
      "com.typesafe.akka" %% "akka-http-spray-json" % AkkaHttpVersion,

      // Serialization
      "org.scala-lang.modules" %% "scala-xml" % "2.1.0",
      "org.scala-lang.modules" %% "scala-parallel-collections" % "1.0.4",

      // Logging
      "org.slf4j" % "slf4j-api" % "1.7.36",
      "ch.qos.logback" % "logback-classic" % LogbackVersion,

      // Testing dependencies
      "org.scalameta" %% "munit" % "0.7.29" % Test,
      "io.circe" %% "circe-core" % "0.14.5",
      "io.circe" %% "circe-generic" % "0.14.5",
      "io.circe" %% "circe-parser" % "0.14.5"
    ),

    // Ressources statiques
    Compile / unmanagedResourceDirectories += baseDirectory.value / "src" / "main" / "resources",

    // Tasks de déploiement
    assembly / mainClass := Some("main"),
    assembly / assemblyJarName := "predictive-text-app.jar"
  )

// Configuration pour le plugin sbt-assembly
ThisBuild / assemblyMergeStrategy := {
  case PathList("META-INF", xs @ _*) => MergeStrategy.discard
  case "reference.conf"              => MergeStrategy.concat
  case x                             => MergeStrategy.first
}
