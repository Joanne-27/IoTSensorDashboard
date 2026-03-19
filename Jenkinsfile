pipeline {
    agent any

    tools {
        jdk 'JDK_17'
        maven 'Maven3'
    }

    environment {
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                // Compiles the code without running tests yet
                bat 'mvn clean compile'
            }
        }

        stage('Unit Tests') {
            steps {
                // Runs standard JUnit tests
                // EXCLUSION: Runs all tests EXCEPT the Karate TestRunner
                bat 'mvn test -Dtest=!TestRunner'
            }
        }

        stage('Coverage Report') {
            steps {
                // Explicitly generates the JaCoCo HTML report
                bat 'mvn jacoco:report'
            }
        }

        stage('Secure Token Check') {
            steps {
                bat 'echo "GitHub Token is successfully loaded and ready for use."'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('LocalSonar') {
                    bat 'mvn sonar:sonar -Dsonar.projectKey=iot-sensor-dashboard'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('API Tests (Karate)') {
            steps {
                // INCLUSION: Runs ONLY the Karate TestRunner
                // Now that the app is built and Sonar is done, we run E2E API tests
                bat 'mvn test -Dtest=TestRunner -Dsurefire.failIfNoSpecifiedTests=false'
            }
        }

        stage('UI Tests (Selenium)') {
            steps {
                // Runs Selenium tests using the profile defined in your pom.xml
                bat 'mvn verify -Pselenium'
            }
        }
    }

    post {
        always {
            // Records results from all test stages for the Trend Graph
            junit 'target/surefire-reports/*.xml'

            publishHTML(target: [
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'JaCoCo Code Coverage',
                keepAll: true,
                alwaysLinkToLastBuild: true
            ])

            publishHTML(target: [
                reportDir: 'target/karate-reports',
                reportFiles: 'karate-summary.html',
                reportName: 'Karate API Reports',
                keepAll: true,
                alwaysLinkToLastBuild: true
            ])
        }
    }
}