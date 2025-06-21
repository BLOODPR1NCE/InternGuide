import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent.parent
DB_PATH = BASE_DIR / 'database' / 'intern_guide.db'

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'ingosstrakh-intern-guide-secret-key-2023')
    SQLALCHEMY_DATABASE_URI = f'sqlite:///{DB_PATH}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    DEBUG = os.getenv('DEBUG', 'True') == 'True'