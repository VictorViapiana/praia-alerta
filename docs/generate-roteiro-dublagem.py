#!/usr/bin/env python3
"""Gera o roteiro de dublagem do Guará (PDF + checklist MD)."""

from __future__ import annotations

import re
from pathlib import Path

from fpdf import FPDF

FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

lines: list[dict] = []


def add(id_: str, section: str, context: str, text: str, notes: str = "") -> None:
    spoken = re.sub(r"[\U0001F300-\U0001FAFF\U00002600-\U000027BF]", "", text)
    spoken = re.sub(r"\s+", " ", spoken).strip()
    lines.append(
        {
            "id": id_,
            "section": section,
            "context": context,
            "text": spoken,
            "notes": notes,
        }
    )


# ——— HOME / ILHA ———
add(
    "home_intro",
    "Home — Ilha do Guará",
    "Saudação padrão ao abrir o Guará na home",
    "Oi, sou o Guará! Como posso te ajudar na Praia do Morro hoje?",
)

# ——— TUTORIAL HOME ———
add(
    "tour_home_01",
    "Tutorial — Home",
    "Passo 1",
    "Olá! Eu sou o Guará, o seu guia aqui na Praia do Morro! Deixe-me dar 2 avisos muito importantes antes de você aproveitar.",
)
add(
    "tour_home_02",
    "Tutorial — Home",
    "Passo 2 — Criança Perdida",
    "Este é o botão de Criança Perdida. Ele avisa todos os quiosques e guarda-vidas da orla instantaneamente. Use APENAS se uma criança se perder de verdade!",
)
add(
    "tour_home_03",
    "Tutorial — Home",
    "Passo 3 — Emergência",
    "E aqui embaixo fica o botão de Emergência. Deslizar este botão aciona a Polícia e o Resgate. Trotes e alarmes falsos são crime, então use com total responsabilidade, ok?",
)
add(
    "tour_home_04",
    "Tutorial — Home",
    "Passo 4 — Encerramento",
    "Tudo certo! Pode contar comigo. Toque em qualquer lugar da tela para começar.",
)

# ——— TUTORIAL MAPA ———
add(
    "tour_map_01",
    "Tutorial — Mapa",
    "Passo 1",
    "Chegamos na orla! Eu te mostro o mapa em poucos toques, para você achar gente e registrar a praia.",
)
add(
    "tour_map_02",
    "Tutorial — Mapa",
    "Passo 2 — Busca",
    "Escreva aqui o nome de um quiosque, de um ambulante ou a palavra escuna. Eu levo o mapa até o ponto.",
)
add(
    "tour_map_03",
    "Tutorial — Mapa",
    "Passo 3 — Filtros",
    "Se preferir, filtre. Quiosques, ambulantes, duchas, hotéis e sorvetes. Toque de novo no mesmo filtro para voltar à vista geral.",
)
add(
    "tour_map_04",
    "Tutorial — Mapa",
    "Passo 4 — Câmera",
    "Este botão abre a câmera com a moldura Eu amo Guarapari. A foto fica com você.",
)
add(
    "tour_map_05",
    "Tutorial — Mapa",
    "Passo 5 — Localização",
    "Este círculo branco centraliza o mapa em você: calçadão embaixo dos pés, areia na frente.",
)
add(
    "tour_map_06",
    "Tutorial — Mapa",
    "Passo 6 — Zoom / pinos",
    "Aproxima com dois dedos. Os quiosques e os carrinhos nascem na areia. Toque no carrinho para ver o cardápio e chamar no WhatsApp.",
)
add(
    "tour_map_07",
    "Tutorial — Mapa",
    "Passo 7 — Encerramento",
    "É isso. A orla é sua. Bom passeio na Praia do Morro!",
)

# ——— CHAT MAPA ———
add(
    "map_chat_hello",
    "Chat do mapa",
    "Abertura do chat com o Guará",
    "Diz o que você quer ver. Eu movo o mapa e abro o lugar.",
)
add(
    "map_beach_invite_title",
    "Convite — longe da praia",
    "Título do convite",
    "Você quer que eu te mostre a praia?",
)
add(
    "map_beach_invite_body",
    "Convite — longe da praia",
    "Texto de apoio",
    "Você está longe da Praia do Morro. Posso te levar até a orla.",
)

# ——— GUIA (respostas fixas) ———
G = "Guia — respostas do chat"
add(
    "guide_kiosk_range",
    G,
    "Número de quiosque inválido",
    "Na Praia do Morro os quiosques vão do 01 ao 26, só com o número. Me diz qual deles.",
)
add(
    "guide_kiosk_open",
    G,
    "Trecho fixo — abertura do quiosque (modelo)",
    "O Quiosque 12 está na faixa de areia, de frente para o calçadão.",
    "No app o número muda (01–26). Grave o ritmo; o número pode ficar no TTS ou em stems.",
)
add(
    "guide_kiosk_sponsor_tail",
    G,
    "Trecho fixo — quiosque com cardápio",
    "Este é um dos quiosques com cardápio.",
)
add(
    "guide_kiosk_plain_tail",
    G,
    "Trecho fixo — quiosque só com número",
    "Este aparece só com o número, na areia.",
)
add(
    "guide_kiosk_ex_sponsor",
    G,
    "Exemplo completo — patrocinador",
    "O Quiosque 12 está na faixa de areia, de frente para o calçadão. Este é um dos quiosques com cardápio.",
)
add(
    "guide_kiosk_ex_plain",
    G,
    "Exemplo completo — sem cardápio",
    "O Quiosque 05 está na faixa de areia, de frente para o calçadão. Este aparece só com o número, na areia.",
)
add(
    "guide_crianca",
    G,
    "Criança perdida",
    "Criança perdida fica na home, no card com o rosto. Ele avisa a orla. Usa só se uma criança se perder de verdade.",
)
add(
    "guide_emergencia",
    G,
    "Emergência",
    "No mapa, o círculo vermelho à esquerda, no alto, é a emergência. Segura até o anel fechar. Na home, desliza o botão de baixo. Os dois disparam o mesmo alerta.",
)
add(
    "guide_camera",
    G,
    "Câmera",
    "A câmera fica à direita, acima da busca, no botão com o coração. A foto sai com a moldura Eu amo Guarapari.",
)
add(
    "guide_locate",
    G,
    "Onde estou",
    "Vou centralizar o mapa em você: calçadão embaixo dos pés, areia na frente.",
)
add(
    "guide_show_beach",
    G,
    "Me mostre a praia",
    "Bora! Te levo até a Praia do Morro, com a vista geral da orla.",
)
add(
    "guide_map_clean",
    G,
    "Mapa limpo",
    "Troquei para o mapa limpo: areia, água e ruas, sem a foto de satélite.",
)
add(
    "guide_map_sat",
    G,
    "Satélite",
    "Voltei para o satélite, com a orla mais suave.",
)
add(
    "guide_vista_geral",
    G,
    "Vista geral",
    "Vista geral de novo. Os pinos voltam quando você aproximar ou escolher um filtro.",
)
add(
    "guide_marlin",
    G,
    "Marlin",
    "O Marlin Azul é o símbolo da orla, no canto norte da praia. Estou te levando até ele.",
)
add(
    "guide_parque",
    G,
    "Parque",
    "O Parque Natural Municipal Morro da Pescaria fica no alto, fechando a baía. Te levo até a entrada.",
)
add(
    "guide_golfinho",
    G,
    "Golfinho",
    "A estátua do golfinho fica no costão, ao lado do píer do Morro da Pescaria. Te levo até ela.",
)
add(
    "guide_pier",
    G,
    "Píer de pesca",
    "O píer do Morro da Pescaria é o ponto de pesca no costão, no fim da praia. Estou te levando.",
)
add(
    "guide_banheiro",
    G,
    "Banheiros",
    "Tem banheiros públicos na orla. Estou no Banheiro V, na Beira Mar. Também tem o II, III e VI.",
)
add(
    "guide_quadra_03",
    G,
    "Quadra 03",
    "Quadra 03: quadra na areia. Te levo até lá — e lembro das regras de convivência.",
)
add(
    "guide_quadra_areia",
    G,
    "Quadra de Areia",
    "Quadra de Areia: quadra na areia. Te levo até lá — e lembro das regras de convivência.",
)
add(
    "guide_playground",
    G,
    "Playground",
    "O playground fica na areia. Te levo até lá — e lembro: ferro quente e fila no brinquedo.",
)
add(
    "guide_salva",
    G,
    "Salva-vidas",
    "O posto de salva-vidas fica na areia. Bandeira manda, e o corredor do posto fica livre.",
)
add(
    "guide_bancos_norte",
    G,
    "Bancos cobertos — norte",
    "Conjunto de três bancos cobertos no fim da praia. Te levo até eles.",
)
add(
    "guide_bancos_marlin",
    G,
    "Bancos cobertos — Marlin",
    "São dois conjuntos de três bancos: um ao lado do Marlin e outro no fim da praia. Te levo ao do Marlin.",
)
add(
    "guide_praca",
    G,
    "Praça da Paz",
    "A Praça da Paz fica na Beira Mar, perto do Marlin. Vamos até ela.",
)
add(
    "guide_escunas",
    G,
    "Escunas",
    "O ponto das escunas fica na água, ao sul da praia. Pirata, Monte Aghá e a do Canal saem dali.",
)
add(
    "guide_pier_dois",
    G,
    "Dois píeres",
    "Tem dois: o píer de pesca no Morro da Pescaria, no fim da praia, e o ponto das escunas no canal, ao sul. Te levo ao de pesca.",
)
add(
    "guide_milho",
    G,
    "Ambulante — milho",
    "O Milho Verde está andando na areia, com espiga na brasa. Abri o cardápio.",
)
add(
    "guide_picole",
    G,
    "Ambulante — picolé",
    "O Picolé da Tarde passa pela areia com a caixa térmica. Abri o cardápio.",
)
add(
    "guide_acai",
    G,
    "Ambulante — açaí",
    "O açaí está parado na areia, com tigela gelada. Abri o cardápio.",
)
add(
    "guide_caldo",
    G,
    "Ambulante — caldo de cana",
    "O Caldo de Cana está parado na areia, copo na hora. Abri o cardápio.",
)
add(
    "guide_coco_off",
    G,
    "Água de coco fora",
    "Água de coco não está na areia neste momento. Na faixa, agora, eu vejo milho, picolé, açaí e caldo de cana.",
)
add(
    "guide_pastel_off",
    G,
    "Pastel sem credencial",
    "O Pastel do Morro ainda não entra no mapa. Só aparecem os ambulantes que estão na areia.",
)
add(
    "guide_ducha_sul",
    G,
    "Ducha Sul",
    "A Ducha Sul fica no calçadão, no trecho sul da praia.",
)
add(
    "guide_ducha_norte",
    G,
    "Ducha Norte",
    "A Ducha Norte fica no calçadão, mais para o norte.",
)
add(
    "guide_duchas",
    G,
    "Duchas (geral)",
    "São duas duchas no calçadão: Sul e Norte. Estou na Ducha Sul. A Norte fica mais adiante.",
)
add(
    "guide_farmacia",
    G,
    "Farmácia",
    "A Farmácia da Orla fica na avenida, atrás da praia.",
)
add(
    "guide_restaurante",
    G,
    "Restaurante",
    "O Restaurante Beira-Mar fica na avenida. Abri a casa.",
)
add(
    "guide_sorvete",
    G,
    "Sorveteria",
    "A Sorveteria do Morro fica na avenida, das 11h às 22h. Abri a casa.",
)
add(
    "guide_pousada",
    G,
    "Pousada",
    "A Pousada da Orla fica na avenida. O check-in é às 14h. Abri a casa.",
)
add(
    "guide_hotel",
    G,
    "Hotel",
    "O Hotel Mar tem recepção 24h, na avenida, atrás da praia. A Pousada da Orla também está nesse filtro.",
)
add(
    "guide_ambulantes",
    G,
    "Ambulantes na areia",
    "Na areia agora: Milho Verde e Picolé da Tarde andando, Açaí e Caldo de Cana parados. Toca o carrinho para ver o cardápio e chamar no WhatsApp.",
)
add(
    "guide_quiosques",
    G,
    "Quiosques (geral)",
    "São 26 quiosques, só com o número, na areia na frente do calçadão. Os de cardápio são o 07, o 12, o 18 e o 22. Te deixei no 12.",
)
add(
    "guide_alerts",
    G,
    "Alertas / bandeira",
    "Bandeira amarela na Praia do Morro: mar picado, banho só entre as bandeiras. Há registro de águas-vivas na Areia Preta. O salva-vidas fica até 18h.",
)
add(
    "guide_fallback",
    G,
    "Não entendeu o pedido",
    "Posso te levar aos quiosques, ambulantes, duchas, hotéis, sorvete, escunas ou ao Marlin. Pode pedir pelo nome, como Quiosque 12 ou Caldo de Cana.",
)
add(
    "guide_tide_loading",
    G,
    "Maré ainda carregando",
    "A carta de maré ainda não chegou. Abre Maré agora na home para ver o nível e as ondas.",
)
add(
    "guide_tide_ex",
    G,
    "Maré — exemplo completo (números mudam no app)",
    "Maré enchente, 0,8 m. Ondas de 0,6 m. A preamar chega às 15h20, com 1,2 m. Água subindo no raso — atenção à bandeira.",
    "Grave o ritmo. Também grave isoladas: «Maré enchente», «Maré vazante», «Maré estável», «Ondas de», «A preamar chega às», «metros».",
)
add(
    "guide_weather_loading",
    G,
    "Clima carregando",
    "O clima da Praia do Morro ainda está carregando. Em instantes eu te digo a temperatura e o vento.",
)
add(
    "guide_weather_ex",
    G,
    "Clima — exemplo completo",
    "28 graus e céu limpo. Sensação de 31 graus. Vento de 12 quilômetros por hora vindo de nordeste.",
    "Grave o ritmo. Números e direção do vento mudam no app.",
)

# ——— MARCOS (Ouvir) ———
L = "Marcos da orla — botão Ouvir"
add(
    "land_marlin",
    L,
    "Marlin Azul — fala completa",
    "O Marlin Azul é patrimônio da Praia do Morro. Atenção: a pedra escorrega, então ande com cuidado. Não deixe lixo. E não risque, não suba e não danifique o monumento. Foto, sim. Dano, não.",
)
add(
    "land_marlin_tip1",
    L,
    "Marlin — tip 1",
    "A pedra fica molhada de maresia. Ande devagar e segure a criança pela mão.",
)
add(
    "land_marlin_tip2",
    L,
    "Marlin — tip 2",
    "Garrafa, bituca e sacola não ficam na pedra. O que você trouxe, você leva.",
)
add(
    "land_marlin_tip3",
    L,
    "Marlin — tip 3",
    "Não escreva nome, não suba no peixe e não danifique a pintura. Foto, sim. Dano, não.",
)
add(
    "land_pier",
    L,
    "Píer da Pescaria — fala completa",
    "O píer do Morro da Pescaria é o ponto de pesca no costão, no fim da praia. A pedra escorrega, olhe a onda e não deixe lixo. Foto e pesca com cuidado.",
)
add(
    "land_pier_tip1",
    L,
    "Píer — tip 1",
    "O píer e as pedras escorregam com a maresia. Ande devagar e firme o passo.",
)
add(
    "land_pier_tip2",
    L,
    "Píer — tip 2",
    "O mar bate no costão. Não vire as costas para a água e não se encoste na beira.",
)
add(
    "land_pier_tip3",
    L,
    "Píer — tip 3",
    "Linha, isca e lixo voltam com você. O ponto de pesca é da orla — deixe limpo.",
)
add(
    "land_parque",
    L,
    "Parque Morro da Pescaria — fala completa",
    "O Parque Natural Municipal Morro da Pescaria fecha a baía no norte da Praia do Morro. Trilha, mata e vista do mar. Fique no caminho, leve água e respeite a fauna.",
)
add(
    "land_parque_tip1",
    L,
    "Parque — tip 1",
    "É parque natural: fique nas trilhas, não corte planta e não faça fogo.",
)
add(
    "land_parque_tip2",
    L,
    "Parque — tip 2",
    "Há pouco comércio no alto. Leve água, chapéu e saia antes do escurecer.",
)
add(
    "land_parque_tip3",
    L,
    "Parque — tip 3",
    "Não alimente animais e não leve nada da mata. Observe e fotografe só.",
)
add(
    "land_praca",
    L,
    "Praça da Paz — fala completa",
    "A Praça da Paz fica na Beira Mar, perto do Marlin. Cruze na faixa, não deixe lixo e à noite prefira o calçadão iluminado.",
)
add(
    "land_praca_tip1",
    L,
    "Praça — tip 1",
    "Fica na Beira Mar com movimento de carro. Cruze na faixa e segure a criança.",
)
add(
    "land_praca_tip2",
    L,
    "Praça — tip 2",
    "Som alto, churrasco improvisado e lixo no banco estragam a praça. Use a lixeira.",
)
add(
    "land_praca_tip3",
    L,
    "Praça — tip 3",
    "Depois do escurecer, prefira o calçadão iluminado e evite ficar isolado.",
)
add(
    "land_arena03",
    L,
    "Quadra 03 — fala completa",
    "Quadra 03, na areia da orla. Olhe as crianças ao redor, divida o tempo de jogo e mantenha o respeito.",
)
add(
    "land_arena03_tip1",
    L,
    "Quadra 03 — tip 1",
    "Jogo forte perto de criança e guarda-sol. Avise antes de sacar e olhe quem está atrás.",
)
add(
    "land_arena03_tip2",
    L,
    "Quadra 03 — tip 2",
    "A quadra é coletiva: combine o tempo, não monopolize e deixe o próximo time entrar.",
)
add(
    "land_arena03_tip3",
    L,
    "Quadra 03 — tip 3",
    "Discussão de ponto não vira gritaria. O clima da orla vem antes do placar.",
)
add(
    "land_quadra_areia",
    L,
    "Quadra de Areia — fala completa",
    "Quadra de areia no sul da praia. Hidrate no calor, não ocupe a marca com cooler e mantenha o som baixo.",
)
add(
    "land_quadra_areia_tip1",
    L,
    "Quadra de Areia — tip 1",
    "No meio-dia a areia queima. Hidrate, use protetor e faça pausa entre os sets.",
)
add(
    "land_quadra_areia_tip2",
    L,
    "Quadra de Areia — tip 2",
    "Não espalhe coolers na quadra. Guarde o material na beira e liberte a marca.",
)
add(
    "land_quadra_areia_tip3",
    L,
    "Quadra de Areia — tip 3",
    "Caixa de som no talo atrapalha o jogo e o banho. Volume baixo, bom senso alto.",
)
add(
    "land_bancos_marlin",
    L,
    "Bancos cobertos · Marlin — fala completa",
    "Bancos cobertos · Marlin. A sombra é compartilhada: não reserve o banco o dia todo, não suba na cobertura e não deixe lixo.",
)
add(
    "land_bancos_norte",
    L,
    "Bancos cobertos · Norte — fala completa",
    "Bancos cobertos · Norte. A sombra é compartilhada: não reserve o banco o dia todo, não suba na cobertura e não deixe lixo.",
)
add(
    "land_bancos_tip1",
    L,
    "Bancos — tip 1 (vale para os dois conjuntos)",
    "A cobertura esquenta e o piso em volta queima. Não suba no telhado e não deixe criança sozinha.",
)
add(
    "land_bancos_tip2",
    L,
    "Bancos — tip 2",
    "Toalha e bolsa não reservam o banco o dia inteiro. Sentou, usou, liberou para o próximo.",
)
add(
    "land_bancos_tip3",
    L,
    "Bancos — tip 3",
    "Comida, bituca e sacola não ficam debaixo da cobertura. O que trouxe, leva.",
)
add(
    "land_playground",
    L,
    "Playground — fala completa",
    "Playground na areia. O ferro esquenta no sol, fique com a criança e respeite a fila do brinquedo.",
)
add(
    "land_playground_tip1",
    L,
    "Playground — tip 1",
    "No sol o brinquedo queima. Confira com a mão antes de a criança sentar ou escorregar.",
)
add(
    "land_playground_tip2",
    L,
    "Playground — tip 2",
    "Areia e brinquedo juntos. Não deixe sozinha e não deixe correr para o mar daqui.",
)
add(
    "land_playground_tip3",
    L,
    "Playground — tip 3",
    "Um de cada vez no escorrega e no balanço. Espere a vez e ajude quem é menor.",
)
add(
    "land_salva",
    L,
    "Salva-vidas — fala completa",
    "Posto de salva-vidas. Respeite a bandeira, deixe o corredor livre e chame o posto só para emergência.",
)
add(
    "land_salva_tip1",
    L,
    "Salva-vidas — tip 1",
    "Amarela é cuidado, vermelha é sem banho. O posto vale mais do que o mar parecer calmo.",
)
add(
    "land_salva_tip2",
    L,
    "Salva-vidas — tip 2",
    "Não pare cadeira, guarda-sol ou carrinho na frente do posto. A saída para o resgate tem que estar livre.",
)
add(
    "land_salva_tip3",
    L,
    "Salva-vidas — tip 3",
    "Não peça gelo, tomada ou guarda-volume. Em emergência, chame alto e aponte o ponto.",
)
add(
    "land_golfinho",
    L,
    "Estátua do Golfinho — fala completa",
    "A estátua do golfinho fica no costão do Morro da Pescaria, ao lado do píer. A pedra escorrega. Não suba, não risque e não deixe lixo.",
)
add(
    "land_golfinho_tip1",
    L,
    "Golfinho — tip 1",
    "O piso do costão fica molhado de maresia. Segure a criança e não corra em volta da estátua.",
)
add(
    "land_golfinho_tip2",
    L,
    "Golfinho — tip 2",
    "A estátua não é brinquedo. Não sente, não escale e não apoie o peso no golfinho.",
)
add(
    "land_golfinho_tip3",
    L,
    "Golfinho — tip 3",
    "Não escreva, não risque e não deixe lixo no monumento. O golfinho é da orla.",
)
for code, name in [("ii", "II"), ("iii", "III"), ("v", "V"), ("vi", "VI")]:
    add(
        f"land_banheiro_{code}",
        L,
        f"Banheiro {name} — fala completa",
        f"Banheiro {name} · Praia do Morro: piso molhado, sem correria. Use a lixeira, respeite a fila e deixe o lugar limpo para o próximo.",
    )
add(
    "land_banheiro_tip1",
    L,
    "Banheiro — tip 1 (vale para II, III, V e VI)",
    "Molhado e com pressa? Cuidado no piso. Segure a criança e não corra no corredor.",
)
add(
    "land_banheiro_tip2",
    L,
    "Banheiro — tip 2",
    "Não jogue papel fora da lixeira, não escreva na parede e liberte o box assim que terminar.",
)
add(
    "land_banheiro_tip3",
    L,
    "Banheiro — tip 3",
    "Prioridade para criança, idoso e quem precisa. Sem empurrão e sem gritaria.",
)

# ——— RAMPA ———
add(
    "rampa_warn",
    "Rampa principal",
    "Ao entrar no corredor",
    "Você está na passagem da rampa. Este caminho fica livre para os ambulantes entrarem e saírem, e para os banhistas passarem. Segue ou sai um pouco para a areia.",
)
add(
    "rampa_rule",
    "Rampa principal",
    "Regra do corredor",
    "Neste corredor não pode guarda-sol, cadeira nem barraca. A passagem fica livre para os ambulantes entrarem e saírem, e para os banhistas irem até a água.",
)
add(
    "rampa_tip3",
    "Rampa principal",
    "Dica extra do tour",
    "Guarda-sol, cadeira e barraca ficam fora deste caminho. Liberte a rampa e o trânsito da orla flui.",
)
add(
    "rampa_combo",
    "Rampa principal",
    "Versão falada completa (warn + rule)",
    "Você está na passagem da rampa. Este caminho fica livre para os ambulantes entrarem e saírem, e para os banhistas passarem. Segue ou sai um pouco para a areia. Neste corredor não pode guarda-sol, cadeira nem barraca. A passagem fica livre para os ambulantes entrarem e saírem, e para os banhistas irem até a água.",
)

# ——— MARÉ ———
add(
    "mare_tip_enchente",
    "Card Maré",
    "Dica Guará — enchente",
    "Na enchente a água sobe rápido no raso. Olhe a bandeira e fique onde o salva-vidas enxerga.",
)
add(
    "mare_tip_vazante",
    "Card Maré",
    "Dica Guará — vazante",
    "Na vazante o raso abre, mas a corrente ainda puxa. Criança sempre de mão dada.",
)
add(
    "mare_tip_estavel",
    "Card Maré",
    "Dica Guará — estável",
    "Mar estável agora. Mesmo assim, o posto manda mais do que o aspecto da água.",
)

# ——— PATROCINADORES ———
P = "Patrocinadores — Guará sussurra"
add(
    "spon_q07",
    P,
    "Quiosque 07",
    "Peça o camarão no fim da tarde — a brasa fica no ponto e o sol ainda ilumina a mesa.",
)
add(
    "spon_q12",
    P,
    "Quiosque 12",
    "Chegue um pouco antes do show — a mesa boa some rápido e o som fica perfeito.",
)
add(
    "spon_q18",
    P,
    "Quiosque 18",
    "Depois do banho de mar, o bowl da casa recupera energia sem pesar.",
)
add(
    "spon_q22",
    P,
    "Quiosque 22",
    "Chegue 40 minutos antes do sol sumir — a vista e a mesa valem o timing.",
)
add(
    "spon_sorvete",
    P,
    "Sorveteria do Morro",
    "Depois das 16h a taça da casa some rápido — chega cedo ou manda mensagem.",
)
add(
    "spon_pousada",
    P,
    "Pousada da Orla",
    "Peça o quarto com vista pro nascer — o Guará recomenda a varanda do segundo andar.",
)
add(
    "spon_rest",
    P,
    "Restaurante Beira-Mar",
    "Reserva pelo app evita fila no fim de semana — a barca do chef some cedo.",
)
add(
    "spon_fallback",
    P,
    "Fallback genérico",
    "Vale a visita — é casa de patrocinador da orla.",
)

# Navegação / "Ir até aqui" (a pé, bike, carro) — fora deste roteiro por enquanto.

# ——— TELA MARLIN (orla) ———
add(
    "orla_marlin_long1",
    "Tela Marlin (orla)",
    "Piso",
    "A pedra é lisa e fica molhada de maresia e de respingo. Ande devagar, com o pé inteiro no chão. Não corra. Segure a criança pela mão. Um escorregão aqui machuca.",
)
add(
    "orla_marlin_long2",
    "Tela Marlin (orla)",
    "Lixo",
    "Garrafa, bituca, casca e sacola não ficam na pedra nem na fresta. O que você trouxe, você leva. Nada de deixar resto para o mar recolher.",
)
add(
    "orla_marlin_long3",
    "Tela Marlin (orla)",
    "Patrimônio",
    "O Marlin é patrimônio da cidade. Não escreva nome, não grave data, não arranque pedaço, não suba no peixe e não apoie nada que risque a pintura. Foto, sim. Dano, não.",
)

# Deduplicate by id
seen: set[str] = set()
uniq: list[dict] = []
for item in lines:
    if item["id"] in seen:
        continue
    seen.add(item["id"])
    uniq.append(item)
lines = uniq


class PDF(FPDF):
    def header(self) -> None:
        if self.page_no() == 1:
            return
        self.set_font("DejaVu", "B", 9)
        self.set_text_color(80, 80, 80)
        self.cell(0, 6, "Praia Alerta Guará — Roteiro de dublagem do Guará", align="L")
        self.ln(8)

    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("DejaVu", "", 8)
        self.set_text_color(120, 120, 120)
        self.cell(0, 8, f"Página {self.page_no()}/{{nb}}", align="C")


pdf = PDF(format="A4")
pdf.alias_nb_pages()
pdf.set_auto_page_break(auto=True, margin=18)
pdf.set_margins(14, 14, 14)
pdf.add_font("DejaVu", "", FONT)
pdf.add_font("DejaVu", "B", FONT_B)


def block(text: str, size: float = 10, bold: bool = False, h: float = 5, fill: bool = False, color=(30, 30, 30)) -> None:
    """Safe full-width paragraph — always resets X to left margin."""
    pdf.set_x(pdf.l_margin)
    pdf.set_font("DejaVu", "B" if bold else "", size)
    pdf.set_text_color(*color)
    pdf.multi_cell(pdf.epw, h, text, fill=fill)
    pdf.set_x(pdf.l_margin)


pdf.add_page()

block("Roteiro de dublagem — Guará", size=18, bold=True, h=9, color=(12, 74, 110))
pdf.ln(2)
block(
    "App: Praia Alerta Guará\n"
    "Personagem: Guará (guia da Praia do Morro, Guarapari/ES)\n"
    "Objetivo: gravar as falas do Guará no app "
    "(tutoriais, chat, marcos, tips, maré, patrocinadores).\n"
    "Fora deste roteiro (por enquanto): falas de rota depois de Ir até aqui "
    "(a pé / bike / carro).\n"
    "Idioma: português do Brasil (pt-BR).\n"
    "Tom: amigável, claro, seguro, praiano — nunca infantil demais; "
    "urgência só em emergência/alerta.\n"
    "Acessibilidade: cada fala precisa existir em áudio para o botão Ouvir "
    "e para o Guará narrar qualquer tela.",
    size=11,
    h=6,
)
pdf.ln(3)
block("Instruções gerais para a dubladora", size=11, bold=True, h=6)
block(
    "- Grave cada ID em um arquivo separado.\n"
    "- Não fale o ID nem o título em voz alta — só o texto da fala.\n"
    "- Não leia emojis (já removidos abaixo).\n"
    "- Pausas naturais entre frases; dicção clara (acessibilidade / ouvir no celular na praia).\n"
    "- Evite sopro no microfone e ruído de fundo.\n"
    "- Se houver nota sob a fala, leia a nota em silêncio — é orientação, não texto.\n"
    "- Trechos modelo e stem usam exemplos; o app monta variações — grave o ritmo e os trechos fixos.\n",
    size=10,
    h=5,
)
pdf.ln(2)
block(f"Total de falas neste roteiro: {len(lines)}", size=11, bold=True, h=6)
pdf.ln(4)

current_section = None
for i, item in enumerate(lines, 1):
    if item["section"] != current_section:
        current_section = item["section"]
        pdf.ln(2)
        block(current_section, size=13, bold=True, h=7, color=(12, 74, 110))
        pdf.ln(1)

    block(f"{i:03d}.  [{item['id']}]  -  {item['context']}", size=10, bold=True, h=5)
    pdf.set_fill_color(245, 248, 250)
    # Prefer ASCII quotes in PDF body to avoid rare glyph-width bugs
    fala = item["text"].replace("“", '"').replace("”", '"').replace("—", "-").replace("–", "-")
    block(f'Fala: "{fala}"', size=10, h=5, fill=True)
    if item["notes"]:
        nota = item["notes"].replace("«", '"').replace("»", '"').replace("—", "-")
        block(f"Nota: {nota}", size=9, h=4.5, color=(90, 60, 20))
    pdf.ln(2)

# ——— ENTREGA ———
pdf.add_page()
block("Como gravar e entregar (passo a passo simples)", size=16, bold=True, h=8, color=(12, 74, 110))
pdf.ln(2)
block(
    "Fluxo para quem vai gravar (não precisa ser estúdio nem saber de WAV):\n"
    "\n"
    "1) Grave normal\n"
    "   - Use o Gravador do celular, Notas de Voz (iPhone) ou Audacity no computador.\n"
    "   - Quarto quieto, celular perto da boca, fale só o texto da linha Fala.\n"
    "   - Não diga o número da fala nem o ID em voz alta.\n"
    "   - Uma fala por vez. Se errar, grave de novo.\n"
    "\n"
    "2) Salve o arquivo com o nome certo (obrigatório)\n"
    "   - Use exatamente o ID entre colchetes do roteiro.\n"
    "   - Padrão: guara__<ID>  + a extensão que o celular der\n"
    "   - Exemplos (qualquer extensão serve no envio):\n"
    "        guara__home_intro.m4a\n"
    "        guara__tour_home_01.mp3\n"
    "        guara__guide_marlin.wav\n"
    "        guara__land_golfinho.m4a\n"
    "   - Minúsculas, underline duplo depois de guara, sem acento no nome.\n"
    "   - Um arquivo = uma fala (não junte várias no mesmo arquivo).\n"
    "\n"
    "3) Mande o pacote para a gente\n"
    "   - Junte tudo num ZIP (pode ser tudo na raiz do ZIP).\n"
    "   - Opcional: um 00_readme.txt com seu nome, data e como gravou.\n"
    "\n"
    "4) Nós convertemos para WAV e colocamos no app\n"
    "   - Você NÃO precisa exportar em WAV.\n"
    "   - MP3, M4A, AAC, CAF ou WAV — tudo bem.\n"
    "   - A equipe converte para o formato do app (WAV) e sobe em public/guara/voice/.\n"
    "   - O que não pode errar é o NOME bater com o ID do PDF.\n"
    "\n"
    "Checklist rápido antes de enviar\n"
    "   [ ] Todas as falas do roteiro foram gravadas (conte o total)\n"
    "   [ ] Cada arquivo começa com guara__ e o ID certo\n"
    "   [ ] Sem ruído forte de fundo\n"
    "   [ ] Sem dizer o número ou o ID em voz alta\n",
    size=10,
    h=5,
)

pdf.ln(3)
block("Dicas extras (opcional — se quiser caprichar)", size=12, bold=True, h=6, color=(12, 74, 110))
pdf.ln(1)
block(
    "- Se souber exportar WAV: mono, 48 kHz (ou 44,1 kHz), sem música e sem efeito.\n"
    "- Take alternativo: guara__<ID>__alt2.m4a (ou .wav / .mp3).\n"
    "- Pastas por tema ajudam, mas não são obrigatórias se o nome estiver certo.\n",
    size=10,
    h=5,
)

pdf.ln(3)
block("Índice rápido de IDs (conferência)", size=11, bold=True, h=6)
pdf.ln(1)
block(
    "Salve como guara__<ID>.m4a (ou .mp3 / .wav). Nós convertemos para WAV depois.",
    size=9,
    h=4,
    color=(80, 80, 80),
)
pdf.ln(1)
for idx, item in enumerate(lines, 1):
    block(f"{idx:03d}  guara__{item['id']}", size=8, h=4)

out1 = Path("/workspace/docs/roteiro-dublagem-guara.pdf")
out2 = Path("/opt/cursor/artifacts/roteiro-dublagem-guara.pdf")
pdf.output(str(out1))
pdf.output(str(out2))

md = Path("/workspace/docs/roteiro-dublagem-guara.md")
with md.open("w", encoding="utf-8") as f:
    f.write(f"# Roteiro Guará — {len(lines)} falas\n\n")
    f.write("Arquivo para a dubladora: `roteiro-dublagem-guara.pdf`\n\n")
    sec = None
    for i, item in enumerate(lines, 1):
        if item["section"] != sec:
            sec = item["section"]
            f.write(f"\n## {sec}\n\n")
        f.write(f"{i}. **`{item['id']}`** — {item['context']}\n\n> {item['text']}\n\n")
        if item["notes"]:
            f.write(f"_Nota: {item['notes']}_\n\n")
    f.write(
        "\n## Entrega\n\n"
        "1. Grave normal (celular ou Audacity).\n"
        "2. Salve como `guara__<ID>.m4a` / `.mp3` / `.wav` (nome = ID do roteiro).\n"
        "3. Mande o ZIP — a equipe converte para WAV e coloca no app.\n"
    )

ids_path = Path("/workspace/docs/roteiro-dublagem-guara-ids.txt")
ids_path.write_text("\n".join(item["id"] for item in lines) + "\n", encoding="utf-8")

print("PDF", out1, "pages", pdf.page_no(), "lines", len(lines), "bytes", out1.stat().st_size)
print("artifact", out2, out2.stat().st_size)
print("md", md)
print("ids", ids_path)
