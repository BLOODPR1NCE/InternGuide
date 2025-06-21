import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent / 'intern_guide.db'

def create_database():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Создание таблицы пользователей
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        surname TEXT NOT NULL,
        login TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('trainee', 'curator', 'admin')),
        registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Создание таблицы материалов
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS materials (
        material_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        content TEXT,
        category TEXT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_url TEXT,
        FOREIGN KEY (author_id) REFERENCES users(user_id)
    )
    ''')
    
    # Создание таблицы тестов
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tests (
        test_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        creator_id INTEGER NOT NULL,
        description TEXT,
        max_score INTEGER NOT NULL,
        FOREIGN KEY (creator_id) REFERENCES users(user_id)
    )
    ''')
    
    # Создание таблицы вопросов
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS questions (
        question_id INTEGER PRIMARY KEY AUTOINCREMENT,
        test_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        points INTEGER NOT NULL,
        option_a TEXT NOT NULL,
        option_b TEXT NOT NULL,
        option_c TEXT,
        option_d TEXT,
        correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
        FOREIGN KEY (test_id) REFERENCES tests(test_id)
    )
    ''')
    
    # Создание таблицы прогресса
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS progress (
        progress_id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        test_id INTEGER,
        material_id INTEGER,
        completion_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        score INTEGER,
        status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
        FOREIGN KEY (user_id) REFERENCES users(user_id),
        FOREIGN KEY (test_id) REFERENCES tests(test_id),
        FOREIGN KEY (material_id) REFERENCES materials(material_id)
    )
    ''')
    
    conn.commit()
    conn.close()

if __name__ == '__main__':
    create_database()
    print("База данных успешно создана")