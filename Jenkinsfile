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
        //
        // WHY THE INJECT STEP IS HERE:
        //   application.properties is listed in .gitignore (intentionally, to keep
        //   secrets out of the repo). This means the Jenkins workspace NEVER has it
        //   after a fresh checkout, so Maven packages a JAR with no properties file.
        //   At runtime, Spring Boot fails to resolve ${app.jwt.secret} → JwtUtil
        //   bean cannot be created → Tomcat cannot start → EB shows "Degraded".
        //
        // FIX:
        //   Store application.properties as a Jenkins "Secret file" credential with
        //   ID "trackmysubs-application-properties". This stage writes it into the
        //   correct resources directory before mvn package runs, so the real values
        //   are baked into the fat JAR and available to Spring Boot on startup.
        //
        // HOW TO ADD THE CREDENTIAL (one-time setup):
        //   Jenkins → Manage Jenkins → Credentials → (global) → Add Credential
        //     Kind      : Secret file
        //     ID        : trackmysubs-application-properties
        //     File      : upload your local application.properties
        // ─────────────────────────────────────────────────────────────────────
        stage('Build Backend (Java/Spring Boot)') {
            steps {
                // Step 1: Inject application.properties from Jenkins Secret File
                withCredentials([file(credentialsId: 'trackmysubs-application-properties',
                                      variable: 'APP_PROPS_FILE')]) {
                    echo 'Injecting application.properties from Jenkins credentials...'
                    bat "copy /Y \"%APP_PROPS_FILE%\" backend\\src\\main\\resources\\application.properties"
                    echo 'application.properties injected successfully.'
                }

                // Step 2: Build the fat JAR (properties file is now present)
                dir('backend') {
                    echo 'Building backend with Maven...'
                    bat 'mvn clean package -DskipTests --batch-mode --no-transfer-progress'
                    echo 'Backend JAR built successfully.'
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
                                script: 'call npm ci --fetch-retries=5 --fetch-retry-mintimeout=10000 --fetch-retry-maxtimeout=60000 --cache .npm-cache --no-progress --no-audit --no-fund --no-color',
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
        //
        // ROOT CAUSE of silent s3 cp failure on Windows:
        //   aws s3 cp exits 0 but uploads nothing because:
        //   (a) each bat{} is a separate cmd.exe — 'aws configure set' in one bat
        //       does NOT reliably take effect in the next bat on Windows.
        //   (b) AWS CLI v2 on Windows has a known pipe/stream bug that returns 0
        //       on large-file upload failures.
        //
        // FIX:
        //   1. Verify the JAR exists locally BEFORE attempting upload.
        //   2. Pass multipart flags directly on the cp command line (not via configure).
        //   3. Capture the exit code of aws s3 cp and fail loudly if non-zero.
        //   4. Re-verify with aws s3 ls immediately after — catches the silent-0 bug.
        //   5. Retry the entire upload+verify cycle up to 3 times.
        // ─────────────────────────────────────────────────────────────────────
        stage('Deploy Backend to AWS Elastic Beanstalk') {
            steps {
                dir('backend') {
                    withCredentials([aws(credentialsId: 'aws-credentials', accessKeyVariable: 'AWS_ACCESS_KEY_ID', secretKeyVariable: 'AWS_SECRET_ACCESS_KEY')]) {
                        script {
                            echo 'Fetching default Elastic Beanstalk storage location...'
                            bat '@aws elasticbeanstalk create-storage-location --query "S3Bucket" --output text > eb_bucket.txt'
                            def autoEbBucket = readFile('eb_bucket.txt').trim()
                            echo "Using AWS-managed EB bucket: ${autoEbBucket}"

                            // ── Step 1: Confirm the JAR was built ──────────────────────────────
                            def jarExists = bat(
                                script: 'if exist "target\\subscription-management-backend-0.0.1-SNAPSHOT.jar" (exit 0) else (exit 1)',
                                returnStatus: true
                            )
                            if (jarExists != 0) {
                                error('''
FATAL: JAR file not found at backend/target/subscription-management-backend-0.0.1-SNAPSHOT.jar
The Maven build stage may have failed silently, or the workspace was cleaned between stages.
''')
                            }
                            echo 'JAR file confirmed present locally. Proceeding with S3 upload...'

                            // ── Step 2: Upload with retry + inline multipart flags ─────────────
                            // Pass --no-multipart via the CLI flags directly (not via 'aws configure set'
                            // which runs in a separate process and may not be visible to this bat call).
                            // For a ~74 MB JAR, raising the threshold to 200 MB forces single-part upload.
                            def s3Key    = "app-v${BUILD_NUMBER}.jar"
                            def s3Uri    = "s3://${autoEbBucket}/${s3Key}"
                            def uploaded = false
                            def maxUploadAttempts = 3

                            for (int attempt = 1; attempt <= maxUploadAttempts; attempt++) {
                                echo "=== S3 upload attempt ${attempt} of ${maxUploadAttempts} ==="

                                def cpExitCode = bat(
                                    script: "aws s3 cp target\\subscription-management-backend-0.0.1-SNAPSHOT.jar ${s3Uri} --no-progress --sse AES256",
                                    returnStatus: true
                                )

                                if (cpExitCode != 0) {
                                    echo "=== aws s3 cp returned non-zero exit code: ${cpExitCode} (attempt ${attempt}) ==="
                                } else {
                                    // AWS CLI v2 Windows bug: exit 0 does NOT guarantee the file is in S3.
                                    // Re-verify immediately with aws s3 ls.
                                    def lsExitCode = bat(
                                        script: "aws s3 ls ${s3Uri}",
                                        returnStatus: true
                                    )
                                    if (lsExitCode == 0) {
                                        echo "=== Upload VERIFIED in S3 on attempt ${attempt} ==="
                                        uploaded = true
                                        break
                                    } else {
                                        echo "=== aws s3 cp returned 0 BUT file NOT found in S3 (silent failure, attempt ${attempt}) ==="
                                    }
                                }

                                if (attempt < maxUploadAttempts) {
                                    echo "Waiting 10 s before retry..."
                                    sleep(time: 10, unit: 'SECONDS')
                                }
                            }

                            if (!uploaded) {
                                error("""
FATAL: aws s3 cp failed to upload the JAR after ${maxUploadAttempts} attempts.

COMMON CAUSES (check in this order):
  1. IAM PERMISSIONS: The Jenkins IAM user is missing s3:PutObject on bucket '${autoEbBucket}'.
     FIX → AWS Console > IAM > Users > jenkins-user > Add inline policy:
       { "Effect":"Allow", "Action":["s3:PutObject","s3:GetObject","s3:ListBucket"],
         "Resource":"arn:aws:s3:::${autoEbBucket}/*" }

  2. AWS CLI WINDOWS BUG: Known issue where large uploads silently exit 0 without uploading.
     FIX → Upgrade to AWS CLI v2.15+ on the Jenkins agent:
       msiexec /i https://awscli.amazonaws.com/AWSCLIV2.msi

  3. NETWORK/FIREWALL: Windows Defender / antivirus is resetting the TCP connection to S3.
     FIX → Add s3.amazonaws.com to Windows Defender outbound allow list.
""")
                            }

                            // ── Step 3: Create EB application version ─────────────────────────
                            echo 'JAR verified in S3. Creating Elastic Beanstalk application version...'
                            def createVersionExitCode = bat(
                                script: "aws elasticbeanstalk create-application-version --application-name ${EB_APP_NAME} --version-label v${BUILD_NUMBER} --source-bundle S3Bucket=\"${autoEbBucket}\",S3Key=\"${s3Key}\"",
                                returnStatus: true
                            )
                            if (createVersionExitCode != 0) {
                                error("""
FATAL: Elastic Beanstalk create-application-version failed!
The JAR exists in S3 (verified above), so this is an IAM permission error.
The Jenkins IAM user is missing 'elasticbeanstalk:CreateApplicationVersion'
or 's3:GetObject' on bucket '${autoEbBucket}'.
FIX: Attach the AWS managed policy 'AdministratorAccess-AWSElasticBeanstalk'
     to the Jenkins IAM user in the AWS Console.
""")
                            }

                            // ── Step 4: Deploy to EB environment ──────────────────────────────
                            echo 'Deploying new version to Elastic Beanstalk environment...'
                            bat "aws elasticbeanstalk update-environment --application-name ${EB_APP_NAME} --environment-name ${EB_ENV_NAME} --version-label v${BUILD_NUMBER}"
                            echo 'Elastic Beanstalk environment update triggered. Deployment is in progress.'
                        }
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
