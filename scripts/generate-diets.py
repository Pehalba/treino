# -*- coding: utf-8 -*-
import json
from pathlib import Path

food = {
    "Leite integral": (65, 2.333, 7.167, 3.033),
    "Aveia em flocos": (394, 14.0, 66.6, 8.4),
    "Banana nanica": (92, 1.417, 23.833, 0.083),
    "Ovo": (146, 13.4, 0.6, 9.6),
    "Iogurte natural": (51, 4.118, 1.882, 3.0),
    "Mel": (309.3, 0.0, 84.0, 0.0),
    "Arroz branco cozido": (128, 2.5, 28.1, 0.2),
    "Feijão carioca cozido": (76, 4.8, 13.6, 0.533),
    "Peito de frango grelhado/ao molho": (159, 32.0, 0.0, 2.444),
    "Azeite de oliva": (884, 0.0, 0.0, 100.0),
    "Tomate cru": (15, 1.1, 3.1, 0.2),
    "Tapioca": (289, 0.375, 71.875, 0.0),
    "Queijo minas frescal": (264, 17.333, 3.333, 20.333),
    "Macarrão de trigo cozido": (125, 3.5, 27.3, 0.467),
    "Patinho bovino moído/grelhado": (219, 35.889, 0.0, 7.333),
    "Molho de tomate": (38, 1.4, 7.733, 0.933),
    "Pão integral": (253, 9.375, 49.875, 3.75),
    "Batata inglesa cozida": (52, 1.2, 11.9, 0.0),
    "Batata-doce cozida": (77, 0.6, 18.4, 0.1),
    "Cuscuz de milho cozido": (113, 2.2, 25.3, 0.7),
    "Pão francês": (300, 8.0, 58.6, 3.1),
    "Atum em água drenado": (116, 26.0, 0.0, 1.0),
    "Mamão formosa": (45, 0.8, 11.6, 0.1),
    "Mandioca cozida": (125, 0.6, 30.1, 0.3),
    "Pasta de amendoim": (588, 25.0, 20.0, 50.0),
}

def qlabel(foodname, g):
    g = int(g) if abs(g - round(g)) < 1e-9 else round(g, 1)
    if foodname == "Leite integral":
        return f"{g} ml ({g} g)"
    if foodname == "Aveia em flocos":
        return f"aprox. {g/10:g} colheres de sopa rasas ({g} g)"
    if foodname == "Banana nanica":
        unit = (
            "aprox. 1 unidade média"
            if g >= 110
            else "aprox. 1 unidade pequena"
            if g >= 80
            else "aprox. 1/2 a 2/3 unidade"
            if g >= 55
            else "aprox. 1/3 unidade"
        )
        return f"{unit} ({g} g)"
    if foodname == "Ovo":
        return "1 unidade (50 g)" if g == 50 else "2 unidades (100 g)" if g == 100 else f"aprox. {g/50:g} unidade(s) ({g} g)"
    if foodname == "Iogurte natural":
        return "1 pote (170 g)" if g == 170 else f"aprox. {g} g"
    if foodname == "Mel":
        return {5: "1 colher de chá rasa (5 g)", 10: "2 colheres de chá (10 g)", 15: "1 colher de sopa rasa (15 g)", 20: "1 colher de sopa cheia (20 g)"}.get(
            g, f"aprox. {g} g"
        )
    if foodname == "Arroz branco cozido":
        return f"aprox. {g/150:.1f} xícara(s) rasa(s) ({g} g)"
    if foodname == "Feijão carioca cozido":
        return f"aprox. {g/150:.1f} concha(s) média(s) ({g} g)"
    if foodname == "Peito de frango grelhado/ao molho":
        return f"aprox. {g} g de frango pronto"
    if foodname == "Azeite de oliva":
        return f"1 colher de chá ({g} g)" if g <= 5 else f"1 colher de sobremesa ({g} g)"
    if foodname == "Tomate cru":
        return f"aprox. 1 tomate médio ({g} g)" if g >= 90 else f"aprox. {g} g"
    if foodname == "Tapioca":
        return f"1 disco de tapioca, aprox. {g} g pronto"
    if foodname == "Queijo minas frescal":
        return f"aprox. {g/30:.1f} fatia(s) média(s) ({g} g)"
    if foodname == "Macarrão de trigo cozido":
        return f"aprox. {g/100:.1f} escumadeira(s) cheia(s) ({g} g)"
    if foodname == "Patinho bovino moído/grelhado":
        return f"aprox. {g} g pronto"
    if foodname == "Molho de tomate":
        return f"aprox. {g/200:.2g} xícara(s) ({g} g)"
    if foodname == "Pão integral":
        return f"aprox. {g/27:.1f} fatia(s) ({g} g)"
    if foodname == "Batata inglesa cozida":
        return f"aprox. {g/100:.1f} unidade(s) média(s) ({g} g)"
    if foodname == "Batata-doce cozida":
        return f"aprox. {g/100:.1f} unidade(s) pequena(s) ({g} g)"
    if foodname == "Cuscuz de milho cozido":
        return f"aprox. {g/100:.1f} xícara(s) pequena(s) ({g} g)"
    if foodname == "Pão francês":
        return f"aprox. {g/50:.1f} unidade(s) ({g} g)"
    if foodname == "Atum em água drenado":
        return f"aprox. {g/120:.1f} lata(s) drenada(s) ({g} g)"
    if foodname == "Mamão formosa":
        return f"aprox. {g} g em cubos/fatia"
    if foodname == "Mandioca cozida":
        return f"aprox. {g/100:.1f} pedaço(s) médio(s) ({g} g)"
    if foodname == "Pasta de amendoim":
        return f"1 colher de chá rasa ({g} g)" if g <= 5 else f"2 colheres de chá rasas ({g} g)"
    return f"{g} g"

baseP = {
    "breakfast": {"Leite integral": 300, "Aveia em flocos": 50, "Banana nanica": 120, "Ovo": 50},
    "morning_snack": {"Iogurte natural": 170, "Banana nanica": 100, "Aveia em flocos": 20, "Mel": 15},
    "lunch": {"Arroz branco cozido": 300, "Feijão carioca cozido": 150, "Peito de frango grelhado/ao molho": 90, "Azeite de oliva": 10, "Tomate cru": 100},
    "afternoon_snack": {"Tapioca": 80, "Ovo": 50, "Queijo minas frescal": 30},
    "dinner": {"Macarrão de trigo cozido": 300, "Patinho bovino moído/grelhado": 90, "Molho de tomate": 150, "Azeite de oliva": 10},
    "supper": {"Leite integral": 300, "Aveia em flocos": 30, "Mel": 15},
    "other": {"Pão integral": 80, "Banana nanica": 120, "Mel": 20},
}
baseC = {
    "breakfast": {"Leite integral": 180, "Aveia em flocos": 25, "Banana nanica": 90, "Ovo": 50},
    "morning_snack": {"Iogurte natural": 120, "Banana nanica": 70, "Aveia em flocos": 10, "Mel": 10},
    "lunch": {"Arroz branco cozido": 150, "Feijão carioca cozido": 90, "Peito de frango grelhado/ao molho": 50, "Azeite de oliva": 5, "Tomate cru": 100},
    "afternoon_snack": {"Tapioca": 45, "Ovo": 50, "Queijo minas frescal": 15},
    "dinner": {"Macarrão de trigo cozido": 150, "Patinho bovino moído/grelhado": 50, "Molho de tomate": 100, "Azeite de oliva": 5},
    "supper": {"Leite integral": 180, "Aveia em flocos": 15, "Mel": 10},
    "other": {"Pão integral": 30, "Banana nanica": 60, "Mel": 8},
}
optsP = {
    "breakfast": [
        ("Café aveia e banana", baseP["breakfast"]),
        ("Café cuscuz, ovos e banana", {"Cuscuz de milho cozido": 150, "Ovo": 100, "Leite integral": 200, "Banana nanica": 100}),
        ("Café pão francês e mamão", {"Pão francês": 90, "Ovo": 50, "Queijo minas frescal": 15, "Leite integral": 200, "Mamão formosa": 100}),
        ("Café tapioca com ovos", {"Tapioca": 60, "Ovo": 100, "Queijo minas frescal": 30, "Banana nanica": 100, "Leite integral": 150}),
        ("Café pão, iogurte e banana", {"Pão integral": 80, "Ovo": 50, "Iogurte natural": 170, "Banana nanica": 100, "Pasta de amendoim": 10, "Mel": 20}),
        ("Panqueca de banana e aveia", {"Aveia em flocos": 70, "Ovo": 50, "Banana nanica": 120, "Iogurte natural": 100, "Mel": 20}),
        ("Café batata-doce e ovos", {"Batata-doce cozida": 250, "Ovo": 100, "Leite integral": 250, "Mamão formosa": 150}),
    ],
    "morning_snack": [
        ("Iogurte com banana e aveia", baseP["morning_snack"]),
        ("Vitamina leve de banana", {"Leite integral": 200, "Banana nanica": 100, "Aveia em flocos": 25}),
        ("Pão integral com minas e mamão", {"Pão integral": 70, "Queijo minas frescal": 30, "Mamão formosa": 100, "Mel": 10}),
        ("Tapioca com ovo e minas", {"Tapioca": 50, "Ovo": 50, "Queijo minas frescal": 30}),
        ("Meio pão francês com leite e minas", {"Pão francês": 50, "Leite integral": 200, "Queijo minas frescal": 10}),
        ("Iogurte com mamão e aveia", {"Iogurte natural": 170, "Mamão formosa": 150, "Aveia em flocos": 25, "Mel": 15}),
        ("Batata-doce com leite e minas", {"Batata-doce cozida": 100, "Leite integral": 200, "Pasta de amendoim": 10, "Queijo minas frescal": 15}),
    ],
    "lunch": [
        ("Almoço frango, arroz e feijão", baseP["lunch"]),
        ("Almoço patinho, arroz e feijão", {"Arroz branco cozido": 300, "Feijão carioca cozido": 150, "Patinho bovino moído/grelhado": 80, "Azeite de oliva": 5, "Tomate cru": 100}),
        ("Almoço macarrão com frango", {"Macarrão de trigo cozido": 350, "Peito de frango grelhado/ao molho": 90, "Molho de tomate": 150, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Almoço arroz, feijão e atum", {"Arroz branco cozido": 300, "Feijão carioca cozido": 150, "Atum em água drenado": 110, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Almoço cuscuz com frango", {"Cuscuz de milho cozido": 300, "Feijão carioca cozido": 150, "Peito de frango grelhado/ao molho": 100, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Almoço mandioca com frango", {"Mandioca cozida": 250, "Feijão carioca cozido": 150, "Peito de frango grelhado/ao molho": 100, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Almoço batata, arroz e patinho", {"Batata inglesa cozida": 250, "Arroz branco cozido": 250, "Patinho bovino moído/grelhado": 90, "Azeite de oliva": 8, "Tomate cru": 100}),
    ],
    "afternoon_snack": [
        ("Tapioca com ovo e minas", baseP["afternoon_snack"]),
        ("Pão com ovo e banana", {"Pão integral": 60, "Ovo": 50, "Banana nanica": 120, "Mel": 10}),
        ("Cuscuz com ovo e minas", {"Cuscuz de milho cozido": 235, "Ovo": 50, "Queijo minas frescal": 12}),
        ("Iogurte com banana e pasta", {"Iogurte natural": 120, "Aveia em flocos": 30, "Banana nanica": 100, "Pasta de amendoim": 10, "Mel": 10}),
        ("Pão francês com minas e tomate", {"Pão francês": 70, "Queijo minas frescal": 35, "Tomate cru": 100, "Mel": 10}),
        ("Batata-doce com ovo e leite", {"Batata-doce cozida": 200, "Ovo": 50, "Leite integral": 200}),
        ("Tapioca com frango e minas", {"Tapioca": 90, "Peito de frango grelhado/ao molho": 22, "Queijo minas frescal": 20}),
    ],
    "dinner": [
        ("Jantar macarrão com patinho", baseP["dinner"]),
        ("Jantar arroz, feijão e frango", {"Arroz branco cozido": 280, "Feijão carioca cozido": 130, "Peito de frango grelhado/ao molho": 90, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Jantar batata, arroz e frango", {"Batata inglesa cozida": 250, "Arroz branco cozido": 250, "Peito de frango grelhado/ao molho": 100, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Jantar mandioca com patinho", {"Mandioca cozida": 250, "Feijão carioca cozido": 100, "Patinho bovino moído/grelhado": 90, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Jantar cuscuz com frango", {"Cuscuz de milho cozido": 280, "Feijão carioca cozido": 120, "Peito de frango grelhado/ao molho": 100, "Azeite de oliva": 10, "Tomate cru": 100}),
        ("Jantar macarrão com atum", {"Macarrão de trigo cozido": 350, "Atum em água drenado": 110, "Molho de tomate": 150, "Azeite de oliva": 10}),
        ("Jantar arroz com patinho e feijão", {"Arroz branco cozido": 300, "Patinho bovino moído/grelhado": 90, "Feijão carioca cozido": 100, "Azeite de oliva": 5, "Tomate cru": 100}),
    ],
    "supper": [
        ("Ceia leite, aveia e mel", baseP["supper"]),
        ("Ceia iogurte, banana e aveia", {"Iogurte natural": 170, "Banana nanica": 100, "Aveia em flocos": 30, "Mel": 20}),
        ("Ceia leite, pão e banana", {"Leite integral": 200, "Pão integral": 50, "Banana nanica": 100}),
        ("Ceia cuscuz com leite e minas", {"Cuscuz de milho cozido": 180, "Leite integral": 200, "Mel": 10, "Queijo minas frescal": 10}),
        ("Ceia tapioca, minas e iogurte", {"Tapioca": 70, "Queijo minas frescal": 25, "Leite integral": 130, "Iogurte natural": 60}),
        ("Ceia pão integral com leite", {"Pão integral": 80, "Leite integral": 200, "Mel": 10}),
        ("Ceia mamão, iogurte e aveia", {"Mamão formosa": 200, "Iogurte natural": 170, "Aveia em flocos": 30, "Mel": 20}),
    ],
    "other": [
        ("Pré-treino pão, banana e mel", baseP["other"]),
        ("Pré-treino tapioca e banana", {"Tapioca": 60, "Banana nanica": 100, "Mel": 10, "Iogurte natural": 155}),
        ("Pré-treino cuscuz e banana", {"Cuscuz de milho cozido": 150, "Banana nanica": 100, "Leite integral": 150}),
        ("Pré-treino pão francês e banana", {"Pão francês": 70, "Banana nanica": 120, "Mel": 15, "Iogurte natural": 30}),
        ("Pré-treino batata-doce e banana", {"Batata-doce cozida": 200, "Banana nanica": 100, "Leite integral": 150, "Iogurte natural": 50}),
        ("Pré-treino aveia e banana", {"Aveia em flocos": 40, "Banana nanica": 100, "Mel": 20, "Iogurte natural": 80}),
        ("Pré-treino mandioca e banana", {"Mandioca cozida": 150, "Banana nanica": 80, "Mel": 15, "Iogurte natural": 150}),
    ],
}
optsC = {
    "breakfast": [
        ("Café aveia e banana", baseC["breakfast"]),
        ("Café cuscuz, ovos e banana", {"Cuscuz de milho cozido": 130, "Ovo": 50, "Leite integral": 150, "Banana nanica": 70}),
        ("Café pão francês e mamão", {"Pão francês": 50, "Ovo": 50, "Queijo minas frescal": 15, "Leite integral": 100, "Mamão formosa": 100}),
        ("Café tapioca com ovos", {"Tapioca": 40, "Ovo": 50, "Queijo minas frescal": 15, "Banana nanica": 70, "Leite integral": 130}),
        ("Café pão, iogurte e banana", {"Pão integral": 40, "Ovo": 50, "Iogurte natural": 100, "Banana nanica": 70, "Pasta de amendoim": 5, "Mel": 17}),
        ("Panqueca de banana e aveia", {"Aveia em flocos": 35, "Ovo": 50, "Banana nanica": 70, "Iogurte natural": 70, "Mel": 20}),
        ("Café batata-doce e ovos", {"Batata-doce cozida": 150, "Ovo": 50, "Leite integral": 150, "Mamão formosa": 120, "Queijo minas frescal": 15}),
    ],
    "morning_snack": [
        ("Iogurte com banana e aveia", baseC["morning_snack"]),
        ("Vitamina leve de banana", {"Leite integral": 120, "Banana nanica": 60, "Aveia em flocos": 10, "Iogurte natural": 40}),
        ("Pão integral com minas e mamão", {"Pão integral": 30, "Queijo minas frescal": 17, "Mamão formosa": 80, "Mel": 10}),
        ("Tapioca com ovo e minas", {"Tapioca": 40, "Ovo": 50, "Queijo minas frescal": 5}),
        ("Meio pão francês com leite e minas", {"Pão francês": 25, "Leite integral": 100, "Queijo minas frescal": 15}),
        ("Iogurte com mamão e aveia", {"Iogurte natural": 120, "Mamão formosa": 100, "Aveia em flocos": 10, "Mel": 15}),
        ("Batata-doce com leite e minas", {"Batata-doce cozida": 60, "Leite integral": 100, "Pasta de amendoim": 5, "Queijo minas frescal": 15}),
    ],
    "lunch": [
        ("Almoço frango, arroz e feijão", baseC["lunch"]),
        ("Almoço patinho, arroz e feijão", {"Arroz branco cozido": 150, "Feijão carioca cozido": 90, "Patinho bovino moído/grelhado": 45, "Azeite de oliva": 2, "Tomate cru": 100}),
        ("Almoço macarrão com frango", {"Macarrão de trigo cozido": 180, "Peito de frango grelhado/ao molho": 50, "Molho de tomate": 100, "Azeite de oliva": 5, "Tomate cru": 80}),
        ("Almoço arroz, feijão e atum", {"Arroz branco cozido": 150, "Feijão carioca cozido": 90, "Atum em água drenado": 60, "Azeite de oliva": 5, "Tomate cru": 100}),
        ("Almoço cuscuz com frango", {"Cuscuz de milho cozido": 170, "Feijão carioca cozido": 80, "Peito de frango grelhado/ao molho": 55, "Azeite de oliva": 5, "Tomate cru": 100}),
        ("Almoço mandioca com frango", {"Mandioca cozida": 125, "Feijão carioca cozido": 80, "Peito de frango grelhado/ao molho": 55, "Azeite de oliva": 5, "Tomate cru": 100}),
        ("Almoço batata, arroz e patinho", {"Batata inglesa cozida": 150, "Arroz branco cozido": 120, "Patinho bovino moído/grelhado": 50, "Azeite de oliva": 4, "Tomate cru": 100}),
    ],
    "afternoon_snack": [
        ("Tapioca com ovo e minas", baseC["afternoon_snack"]),
        ("Pão com ovo e banana", {"Pão integral": 30, "Ovo": 50, "Banana nanica": 70, "Mel": 5}),
        ("Cuscuz com ovo e minas", {"Cuscuz de milho cozido": 120, "Ovo": 50, "Queijo minas frescal": 5}),
        ("Iogurte com banana e pasta", {"Iogurte natural": 100, "Aveia em flocos": 15, "Banana nanica": 60, "Pasta de amendoim": 5, "Mel": 10}),
        ("Pão francês com minas e tomate", {"Pão francês": 40, "Queijo minas frescal": 25, "Tomate cru": 80, "Mel": 10}),
        ("Batata-doce com ovo e leite", {"Batata-doce cozida": 100, "Ovo": 50, "Leite integral": 120}),
        ("Tapioca com frango e minas", {"Tapioca": 55, "Peito de frango grelhado/ao molho": 17, "Queijo minas frescal": 15}),
    ],
    "dinner": [
        ("Jantar macarrão com patinho", baseC["dinner"]),
        ("Jantar arroz, feijão e frango", {"Arroz branco cozido": 140, "Feijão carioca cozido": 80, "Peito de frango grelhado/ao molho": 50, "Azeite de oliva": 5, "Tomate cru": 100}),
        ("Jantar batata, arroz e frango", {"Batata inglesa cozida": 120, "Arroz branco cozido": 120, "Peito de frango grelhado/ao molho": 50, "Azeite de oliva": 5, "Tomate cru": 100}),
        ("Jantar mandioca com patinho", {"Mandioca cozida": 110, "Feijão carioca cozido": 50, "Patinho bovino moído/grelhado": 50, "Azeite de oliva": 5, "Tomate cru": 100}),
        ("Jantar cuscuz com frango", {"Cuscuz de milho cozido": 150, "Feijão carioca cozido": 60, "Peito de frango grelhado/ao molho": 55, "Azeite de oliva": 4, "Tomate cru": 100}),
        ("Jantar macarrão com atum", {"Macarrão de trigo cozido": 170, "Atum em água drenado": 60, "Molho de tomate": 100, "Azeite de oliva": 5}),
        ("Jantar arroz com patinho e feijão", {"Arroz branco cozido": 150, "Patinho bovino moído/grelhado": 50, "Feijão carioca cozido": 50, "Azeite de oliva": 3, "Tomate cru": 100}),
    ],
    "supper": [
        ("Ceia leite, aveia e mel", baseC["supper"]),
        ("Ceia iogurte, banana e aveia", {"Iogurte natural": 100, "Banana nanica": 60, "Aveia em flocos": 15, "Mel": 15}),
        ("Ceia leite, pão e banana", {"Leite integral": 100, "Pão integral": 25, "Banana nanica": 70}),
        ("Ceia cuscuz com leite e minas", {"Cuscuz de milho cozido": 90, "Leite integral": 100, "Mel": 5, "Queijo minas frescal": 7}),
        ("Ceia tapioca, minas e iogurte", {"Tapioca": 35, "Queijo minas frescal": 10, "Leite integral": 80, "Iogurte natural": 45}),
        ("Ceia pão integral com leite", {"Pão integral": 30, "Leite integral": 100, "Mel": 20, "Iogurte natural": 10}),
        ("Ceia mamão, iogurte e aveia", {"Mamão formosa": 100, "Iogurte natural": 100, "Aveia em flocos": 15, "Mel": 15}),
    ],
    "other": [
        ("Pré-treino pão, banana e mel", baseC["other"]),
        ("Pré-treino tapioca e banana", {"Tapioca": 25, "Banana nanica": 40, "Mel": 5, "Iogurte natural": 60}),
        ("Pré-treino cuscuz e banana", {"Cuscuz de milho cozido": 60, "Banana nanica": 40, "Leite integral": 60}),
        ("Pré-treino pão francês e banana", {"Pão francês": 25, "Banana nanica": 40, "Mel": 5, "Iogurte natural": 30}),
        ("Pré-treino batata-doce e banana", {"Batata-doce cozida": 80, "Banana nanica": 40, "Leite integral": 50, "Iogurte natural": 22}),
        ("Pré-treino aveia e banana", {"Aveia em flocos": 10, "Banana nanica": 60, "Mel": 15, "Iogurte natural": 30}),
        ("Pré-treino mandioca e banana", {"Mandioca cozida": 60, "Banana nanica": 30, "Mel": 5, "Iogurte natural": 60}),
    ],
}
cat_order = ["breakfast", "morning_snack", "lunch", "afternoon_snack", "dinner", "supper", "other"]


def item_obj(name, g):
    kcal, p, c, f = food[name]
    return {
        "foodName": name,
        "calories": round(kcal * g / 100, 1),
        "protein": round(p * g / 100, 1),
        "carbs": round(c * g / 100, 1),
        "fat": round(f * g / 100, 1),
        "quantityLabel": qlabel(name, g),
    }


def build(person, opts):
    return {
        "name": f"Dieta Bulking {person}",
        "meals": [
            {"category": cat, "name": name, "youtubeUrl": "", "items": [item_obj(k, g) for k, g in items.items()]}
            for cat in cat_order
            for name, items in opts[cat]
        ],
    }


def ts_str(value: str) -> str:
    return json.dumps(value, ensure_ascii=False)


def emit_diet(var_name: str, diet: dict) -> str:
    lines = [f"export const {var_name}: DietPreset = {{", f"  name: {ts_str(diet['name'])},", "  meals: ["]
    for meal in diet["meals"]:
        lines.append("    {")
        lines.append(f"      category: {ts_str(meal['category'])},")
        lines.append(f"      name: {ts_str(meal['name'])},")
        if meal.get("youtubeUrl"):
            lines.append(f"      youtubeUrl: {ts_str(meal['youtubeUrl'])},")
        lines.append("      items: [")
        for item in meal["items"]:
            lines.append(
                "        {{ foodName: {foodName}, calories: {calories}, protein: {protein}, carbs: {carbs}, fat: {fat}, quantityLabel: {quantityLabel} }},".format(
                    foodName=ts_str(item["foodName"]),
                    calories=item["calories"],
                    protein=item["protein"],
                    carbs=item["carbs"],
                    fat=item["fat"],
                    quantityLabel=ts_str(item["quantityLabel"]),
                )
            )
        lines.append("      ],")
        lines.append("    },")
    lines.append("  ],")
    lines.append("}")
    return "\n".join(lines)


pedro = build("Pedro", optsP)
carol = build("Carol", optsC)

header = """import type { MealCategory } from '@/types'

export const DIET_PRESET_VERSION = '7opcoes'

export type DietPresetItem = {
  foodName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantityLabel: string
}

export type DietPresetMeal = {
  category: MealCategory
  name: string
  youtubeUrl?: string
  items: DietPresetItem[]
}

export type DietPreset = {
  name: string
  meals: DietPresetMeal[]
}

"""

footer = """
export function presetForProfile(name: string, avatar?: string | null): DietPreset | null {
  const key = (avatar || name).trim().toLowerCase()
  if (key === 'pedro') return PEDRO_DIET
  if (key === 'carol') return CAROL_DIET
  return null
}

function firstMealPerCategory(meals: DietPresetMeal[]): DietPresetMeal[] {
  const seen = new Set<string>()
  const typical: DietPresetMeal[] = []
  for (const meal of meals) {
    if (seen.has(meal.category)) continue
    seen.add(meal.category)
    typical.push(meal)
  }
  return typical
}

export function dietPresetTotals(diet: DietPreset) {
  return firstMealPerCategory(diet.meals).flatMap((meal) => meal.items).reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function presetGoalsForProfile(name: string, avatar?: string | null) {
  const preset = presetForProfile(name, avatar)
  if (!preset) return null
  const totals = dietPresetTotals(preset)
  return {
    calorieGoal: Math.round(totals.calories),
    proteinGoal: Math.round(totals.protein),
    carbGoal: Math.round(totals.carbs),
    fatGoal: Math.round(totals.fat),
  }
}
"""

export type DietPresetItem = {
  foodName: string
  calories: number
  protein: number
  carbs: number
  fat: number
  quantityLabel: string
}

export type DietPresetMeal = {
  category: MealCategory
  name: string
  youtubeUrl?: string
  items: DietPresetItem[]
}

export type DietPreset = {
  name: string
  meals: DietPresetMeal[]
}

"""

footer = """
export function presetForProfile(name: string, avatar?: string | null): DietPreset | null {
  const key = (avatar || name).trim().toLowerCase()
  if (key === 'pedro') return PEDRO_DIET
  if (key === 'carol') return CAROL_DIET
  return null
}

export function dietPresetTotals(diet: DietPreset) {
  const typical = firstMealPerCategory(diet.meals)
  return typical.flatMap((meal) => meal.items).reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  )
}

export function presetGoalsForProfile(name: string, avatar?: string | null) {
  const preset = presetForProfile(name, avatar)
  if (!preset) return null
  const totals = dietPresetTotals(preset)
  return {
    calorieGoal: Math.round(totals.calories),
    proteinGoal: Math.round(totals.protein),
    carbGoal: Math.round(totals.carbs),
    fatGoal: Math.round(totals.fat),
  }
}
"""

out = Path(__file__).resolve().parents[1] / "src" / "data" / "diets.ts"
out.write_text(header + emit_diet("PEDRO_DIET", pedro) + "\n\n" + emit_diet("CAROL_DIET", carol) + "\n" + footer, encoding="utf-8")
print(f"Wrote {out}")
print(f"Pedro meals={len(pedro['meals'])} Carol meals={len(carol['meals'])}")
