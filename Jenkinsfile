pipeline {
    agent any

    environment {
        AWS_DEFAULT_REGION   = 'us-east-1'
        EB_APP_NAME          = 'TrackMySubs'
        EB_ENV_NAME          = 'TrackMySubs-env'
        EB_BUCKET            = 'trackmysubs-eb-deployments'
        S3_FRONTEND_BUCKET   = 'trackmysubs-frontend-hosting'
        VITE_API_URL         = 'http://trackmysubs-env.eba-gmizpmmr.us-east-1.elasticbeanstalk.com/api'
        // Force npm to use the local workspace cache, not the Jenkins service account profile
        npm_config_cache     = "${WORKSPACE}\\frontend\\.npm-cache"
    }

    options {
        timeout(time: 30, unit: 'MINUTES')
        buildDiscarder(logRotator(numToKeepStr: '10'))
        disableConcurrentBuilds()
    }

    stages {

        // ─── STAGE 1: Checkout ───────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo 'Checking out code from SCM...'
                checkout scm
            }
        }

        // ─── STAGE 2: Verify Tools ───────────────────────────────────────────
        // Confirms node, npm, java, mvn are on PATH before wasting build time.
        stage('Verify Tools') {
            steps {
                echo '--- Verifying tool versions and PATH ---'
                bat 'where node && node -v'
                bat 'where npm  && npm  -v'
                bat 'where java && java -version'
                bat 'where mvn  && mvn  -version'
                echo '--- Tool verification complete ---'
            }
        }

        // ─── STAGE 3: Build Backend (Java/Spring Boot) ───────────────────────
        stage('Build Backend (Java/Spring Boot)') {
            steps {
                dir('backend') {
                    echo 'Building backend with Maven...'
                    bat 'mvn clean package -DskipTests --batch-mode --no-transfer-progress'
                }
            }
        }

        // ─── STAGE 4: Build Frontend (React/Vite) ────────────────────────────
        //
        // ROOT CAUSE: The npm debug log reveals the REAL error (not "Exit handler"):
        //   "http fetch GET ...vite-8.0.16.tgz attempt 3 failed with ECONNRESET"
        //
        // ECONNRESET = Windows (Defender/firewall/antivirus) forcibly drops the
        // TCP connection to registry.npmjs.org mid-download. npm's internal fetch
        // stream crashes before its own error handler can run, producing the
        // misleading secondary error "Exit handler never called!".
        //
        // FIX: Use --fetch-retries=5 to survive transient ECONNRESET drops,
        //      and auto-retry the entire install up to 3 times with cache wipe.
        // ─────────────────────────────────────────────────────────────────────
        stage('Build Frontend (React/Vite)') {
            steps {
                dir('frontend') {
                    echo 'Writing production environment file...'
                    bat "node -e \"require('fs').writeFileSync('.env.production', 'VITE_API_URL=${VITE_API_URL}')\""

                    script {
                        def installed = false
                        def maxAttempts = 3

                        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
                            echo "=== npm ci: attempt ${attempt} of ${maxAttempts} ==="

                            if (attempt > 1) {
                                echo 'Wiping node_modules and npm cache before retry...'
                                bat 'if exist node_modules rmdir /S /Q node_modules'
                                bat 'if exist .npm-cache   rmdir /S /Q .npm-cache'
                                sleep(time: 10, unit: 'SECONDS')
                            }

                            // Key npm flags:
                            //   --omit=optional           skip platform-native binaries (lightningcss-*, rolldown-*)
                            //   --fetch-retries=5         retry each download 5x on ECONNRESET
                            //   --fetch-retry-mintimeout  10 s between retries
                            //   --fetch-retry-maxtimeout  60 s between retries
                            //   --no-progress / --no-color  plain output safe for Jenkins
                            def exitCode = bat(
                                script: 'call npm ci --omit=optional --fetch-retries=5 --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=60000 --cache .npm-cache --no-progress --no-audit --no-fund --no-color',
                                returnStatus: true
                            )

                            if (exitCode == 0) {
                                echo "=== npm ci succeeded on attempt ${attempt} ==="
                                installed = true
                                break
                            }

                            echo "=== npm ci FAILED on attempt ${attempt} (exit: ${exitCode}) ==="
                            // Print last 100 lines of the npm debug log immediately
                            bat '''
                                for /f "delims=" %%F in ('dir /b /o-d /a-d ".npm-cache\\_logs\\*debug*.log" 2^>nul') do (
                                    echo === NPM DEBUG LOG ^(last 100 lines^): %%F ===
                                    powershell -NoProfile -NonInteractive -Command "Get-Content '.npm-cache\\_logs\\%%F' -Tail 100"
                                    goto :logdone
                                )
                                :logdone
                            '''
                        }

                        if (!installed) {
                            error("""
FATAL: npm ci failed after ${maxAttempts} attempts.
REAL CAUSE (from npm debug log): ECONNRESET — the Jenkins agent machine's
network/firewall is forcibly resetting TCP connections to registry.npmjs.org.

REQUIRED ACTIONS (pick one):
  1. Add registry.npmjs.org (104.16.x.x range) to Windows Defender / AV whitelist.
  2. Set up a local npm registry mirror (Nexus / Verdaccio) and point .npmrc at it.
  3. Pre-install node_modules locally, commit the cache, and use --prefer-offline.
""")
                        }
                    }

                    echo 'Running Vite production build...'
                    bat 'call npm run build'
                    echo 'Frontend build complete.'
                }
            }
        }

        // ─── STAGE 5: Deploy Backend to AWS Elastic Beanstalk ────────────────
        stage('Deploy Backend to AWS Elastic Beanstalk') {
            steps {
                dir('backend') {
                    withCredentials([aws(credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                        echo 'Uploading JAR to S3...'
                        bat "aws s3 cp target/subscription-management-backend-0.0.1-SNAPSHOT.jar s3://${EB_BUCKET}/app-v${BUILD_NUMBER}.jar"

                        echo 'Creating Elastic Beanstalk application version...'
                        bat "aws elasticbeanstalk create-application-version --application-name ${EB_APP_NAME} --version-label v${BUILD_NUMBER} --source-bundle S3Bucket=\"${EB_BUCKET}\",S3Key=\"app-v${BUILD_NUMBER}.jar\""

                        echo 'Updating Elastic Beanstalk environment...'
                        bat "aws elasticbeanstalk update-environment --application-name ${EB_APP_NAME} --environment-name ${EB_ENV_NAME} --version-label v${BUILD_NUMBER}"
                    }
                }
            }
        }

        // ─── STAGE 6: Deploy Frontend to AWS S3 ──────────────────────────────
        stage('Deploy Frontend to AWS S3') {
            steps {
                dir('frontend/dist') {
                    withCredentials([aws(credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                        echo "Syncing dist/ to s3://${S3_FRONTEND_BUCKET}..."
                        bat "aws s3 sync . s3://${S3_FRONTEND_BUCKET} --delete"
                        echo 'Frontend deployed successfully.'
                    }
                }
            }
        }
    }

    post {
        success {
            echo '============================================'
            echo 'DEPLOYMENT SUCCESSFUL! App is live on AWS.'
            echo '============================================'
        }
        failure {
            echo '================================================================'
            echo 'DEPLOYMENT FAILED.'
            echo 'If the error was npm ECONNRESET: whitelist registry.npmjs.org'
            echo 'in Windows Defender / firewall on the Jenkins agent machine.'
            echo '================================================================'
        }
        cleanup {
            echo 'Pipeline finished. Workspace retained for npm cache reuse.'
        }
    }
}
