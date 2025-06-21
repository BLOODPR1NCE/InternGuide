from backend import create_app, db
from backend.routes.auth import auth_bp
from backend.routes.materials import materials_bp
from backend.routes.progress import progress_bp
from backend.routes.tests import tests_bp
from backend.routes.users import users_bp
from flask_cors import CORS

app = create_app()
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:*", "file://*"],
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# Регистрация blueprint'ов
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(materials_bp, url_prefix='/api')
app.register_blueprint(progress_bp, url_prefix='/api')
app.register_blueprint(tests_bp, url_prefix='/api')
app.register_blueprint(users_bp, url_prefix='/api')

# Создание таблиц при первом запуске
with app.app_context():
    db.create_all()

@app.route('/')
def index():
    return 'Intern Guide API'

if __name__ == '__main__':
    app.run(debug=True)