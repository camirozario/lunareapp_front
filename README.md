🌙 Lunare — Tracker de Ciclo & Sintomas

Aplicação web minimalista para acompanhamento do ciclo menstrual e registro de sintomas ao longo do mês.

Permite visualizar o ciclo em formato circular, registrar sintomas com intensidade e organizar tudo por tópicos personalizados.

✨ Funcionalidades
🔵 Ciclo em formato circular
Visualização de ciclo de 28 dias
Navegação arrastando o marcador
Indicadores visuais de dias com registros
📝 Registro de sintomas
Adicionar sintomas por dia
Editar e excluir sintomas
Definir intensidade (barra visual)
Adicionar observações
🎨 Sistema de tópicos
Categorizar sintomas (Energia, Dor, Intestino, etc.)
Criar novos tópicos personalizados
Editar nome e cor do tópico
Paleta de cores em tons pastel
Interface muda de cor conforme o tópico
🧠 Experiência do usuário
Sugestões automáticas de sintomas
Ações por hover (editar / excluir)
Sidebar lateral para edição
Interface fluida e minimalista
🏗️ Estrutura do Projeto
project-root/
│
├── meu_app_api/          # Backend (Flask)
│   ├── app.py
│   ├── model/
│   └── database/
│
├── meu_app_front/        # Frontend
│   ├── index.html
│   ├── styles.css
│   ├── scripts.js
│
└── README.md
⚙️ Como rodar o projeto
1. Backend (Flask)

Instalar dependências:

pip install flask flask-cors flask-openapi3

Rodar servidor:

python app.py

A API ficará disponível em:

http://127.0.0.1:5000
2. Frontend
Opção recomendada:

Utilizar Live Server (VS Code)

Ou rodar com Python:
python -m http.server 5500

Abrir no navegador:

http://127.0.0.1:5500
🔗 Endpoints da API
Tópicos
GET /topics
POST /topics
PUT /topics/<id>
Sintomas
GET /daily-log
POST /daily-log-symptoms
POST /daily-log-symptoms/<id>/update
POST /daily-log-symptoms/<id>/delete
