// Importa NextResponse para devolver respostas da API
import { NextResponse } from "next/server";

// Importa a função que faz ligação ao MongoDB
import { connectMongo } from "@/lib/mongodb";

// Importa o modelo Pedido
import { Pedido } from "@/lib/models/Pedido";

// Rota PATCH para concluir um pedido
export async function PATCH(
  // Representa o pedido HTTP recebido
  req: Request,

  // Params contém os parâmetros do URL
  // Neste caso, o id do pedido
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Liga ao MongoDB
    await connectMongo();

    // Obtém o id do pedido vindo do URL
    const { id } = await params;

    // Procura o pedido pelo id e atualiza o estado
    const pedidoAtualizado = await Pedido.findByIdAndUpdate(
      id,

      // Campos atualizados
      {
        estado: "concluido",
      },

      // Faz com que seja devolvido o documento já atualizado
      { returnDocument: "after" }
    );

    // Devolve o pedido atualizado em formato JSON
    return NextResponse.json(pedidoAtualizado);

  } catch {

    // Caso exista algum erro,
    // devolve resposta de erro com status 500
    return NextResponse.json(
      { error: "Erro ao concluir pedido" },
      { status: 500 }
    );
  }
}