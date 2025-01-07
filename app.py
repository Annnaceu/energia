from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)  # Permitir conexões do frontend


def connect_db():
    conn = sqlite3.connect("consumo.db")
    conn.row_factory = sqlite3.Row
    return conn


def create_tables():
    conn = connect_db()
    cursor = conn.cursor()
    # Tabela de consumo
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS consumo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            consumo REAL NOT NULL
        )
    """)
    # Tabela de limite de consumo
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS limite_consumo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            limite REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()


@app.route("/api/consumo", methods=["POST"])
def inserir_consumo():
    dados = request.json
    data = dados.get("data")
    consumo = dados.get("consumo")

    if not data or not consumo:
        return jsonify({"error": "Campos 'data' e 'consumo' são obrigatórios"}), 400

    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO consumo (data, consumo) VALUES (?, ?)", (data, consumo))
    conn.commit()

    # Verificar limite
    cursor.execute("SELECT limite FROM limite_consumo ORDER BY id DESC LIMIT 1")
    limite = cursor.fetchone()
    alerta = None
    if limite and consumo > limite["limite"]:
        alerta = f"Consumo de {consumo} kWh ultrapassou o limite de {limite['limite']} kWh!"

    conn.close()

    return jsonify({"message": "Dados inseridos com sucesso!", "alerta": alerta}), 201


@app.route("/api/consumo", methods=["GET"])
def listar_consumo():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consumo")
    rows = cursor.fetchall()
    conn.close()

    dados = [dict(row) for row in rows]
    return jsonify(dados)


@app.route("/api/consumo/analise", methods=["GET"])
def analisar_consumo():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT AVG(consumo) as media, MAX(consumo) as pico FROM consumo")
    row = cursor.fetchone()
    conn.close()

    return jsonify({
        "media": row["media"],
        "pico": row["pico"]
    })


@app.route("/api/limite", methods=["POST"])
def definir_limite():
    dados = request.json
    limite = dados.get("limite")

    if limite is None:
        return jsonify({"error": "Campo 'limite' é obrigatório"}), 400

    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM limite_consumo")  # Apenas um limite deve existir
    cursor.execute("INSERT INTO limite_consumo (limite) VALUES (?)", (limite,))
    conn.commit()
    conn.close()

    return jsonify({"message": "Limite de consumo definido com sucesso!"}), 200


@app.route("/api/limite", methods=["GET"])
def obter_limite():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT limite FROM limite_consumo ORDER BY id DESC LIMIT 1")
    limite = cursor.fetchone()
    conn.close()

    if limite:
        return jsonify({"limite": limite["limite"]}), 200
    else:
        return jsonify({"limite": None}), 200


if __name__ == "__main__":
    create_tables()  # Criar tabelas na primeira execução
    app.run(debug=True)
