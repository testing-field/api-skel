pipeline {
    environment {
        registry = "wdalmut/app2"
        registryCredential = 'dockerhub'
    }
    agent none

    stages {
        stage('Test') {
            agent any
            environment {
                NODE_ENV="test"
            }
            steps {
                script {
                    docker.image('mysql:5.7').withRun('-e "MYSQL_ROOT_PASSWORD=root"') { c ->
                        docker.image('mysql:5.7').inside("--link ${c.id}:db") {
                            /* Wait until mysql service is up */
                            sh 'while ! mysqladmin ping -hdb --silent; do sleep 1; done'
                            sh 'mysql -hdb -uroot -proot -e "create database app_test;"'
                        }

                        docker.image('node:12-alpine').inside("--link ${c.id}:db") {
                            sh 'npm i'
                            sh 'DB_NAME=app_test ./node_modules/.bin/knex migrate:latest'
                            sh 'DB_NAME=app_test ./node_modules/.bin/jasmine'
                        }
                    }
                }
            }
        }
        stage ('Push Image') {
            agent any
            steps {
                script {
                    def customImage = docker.build(registry + ":${env.BUILD_ID}", "-f Dockerfile_prod .")

                    docker.withRegistry( '', registryCredential ) {
                        customImage.push()
                    }
                }
            }
        }
        stage('propose changes for Development') {
            agent any
            environment {
                PR_NUMBER = "app2-build-$BUILD_NUMBER"
            }
            steps {
                git branch: 'master', credentialsId: 'github', url: 'git@github.com:testing-field/gitops-dev-infrastructure.git'
                sh 'git config --global user.email "walter.dalmut@gmail.com"'
                sh 'git config --global user.name "Walter Dal Mut"'

                sh "git checkout -b feature/${PR_NUMBER}"

                sh 'kubectl patch -f app2/app.yaml -p \'{"spec":{"template":{"spec":{"containers":[{"name":"hello-pod","image":"'+ registry + ":${env.BUILD_ID}" + '"}]}}}}\' --local -o yaml | tee /tmp/app2.yaml'
                sh 'mv /tmp/app2.yaml app2/app.yaml'

                sh 'git add app2/app.yaml'

                sh 'git commit -m "[JENKINS-CI] - new application release"'

                sshagent(['github']) {
                    sh("""
                        #!/usr/bin/env bash
                        set +x
                        export GIT_SSH_COMMAND="ssh -oStrictHostKeyChecking=no"
                        git push origin feature/${PR_NUMBER}
                     """)
                }

                withCredentials([string(credentialsId: 'github_token', variable: 'GITHUB_TOKEN')]) {
                    sh 'hub pull-request -m "[JENKINS-CI] - Pull Request for image: "'+registry
                }
            }
        }
    }
}

