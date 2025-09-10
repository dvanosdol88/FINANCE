Here are the detailed, step-by-step instructions for the first phase of setting up the backend application. This guide will walk you through creating the project structure, installing the necessary dependencies, and running a basic "Hello World" version of the Falcon API server.

This serves as a solid foundation and a verifiable stopping point before we proceed with database and Teller API integration.

Step 1: Backend Project Initialization
This guide details the first phase of building the financial dashboard's backend. The objective is to establish a clean project structure, install all necessary Python dependencies, and confirm that a basic Falcon web server can be run locally.

1. Create Project Directory and Virtual Environment
First, we will create the main project directory and a Python virtual environment within it to manage dependencies in an isolated manner.bash

Create the root directory for the project
mkdir financial_dashboard_project
cd financial_dashboard_project

Create a Python virtual environment
The Python version is 3.12.3 as specified in your project files
python3 -m venv.venv

Activate the virtual environment
On macOS/Linux:
source.venv/bin/activate

On Windows:
#..venv\Scripts\activate


## 2. Install Dependencies

Next, we will create a `requirements.txt` file and install the required Python packages. This includes Falcon for the web framework, Gunicorn as the production-grade server, SQLAlchemy for the database ORM, and `psycopg2-binary` as the PostgreSQL driver.[2, 3, 4, 5, 6, 1]

```bash
# Create the requirements.txt file
touch requirements.txt
Now, add the following content to the requirements.txt file.

requirements.txt
Web Framework
falcon==3.0.1
gunicorn==20.1.0

Database ORM and Driver
SQLAlchemy==2.0.23
psycopg2-binary==2.9.9

HTTP Client & Utilities
requests==2.25.1
python-dotenv==1.0.0

With the file saved, run the following command from your terminal to install these packages into your virtual environment.

Bash

pip install -r requirements.txt
3. Create the Application Directory Structure
A well-organized directory structure is crucial for maintainability. Execute the following commands to create the folders and empty Python files for our backend application.   

Bash

# Create the main application package
mkdir app
touch app/__init__.py

# Create sub-packages for different components
mkdir app/resources
touch app/resources/__init__.py

mkdir app/services
touch app/services/__init__.py

mkdir app/models
touch app/models/__init__.py

# Create core application and database files
touch app/app.py
touch app/db.py
touch app/middleware.py
After running these commands, your project structure should look like this:

/financial_dashboard_project
├──.venv/
├── app/
│   ├── __init__.py
│   ├── app.py
│   ├── db.py
│   ├── middleware.py
│   ├── models/
│   │   └── __init__.py
│   ├── resources/
│   │   └── __init__.py
│   └── services/
│       └── __init__.py
└── requirements.txt
4. Create the Initial Falcon Application
Now, let's add the minimum required code to app/app.py to create a running Falcon application. This version will have a single "health check" endpoint at the root (/) that returns a simple JSON message.

Add the following code to app/app.py:

Python

# app/app.py

import falcon
import json

# Define a simple resource for a health check
class HealthCheckResource:
    def on_get(self, req, resp):
        """Handles GET requests"""
        resp.status = falcon.HTTP_200  # This is the default
        resp.content_type = falcon.MEDIA_JSON
        resp.text = json.dumps({
            "status": "ok",
            "message": "Falcon API is running!"
        })

# Create the Falcon WSGI application instance
app = application = falcon.App()

# Instantiate the health check resource
health_check = HealthCheckResource()

# Add a route to the health check resource
app.add_route('/', health_check)
5. Run the Application Locally
With the basic application code in place, we can now run it using the Gunicorn server we installed earlier.   

From the root directory (financial_dashboard_project), run the following command in your terminal:

Bash

gunicorn --reload app.app:application
--reload: This flag tells Gunicorn to automatically restart the server whenever a code change is detected, which is very useful for development.

app.app:application: This tells Gunicorn where to find the WSGI application instance. It looks for a variable named application inside the app.py file within the app package.

You should see output indicating that the server is running, something like:

[INFO] Starting gunicorn...
[INFO] Listening at: [http://127.0.0.1:8000](http://127.0.0.1:8000)...
[INFO] Using worker: sync
[INFO] Booting worker with pid:...
6. Verify the Application is Running
Finally, open a new terminal window (leaving Gunicorn running in the first one) and use curl to send a request to your running application.

Bash

curl [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
You should receive the following JSON response, confirming that your Falcon application is up and running correctly:

JSON

{"status": "ok", "message": "Falcon API is running!"}
  
Stopping Point Summary

You have successfully:

Created a clean project structure for the backend.

Installed all the necessary Python dependencies into an isolated virtual environment.

Written a minimal Falcon application with a single API endpoint.

Served the application locally using Gunicorn.

Verified that the application is running and responding to requests.

This provides a stable foundation for the next steps, which will involve connecting to the PostgreSQL database and implementing the Teller API logic.