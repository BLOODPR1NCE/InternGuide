from backend import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'
    
    user_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    surname = db.Column(db.String(50), nullable=False)
    login = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='trainee')
    registration_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    materials = db.relationship('Material', backref='author', lazy=True)
    tests = db.relationship('Test', backref='creator', lazy=True)
    progress = db.relationship('Progress', backref='user', lazy=True)

class Material(db.Model):
    __tablename__ = 'materials'
    
    material_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    content = db.Column(db.Text)
    category = db.Column(db.String(50))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    file_url = db.Column(db.String(200))
    
    progress = db.relationship('Progress', backref='material', lazy=True)

class Test(db.Model):
    __tablename__ = 'tests'
    
    test_id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    creator_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    description = db.Column(db.Text)
    max_score = db.Column(db.Integer, nullable=False)
    creation_date = db.Column(db.DateTime, default=datetime.utcnow)
    
    questions = db.relationship('Question', backref='test', lazy=True, cascade='all, delete-orphan')
    progress = db.relationship('Progress', backref='test', lazy=True)

class Question(db.Model):
    __tablename__ = 'questions'
    
    question_id = db.Column(db.Integer, primary_key=True)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.test_id'), nullable=False)
    text = db.Column(db.String(500), nullable=False)
    points = db.Column(db.Integer, nullable=False, default=1)
    option_a = db.Column(db.String(200), nullable=False)
    option_b = db.Column(db.String(200), nullable=False)
    option_c = db.Column(db.String(200))
    option_d = db.Column(db.String(200))
    correct_option = db.Column(db.String(1), nullable=False)

class Progress(db.Model):
    __tablename__ = 'progress'
    
    progress_id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.user_id'), nullable=False)
    test_id = db.Column(db.Integer, db.ForeignKey('tests.test_id'))
    material_id = db.Column(db.Integer, db.ForeignKey('materials.material_id'))
    completion_date = db.Column(db.DateTime, default=datetime.utcnow)
    score = db.Column(db.Integer)
    status = db.Column(db.String(20), nullable=False, default='started')