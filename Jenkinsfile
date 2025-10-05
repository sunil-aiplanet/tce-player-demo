@Library("Shared") _
pipeline {
    agent { label "AgentOne" }
    stages{
        stage("Greetings"){
            steps{
                script{
                    hello()
                }
            }
        }
        stage("Code"){
            steps{
                script{
                    clone_repo(
                        "TCEPlayerDemoApp", 
                        "https://github.com/sunil-aiplanet/tce-player-demo.git", 
                        "main"
                    )
                }
            }
        }
        stage("Build"){
            steps {
                echo "Building backend Docker image..."
                sh "docker build -t tce-player-demo-backend-jenkins:latest backend/"
                echo "Backend build completed successfully!"
                
                echo "Building frontend Docker image..."
                sh "docker build -t tce-player-demo-frontend-jenkins:latest frontend/"
                echo "Frontend build completed successfully!"
                
                echo "Builds completed successfully!"
            }
        }
        stage("Push Docker Images"){
            steps{
                echo "Pushing images to docker hub...!"
                
                withCredentials([
                    usernamePassword(
                        "credentialsId":"DockerHub", 
                        usernameVariable:"dockerHubUsername", 
                        passwordVariable:"dockerHubPassword"
                    )
                ]){
                    sh "docker login -u ${env.dockerHubUsername} -p ${env.dockerHubPassword}"
                
                    sh "docker image tag tce-player-demo-backend-jenkins:latest ${env.dockerHubUsername}/tce-player-demo-backend-jenkins:latest"
                    sh "docker image tag tce-player-demo-frontend-jenkins:latest ${env.dockerHubUsername}/tce-player-demo-frontend-jenkins:latest"
                    
                    sh "docker push ${env.dockerHubUsername}/tce-player-demo-backend-jenkins:latest"
                    sh "docker push ${env.dockerHubUsername}/tce-player-demo-frontend-jenkins:latest"   
                }
            }
        }
        stage("Deploy") {
            steps {
                echo "Deploying backend, frontend & nginx containers...!"
        
                // Stop and remove existing backend container if it exists
                sh '''
                    if [ $(docker ps -aq -f name=tce-backend) ]; then
                        docker stop tce-backend
                        docker rm tce-backend
                    fi
                '''
        
                // Stop and remove existing frontend container if it exists
                sh '''
                    if [ $(docker ps -aq -f name=tce-frontend) ]; then
                        docker stop tce-frontend
                        docker rm tce-frontend
                    fi
                '''
                
                // Stop and remove existing nginx container if it exists
                sh '''
                    if [ $(docker ps -aq -f name=tce-nginx) ]; then
                        docker stop tce-nginx
                        docker rm tce-nginx
                    fi
                '''
                
                withCredentials([
                    usernamePassword(
                        "credentialsId":"DockerHub", 
                        usernameVariable:"dockerHubUsername", 
                        passwordVariable:"dockerHubPassword"
                    )
                ]){
                    // Run backend container
                    sh """
                        docker run -d \
                            --name tce-backend \
                            -p 8900:8900 \
                            ${env.dockerHubUsername}/tce-player-demo-backend-jenkins:latest
                    """
                    
                    // Run frontend container
                    sh """
                        docker run -d \
                            --name tce-frontend \
                            -p 5173:5173 \
                            ${env.dockerHubUsername}/tce-player-demo-frontend-jenkins:latest
                    """
                }
        
                // Run nginx container
                sh """
                    docker run -d \
                        --name tce-nginx \
                        -p 80:80 \
                        -v /Users/sunil/Desktop/tce-player/tce-player-demo/nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro \
                        --link tce-frontend \
                        --link tce-backend \
                        nginx:latest
                """
                
                echo "Deployment completed successfully...!"
            }
        }
    }
}
