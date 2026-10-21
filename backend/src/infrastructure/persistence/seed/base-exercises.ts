/**
 * Banco base de ejercicios de Activa: ejercicios de rehabilitación comunes,
 * escritos para Activa (textos propios, sin fotos ni videos de terceros).
 * Todos los fisios los ven; solo el admin los edita. Cada fisio puede copiar
 * uno a "Mis ejercicios" para cambiarle el texto o agregarle su video.
 *
 * Se insertan al arrancar el servidor si falta alguno (se buscan por nombre),
 * así que agregar uno aquí lo publica en el siguiente despliegue.
 */

export interface BaseExercise {
  name: string;
  bodyZone: string;
  description: string;
}

/** Zonas del cuerpo que usa el banco (el panel del fisio filtra por estas) */
export const BODY_ZONES = [
  "Cuello",
  "Hombro",
  "Codo, muñeca y mano",
  "Espalda alta",
  "Lumbar y core",
  "Cadera",
  "Rodilla",
  "Tobillo y pie",
  "Equilibrio",
] as const;

export const BASE_EXERCISES: BaseExercise[] = [
  // ── Cuello ───────────────────────────────────────────────────────────────
  {
    name: "Retracción cervical (doble mentón)",
    bodyZone: "Cuello",
    description:
      "Sentado con la espalda recta y la vista al frente, lleva la barbilla hacia atrás como si hicieras doble mentón, sin bajar la cabeza. Sostén 5 segundos y regresa despacio.",
  },
  {
    name: "Flexión lateral de cuello",
    bodyZone: "Cuello",
    description:
      "Sentado y con los hombros relajados, acerca la oreja al hombro del mismo lado sin subir el hombro. Sostén 20 a 30 segundos, regresa al centro y cambia de lado.",
  },
  {
    name: "Rotación cervical activa",
    bodyZone: "Cuello",
    description:
      "Sentado con la espalda recta, gira la cabeza despacio para mirar sobre un hombro hasta donde no haya dolor, regresa al centro y gira hacia el otro lado.",
  },
  {
    name: "Isométrico de cuello con la mano",
    bodyZone: "Cuello",
    description:
      "Coloca la palma en la frente y empuja la cabeza contra la mano sin que se mueva. Sostén 5 a 10 segundos con fuerza suave. Repite con la mano a un lado de la cabeza y en la nuca.",
  },

  // ── Hombro ───────────────────────────────────────────────────────────────
  {
    name: "Péndulo de Codman",
    bodyZone: "Hombro",
    description:
      "Apoya la mano sana en una mesa e inclina el tronco hacia adelante. Deja colgar el brazo afectado relajado y haz círculos pequeños con el movimiento del cuerpo, no con el hombro. Cambia de sentido a los 30 segundos.",
  },
  {
    name: "Deslizamiento en pared (flexión de hombro)",
    bodyZone: "Hombro",
    description:
      "De frente a la pared, apoya la mano y deslízala hacia arriba con los dedos hasta donde no haya dolor. Sostén 5 segundos y baja despacio.",
  },
  {
    name: "Rotación externa con liga",
    bodyZone: "Hombro",
    description:
      "De pie, con el codo pegado al costado y doblado a 90 grados, sujeta una liga anclada a tu lado. Gira el antebrazo hacia afuera sin despegar el codo y regresa despacio.",
  },
  {
    name: "Rotación interna con liga",
    bodyZone: "Hombro",
    description:
      "De pie, con el codo pegado al costado y doblado a 90 grados, sujeta una liga anclada del lado contrario. Lleva el antebrazo hacia el abdomen sin despegar el codo y regresa despacio.",
  },
  {
    name: "Retracción escapular (juntar omóplatos)",
    bodyZone: "Hombro",
    description:
      "Sentado o de pie con los brazos relajados, junta los omóplatos hacia atrás y abajo, sin subir los hombros. Sostén 5 segundos y suelta.",
  },
  {
    name: "Remo con liga",
    bodyZone: "Hombro",
    description:
      "Con una liga anclada al frente a la altura del pecho, jala hacia atrás doblando los codos y juntando los omóplatos. Regresa despacio sin dejar que la liga te jale.",
  },
  {
    name: "Elevación lateral hasta 90 grados",
    bodyZone: "Hombro",
    description:
      "De pie, con un peso ligero o sin peso, sube los brazos por los lados con el pulgar hacia arriba hasta la altura de los hombros. Baja despacio. Detente si aparece dolor.",
  },

  // ── Codo, muñeca y mano ──────────────────────────────────────────────────
  {
    name: "Flexión y extensión de muñeca con peso",
    bodyZone: "Codo, muñeca y mano",
    description:
      "Apoya el antebrazo en una mesa con la mano fuera del borde y un peso ligero. Sube y baja la mano solo con la muñeca, despacio. Hazlo con la palma hacia arriba y luego hacia abajo.",
  },
  {
    name: "Estiramiento de extensores de muñeca",
    bodyZone: "Codo, muñeca y mano",
    description:
      "Con el brazo estirado al frente y la palma hacia abajo, dobla la muñeca hacia abajo y ayúdate suavemente con la otra mano. Sostén 20 a 30 segundos.",
  },
  {
    name: "Pronación y supinación de antebrazo",
    bodyZone: "Codo, muñeca y mano",
    description:
      "Sentado con el codo pegado al cuerpo y doblado a 90 grados, gira la palma hacia arriba y luego hacia abajo, despacio. Puedes sostener un martillo o una botella para dar resistencia.",
  },
  {
    name: "Apretar pelota blanda",
    bodyZone: "Codo, muñeca y mano",
    description:
      "Sostén una pelota blanda o esponja en la mano, apriétala con fuerza moderada durante 3 a 5 segundos y suelta despacio.",
  },
  {
    name: "Deslizamientos tendinosos de dedos",
    bodyZone: "Codo, muñeca y mano",
    description:
      "Con la mano abierta, haz en orden: puño en gancho, puño completo, mesa (nudillos rectos y dedos doblados) y puño recto. Regresa a la mano abierta entre cada posición.",
  },

  // ── Espalda alta ─────────────────────────────────────────────────────────
  {
    name: "Extensión torácica sobre silla",
    bodyZone: "Espalda alta",
    description:
      "Sentado en una silla con respaldo bajo, cruza las manos detrás de la nuca e inclínate hacia atrás sobre el respaldo, abriendo el pecho. Regresa despacio.",
  },
  {
    name: "Libro abierto (rotación torácica)",
    bodyZone: "Espalda alta",
    description:
      "Acostado de lado con las rodillas dobladas y los brazos estirados al frente, abre el brazo de arriba hacia el otro lado siguiendo la mano con la vista, como si abrieras un libro. Regresa despacio.",
  },
  {
    name: "Gato-vaca",
    bodyZone: "Espalda alta",
    description:
      "En cuatro puntos, con las manos bajo los hombros y las rodillas bajo la cadera, redondea la espalda hacia el techo y luego hunde suavemente la espalda mirando al frente. Muévete despacio y sin dolor.",
  },

  // ── Lumbar y core ────────────────────────────────────────────────────────
  {
    name: "Basculación pélvica acostado",
    bodyZone: "Lumbar y core",
    description:
      "Boca arriba con las rodillas dobladas, aplana la zona lumbar contra el piso apretando suavemente el abdomen y regresa a la posición neutra. Respira sin contener el aire.",
  },
  {
    name: "Puente de glúteo",
    bodyZone: "Lumbar y core",
    description:
      "Boca arriba con las rodillas dobladas y los pies apoyados, aprieta los glúteos y sube la cadera hasta formar una línea de hombros a rodillas. Sostén 3 segundos y baja despacio.",
  },
  {
    name: "Bird dog (cuadrupedia con brazo y pierna)",
    bodyZone: "Lumbar y core",
    description:
      "En cuatro puntos, estira al mismo tiempo un brazo al frente y la pierna contraria hacia atrás, sin arquear la espalda ni girar la cadera. Sostén 5 segundos y cambia de lado.",
  },
  {
    name: "Dead bug (bicho muerto)",
    bodyZone: "Lumbar y core",
    description:
      "Boca arriba con brazos hacia el techo y cadera y rodillas a 90 grados, baja despacio un brazo y la pierna contraria sin despegar la zona lumbar del piso. Regresa y cambia de lado.",
  },
  {
    name: "Plancha en antebrazos",
    bodyZone: "Lumbar y core",
    description:
      "Apoya antebrazos y puntas de los pies (o rodillas para hacerlo más fácil) y mantén el cuerpo en línea recta, sin hundir ni subir la cadera. Sostén el tiempo indicado respirando normal.",
  },
  {
    name: "Plancha lateral con rodillas apoyadas",
    bodyZone: "Lumbar y core",
    description:
      "De lado, apoyado en el antebrazo y con las rodillas dobladas, sube la cadera hasta alinear hombros, cadera y rodillas. Sostén el tiempo indicado y cambia de lado.",
  },
  {
    name: "Rodillas al pecho",
    bodyZone: "Lumbar y core",
    description:
      "Boca arriba, lleva una o ambas rodillas al pecho abrazándolas con las manos. Sostén 20 a 30 segundos relajando la espalda baja.",
  },
  {
    name: "Extensión lumbar en prono (cobra suave)",
    bodyZone: "Lumbar y core",
    description:
      "Boca abajo con las manos bajo los hombros, empuja para subir el pecho dejando la cadera apoyada y la espalda baja relajada. Sube solo hasta donde no haya dolor y baja despacio.",
  },

  // ── Cadera ───────────────────────────────────────────────────────────────
  {
    name: "Almeja (clamshell)",
    bodyZone: "Cadera",
    description:
      "Acostado de lado con las rodillas dobladas y los pies juntos, abre la rodilla de arriba sin separar los pies ni girar la cadera hacia atrás. Baja despacio. Puedes usar una liga en los muslos.",
  },
  {
    name: "Abducción de cadera acostado de lado",
    bodyZone: "Cadera",
    description:
      "Acostado de lado con la pierna de abajo doblada, sube la pierna de arriba estirada y ligeramente hacia atrás, con la punta del pie al frente. Baja despacio.",
  },
  {
    name: "Estiramiento de flexores de cadera en rodilla",
    bodyZone: "Cadera",
    description:
      "Con una rodilla en el piso (sobre un cojín) y el otro pie al frente, aprieta el glúteo de la pierna de atrás y lleva la cadera un poco hacia adelante. Sostén 20 a 30 segundos.",
  },
  {
    name: "Estiramiento de piriforme",
    bodyZone: "Cadera",
    description:
      "Boca arriba, cruza el tobillo sobre la rodilla contraria y jala hacia el pecho el muslo de la pierna de apoyo hasta sentir el estiramiento en el glúteo. Sostén 20 a 30 segundos.",
  },
  {
    name: "Extensión de cadera de pie",
    bodyZone: "Cadera",
    description:
      "De pie y apoyado en una silla, lleva una pierna estirada hacia atrás apretando el glúteo, sin inclinar el tronco ni arquear la espalda. Regresa despacio.",
  },

  // ── Rodilla ──────────────────────────────────────────────────────────────
  {
    name: "Cuádriceps isométrico (toalla bajo la rodilla)",
    bodyZone: "Rodilla",
    description:
      "Sentado o acostado con la pierna estirada y una toalla enrollada bajo la rodilla, aprieta el muslo empujando la toalla hacia abajo. Sostén 5 a 10 segundos y relaja.",
  },
  {
    name: "Elevación de pierna recta",
    bodyZone: "Rodilla",
    description:
      "Boca arriba con una rodilla doblada, aprieta el muslo de la pierna estirada y súbela hasta la altura de la otra rodilla. Baja despacio sin doblar la rodilla.",
  },
  {
    name: "Arco corto de cuádriceps",
    bodyZone: "Rodilla",
    description:
      "Boca arriba con un rollo o cojín bajo la rodilla, estira la rodilla subiendo el talón hasta dejar la pierna recta. Sostén 3 segundos y baja despacio.",
  },
  {
    name: "Deslizamiento de talón",
    bodyZone: "Rodilla",
    description:
      "Boca arriba con las piernas estiradas, desliza el talón hacia el glúteo doblando la rodilla hasta donde no haya dolor y regresa despacio.",
  },
  {
    name: "Sentadilla a silla",
    bodyZone: "Rodilla",
    description:
      "De pie frente a una silla, con los pies al ancho de la cadera, baja como para sentarte hasta rozar el asiento y sube sin usar las manos. Las rodillas siguen la dirección de los pies.",
  },
  {
    name: "Subir escalón",
    bodyZone: "Rodilla",
    description:
      "Frente a un escalón y con apoyo cerca, sube con la pierna indicada y luego baja despacio con la misma. Mantén la rodilla alineada con el segundo dedo del pie.",
  },
  {
    name: "Flexión de rodilla de pie (isquiotibiales)",
    bodyZone: "Rodilla",
    description:
      "De pie y apoyado en una silla, dobla la rodilla llevando el talón hacia el glúteo sin mover el muslo. Baja despacio. Puedes usar una tobillera con peso.",
  },
  {
    name: "Estiramiento de isquiotibiales sentado",
    bodyZone: "Rodilla",
    description:
      "Sentado en el borde de una silla con una pierna estirada y el talón apoyado, inclina el tronco al frente con la espalda recta hasta sentir el estiramiento detrás del muslo. Sostén 20 a 30 segundos.",
  },

  // ── Tobillo y pie ────────────────────────────────────────────────────────
  {
    name: "Bombeo de tobillo",
    bodyZone: "Tobillo y pie",
    description:
      "Sentado o acostado con la pierna estirada, mueve el pie hacia arriba y hacia abajo a un ritmo constante, como si pisaras un pedal.",
  },
  {
    name: "Alfabeto con el tobillo",
    bodyZone: "Tobillo y pie",
    description:
      "Sentado con el pie en el aire, dibuja las letras del abecedario con el dedo gordo moviendo solo el tobillo.",
  },
  {
    name: "Elevación de talones",
    bodyZone: "Tobillo y pie",
    description:
      "De pie y apoyado en una silla, sube a las puntas de los pies y baja despacio. Para hacerlo más difícil, hazlo con un solo pie.",
  },
  {
    name: "Estiramiento de pantorrilla en pared",
    bodyZone: "Tobillo y pie",
    description:
      "De frente a la pared, con un pie adelante y el otro atrás con el talón apoyado y la rodilla estirada, inclínate hacia la pared hasta sentir el estiramiento en la pantorrilla. Sostén 20 a 30 segundos.",
  },
  {
    name: "Eversión de tobillo con liga",
    bodyZone: "Tobillo y pie",
    description:
      "Sentado con una liga alrededor del pie anclada del lado de adentro, gira la planta del pie hacia afuera contra la liga y regresa despacio.",
  },
  {
    name: "Recoger toalla con los dedos",
    bodyZone: "Tobillo y pie",
    description:
      "Sentado con el pie descalzo sobre una toalla en el piso, arrúgala jalándola hacia ti solo con los dedos del pie.",
  },

  // ── Equilibrio ───────────────────────────────────────────────────────────
  {
    name: "Apoyo en una pierna",
    bodyZone: "Equilibrio",
    description:
      "De pie junto a una silla o pared, levanta un pie y mantén el equilibrio sobre la otra pierna el tiempo indicado. Apóyate si lo necesitas. Para hacerlo más difícil, cierra los ojos con supervisión.",
  },
  {
    name: "Marcha en tándem (talón-punta)",
    bodyZone: "Equilibrio",
    description:
      "Junto a una pared, camina en línea recta poniendo el talón de un pie justo frente a la punta del otro. Mira al frente y avanza despacio.",
  },
];
