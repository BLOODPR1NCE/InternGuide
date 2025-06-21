from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

def create_app():
    from flask import Flask
    from backend.config import Config
    
    app = Flask(__name__)
    app.config.from_object(Config)
    
    db.init_app(app)
    
    return app