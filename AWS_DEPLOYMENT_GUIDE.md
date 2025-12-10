# AWS Deployment Guide

This guide will walk you through deploying the Process Tracker application to AWS.

## Prerequisites

1.  **AWS CLI**: Installed and configured with your credentials (`aws configure`).
2.  **AWS SAM CLI**: Installed (`sam --version`).
3.  **Node.js & NPM**: For the frontend.

## Step 1: Deploy Backend (Serverless)

We will use AWS SAM to deploy the Lambda functions, DynamoDB tables, and API Gateway.

1.  Open your terminal/command prompt to the project root.
2.  Build the application:
    ```bash
    sam build
    ```
3.  Deploy the application:
    ```bash
    sam deploy --guided
    ```
4.  Follow the prompts:
    - **Stack Name**: `wabash-process-tracker`
    - **AWS Region**: (e.g., `us-east-1`)
    - **Confirm changes before deploy**: `y`
    - **Allow SAM CLI IAM role creation**: `y`
    - **Disable rollback**: `n`
    - **ProcessTrackerApi may not have authorization defined, Is this okay?**: `y` (We are using public API for this demo, similar to the Azure setup)
    - **Save arguments to configuration file**: `y`

5.  **Wait for deployment to finish.**
6.  **Copy the API URL**: Look at the "Outputs" section of the SAM deployment output. Copy the value for `ApiUrl`. It will look like `https://xyz.execute-api.us-east-1.amazonaws.com/Prod/`.

## Step 2: Deploy Frontend (HTTPS via CloudFront)

Accessing S3 directly only provides HTTP. For HTTPS, we use AWS CloudFront. I have updated the `template.yaml` to create this configuration automatically.

1.  **Redeploy Infrastructure**:
    ```bash
    sam deploy
    ```
    *Note: Type `Y` if promoted to verify changes. You will see new resources being created (CloudFront Distribution, Frontend Bucket).*

2.  **Get New URLs**:
    After deployment finishes, check the "Outputs" section in your terminal. You will see:
    -   `ApiUrl`: Your backend URL.
    -   `FrontendUrl`: Your new secure **HTTPS** website URL (e.g., `https://d12345abcdef.cloudfront.net`).
    -   `FrontendBucketName`: The name of the S3 bucket created for your website.

3.  **Build Frontend**:
    ```bash
    cd src
    npm install
    npm run build
    ```

4.  **Sync Files to New Bucket**:
    Use the `FrontendBucketName` from the outputs (it will look like `wabash-frontend-123456...`).
    ```bash
    # Replace <your-new-frontend-bucket-name> below
    python -m awscli s3 sync dist s3://<your-new-frontend-bucket-name>
    ```

5.  **Access your App**:
    - Go to the `FrontendUrl` (https://...). It may take a few minutes for CloudFront to deploy globally.

## Verify Deployment

1.  Open the App URL on your phone or browser.

2.  Go to **Admin** (password is `root`) and add a Process.
3.  Go to **Home**, start a process, and stop it.

4.  **Check DynamoDB**: Go to AWS Console -> DynamoDB -> Tables -> `WorkLogsTable`. You should see the entry.
5.  **Check S3 Ingestion**: Go to AWS Console -> S3 -> `wabash-ingestion-...` bucket. You should see a JSON file for the completed log.

## Troubleshooting

-   **Error: "Could not connect to the endpoint URL"**: This happens if you select `Global` as the AWS Region. You **MUST** type a valid region like `us-east-1` when prompted.
-   **Error: "no identity-based policy allows... CreateChangeSet"**: This means your AWS User does not have enough permissions. You need `AdministratorAccess` or full permissions for CloudFormation, IAM, S3, DynamoDB, and Lambda.
-   **CORS Errors**: If you see CORS errors in the browser console, ensure the `ApiUrl` in `.env.production` is correct and does NOT have a trailing slash if your code appends one, or vice-versa. The backend handles CORS with `Access-Control-Allow-Origin: *`.
-   **500 Errors**: Check CloudWatch Logs for the Lambda functions.
