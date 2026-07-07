pipeline {
    agent any

    environment {
        // AWS Variables - These will need to be configured based on your actual AWS setup
        AWS_DEFAULT_REGION = 'us-east-1'
        EB_APP_NAME = 'trackmysubs-backend'
        EB_ENV_NAME = 'TrackmysubsBackend-env'
        EB_BUCKET = 'trackmysubs-eb-deployments' // An S3 bucket to hold your backend .jar files
        S3_FRONTEND_BUCKET = 'trackmysubs-frontend-hosting'
    }

    stages {
        stage('Checkout') {
            steps {
                // Jenkins automatically checks out the code from the Git webhook
                echo 'Checking out code...'
                checkout scm
            }
        }

        stage('Build Backend (Java/Spring Boot)') {
            steps {
                dir('backend') {
                    echo 'Building the backend...'
                    bat 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Build Frontend (React/Vite)') {
            steps {
                dir('frontend') {
                    echo 'Building the frontend...'
                    // Jenkins on Windows System Account often crashes NPM when using the default system cache.
                    // Using a local workspace cache folder prevents the "Exit handler never called" error.
                    bat 'npm install --cache .npm-cache'
                    bat 'npm run build'
                }
            }
        }

        stage('Deploy Backend to AWS Elastic Beanstalk') {
            steps {
                dir('backend') {
                    echo 'Deploying to AWS Elastic Beanstalk...'
                    // Upload the compiled JAR to an S3 bucket
                    bat "aws s3 cp target/subscription-management-backend-0.0.1-SNAPSHOT.jar s3://${EB_BUCKET}/app-v${BUILD_NUMBER}.jar"
                    
                    // Tell Elastic Beanstalk to create a new version from that JAR
                    bat "aws elasticbeanstalk create-application-version --application-name ${EB_APP_NAME} --version-label v${BUILD_NUMBER} --source-bundle S3Bucket=\"${EB_BUCKET}\",S3Key=\"app-v${BUILD_NUMBER}.jar\""
                    
                    // Update the running environment to use the new version
                    bat "aws elasticbeanstalk update-environment --application-name ${EB_APP_NAME} --environment-name ${EB_ENV_NAME} --version-label v${BUILD_NUMBER}"
                }
            }
        }

        stage('Deploy Frontend to AWS S3') {
            steps {
                dir('frontend/dist') {
                    echo 'Deploying to AWS S3...'
                    // Sync the built 'dist' folder to the static hosting bucket
                    bat "aws s3 sync . s3://${S3_FRONTEND_BUCKET} --delete"
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment Successful! App is live on AWS.'
        }
        failure {
            echo 'Deployment Failed. Please check the Jenkins logs.'
        }
    }
}
