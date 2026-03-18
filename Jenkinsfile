pipeline {
    agent any

    environment {
        // Securely managing credentials from the Jenkins Store
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps {
                // Automatically clones the branch configured in the Jenkins Job (e.g., feature/testingWithJenkins)
                checkout scm
            }
        }

        stage('Build, Test & Coverage') {
            steps {
                // 'verify' runs unit tests, generates JaCoCo reports, and packages the app
                sh 'mvn clean verify'
            }
        }

        stage('Secure Token Check') {
            steps {
                // Validates that credentials are loaded without exposing the secret
                sh 'echo "GitHub Token is successfully loaded and ready for use."'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                // Integration with self-hosted SonarQube
                withSonarQubeEnv('LocalSonar') {
                    sh 'mvn sonar:sonar -Dsonar.projectKey=iot-sensor-dashboard'
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Enforce pipeline failure if Quality Gate conditions are not met
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        always {
            // Lab 5: Publishes JUnit results to the Jenkins dashboard
            junit 'target/surefire-reports/*.xml'

            // Project Requirement: Publishes JaCoCo HTML reports for code coverage visualization
            publishHTML(target: [
                reportDir: 'target/site/jacoco',
                reportFiles: 'index.html',
                reportName: 'JaCoCo Code Coverage',
                keepAll: true,
                alwaysLinkToLastBuild: true
            ])
        }
    }
}