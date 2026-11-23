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
        sh 'npm pack'
        archiveArtifacts artifacts: '*.tgz', fingerprint: true
    }
        }
        stage("scanartifactwithTrivy")
        {
            steps
            {
         sh '''
            rm -rf trivy-scan && mkdir trivy-scan
            tar -xzf node-sonar-ci-*.tgz -C trivy-scan

            # npm pack strips the lock file – rebuild it (no install, no scripts run)
            cd trivy-scan/package
            npm install --package-lock-only --omit=dev --ignore-scripts
            cd ../..

            # Full report – vulnerabilities + secrets
            trivy rootfs --scanners vuln,secret \
                --format table \
                --output trivy-npm-report.txt \
                trivy-scan/package/

            # Quality gate – fail on CRITICAL
            trivy rootfs --scanners vuln \
                --severity CRITICAL \
                --exit-code 1 \
                --no-progress \
                trivy-scan/package/
        '''

                
    }
        }

stage('Publish to Nexus') {
    environment {
        NEXUS_NPM = 'http://3.107.40.126:8081/repository/npm-hosted/'
    }
    steps {
        withCredentials([usernamePassword(credentialsId: 'nexus-creds',
                                          usernameVariable: 'NEXUS_USER',
                                          passwordVariable: 'NEXUS_PASS')]) {
            sh '''
                AUTH=$(echo -n "$NEXUS_USER:$NEXUS_PASS" | base64)
                REG=${NEXUS_NPM#http:}

                # Temporary .npmrc – only for this publish
                cat > .npmrc-nexus <<EOF
${REG}:_auth=${AUTH}
${REG}:always-auth=true
EOF

                npm publish node-sonar-ci-*.tgz \
                    --registry "$NEXUS_NPM" \
                    --userconfig .npmrc-nexus
            '''
        }
    }
    post {
        always {
            sh 'rm -f .npmrc-nexus'
        }
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
