# COMMAND ----------
# MAGIC %md
# MAGIC # RESET SCRIPT
# MAGIC **WARNING**: This will delete all your ingested data in the Bronze table and the checkpoint history.
# MAGIC Use this when you want to start fresh (e.g., after fixing a schema).
# MAGIC
# MAGIC **Instructions**:
# MAGIC 1. Run this cell/script ONCE.
# MAGIC 2. Go back to your Ingestion Script and run it.

# COMMAND ----------
# WIDGETS CONFIGURATION
dbutils.widgets.text("bucket_name", "", "S3 Bucket Name")

try:
    bucket_name = dbutils.widgets.get("bucket_name")
except:
    bucket_name = "REPLACE_WITH_YOUR_BUCKET_NAME"

if not bucket_name or bucket_name == "REPLACE_WITH_YOUR_BUCKET_NAME":
    print("WARNING: Please set the 'bucket_name' widget or update the variable.")
    
print(f"RESETTING Environment for Bucket: {bucket_name}")

# Define Dynamic Paths
checkpoint_location = f"s3://{bucket_name}/checkpoints/senior_design_project/"
schema_location = f"s3://{bucket_name}/schema/senior_design_project/"

# COMMAND ----------

# 1. Clean up Checkpoints (The memory of what has been processed)
# If you don't delete this, Spark will remember it already "saw" the files and won't re-process them.
dbutils.fs.rm(checkpoint_location, True)

# OPTIONAL: If you want to re-process schema inference as well
dbutils.fs.rm(schema_location, True)

# 2. Drop the Table (The stored bad data)
spark.sql("DROP TABLE IF EXISTS wabash_wood_works.bronze.ProcessTable")

print("Reset Complete. You can now run the Ingestion Script.")
