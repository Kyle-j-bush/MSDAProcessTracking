# COMMAND ----------
# WIDGETS CONFIGURATION
# Set these widgets in your Databricks Notebook environment.
dbutils.widgets.text("bucket_name", "", "S3 Bucket Name")

# Only get the value if we are running in Databricks (avoids local errors if testing locally without dbutils)
try:
    bucket_name = dbutils.widgets.get("bucket_name")
except:
    bucket_name = "REPLACE_WITH_YOUR_BUCKET_NAME"

if not bucket_name or bucket_name == "REPLACE_WITH_YOUR_BUCKET_NAME":
    print("WARNING: Please set the 'bucket_name' widget or update the variable.")

print(f"Using Bucket: {bucket_name}")

# COMMAND ----------

from pyspark.sql.types import StructType, StructField, StringType, DoubleType

# 1. Define Paths dynamically
schema_location = f"s3://{bucket_name}/schema/senior_design_project/"
checkpoint_location = f"s3://{bucket_name}/checkpoints/senior_design_project/"
source_path = f"s3://{bucket_name}/"

# 2. Define Schema
schema = StructType([
    StructField("id", StringType(), True),
    StructField("process_id", StringType(), True),
    StructField("process_name", StringType(), True),
    StructField("person_name", StringType(), True),
    StructField("status", StringType(), True),
    StructField("duration", DoubleType(), True),
    StructField("start_timestamp", StringType(), True),
    StructField("end_timestamp", StringType(), True),
    # Include metadata field that exists in the JSON
    StructField("_metadata", StructType([
        StructField("ingested_at", StringType(), True)
    ]), True)
])

# 3. Bronze Layer: Ingest Raw Data
# using cloudFiles (Auto Loader)
df_bronze = (spark.readStream
    .format("cloudFiles")
    .option("cloudFiles.format", "json")
    .option("cloudFiles.schemaLocation", schema_location)
    # CRITICAL FIX: Only read JSON files. 
    # Without this, Spark ingests its own checkpoint/schema files (infinite loop of nulls).
    .option("pathGlobFilter", "*.json") 
    .schema(schema)  # Enforce the schema we defined
    .load(source_path)
)

# 4. Validation
# If you are seeing nulls, check _rescued_data to see the raw invalid JSON
# display(df_bronze.select("_rescued_data", "*").filter("_rescued_data IS NOT NULL"))

# 5. Write to Bronze Table
(df_bronze.writeStream
    .option("checkpointLocation", checkpoint_location)
    .option("mergeSchema", "true")
    .trigger(availableNow=True) # Process all available data then stop (Batch mode). Use processingTime='1 minute' for continuous.
    .toTable("wabash_wood_works.bronze.ProcessTable")
)
