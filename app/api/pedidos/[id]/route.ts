// Importa NextResponse para devolver respostas da API
import { NextResponse } from "next/server";

// Importa a função que faz ligação ao MongoDB
import { connectMongo } from "@/lib/mongodb";

// Importa o modelo Pedido
import { Pedido } from "@/lib/models/Pedido";


// =========================
// PUT Pedido
// =========================

// Rota PUT para atualizar um pedido
export async function PUT(
  // Request recebida do frontend
  req: Request,

  // Params contém os parâmetros do URL
  // Neste caso, o id do pedido
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Converte o body da request para JSON
    const body = await req.json();

    // Liga à base de dados MongoDB
    await connectMongo();

    // Obtém o id vindo do URL
    const { id } = await params;

    // Procura o pedido pelo id e atualiza os dados
    const pedidoAtualizado = await Pedido.findByIdAndUpdate(
      id,

      // Campos que vão ser atualizados
      {
        titulo: body.titulo,
        nomePessoa: body.nomePessoa,
        descricao: body.descricao,
        freguesia: body.freguesiaId,
        estado: body.estado,
        morada: body.morada,
        //coordenadas: {
          //lat: body.lat,
          //lng: body.lng,
        //},
        "coordenadas.lat": body.lat,
        "coordenadas.lng": body.lng,
      },

      // Faz com que seja devolvido o documento atualizado
      { returnDocument: "after" }
    );

    // Devolve o pedido atualizado em JSON
    return NextResponse.json(pedidoAtualizado);

  } catch {

    // Caso exista erro, devolve status 500
    return NextResponse.json(
      { error: "Erro ao atualizar pedido" },
      { status: 500 }
    );
  }
}


// =========================
// DELETE Pedido
// =========================

// Rota DELETE para remover um pedido
export async function DELETE(
  // Request recebida
  req: Request,

  // Params contém o id vindo do URL
  { params }: { params: Promise<{ id: string }> }
) {
  try {

    // Liga ao MongoDB
    await connectMongo();

    // Obtém o id do pedido
    const { id } = await params;

    // Procura o pedido pelo id e remove da base de dados
    await Pedido.findByIdAndDelete(id);

    // Devolve mensagem de sucesso
    return NextResponse.json({ message: "Pedido removido" });

  } catch {

    // Caso exista erro, devolve status 500
    return NextResponse.json(
      { error: "Erro ao remover pedido" },
      { status: 500 }
    );
  }
}