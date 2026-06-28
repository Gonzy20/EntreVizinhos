// Importa NextResponse para devolver respostas da API
import { NextResponse } from "next/server";

// Importa a função que liga ao MongoDB
import { connectMongo } from "@/lib/mongodb";

// Importa o modelo Pedido
import { Pedido } from "@/lib/models/Pedido";

// Rota PATCH para marcar um pedido como não resolvido
export async function PATCH(
  // Representa o pedido HTTP recebido
  req: Request,

  // Params contém os parâmetros do URL
  // Neste caso, o id do pedido
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Converte o body da request para JSON
    const body = await req.json();

    // Obtém o id vindo do URL
    const { id } = await params;

    // Liga à base de dados MongoDB
    await connectMongo();

    // Procura o pedido pelo id e atualiza os dados
    const pedidoAtualizado = await Pedido.findByIdAndUpdate(
      id,

      // Campos que vão ser atualizados
      {
        // Volta a colocar o pedido como ativo
        estado: "ativo",

        // Remove o ajudante atual
        ajudanteNome: null,

        // Guarda a justificativa da falha
        justificativaFalha: body.justificativaFalha,
      },

      // Faz com que seja devolvido o documento já atualizado
      { returnDocument: "after" }
    );

    // Devolve o pedido atualizado em JSON
    return NextResponse.json(pedidoAtualizado);

  } catch {

    // Caso exista erro, devolve mensagem com status 500
    return NextResponse.json(
      { error: "Erro ao marcar como não resolvido" },
      { status: 500 }
    );
  }
}