1. Создайте виртуальное окружение:

```bash
python -m venv venv
```

2. Активируйте его
```bash
venv\Scripts\activate
```

3. Установите пакет:

```bash
pip install flask-cors
```

4. Установите значение для старта
```bash
$env:FLASK_APP="backend/app.py"     
```
 
5. Установите зависимости:
```bash
pip install -r backend/requirements.txt
```

6. Создайте базу данных:
```bash
python database/create_db.py
```

7. Заполните тестовыми данными:
```bash
python database/test_data.py
```

8. Запустите сервер:
```bash
python backend/app.py
```
