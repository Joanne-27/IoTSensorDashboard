pipeline {
    agent any [cite: 1]

    environment {
        // Preserved from uploaded file 
        GITHUB_TOKEN = credentials('github-token')
    }

    stages {
        stage('Checkout') {
            steps {
                // Preserved from both sources [cite: 1, 2]
                checkout scm
            }
        }

        stage('Build, Test & Coverage') {
            steps {
                // Combines 'Build and Test'  with the 'Coverage' requirements
                // 'verify' includes 'test' and 'package' logic
                sh 'mvn clean verify'
            }
        }

        stage('Secure Token Check') {
            steps {
                // Preserved from uploaded file 
                sh 'echo "Token is loaded and ready for use."'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                // Added from your SonarQube snippet
                withSonarQubeEnv('LocalSonar') {
                    sh '''
                      mvn sonar:sonar \
                        -Dsonar.projectKey=simple-java-maven-app
                    '''
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Added from your SonarQube snippet
                timeout(time: 2, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
    }

    post {
        always {
            // Preserved JUnit reporting from uploaded file [cite: 4]
            junit 'target/surefire-reports/*.xml'

            // Preserved JaCoCo HTML reporting from uploaded file 
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