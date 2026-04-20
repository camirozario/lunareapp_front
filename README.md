# 🌙 Lunare  
### Tracker de Ciclo & Sintomas

Aplicação web minimalista para acompanhar o ciclo menstrual e registrar sintomas ao longo do mês.

> Uma forma simples e visual de entender seu corpo 💫

---

## ✨ Funcionalidades

### 🔵 Ciclo em formato circular
- Visualização de ciclo de 28 dias
- Navegação arrastando o marcador
- Indicadores visuais de dias com registros

### 📝 Registro de sintomas
- Adicionar sintomas por dia
- Editar e excluir sintomas
- Definir intensidade (barra visual)
- Adicionar observações

### 🎨 Sistema de tópicos
- Categorizar sintomas (Energia, Dor, Intestino, etc.)
- Criar novos tópicos personalizados
- Editar nome e cor do tópico
- Paleta de cores em tons pastel
- Interface muda de cor conforme o tópico

### 🧠 Experiência do usuário
- Sugestões automáticas de sintomas
- Ações por hover (editar / excluir)
- Sidebar lateral para edição
- Interface fluida e minimalista

---


## ⚙️ Como rodar o projeto

### 🔹 Backend (Flask)

Instalar dependências:

```bash
pip install flask flask-cors flask-openapi3

Rodar servidor:

python app.py

A API estará disponível em:

http://127.0.0.1:5000
🔹 Frontend
✅ Opção recomendada:

Use o Live Server (VS Code)

🔄 Alternativa:
python -m http.server 5500

Abrir no navegador:

http://127.0.0.1:5500
