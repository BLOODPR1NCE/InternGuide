from flask_sqlalchemy import SQLAlchemy
import os

db = SQLAlchemy()

def create_app():
    from flask import Flask
    from backend.config import Config
    
    app = Flask(__name__)
    app.config.from_object(Config)
    app.config['UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static/uploads')
        
    db.init_app(app)
    
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    return app