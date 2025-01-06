from flask import Flask, request, jsonify
import sqlite3
from flask_cors import CORS

# Configurar o app Flask
app = Flask(__name__)
CORS(app)  # Permitir conexões do frontend

# Função para conectar ao banco de dados SQLite
def connect_db():
    conn = sqlite3.connect("consumo.db")
    conn.row_factory = sqlite3.Row
    return conn

# Criar a tabela no banco de dados (apenas na primeira execução)
def create_table():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS consumo (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            data TEXT NOT NULL,
            consumo REAL NOT NULL
        )
    """)
    conn.commit()
    conn.close()

# Rota: Inserir dados de consumo
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
    conn.close()
    
    return jsonify({"message": "Dados inseridos com sucesso!"}), 201

# Rota: Recuperar todos os dados
@app.route("/api/consumo", methods=["GET"])
def listar_consumo():
    conn = connect_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM consumo")
    rows = cursor.fetchall()
    conn.close()
    
    # Converter os dados para um formato JSON
    dados = [dict(row) for row in rows]
    return jsonify(dados)

# Rota: Calcular média e identificar picos
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

# Iniciar o servidor
if __name__ == "__main__":
    create_table()  # Criar a tabela na primeira execução
    app.run(debug=True)
