pipeline {
    agent any

    tools {
        // Manage Jenkins > Tools > NodeJS installations > Name: nodejs
        nodejs 'nodejs'
    }

    environment {
        // Manage Jenkins > Tools > SonarQube Scanner installations > Name: sonarscanner
        SCANNER_HOME = tool 'sonarscanner'
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                // Or, for a plain Pipeline job (not "Pipeline script from SCM"):
                // git branch: 'main', url: 'https://github.com/<your-user>/node-sonar-ci.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'node -v && npm -v'
                sh 'npm install'
            }
        }

        stage('Unit Tests + Coverage') {
            steps {
                sh 'npm test'
            }
        }

        stage('SonarQube Analysis') {
            steps {
                // Manage Jenkins > System > SonarQube servers > Name: sonarserver
                withSonarQubeEnv('sonarserver') {
                    // Secret text credential with ID: sonartoken
                    withCredentials([string(credentialsId: 'sonartoken', variable: 'SONAR_TOKEN')]) {
                        sh '''
                            $SCANNER_HOME/bin/sonar-scanner \
                              -Dsonar.projectKey=node-sonar-ci \
                              -Dsonar.projectName=node-sonar-ci \
                              -Dsonar.sources=src \
                              -Dsonar.tests=tests \
                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                              -Dsonar.token=$SONAR_TOKEN
                        '''
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                // Needs a webhook in SonarQube: http://<jenkins-url>/sonarqube-webhook/
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }
        stage("BuildArtifact") {
            steps
            {
                sh 'mvn package'
    }
        }

    }
    post {
        always {
            archiveArtifacts artifacts: 'coverage/lcov.info', allowEmptyArchive: true
        }
        success {
            echo 'CI passed: tests, SonarQube analysis and Quality Gate all green.'
        }
        failure {
            echo 'CI failed. Check the stage logs and the SonarQube dashboard.'
        }
    }
}
