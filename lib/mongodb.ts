import mongoose from "mongoose";

// Função assíncrona para conectar ao MongoDB
export async function connectMongo() {
  // Obtém a URI do MongoDB a partir das variáveis de ambiente
  const MONGODB_URI = process.env.MONGODB_URI;

  // Verifica se a URI está definida
  if (!MONGODB_URI) {
    // Lança erro caso não exista
    throw new Error("Define MONGODB_URI no .env.local");
  }

  // Verifica se já existe uma conexão ativa (readyState >= 1 significa conectado ou conectando)
  if (mongoose.connection.readyState >= 1) {
    return; // Evita criar múltiplas conexões
  }

  // Estabelece a conexão com a base de dados
  await mongoose.connect(MONGODB_URI);
}