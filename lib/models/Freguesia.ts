import { Schema, models, model } from "mongoose";

const FreguesiaSchema = new Schema(
  {
    concelho: { type: String, required: true },
    nome: { type: String, required: true },
    coordenadas: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    criadaAutomaticamente: { type: Boolean, default: false },
  },
  { timestamps: true }
);

FreguesiaSchema.index(
  { nome: 1, concelho: 1},
  { unique: true }
);

export const Freguesia =
  models.Freguesia || model("Freguesia", FreguesiaSchema);
