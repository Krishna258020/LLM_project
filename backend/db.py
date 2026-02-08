"""
MySQL Database Setup Script for Multi-Agent Debate System
This script creates the database and all required tables on port 3306
Compatible with MySQL Workbench and standalone MySQL installations
"""

import mysql.connector
from mysql.connector import Error
import sys
from datetime import datetime
import uuid

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 3306,
    'user': 'root',
    'password': 'Bhargav9@'  # Change this if your MySQL has a password
}

DB_NAME = 'debate_database'

def create_connection(include_db=False):
    """Create a connection to MySQL server"""
    try:
        config = DB_CONFIG.copy()
        if include_db:
            config['database'] = DB_NAME
        
        connection = mysql.connector.connect(**config)
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"✓ Successfully connected to MySQL Server version {db_info}")
            return connection
    except Error as e:
        print(f"✗ Error connecting to MySQL: {e}")
        return None

def create_database(connection):
    """Create the debate_database if it doesn't exist"""
    try:
        cursor = connection.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_NAME}")
        print(f"✓ Database '{DB_NAME}' created successfully")
        cursor.close()
        return True
    except Error as e:
        print(f"✗ Error creating database: {e}")
        return False

def create_tables(connection):
    """Create all required tables"""
    cursor = connection.cursor()
    
    tables = {
        'users': """
            CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(36) PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role VARCHAR(50) DEFAULT 'user',
                created_at DATETIME NOT NULL,
                last_login DATETIME DEFAULT NULL,
                INDEX idx_username (username),
                INDEX idx_email (email)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        'debates': """
            CREATE TABLE IF NOT EXISTS debates (
                id VARCHAR(36) PRIMARY KEY,
                prompt TEXT NOT NULL,
                result TEXT NOT NULL,
                steps JSON NOT NULL,
                timestamp DATETIME NOT NULL,
                tags JSON DEFAULT NULL,
                category VARCHAR(100) DEFAULT NULL,
                is_favorite BOOLEAN DEFAULT FALSE,
                duration_seconds INT DEFAULT NULL,
                user_id VARCHAR(36) DEFAULT NULL,
                INDEX idx_timestamp (timestamp),
                INDEX idx_category (category),
                INDEX idx_favorite (is_favorite),
                INDEX idx_user_id (user_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        'templates': """
            CREATE TABLE IF NOT EXISTS templates (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                prompt_template TEXT NOT NULL,
                category VARCHAR(100),
                is_public BOOLEAN DEFAULT TRUE,
                created_by VARCHAR(36),
                created_at DATETIME NOT NULL,
                usage_count INT DEFAULT 0,
                INDEX idx_category (category),
                INDEX idx_public (is_public),
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        
        'status_checks': """
            CREATE TABLE IF NOT EXISTS status_checks (
                id VARCHAR(36) PRIMARY KEY,
                client_name VARCHAR(255) NOT NULL,
                timestamp DATETIME NOT NULL,
                INDEX idx_timestamp (timestamp)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    }
    
    try:
        for table_name, create_query in tables.items():
            cursor.execute(create_query)
            print(f"✓ Table '{table_name}' created successfully")
        
        connection.commit()
        cursor.close()
        return True
    except Error as e:
        print(f"✗ Error creating tables: {e}")
        return False

def insert_sample_data(connection):
    """Insert sample templates and demo user"""
    cursor = connection.cursor()
    
    try:
        # Insert sample templates
        templates = [
            (str(uuid.uuid4()), 'Technical Analysis', 
             'Analyze technical concepts and implementations',
             'Explain the technical aspects of {topic} including architecture, implementation details, and best practices.',
             'Technical', datetime.now(), 0),
            
            (str(uuid.uuid4()), 'Business Strategy',
             'Evaluate business strategies and decisions',
             'Analyze the business strategy for {topic}, including market analysis, competitive advantages, and potential risks.',
             'Business', datetime.now(), 0),
            
            (str(uuid.uuid4()), 'Code Review',
             'Review code quality and suggest improvements',
             'Review the following code and provide feedback on quality, performance, security, and best practices: {code}',
             'Development', datetime.now(), 0),
            
            (str(uuid.uuid4()), 'Problem Solving',
             'Break down and solve complex problems',
             'Help me solve this problem step by step: {problem}. Provide a clear analysis and solution.',
             'General', datetime.now(), 0),
            
            (str(uuid.uuid4()), 'Learning Path',
             'Create learning roadmaps for topics',
             'Create a comprehensive learning path for {topic}, including prerequisites, resources, and milestones.',
             'Education', datetime.now(), 0)
        ]
        
        template_query = """
            INSERT INTO templates (id, name, description, prompt_template, category, created_at, usage_count)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE name=name
        """
        
        cursor.executemany(template_query, templates)
        print(f"✓ Inserted {len(templates)} sample templates")
        
        # Insert demo user (password: demo123)
        # This is the bcrypt hash for 'demo123'
        demo_user = (
            str(uuid.uuid4()),
            'demo',
            'demo@example.com',
            '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqYr8P8fKu',
            'user',
            datetime.now()
        )
        
        user_query = """
            INSERT INTO users (id, username, email, password_hash, role, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE username=username
        """
        
        cursor.execute(user_query, demo_user)
        print("✓ Created demo user (username: demo, password: demo123)")
        
        connection.commit()
        cursor.close()
        return True
    except Error as e:
        print(f"✗ Error inserting sample data: {e}")
        return False

def verify_setup(connection):
    """Verify that all tables were created and contain data"""
    cursor = connection.cursor()
    
    try:
        print("\n" + "="*50)
        print("DATABASE VERIFICATION")
        print("="*50)
        
        # Check users
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"✓ Users table: {user_count} records")
        
        # Check templates
        cursor.execute("SELECT COUNT(*) FROM templates")
        template_count = cursor.fetchone()[0]
        print(f"✓ Templates table: {template_count} records")
        
        # Check debates
        cursor.execute("SELECT COUNT(*) FROM debates")
        debate_count = cursor.fetchone()[0]
        print(f"✓ Debates table: {debate_count} records")
        
        # Check status_checks
        cursor.execute("SELECT COUNT(*) FROM status_checks")
        status_count = cursor.fetchone()[0]
        print(f"✓ Status_checks table: {status_count} records")
        
        print("="*50)
        cursor.close()
        return True
    except Error as e:
        print(f"✗ Error verifying setup: {e}")
        return False

def main():
    """Main execution function"""
    print("="*50)
    print("MySQL Database Setup for Multi-Agent Debate System")
    print("="*50)
    print(f"Target: {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"Database: {DB_NAME}")
    print("="*50 + "\n")
    
    # Step 1: Connect to MySQL server
    print("Step 1: Connecting to MySQL server...")
    connection = create_connection(include_db=False)
    if not connection:
        print("\n✗ Failed to connect to MySQL. Please check:")
        print("  1. MySQL is installed and running")
        print("  2. MySQL is running on port 3306")
        print("  3. Root password is correct (update DB_CONFIG if needed)")
        sys.exit(1)
    
    # Step 2: Create database
    print("\nStep 2: Creating database...")
    if not create_database(connection):
        connection.close()
        sys.exit(1)
    
    # Close connection and reconnect with database selected
    connection.close()
    
    # Step 3: Connect to the new database
    print("\nStep 3: Connecting to debate_database...")
    connection = create_connection(include_db=True)
    if not connection:
        sys.exit(1)
    
    # Step 4: Create tables
    print("\nStep 4: Creating tables...")
    if not create_tables(connection):
        connection.close()
        sys.exit(1)
    
    # Step 5: Insert sample data
    print("\nStep 5: Inserting sample data...")
    if not insert_sample_data(connection):
        connection.close()
        sys.exit(1)
    
    # Step 6: Verify setup
    print("\nStep 6: Verifying setup...")
    verify_setup(connection)
    
    # Close connection
    connection.close()
    
    print("\n" + "="*50)
    print("✓ DATABASE SETUP COMPLETE!")
    print("="*50)
    print("\nYou can now:")
    print("  1. Start the backend server: cd backend && v2\\Scripts\\activate && python server.py")
    print("  2. Login with demo account:")
    print("     Username: demo")
    print("     Password: demo123")
    print("\nConnection details:")
    print(f"  Host: {DB_CONFIG['host']}")
    print(f"  Port: {DB_CONFIG['port']}")
    print(f"  Database: {DB_NAME}")
    print(f"  User: {DB_CONFIG['user']}")
    print("="*50)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✗ Setup interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")
        sys.exit(1)
