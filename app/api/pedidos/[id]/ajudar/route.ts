// Importa NextResponse para devolver respostas da API
import { NextResponse } from "next/server";

// Importa a função que liga ao MongoDB
import { connectMongo } from "@/lib/mongodb";

// Importa o modelo Pedido
import { Pedido } from "@/lib/models/Pedido";

// Rota PATCH para aceitar um pedido
export async function PATCH(
  // req representa o pedido HTTP recebido
  req: Request,

  // params contém os parâmetros dinâmicos do URL
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

    // Atualiza o pedido pelo id
    const pedidoAtualizado = await Pedido.findByIdAndUpdate(
      id,

      // Campos que vão ser alterados
      {
        // Guarda o nome da pessoa que aceitou ajudar
        ajudanteNome: body.ajudanteNome,

        // Muda o estado do pedido
        estado: "em_progresso",
      },

      // Faz com que o MongoDB devolva o documento já atualizado
      { returnDocument: "after" }
    );

    // Devolve o pedido atualizado em JSON
    return NextResponse.json(pedidoAtualizado);

  } catch {

    // Caso exista algum erro,
    // devolve mensagem de erro com status 500
    return NextResponse.json(
      { error: "Erro ao aceitar pedido" },
      { status: 500 }
    );
  }
}