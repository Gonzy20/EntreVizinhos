// Use client indica ao next.js que o componente tem de correr no browser
"use client";

// Importa a biblioteca Leaflet
// Leaflet é responsável pelo funcionamento do mapa
import L from "leaflet";

// Importa useState do React
import { useEffect, useState } from "react";

// Importa componentes do React Leaflet
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";

// Importa o CSS necessário do Leaflet
import "leaflet/dist/leaflet.css";


// Configuração do ícone do marcador.
// Isto corrige o problema comum dos ícones não aparecerem no Next.js.
const markerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",

  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",

  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",

  // Tamanho do ícone
  iconSize: [25, 41],

  // Ponto do ícone que fica exatamente na localização clicada
  iconAnchor: [12, 41],
});


// Define o formato de uma posição geográfica
type Posicao = {
  lat: number;
  lng: number;
};


// Define as props recebidas pelo componente
type Props = {

  // Função enviada pelo componente pai
  // Serve para devolver a localização selecionada
  onSelecionarLocalizacao: (posicao: Posicao) => void;
  posicaoInicial?: Posicao | null;
};


// Componente responsável por detetar cliques no mapa
function CliqueMapa({
  setPosicao,
}: {
  setPosicao: (pos: Posicao) => void;
}) {

  // Hook do React Leaflet que escuta eventos do mapa
  useMapEvents({

    // Quando o utilizador clicar no mapa
    click(e) {

      // Guarda latitude e longitude clicadas
      setPosicao({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  // Este componente não renderiza nada visualmente
  return null;
}

// Função para centrar o mapa no ponto
function AtualizarCentroMapa({ posicao }: { posicao: Posicao | null}) {
  const map = useMap();
  useEffect(() => {
    if (posicao) {
      map.setView([posicao.lat, posicao.lng], 15);
    }
  }, [posicao, map]);

  return null;
}


// Componente principal do mapa
export default function MapaSelecionavel({
  onSelecionarLocalizacao,
  posicaoInicial,
}: Props) {

  // Guarda a posição selecionada no mapa
  const [posicao, setPosicao] = useState<Posicao | null>(
    posicaoInicial || null
  );


  useEffect(() => {
    if (posicaoInicial) {
      setPosicao(posicaoInicial);
    }
  }, [posicaoInicial]);


  // Função executada quando o utilizador escolhe uma localização
  function atualizarPosicao(novaPosicao: Posicao) {

    // Atualiza o estado interno do componente
    setPosicao(novaPosicao);

    // Envia a posição para o componente pai
    // (criar-pedido/page.tsx)
    onSelecionarLocalizacao(novaPosicao);
  }

  return (
    <div>

      {/* 
        Container principal do mapa 
      */}
      <MapContainer

        // Coordenadas iniciais do mapa
        // Neste caso Ponta Delgada
        center={
          posicao
            ? [posicao.lat, posicao.lng]
            : [37.7412, -25.6756]
        }

        // Nível de zoom inicial
        zoom={13}

        // Tamanho visual do mapa
        style={{ height: "500px", width: "100%" }}
      >

        {/* 
          Camada visual do mapa.
          Usa OpenStreetMap.
        */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"

          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />


        <AtualizarCentroMapa posicao={posicao} />

        {/* 
          Componente que deteta cliques no mapa 
        */}
        <CliqueMapa setPosicao={atualizarPosicao} />

        {/* 
          Só mostra o marcador se existir uma posição selecionada
        */}
        {posicao && (
          <Marker

            // Posição do marcador
            position={[posicao.lat, posicao.lng]}

            // Ícone personalizado do marcador
            icon={markerIcon}
          />
        )}
      </MapContainer>

      {/* 
        Mostra latitude e longitude selecionadas
      */}
      {posicao && (
        <div style={{ marginTop: "10px" }}>
          <p>Latitude: {posicao.lat}</p>

          <p>Longitude: {posicao.lng}</p>
        </div>
      )}
    </div>
  );
}