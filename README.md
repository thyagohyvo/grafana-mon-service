# 📡 Service Monitoring Timeline - Grafana HTML Graphics

Um painel de monitoramento de serviços em tempo real, construído com o plugin **Grafana HTML Graphics**, consumindo dados do **Zabbix via MySQL**. Exibe o status de hosts (UP/DOWN), uptime e data de início estimada em uma interface de timeline clean e responsiva.

---
<img width="1845" height="843" alt="image" src="https://github.com/user-attachments/assets/24bbafc6-4c0a-4c6a-a6da-c30583d8fb20" />

## ✨ Funcionalidades

- **Timeline visual** com indicadores de status (UP / DOWN)
- **Ordenação automática**: hosts offline aparecem primeiro
- **Filtro em tempo real** por nome do servidor
- **Tema automático** (claro/escuro) sincronizado com o Grafana
- **Contadores** de hosts online e offline no cabeçalho
- **Uptime formatado** (`Xd Xh Xm`) com data estimada de início do estado

---

## 🛠️ Tecnologias

| Camada       | Tecnologia                  |
|--------------|-----------------------------|
| Plataforma   | Grafana                     |
| Plugin       | HTML Graphics               |
| Fonte de dados | Zabbix → MySQL            |
| Tipografia   | IBM Plex Sans / IBM Plex Mono (Google Fonts) |

---

## 📁 Estrutura

```
.
├── panel.html      # Estrutura HTML do painel
├── script.js       # Lógica de renderização e eventos
└── styles.css      # Estilos (variáveis CSS, dark/light theme)
```

Query
<img width="1911" height="822" alt="image" src="https://github.com/user-attachments/assets/628a80d0-1147-4ff0-b9ba-3aec38a59771" />

```
SELECT
    h.name AS Servidor,

    -- Status (Zabbix agent)
    (
        SELECT hu.value
        FROM history_uint hu
        WHERE hu.itemid = iagent.itemid
        ORDER BY hu.clock DESC
        LIMIT 1
    ) AS Status,

    -- Uptime
    (
        SELECT hu.value
        FROM history_uint hu
        WHERE hu.itemid = iuptime.itemid
        ORDER BY hu.clock DESC
        LIMIT 1
    ) AS Uptime

FROM hosts h
JOIN hosts_groups hg ON hg.hostid = h.hostid
JOIN hstgrp g ON g.groupid = hg.groupid

-- Agent
LEFT JOIN items iagent
  ON iagent.hostid = h.hostid
 AND iagent.key_ = 'agent.ping'

-- Uptime
LEFT JOIN items iuptime
  ON iuptime.hostid = h.hostid
 AND iuptime.key_ = 'system.uptime'

WHERE g.name = 'NOME-DO-GRUPO-DE-HOST'
  AND h.status = 0

ORDER BY h.name;
```


## ⚙️ Configuração

### Pré-requisitos

- Grafana com o plugin [HTML Graphics](https://grafana.com/grafana/plugins/gapit-htmlgraphics-panel/) instalado
- Fonte de dados Zabbix configurada via MySQL

### Query esperada

O painel espera um `DataFrame` com as seguintes colunas:

| Coluna    | Tipo    | Descrição                            |
|-----------|---------|--------------------------------------|
| `Servidor`| string  | Nome do host                         |
| `Status`  | number  | `1` = UP, `0` = DOWN                 |
| `Uptime`  | number  | Tempo em segundos desde o último boot|

### Instalação

1. No Grafana, adicione um novo painel e selecione o tipo **HTML Graphics**.
2. Cole o conteúdo de `panel.html` no campo **HTML**.
3. Cole o conteúdo de `styles.css` no campo **CSS**.
4. Cole o conteúdo de `onrender.js` no campo **JavaScript**.
5. Configure a fonte de dados MySQL com a query que retorna as colunas acima.
6. Salve o painel.

---

## 🎨 Temas

O painel detecta automaticamente o tema do Grafana (`htmlGraphics.theme.isDark`) e aplica variáveis CSS correspondentes. Não é necessária nenhuma configuração manual.

---

## 📄 Licença

MIT - sinta-se livre para usar, modificar e distribuir. Se este card te ajudou e você for compartilhar em alguma rede social, blog ou fórum, considere fazer uma referência a este repositório como base. Isso ajuda a comunidade a encontrar o projeto e contribui para que mais pessoas se beneficiem da solução. 🙌 🔗
