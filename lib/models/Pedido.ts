import mongoose, { Schema, models, model } from "mongoose";

const PedidoSchema = new Schema(
    {
        titulo : { type: String, required: true },

        nomePessoa: { type: String, required: true},
        descricao: { type: String, required: true},
        
        freguesia: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Freguesia",
            required: true,
        },

        coordenadas: {
            lat: { type: Number, required: true },
            lng: { type: Number, required: true },
        },

        estado: {
            type: String,
            enum: ["ativo", "em_progresso", "concluido"],
            default: "ativo",
        },

        morada: { type: String, default: "" },
        
        ajudanteNome: { type: String, default: null },

        justificativaFalha: { type: String, default: null },
    },
    { timestamps: true}
);

export const Pedido = models.Pedido || model("Pedido", PedidoSchema);
