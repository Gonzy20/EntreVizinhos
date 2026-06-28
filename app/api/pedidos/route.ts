// Importa NextResponse para devolver respostas da API
import { NextResponse } from "next/server";

// Importa a função que faz ligação ao MongoDB
import { connectMongo } from "@/lib/mongodb";

// Importa o modelo Pedido
import { Pedido } from "@/lib/models/Pedido";

// Importa o modelo Freguesia.
// Isto é necessário para o populate funcionar corretamente.
import "@/lib/models/Freguesia";


// =========================
// GET pedidos
// =========================

// Rota GET para obter todos os pedidos
export async function GET() {

  // Liga ao MongoDB
  await connectMongo();

  // Procura todos os pedidos na base de dados
  // populate("freguesia") substitui o id da freguesia
  // pelos dados completos da freguesia
  // sort({ createdAt: -1 }) ordena do mais recente para o mais antigo
  const pedidos = await Pedido.find()
    .populate("freguesia")
    .sort({ createdAt: -1 });

  // Devolve os pedidos em formato JSON
  return NextResponse.json(pedidos);
}


// =========================
// POST pedido
// =========================

// Rota POST para criar um novo pedido
export async function POST(req: Request) {
  try {

    // Converte o body da request para JSON
    const body = await req.json();

    // Liga ao MongoDB
    await connectMongo();

    // Cria automaticamente um novo documento no MongoDB
    // O Mongoose gera o _id automaticamente
    const novoPedido = await Pedido.create({
      // Titulo do pedido
      titulo: body.titulo,

      // Nome da pessoa que criou o pedido
      nomePessoa: body.nomePessoa,

      // Descrição do pedido
      descricao: body.descricao,

      // Morada
      morada: body.morada,

      // Guarda o id da freguesia
      freguesia: body.freguesiaId,

      // Guarda coordenadas da localização
      coordenadas: {
        lat: body.lat,
        lng: body.lng,
      },
    });

    // Devolve o pedido criado com status 201 (created)
    return NextResponse.json(novoPedido, { status: 201 });

  } catch (error) {

    // Caso exista erro, devolve status 500
    return NextResponse.json(
      { error: "Erro ao criar pedido" },
      { status: 500 }
    );
  }
}