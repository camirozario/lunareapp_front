# 🌙 Lunare  
### Tracker de Ciclo & Sintomas

O Lunare foi criado para melhorar a qualidade de vida de seu usuário. Com o foco majoritário em mulheres, a aplicação permite trackear sintomas diversos, criados pelo próprio usuário ao longo do mês. A UI foi pensada para facilitar a visualização desses sintomas - a roda central mostra um resumo com cores, identificando os tipos de sintomas registrados. A finalidade é permitir que mulheres compreendam ainda melhor cada particularidade do seu corpo, que tem um ciclo lunar. 


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

Para a execução correta do projeto, o usuário deve ter a API ativa. Como proposta do MVP, foi requerido que API fosse comitada em um repositório distinto. A API do lunare se encontra no seguinte link: [https://github.com/camirozario/lunareapp_api](https://github.com/camirozario/lunareapp_api)

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
