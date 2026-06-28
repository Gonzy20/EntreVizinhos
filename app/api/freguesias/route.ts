// Importa NextResponse para conseguir devolver respostas da API
import { NextResponse } from "next/server";

// Importa a função que faz ligação ao MongoDB
import { connectMongo } from "@/lib/mongodb";

// Importa o modelo Freguesia
import { Freguesia } from "@/lib/models/Freguesia";

// Rota GET para obter todas as freguesias
export async function GET() {

    // Liga à base de dados MongoDB
    await connectMongo();

    // Procura todas as freguesias na coleção
    const freguesias = await Freguesia.find();

    // Devolve as freguesias em formato JSON
    return NextResponse.json(freguesias);
}

// Rota POST para adicionar novas freguesias
export async function POST(req: Request) {
    try {
        const body = await req.json();

        await connectMongo();

        const freguesia = await Freguesia.create({
            nome: body.nome,
            concelho: body.concelho,
            coordenadas: {
                lat: body.lat,
                lng: body.lng,
            },
            criadaAutomaticamente: true,
        });

        return NextResponse.json(freguesia, { status: 201 });
    } catch {
        return NextResponse.json(
            { erro: "Erro ao criar freguesia" },
            { status: 500 }
        );
    }
}