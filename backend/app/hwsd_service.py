
from pathlib import Path
from functools import lru_cache
import math
import os
import threading

import boto3
import rasterio

from botocore.config import Config
from access_parser import AccessParser
from dotenv import load_dotenv


# --------------------------------------------------
# DATASET FILE LOCATIONS
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from backend/.env
load_dotenv(BASE_DIR / ".env")

DATA_DIR = BASE_DIR / "data" / "hwsd"

RASTER_PATH = DATA_DIR / "HWSD2.bil"
DATABASE_PATH = DATA_DIR / "HWSD2.mdb"

NODATA_VALUE = 65535


# --------------------------------------------------
# CLOUDFLARE R2 CONFIGURATION
# --------------------------------------------------

R2_ENDPOINT = os.getenv(
    "R2_ENDPOINT_URL",
    "https://357f9a99fcd85339a9413954349878e9.r2.cloudflarestorage.com"
)

R2_BUCKET = os.getenv(
    "R2_BUCKET_NAME",
    "fieldshift-hwsd"
)

DATASET_FILES = [
    "HWSD2.bil",
    "HWSD2.hdr",
    "HWSD2.mdb",
    "HWSD2.prj",
    "HWSD2.stx",
]

_download_lock = threading.Lock()


def get_r2_client():

    access_key = os.getenv("R2_ACCESS_KEY_ID")
    secret_key = os.getenv("R2_SECRET_ACCESS_KEY")

    if not access_key or not secret_key:
        raise RuntimeError(
            "R2 credentials are missing. Configure "
            "R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY."
        )

    return boto3.client(
        "s3",
        endpoint_url=R2_ENDPOINT,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            retries={
                "max_attempts": 5,
                "mode": "standard",
            },
        ),
    )


# --------------------------------------------------
# AUTOMATICALLY DOWNLOAD HWSD DATASET FROM R2
# --------------------------------------------------

def ensure_hwsd_dataset():

    DATA_DIR.mkdir(parents=True, exist_ok=True)

    with _download_lock:

        client = get_r2_client()

        for filename in DATASET_FILES:

            destination = DATA_DIR / filename
            temporary_file = DATA_DIR / f"{filename}.part"

            try:

                response = client.head_object(
                    Bucket=R2_BUCKET,
                    Key=filename,
                )

                expected_size = response["ContentLength"]

                # Skip downloading if the existing file
                # has exactly the expected size.
                if (
                    destination.is_file()
                    and destination.stat().st_size == expected_size
                ):
                    continue

                print(
                    f"Downloading {filename}: "
                    f"{expected_size:,} bytes"
                )

                if temporary_file.exists():
                    temporary_file.unlink()

                client.download_file(
                    R2_BUCKET,
                    filename,
                    str(temporary_file),
                )

                actual_size = temporary_file.stat().st_size

                if actual_size != expected_size:
                    raise IOError(
                        f"Incomplete download of {filename}. "
                        f"Expected {expected_size} bytes, "
                        f"received {actual_size} bytes."
                    )

                os.replace(
                    temporary_file,
                    destination,
                )

                print(f"Downloaded successfully: {filename}")

            except Exception:

                if temporary_file.exists():
                    temporary_file.unlink()

                raise

        print("HWSD dataset is ready.")


# --------------------------------------------------
# SAFELY CONVERT DATABASE VALUES TO NUMBERS
# --------------------------------------------------

def safe_float(value):

    if value is None:
        return None

    try:
        number = float(value)

        if not math.isfinite(number):
            return None

        return number

    except (TypeError, ValueError):
        return None


# --------------------------------------------------
# LOAD AND INDEX THE HWSD DATABASE
# --------------------------------------------------

@lru_cache(maxsize=1)
def load_hwsd_database():

    ensure_hwsd_dataset()

    if not DATABASE_PATH.exists():
        raise FileNotFoundError(
            f"HWSD database not found: {DATABASE_PATH}"
        )

    db = AccessParser(str(DATABASE_PATH))

    table = db.get_table("HWSD2_LAYERS")
    data = table.parse()

    indexed_data = {}

    required_fields = [
        "HWSD2_SMU_ID",
        "SEQUENCE",
        "SHARE",
        "LAYER",
        "TOPDEP",
        "BOTDEP",
        "SAND",
        "SILT",
        "CLAY",
        "ORG_CARBON",
        "PH_WATER",
        "BULK",
        "CEC_SOIL",
        "TOTAL_N",
    ]

    for field in required_fields:
        if field not in data:
            raise ValueError(
                f"Missing HWSD database field: {field}"
            )

    record_count = len(data["HWSD2_SMU_ID"])

    for i in range(record_count):

        mapping_value = safe_float(
            data["HWSD2_SMU_ID"][i]
        )

        if mapping_value is None:
            continue

        mapping_id = int(mapping_value)

        row = {
            "sequence": safe_float(data["SEQUENCE"][i]),
            "share": safe_float(data["SHARE"][i]),
            "layer": str(data["LAYER"][i]),
            "top_depth": safe_float(data["TOPDEP"][i]),
            "bottom_depth": safe_float(data["BOTDEP"][i]),
            "sand": safe_float(data["SAND"][i]),
            "silt": safe_float(data["SILT"][i]),
            "clay": safe_float(data["CLAY"][i]),
            "organic_carbon": safe_float(data["ORG_CARBON"][i]),
            "ph": safe_float(data["PH_WATER"][i]),
            "bulk_density": safe_float(data["BULK"][i]),
            "cec": safe_float(data["CEC_SOIL"][i]),
            "total_nitrogen": safe_float(data["TOTAL_N"][i]),
        }

        if row["share"] is None or row["share"] <= 0:
            continue

        indexed_data.setdefault(
            mapping_id, []
        ).append(row)

    return indexed_data


# --------------------------------------------------
# FIND THE SOIL MAPPING UNIT FOR A COORDINATE
# --------------------------------------------------

def get_mapping_unit(latitude, longitude):

    ensure_hwsd_dataset()

    if not RASTER_PATH.exists():
        raise FileNotFoundError(
            f"HWSD raster not found: {RASTER_PATH}"
        )

    with rasterio.open(RASTER_PATH) as raster:

        row, col = raster.index(longitude, latitude)

        if (
            row < 0
            or col < 0
            or row >= raster.height
            or col >= raster.width
        ):
            return None

        window = rasterio.windows.Window(
            col,
            row,
            1,
            1,
        )

        value = raster.read(
            1,
            window=window
        )[0, 0]

        mapping_id = int(value)

        if mapping_id == NODATA_VALUE:
            return None

        return mapping_id


# --------------------------------------------------
# WEIGHTED SOIL CALCULATIONS
# --------------------------------------------------

def weighted_average(rows, field):

    valid_rows = [
        row for row in rows
        if row[field] is not None
    ]

    total_share = sum(
        row["share"] for row in valid_rows
    )

    if total_share <= 0:
        return None

    result = sum(
        row[field] * row["share"]
        for row in valid_rows
    ) / total_share

    return round(result, 2)


def weighted_ph(rows):

    valid_rows = [
        row for row in rows
        if row["ph"] is not None
    ]

    total_share = sum(
        row["share"] for row in valid_rows
    )

    if total_share <= 0:
        return None

    acidity = sum(
        (10 ** (-row["ph"])) * row["share"]
        for row in valid_rows
    ) / total_share

    return round(-math.log10(acidity), 2)


# --------------------------------------------------
# BUILD THE SEVEN-LAYER SOIL PROFILE
# --------------------------------------------------

def build_soil_profile(mapping_id):

    database = load_hwsd_database()

    records = database.get(mapping_id)

    if not records:
        return None

    grouped_layers = {}

    for row in records:

        layer_name = row["layer"]

        grouped_layers.setdefault(
            layer_name,
            []
        ).append(row)

    profile = []

    layer_order = [
        "D1", "D2", "D3", "D4",
        "D5", "D6", "D7",
    ]

    for layer_name in layer_order:

        rows = grouped_layers.get(layer_name)

        if not rows:
            continue

        profile.append({
            "layer": layer_name,

            "top_depth_cm": int(rows[0]["top_depth"]),
            "bottom_depth_cm": int(rows[0]["bottom_depth"]),

            "sand_percent": weighted_average(
                rows, "sand"
            ),

            "silt_percent": weighted_average(
                rows, "silt"
            ),

            "clay_percent": weighted_average(
                rows, "clay"
            ),

            "organic_carbon_percent": weighted_average(
                rows, "organic_carbon"
            ),

            "ph_water": weighted_ph(rows),

            "bulk_density_g_cm3": weighted_average(
                rows, "bulk_density"
            ),

            "cec_cmolc_kg": weighted_average(
                rows, "cec"
            ),

            "total_nitrogen_g_kg": weighted_average(
                rows, "total_nitrogen"
            ),
        })

    return profile


# --------------------------------------------------
# MAIN SOIL LOOKUP FUNCTION
# --------------------------------------------------

def get_hwsd_soil_data(latitude, longitude):

    mapping_id = get_mapping_unit(
        latitude,
        longitude,
    )

    if mapping_id is None:
        return {
            "available": False,
            "message": (
                "No HWSD soil mapping unit was found "
                "at these coordinates."
            ),
        }

    profile = build_soil_profile(mapping_id)

    if not profile:
        return {
            "available": False,
            "mapping_unit_id": mapping_id,
            "message": (
                "No matching soil profile was found "
                "in the HWSD database."
            ),
        }

    return {
        "available": True,

        "source": (
            "FAO Harmonized World Soil Database v2.0"
        ),

        "dataset_version": "2.0",

        "spatial_resolution": "Approximately 1 km",

        "data_type": (
            "Soil mapping-unit weighted estimates"
        ),

        "mapping_unit_id": mapping_id,

        "location": {
            "latitude": latitude,
            "longitude": longitude,
        },

        "profile": profile,

        "message": "Soil profile retrieved successfully.",
    }
