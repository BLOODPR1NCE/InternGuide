import sqlite3
from pathlib import Path
from datetime import datetime, timedelta
import random
from werkzeug.security import generate_password_hash, check_password_hash

DB_PATH = Path(__file__).parent / 'intern_guide.db'

def insert_test_data():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Очистка таблиц
    cursor.execute("DELETE FROM progress")
    cursor.execute("DELETE FROM questions")
    cursor.execute("DELETE FROM tests")
    cursor.execute("DELETE FROM materials")
    cursor.execute("DELETE FROM users")
    
    hashed_password_adm = generate_password_hash(
        'admin123',
        method='pbkdf2:sha256',
        salt_length=16
    )
    
    hashed_password_cur = generate_password_hash(
        'curator123',
        method='pbkdf2:sha256',
        salt_length=16
    )
    
    hashed_password_tra = generate_password_hash(
        'trainee123',
        method='pbkdf2:sha256',
        salt_length=16
    )
    # Добавление пользователей
    users = [
        ('Иван', 'Иванов', 'admin', hashed_password_adm, 'admin'), #admin123
        ('Петр', 'Петров', 'curator1', hashed_password_cur, 'curator'), #curator123
        ('Мария', 'Сидорова', 'curator2', hashed_password_cur, 'curator'), 
        ('Алексей', 'Смирнов', 'trainee1', hashed_password_tra, 'trainee'), #trainee123
        ('Елена', 'Кузнецова', 'trainee2', hashed_password_tra, 'trainee')
    ]
    cursor.executemany(
        "INSERT INTO users (name, surname, login, password, role) VALUES (?, ?, ?, ?, ?)",
        users
    )
    
    # Добавление материалов
    materials = [
        ('Знакомство с Ингосстрах', 2, 'История компании, миссия и ценности...', 'О компании', None),
        ('Этика и стандарты поведения', 3, 'Как вести себя в офисе...', 'Корпоративная культура', None),
        ('Основные IT-системы компании', 2, 'Как работать с корпоративными системами...', 'Рабочие процессы', None)
    ]
    cursor.executemany(
        "INSERT INTO materials (title, author_id, content, category, file_url) VALUES (?, ?, ?, ?, ?)",
        materials
    )
    
    # Добавление тестов
    tests = [
        ('Введение в страхование', 2, 'Основные понятия и принципы страхования', 10, datetime.now()),
        ('Продукты Ингосстрах', 3, 'Основные страховые продукты компании', 5, datetime.now()),
        ('Корпоративные стандарты', 2, 'Проверка знаний корпоративной культуры', 10, datetime.now())
    ]
    cursor.executemany(
        "INSERT INTO tests (title, creator_id, description, max_score, creation_date) VALUES (?, ?, ?, ?, ?)",
        tests
    )
    
    # Добавление вопросов
    questions = [
        (1, 'Что такое страхование?', 5, 'Защита от рисков', 'Передача рисков', 'Накопление средств', 'Инвестирование', 'A'),
        (1, 'Основной принцип страхования?', 5, 'Солидарность', 'Диверсификация', 'Регресс', 'Аккумулирование', 'B'),
        (2, 'Какой продукт не относится к Ингосстрах?', 5, 'Автострахование', 'Ипотечное страхование', 'Медицинское страхование', 'Кредитное страхование', 'D'),
        (3, 'Как обращаться к коллегам?', 5, 'На "ты"', 'На "вы"', 'По имени', 'По фамилии', 'B'),
        (3, 'Дресс-код в офисе?', 5, 'Спортивный', 'Деловой', 'Кэжуал', 'Любой', 'B')
    ]
    cursor.executemany(
        """INSERT INTO questions (test_id, text, points, option_a, option_b, option_c, option_d, correct_option) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        questions
    )
    
    # Добавление прогресса
    progress = [
        (4, None, 1, datetime.now() - timedelta(days=2), None, 'started'),
        (4, 1, None, datetime.now() - timedelta(days=1), 15, 'completed'),
        (5, None, 2, datetime.now() - timedelta(days=3), None, 'started'),
        (5, 2, None, datetime.now() - timedelta(days=1), 8, 'completed')
    ]
    cursor.executemany(
        """INSERT INTO progress (user_id, material_id, test_id, completion_date, score, status) 
        VALUES (?, ?, ?, ?, ?, ?)""",
        progress
    )
    
    conn.commit()
    conn.close()
    print("Тестовые данные успешно добавлены")

if __name__ == '__main__':
    insert_test_data()