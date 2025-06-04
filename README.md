# 📖 Simple 3-Tier Web Application

This project is a simple 3-tier web application with a static frontend and a Node.js backend. The frontend is served by Nginx, while the backend is built with Express.js.

## 📂 Project Structure
```
simple-3-tier-app/
├── Backend/         # Node.js (Express) API
├── FrontEnd/        # Static HTML served by Nginx
├── K8sManifests/    # Kubernetes deployment & service manifests
├── docker-compose.yml
└── README.md
```

## 🚀 Features

   - Frontend: Static HTML served via Nginx.
   - Backend: Node.js RESTful API using Express.js.
   - Dockerized: Separate Dockerfiles for both services.
   - Kubernetes Deployment: EKS-ready manifests for Managed Node Groups and Self-Managed Node Groups.
   - Dual Service Support:
        - ClusterIP service for internal cluster communication.
        - NodePort service variant for external testing while keeping frontend secure via LoadBalancer.

## 📝 Latest Updates
###  📌 Kubernetes Enhancements

- New Namespace: 3-tier-eks for testing ClusterIP backend accessibility.
- Backend Service ClusterIP in 3-tier-app-eks namespace with Nginx Ingress Controller

## 🛠 Getting Started
### 📦 Prerequisites

- Docker installed.
- Node.js and npm installed.
- kubectl and AWS CLI configured (if deploying on EKS)

### 📌 Running the Backend Locally
```
cd Backend
npm install
npm start
```
## 🐳 Dockerizing The Application
### 📦 Frontend
```
cd FrontEnd
docker build -t frontend:latest .
docker run -d -p 8080:80 frontend:latest
```
### Test:
```
curl http://localhost:8080
```
or open http://localhost:8080/

### 📦 Backend
```
cd Backend
docker build -t backend:latest .
docker run -d -p 3000:3000 backend:latest
```
### Test:
```
curl http://localhost:3000/api/increment
```
or open http://localhost:3000/api/increment

## 📤 Pushing Images to Docker Hub
### Frontend
```
docker build -t hendawyy/frontend:latest .
docker push hendawyy/frontend:latest
```
### Backend
```
docker build -t hendawyy/backend:latest .
docker push hendawyy/backend:latest
```
## 📥 Pulling and Running from Docker Hub
### Frontend
```
docker pull hendawyy/frontend:latest
docker run -d -p 8080:80 hendawyy/frontend:latest
```
Access: http://localhost:8080/
### Backend
```
docker pull hendawyy/backend:latest
docker run -d -p 3000:3000 hendawyy/backend:latest
```
Access: http://localhost:3000/api
## 🌐 Kubernetes Deployment

- K8s manifests available in K8sManifests/ for:

    - Deployments

    - ClusterIP and Ingress services

### Deploy using:
```
kubectl apply -f K8sManifests/
```
### Check services:
```
kubectl get svc -A
```
## 📊 Summary

- Dockerized and deployed a 3-tier web app.

- Added Kubernetes manifests for both Managed and Self-Managed EKS node groups.

- Implemented a Nginx Ingress Controller service and a LoadBalancer and ClusterIP for Both FrontEnd & Backend for backend testing.
# Test
