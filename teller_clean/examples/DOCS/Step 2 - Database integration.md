Here are the detailed instructions for the next logical step: connecting the Falcon backend to a PostgreSQL database using SQLAlchemy.

This guide will walk you through setting up the database connection, defining the data models with the SQLAlchemy ORM, and implementing middleware to manage database sessions for each API request.

Step 2: Database Integration with SQLAlchemy
This guide details the second phase of building the backend. The objective is to integrate a PostgreSQL database, define the application's data schema using SQLAlchemy's Object-Relational Mapper (ORM), and establish a reliable connection management system using Falcon middleware.

1. Update Dependencies for Local Development
For local development, it's helpful to manage environment variables (like the database connection string) in a .env file. We'll add the python-dotenv library to handle this.

First, add the new dependency to your requirements.txt file. It should now look like this:

# requirements.txt

# Web Framework
falcon==3.0.1
gunicorn==20.1.0

# Database ORM and Driver
SQLAlchemy==2.0.23
psycopg2-binary==2.9.9

# HTTP Client & Utilities
requests==2.25.1
python-dotenv==1.0.0
Now, install the new package into your virtual environment.

Bash

# Make sure your virtual environment is activated
# source.venv/bin/activate

pip install -r requirements.txt
2. Set Up Local PostgreSQL Database
Before writing the Python code, you need a running PostgreSQL database for the application to connect to.

Install PostgreSQL: If you don't have it installed, follow the official instructions for your operating system.

Create a Database and User: Open the PostgreSQL interactive terminal (psql) and run the following SQL commands. Replace 'your_password' with a secure password.

SQL

-- Create a new user for your application
CREATE USER dashboard_user WITH PASSWORD 'your_password';

-- Create the database for the application
CREATE DATABASE dashboard_db;

-- Grant all privileges on the new database to the new user
GRANT ALL PRIVILEGES ON DATABASE dashboard_db TO dashboard_user;
Create a .env file: In the root of your project (financial_dashboard_project), create a file named .env. This file will store the connection string for your local database.

Bash

touch.env
Add the following line to the .env file, replacing 'your_password' with the password you set above.

#.env
DATABASE_URL="postgresql://dashboard_user:your_password@localhost:5432/dashboard_db"
3. Configure SQLAlchemy Connection (app/db.py)
This module will be responsible for creating the SQLAlchemy engine and the session factory. It will read the DATABASE_URL from the environment variables.

Add the following code to app/db.py:

Python

# app/db.py

import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables from.env file for local development
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("No DATABASE_URL environment variable set")

# The engine is the core interface to the database
engine = create_engine(DATABASE_URL)

# A sessionmaker factory generates new Session objects
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
4. Define Database Models (app/models/schema.py)
Here, we define our database tables as Python classes using SQLAlchemy's ORM. This allows us to interact with our database using Python objects instead of raw SQL.

Create a new file app/models/schema.py and add the following code:

Python

# app/models/schema.py

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Text,
    ForeignKey,
    DateTime,
    DECIMAL,
    Date
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Base class for our declarative models
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    teller_access_token = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    accounts = relationship("Account", back_populates="owner")

class Account(Base):
    __tablename__ = 'accounts'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    teller_account_id = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    subtype = Column(String(50))
    last_four = Column(String(4))
    balance_available = Column(DECIMAL(19, 4))
    balance_ledger = Column(DECIMAL(19, 4))
    balance_last_updated = Column(DateTime(timezone=True))
    owner = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account")

class Transaction(Base):
    __tablename__ = 'transactions'
    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey('accounts.id'), nullable=False)
    teller_transaction_id = Column(String(255), unique=True, nullable=False, index=True)
    date = Column(Date, nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(DECIMAL(19, 4), nullable=False)
    status = Column(String(20))
    category = Column(String(50))
    account = relationship("Account", back_populates="transactions")

# This function can be used to create the tables in the database
def create_db_and_tables():
    from app.db import engine
    Base.metadata.create_all(bind=engine)

5. Create Session Management Middleware (app/middleware.py)
Falcon requires us to explicitly manage the database session lifecycle. We'll create a middleware that opens a new session for each incoming request and ensures it's closed properly afterward.

Add the following code to app/middleware.py:

Python

# app/middleware.py

from app.db import SessionLocal

class SQLAlchemySessionManager:
    """
    Create a scoped session for every request and close it when the request ends.
    """
    def __init__(self, Session):
        self.Session = Session

    def process_resource(self, req, resp, resource, params):
        """
        Called before routing. Open a session and attach it to the resource.
        """
        # The `resource` object is the instance of the class
        # that is handling the request.
        if resource:
            resource.session = self.Session()

    def process_response(self, req, resp, resource, req_succeeded):
        """
        Called after routing. Close the session.
        """
        if resource and hasattr(resource, 'session'):
            resource.session.close()
6. Update the Falcon Application (app/app.py)
Now, we'll update the main application file to integrate the database models, the session middleware, and add a new test endpoint to verify the database connection.

Replace the content of app/app.py with the following:

Python

# app/app.py

import falcon
import json
from app.db import engine, SessionLocal
from app.middleware import SQLAlchemySessionManager
from app.models.schema import Base

# Create all tables in the database
# This is for demonstration. In a real application, you would use
# a migration tool like Alembic.
Base.metadata.create_all(bind=engine)

# --- Resources ---

class HealthCheckResource:
    def on_get(self, req, resp):
        """Handles GET requests for the health check endpoint."""
        resp.status = falcon.HTTP_200
        resp.content_type = falcon.MEDIA_JSON
        resp.text = json.dumps({
            "status": "ok",
            "message": "Falcon API is running!"
        })

class DatabaseCheckResource:
    # This resource will have a `session` attribute injected by our middleware
    session = None

    def on_get(self, req, resp):
        """Handles GET requests to test the database connection."""
        try:
            # Execute a simple query to check the connection
            self.session.execute('SELECT 1')
            message = "Database connection successful."
            status = "ok"
            resp.status = falcon.HTTP_200
        except Exception as e:
            message = f"Database connection failed: {e}"
            status = "error"
            resp.status = falcon.HTTP_503_SERVICE_UNAVAILABLE

        resp.content_type = falcon.MEDIA_JSON
        resp.text = json.dumps({
            "status": status,
            "message": message
        })

# --- App Initialization ---

# Create the Falcon WSGI application instance, adding the session manager middleware
app = application = falcon.App(
    middleware=
)

# Instantiate resources
health_check = HealthCheckResource()
db_check = DatabaseCheckResource()

# Add routes
app.add_route('/', health_check)
app.add_route('/db-test', db_check)
7. Run and Verify
We are now ready to run the application and test the database connection.

Run the App: From the root directory (financial_dashboard_project), run Gunicorn. It will automatically pick up the changes.

Bash

gunicorn --reload app.app:application
Verify the Database Connection: Open a new terminal and use curl to send a request to the new /db-test endpoint.

Bash

curl http://127.0.0.1:8000/db-test
If everything is configured correctly, you should receive the following JSON response, confirming that the application successfully connected to your local PostgreSQL database and executed a query:

JSON

{"status": "ok", "message": "Database connection successful."}
If you see a "connection failed" message, double-check your DATABASE_URL in the .env file and ensure your PostgreSQL server is running.

Stopping Point Summary

You have successfully:

Configured a local PostgreSQL database and user.

Established the database connection logic using SQLAlchemy.

Defined the application's database schema as ORM models.

Implemented a Falcon middleware for per-request session management.

Integrated the middleware and created a test endpoint.

Verified that the Falcon application can successfully connect to and query the database.

The backend is now fully connected to a persistent database, laying the groundwork for storing and retrieving user and financial data.