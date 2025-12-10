# WabashWoodWorks Process Tracker

A mobile-first PWA for industrial process tracking, built with React (Vite) and AWS Serverless (SAM).

## Architecture Highlights
-   **Frontend**: React + Vite + Tailwind CSS (Mobile First PWA).
-   **Backend**: AWS Lambda (Python 3.9) - Serverless API.
-   **Database**: Amazon DynamoDB (NoSQL) - Fast operational storage.
-   **Analytics**: DynamoDB Streams -> Lambda -> S3 (JSON Lines) for ingestion by Databricks.

## Project Structure
-   `/src`: React Application source code.
-   `/aws_lambda`: AWS Lambda backend code.
-   `template.yaml`: AWS SAM infrastructure definition.

## Getting Started

### Prerequisites
-   Node.js 18+
-   Python 3.9+
-   AWS CLI (`aws`)
-   AWS SAM CLI (`sam`)

### 1. Backend Deployment (AWS SAM)
Deploy the AWS resources to your account:

```bash
sam build
sam deploy --guided
```

This will provision:
- DynamoDB Tables (`Processes`, `WorkLogs`, `AuditLog`)
- Lambda Functions
- API Gateway
- S3 Buckets

### 2. Frontend Setup
In a new terminal:

```bash
cd src
npm install
npm run dev
```

Open `http://localhost:5173` to test locally.

## Deployment (Frontend)
The frontend is deployed to an S3 bucket served via CloudFront.

```bash
cd src
# Build Optimized
npm run build
# Sync to S3
aws s3 sync dist/ s3://<YOUR-FRONTEND-BUCKET> --delete
# Invalidate Cache
aws cloudfront create-invalidation --distribution-id <YOUR-DIST-ID> --paths "/*"
```

## Operation
1.  **Admin Login**: Password `root` (Default).
2.  **Tracking**: Employees verify connectivity and assume "Who is working?" identity.
3.  **Data**: Saved to DynamoDB and streamed to S3.
