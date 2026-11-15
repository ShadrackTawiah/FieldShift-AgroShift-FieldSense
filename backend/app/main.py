
from datetime import date, timedelta
import asyncio

import httpx
import numpy as np

from pyproj import Transformer
from rasterio.io import MemoryFile

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from app.hwsd_service import get_hwsd_soil_data

app = FastAPI(
    title="FieldShift API",
    description="Agricultural intelligence powered by NASA Earth observation data.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# NASA POWER CONFIGURATION
# =========================================================

NASA_POWER_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)

NASA_PARAMETERS = [
    "T2M",
    "PRECTOTCORR",
    "RH2M",
    "ALLSKY_SFC_SW_DWN",
]


# =========================================================
# SOILGRIDS CONFIGURATION
# =========================================================

SOILGRIDS_BASE_URL = "https://maps.isric.org/mapserv"

SOILGRIDS_CRS = (
    "http://www.opengis.net/def/crs/EPSG/0/54009"
)

# Convert longitude/latitude into the projection
# used by our successful SoilGrids browser test.
WGS84_TO_SOILGRIDS = Transformer.from_crs(
    "EPSG:4326",
    "ESRI:54009",
    always_xy=True,
)

# Request a 2 km x 2 km area around the farm.
SOILGRIDS_HALF_SIZE_METERS = 1000

SOIL_PROPERTIES = {
    "phh2o": {
        "name": "Soil pH",
        "unit": "pH",
        "scale": 10,
    },
    "soc": {
        "name": "Organic Carbon",
        "unit": "g/kg",
        "scale": 10,
    },
    "clay": {
        "name": "Clay Content",
        "unit": "%",
        "scale": 10,
    },
    "sand": {
        "name": "Sand Content",
        "unit": "%",
        "scale": 10,
    },
    "cec": {
        "name": "Cation Exchange Capacity",
        "unit": "cmol(+)/kg",
        "scale": 10,
    },
}


# =========================================================
# HOME ENDPOINT
# =========================================================

@app.get("/")
async def home():
    return {
        "application": "FieldShift",
        "description": "NASA-powered agricultural intelligence",
        "status": "running",
    }


# =========================================================
# NASA POWER CLIMATE ENDPOINT
# =========================================================

@app.get("/api/climate/power")
async def get_nasa_climate(
    latitude: float = Query(4.90, ge=-90, le=90),
    longitude: float = Query(-1.75, ge=-180, le=180),
    days: int = Query(30, ge=7, le=365),
):

    end_date = date.today() - timedelta(days=1)
    start_date = end_date - timedelta(days=days - 1)

    params = {
        "parameters": ",".join(NASA_PARAMETERS),
        "community": "AG",
        "longitude": longitude,
        "latitude": latitude,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON",
        "time-standard": "UTC",
    }

    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.get(
                NASA_POWER_URL,
                params=params,
            )

            response.raise_for_status()
            nasa_data = response.json()

        parameters = (
            nasa_data.get("properties", {})
            .get("parameter", {})
        )

        if not parameters:
            raise HTTPException(
                status_code=502,
                detail="NASA POWER returned no climate parameters.",
            )

        return {
            "success": True,
            "source": "NASA POWER",
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "period": {
                "start": start_date.isoformat(),
                "end": end_date.isoformat(),
                "days": days,
            },
            "units": {
                "T2M": "°C",
                "PRECTOTCORR": "mm/day",
                "RH2M": "%",
                "ALLSKY_SFC_SW_DWN": "MJ/m²/day",
            },
            "parameters": parameters,
            "metadata": nasa_data.get("parameters", {}),
        }

    except httpx.HTTPStatusError as error:
        raise HTTPException(
            status_code=502,
            detail=(
                "NASA POWER returned HTTP "
                f"{error.response.status_code}."
            ),
        )

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to NASA POWER. Try again later.",
        )

    except ValueError:
        raise HTTPException(
            status_code=502,
            detail="NASA POWER returned an invalid response.",
        )


# =========================================================
# SOILGRIDS PROPERTY RETRIEVAL
# =========================================================

async def fetch_soil_property(
    client,
    property_id,
    latitude,
    longitude,
):

    property_info = SOIL_PROPERTIES[property_id]

    coverage_id = f"{property_id}_0-5cm_Q0.5"

    try:

        # -------------------------------------------------
        # Convert farm coordinates to SoilGrids projection
        # -------------------------------------------------

        x, y = WGS84_TO_SOILGRIDS.transform(
            longitude,
            latitude,
        )

        # -------------------------------------------------
        # Create a 2 km x 2 km bounding box
        # -------------------------------------------------

        x_min = x - SOILGRIDS_HALF_SIZE_METERS
        x_max = x + SOILGRIDS_HALF_SIZE_METERS

        y_min = y - SOILGRIDS_HALF_SIZE_METERS
        y_max = y + SOILGRIDS_HALF_SIZE_METERS

        # -------------------------------------------------
        # SoilGrids WCS request
        # -------------------------------------------------

        params = [
            ("map", f"/map/{property_id}.map"),
            ("SERVICE", "WCS"),
            ("VERSION", "2.0.1"),
            ("REQUEST", "GetCoverage"),
            ("COVERAGEID", coverage_id),
            ("FORMAT", "GEOTIFF_INT16"),
            ("SUBSET", f"X({x_min},{x_max})"),
            ("SUBSET", f"Y({y_min},{y_max})"),
            ("SUBSETTINGCRS", SOILGRIDS_CRS),
            ("OUTPUTCRS", SOILGRIDS_CRS),
        ]

        response = await client.get(
            SOILGRIDS_BASE_URL,
            params=params,
        )

        response.raise_for_status()

        content = response.content

        # -------------------------------------------------
        # Verify GeoTIFF response
        # -------------------------------------------------

        is_tiff = (
            content.startswith(b"II*\x00")
            or content.startswith(b"MM\x00*")
        )

        if not is_tiff:

            message = content[:500].decode(
                "utf-8",
                errors="replace",
            )

            return {
                "name": property_info["name"],
                "value": None,
                "unit": property_info["unit"],
                "available": False,
                "reason": (
                    "ISRIC returned a non-TIFF response: "
                    + message
                ),
            }

        # -------------------------------------------------
        # Read GeoTIFF in memory
        # -------------------------------------------------

        with MemoryFile(content) as memory_file:

            with memory_file.open() as dataset:

                if dataset.count < 1:
                    raise ValueError(
                        "Soil raster contains no data bands."
                    )

                if dataset.width < 1 or dataset.height < 1:
                    raise ValueError(
                        "Soil raster has invalid dimensions."
                    )

                # Read the centre pixel of the requested area.
                raster = dataset.read(
                    1,
                    masked=True,
                )

                center_row = dataset.height // 2
                center_col = dataset.width // 2

                raw_value = raster[
                    center_row,
                    center_col,
                ]

                # -----------------------------------------
                # Check missing data
                # -----------------------------------------

                if np.ma.is_masked(raw_value):
                    return {
                        "name": property_info["name"],
                        "value": None,
                        "unit": property_info["unit"],
                        "available": False,
                        "reason": (
                            "No soil data at this coordinate."
                        ),
                    }

                raw_value = float(raw_value)

                if (
                    not np.isfinite(raw_value)
                    or raw_value == -32768
                ):
                    return {
                        "name": property_info["name"],
                        "value": None,
                        "unit": property_info["unit"],
                        "available": False,
                        "reason": (
                            "SoilGrids returned an invalid value."
                        ),
                    }

                # -----------------------------------------
                # Convert stored integer to normal units
                # -----------------------------------------

                converted_value = (
                    raw_value / property_info["scale"]
                )

                return {
                    "name": property_info["name"],
                    "value": round(converted_value, 2),
                    "unit": property_info["unit"],
                    "available": True,
                    "reason": None,
                }

    except (
        httpx.HTTPError,
        ValueError,
        OSError,
    ) as error:

        return {
            "name": property_info["name"],
            "value": None,
            "unit": property_info["unit"],
            "available": False,
            "reason": str(error)[:500],
        }


# =========================================================
# SOILGRIDS API ENDPOINT
# =========================================================

@app.get("/api/soil/soilgrids")
async def get_soil_data(
    latitude: float = Query(4.90, ge=-90, le=90),
    longitude: float = Query(-1.75, ge=-180, le=180),
):

    try:

        async with httpx.AsyncClient(
            timeout=120.0
        ) as client:

            tasks = [
                fetch_soil_property(
                    client,
                    property_id,
                    latitude,
                    longitude,
                )
                for property_id in SOIL_PROPERTIES
            ]

            results = await asyncio.gather(*tasks)

        available_count = sum(
            1
            for item in results
            if item["available"]
        )

        # -------------------------------------------------
        # No properties available
        # -------------------------------------------------

        if available_count == 0:
            return {
                "success": False,
                "status": "unavailable",
                "source": "ISRIC SoilGrids",
                "location": {
                    "latitude": latitude,
                    "longitude": longitude,
                },
                "depth": "0-5cm",
                "prediction": "Q0.5 median",
                "spatial_resolution": "250m",
                "properties": results,
                "message": (
                    "SoilGrids did not return usable "
                    "values for this location."
                ),
            }

        # -------------------------------------------------
        # At least one property available
        # -------------------------------------------------

        return {
            "success": True,
            "status": (
                "connected"
                if available_count == len(results)
                else "partial"
            ),
            "source": "ISRIC SoilGrids",
            "location": {
                "latitude": latitude,
                "longitude": longitude,
            },
            "depth": "0-5cm",
            "prediction": "Q0.5 median",
            "spatial_resolution": "250m",
            "data_type": "Modelled soil property estimates",
            "available_properties": available_count,
            "total_properties": len(results),
            "properties": results,
            "message": (
                "Soil properties retrieved from SoilGrids."
            ),
        }

    except httpx.RequestError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to ISRIC SoilGrids.",
        )

# --------------------------------------------------
# FAO HWSD SOIL INTELLIGENCE ENDPOINT
# --------------------------------------------------

@app.get("/api/soil/hwsd")
def get_fao_hwsd_soil(
    latitude: float = Query(..., ge=-90, le=90),
    longitude: float = Query(..., ge=-180, le=180),
):
    try:
        result = get_hwsd_soil_data(
            latitude=latitude,
            longitude=longitude,
        )

        return result

    except FileNotFoundError as error:
        raise HTTPException(
            status_code=500,
            detail=str(error),
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Unable to retrieve FAO soil data: {str(error)}",
        )
