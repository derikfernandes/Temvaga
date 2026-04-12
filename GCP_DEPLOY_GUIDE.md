# Guia de Publicação no Google Cloud (GCP)

Esta aplicação foi desenvolvida para rodar de forma escalável no Google Cloud. Abaixo estão os serviços necessários e os passos para publicação.

## 1. Serviços Necessários

*   **Firebase Hosting:** Para hospedar os arquivos estáticos do frontend (React).
*   **Firebase Authentication:** Para gerenciar o login e criação de contas de usuários.
*   **Cloud Firestore:** Banco de Dados NoSQL para armazenar perfis de usuários, aplicações a vagas e cursos adquiridos.
*   **Cloud Run (Opcional):** Caso deseje adicionar uma API backend customizada no futuro.

## 2. Passos para Publicação Manual

### Pré-requisitos
1. Instale o [Google Cloud SDK](https://cloud.google.com/sdk/docs/install).
2. Instale o Firebase CLI: `npm install -g firebase-tools`.

### Configuração do Projeto
1. Faça login: `firebase login`.
2. Inicialize o projeto: `firebase init`.
    *   Selecione `Hosting` e `Firestore`.
    *   Escolha o projeto existente: `sincere-blade-342520`.
    *   Diretório público: `dist`.
    *   Configurar como SPA: `Yes`.

### Deploy
1. Gere o build da aplicação: `npm run build`.
2. Faça o deploy: `firebase deploy`.

## 3. Variáveis de Ambiente
Certifique-se de que as chaves do Firebase em `firebase-applet-config.json` estejam corretas no seu ambiente de produção. O Google AI Studio já configurou o projeto `sincere-blade-342520` para você.

## 4. Segurança
As regras de segurança do Firestore já foram definidas em `firestore.rules`. Elas garantem que:
*   Usuários só leiam seus próprios perfis.
*   Usuários só vejam suas próprias candidaturas e cursos.
*   Dados sejam validados antes de serem gravados.
