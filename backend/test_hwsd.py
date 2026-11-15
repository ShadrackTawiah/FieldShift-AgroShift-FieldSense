
from app.hwsd_service import get_hwsd_soil_data

result = get_hwsd_soil_data(
    latitude=4.90,
    longitude=-1.75,
)

print("\nHWSD SOIL SERVICE TEST")
print("=" * 60)
print("Available:", result["available"])
print("Mapping unit:", result.get("mapping_unit_id"))
print("Source:", result.get("source"))
print("Message:", result["message"])

if result["available"]:
    print("\nSOIL PROFILE")

    for layer in result["profile"]:
        print(
            f"\n{layer['layer']} "
            f"({layer['top_depth_cm']}-{layer['bottom_depth_cm']} cm)"
        )
        print("Sand:", layer["sand_percent"], "%")
        print("Silt:", layer["silt_percent"], "%")
        print("Clay:", layer["clay_percent"], "%")
        print("Organic carbon:", layer["organic_carbon_percent"], "%")
        print("pH:", layer["ph_water"])
        print("Bulk density:", layer["bulk_density_g_cm3"], "g/cm3")
        print("CEC:", layer["cec_cmolc_kg"], "cmolc/kg")
        print("Total nitrogen:", layer["total_nitrogen_g_kg"], "g/kg")
