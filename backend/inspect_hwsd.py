
from access_parser import AccessParser
import math

db = AccessParser("data/hwsd/HWSD2.mdb")
data = db.get_table("HWSD2_LAYERS").parse()

TARGET_ID = 36104

properties = [
    "SAND",
    "SILT",
    "CLAY",
    "ORG_CARBON",
    "BULK",
    "CEC_SOIL",
    "TOTAL_N",
]

records = {}

for i in range(len(data["HWSD2_SMU_ID"])):
    if data["HWSD2_SMU_ID"][i] == TARGET_ID:
        layer = data["LAYER"][i]

        records.setdefault(layer, []).append({
            "share": float(data["SHARE"][i]) / 100,
            "pH": float(data["PH_WATER"][i]),
            **{
                prop: float(data[prop][i])
                for prop in properties
            },
        })


def weighted_average(rows, field):
    return sum(
        row[field] * row["share"]
        for row in rows
    ) / sum(row["share"] for row in rows)


def weighted_ph(rows):
    acidity = sum(
        (10 ** (-row["pH"])) * row["share"]
        for row in rows
    ) / sum(row["share"] for row in rows)

    return -math.log10(acidity)


print("\nWEIGHTED FAO HWSD SOIL PROFILE")
print("=" * 65)

for layer, rows in records.items():
    print(f"\nLAYER: {layer}")

    for prop in properties:
        value = weighted_average(rows, prop)
        print(f"{prop}: {value:.2f}")

    print(f"PH_WATER: {weighted_ph(rows):.2f}")

print("\nTotal depth layers:", len(records))
print("Mapping unit:", TARGET_ID)
