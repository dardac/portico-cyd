export type EmergencyContact = {
  id: string;
  name: string;
  description: string;
  phones: Array<{ phone: string; tel: string }>;
};

export type QuickSafetyMeasure = {
  id: string;
  label: string;
  text: string;
};

export type EvacuationZone = {
  id: string;
  badge: string;
  title: string;
  description: string;
};

export type BuildingProtocol = {
  id: string;
  badge: string;
  title: string;
  steps: string[];
};

/** Números públicos de referencia. Verificar ante cambios oficiales. */
export const emergencyContacts: EmergencyContact[] = [
  {
    id: "garita",
    name: "Garita de vigilancia",
    description: "Pórtico del Ávila — Torres C y D",
    phones: [{ phone: "0412-933.19.16", tel: "+584129331916" }],
  },
  {
    id: "proteccion-civil",
    name: "Protección Civil (Nacional)",
    description: "Atención de emergencias y desastres",
    phones: [{ phone: "0800-7248451", tel: "08007248451" }],
  },
  {
    id: "bomberos",
    name: "Bomberos de Caracas",
    description: "Incendios y rescates",
    phones: [
      { phone: "(0212) 541-71.33", tel: "+582125417133" },
      { phone: "(0212) 577-92.09", tel: "+582125779209" },
    ],
  },
  {
    id: "911",
    name: "Emergencias Caracas / VEN 911",
    description: "Línea de emergencias",
    phones: [{ phone: "911", tel: "911" }],
  },
  {
    id: "171",
    name: "Emergencias nacionales",
    description: "Bomberos, ambulancias y policía",
    phones: [{ phone: "171", tel: "171" }],
  },
];

export const firstSafetyMeasures: QuickSafetyMeasure[] = [
  {
    id: "valves",
    label: "Cierre de llaves de paso",
    text: "Cierra de inmediato las llaves de paso de gas y agua si sospechas fuga o daño en tuberías.",
  },
  {
    id: "inspection",
    label: "Inspección rápida",
    text: "Revisa si hay personas lesionadas en tu hogar y en el pasillo. Ayuda solo si no te expones.",
  },
  {
    id: "lighting",
    label: "Iluminación segura",
    text: "Utiliza linternas o la luz del celular; NO uses fósforos ni velas ante olor a gas.",
  },
  {
    id: "comms",
    label: "Red de telefonía",
    text: "Prefiere mensajes de texto (SMS) o internet para avisar a familiares y no saturar las antenas.",
  },
];

export const evacuationZones: EvacuationZone[] = [
  {
    id: "point-1",
    badge: "Punto 1",
    title: "Plaza central / áreas verdes comunes",
    description:
      "Zona amplia despejada de torres y vidrios. Reúnete con tu familia y espera instrucciones de vigilancia.",
  },
  {
    id: "point-2",
    badge: "Punto 2",
    title: "Acceso principal — afuera del edificio",
    description:
      "Sal por escaleras hacia la entrada de torres C y D. No uses ascensores durante la evacuación.",
  },
  {
    id: "point-3",
    badge: "Punto 3",
    title: "Estacionamiento exterior",
    description:
      "Si las zonas anteriores están congestionadas, dirígete al estacionamiento abierto lejos de fachadas y árboles grandes.",
  },
];

export const buildingProtocols: BuildingProtocol[] = [
  {
    id: "general",
    badge: "General",
    title: "Ante cualquier emergencia",
    steps: [
      "Mantén la calma y aleja a niños y personas con movilidad reducida del peligro.",
      "Avisa de inmediato a la garita o vigilancia del Pórtico del Ávila.",
      "Comunica torre, piso y apartamento al marcar emergencias.",
      "Registra el censo diario: ayuda a saber quién pernocta en el edificio.",
    ],
  },
  {
    id: "earthquake",
    badge: "Sismo",
    title: "Durante y después de un sismo",
    steps: [
      "Protégete bajo una mesa resistente o junto a un muro estructural, lejos de ventanas.",
      "Al cesar el movimiento, evalúa daños antes de salir.",
      "Usa escaleras; revisa fisuras, humo u olor a gas.",
      "Reporta daños en tu apartamento en el perfil del censo (infraestructura).",
    ],
  },
  {
    id: "fire",
    badge: "Incendio",
    title: "Ante fuego o humo",
    steps: [
      "Activa la alarma si existe y alerta a vecinos cercanos.",
      "Cierra puertas al evacuar para frenar la propagación del humo.",
      "Dirígete a la salida más cercana por escalera; no regreses por pertenencias.",
      "Si el fuego es menor y hay extintor, intenta controlarlo sin exponerte.",
    ],
  },
  {
    id: "flood",
    badge: "Lluvias",
    title: "Lluvias fuertes o inundación",
    steps: [
      "Evita sótanos, estacionamientos bajos y ascensores si hay agua o fallas eléctricas.",
      "Desconecta equipos eléctricos si hay riesgo de contacto con agua.",
      "Reporta filtraciones o daños estructurales a administración y en tu perfil.",
    ],
  },
];
