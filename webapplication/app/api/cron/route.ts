import { NextResponse } from "next/server";
import { Pool } from "pg";
import { ProcessedDataItem } from "@/types";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function GET() {
  try {
    // Get TTN API configuration
    const ttnApiUrl =
      process.env.TTN_API_URL ||
      "https://eu1.cloud.thethings.network/api/v3/as/applications/leezencounter/packages/storage/uplink_message";
    const ttnApiKey = process.env.TTN_API_KEY;
    const timeFrame = process.env.TTN_TIME_FRAME || "36h";

    // Check if API key exists
    if (!ttnApiKey) {
      console.log("Missing TTN API key");
      return NextResponse.json(
        { error: "TTN API key missing" },
        { status: 400 }
      );
    }

    console.log("Fetching data from TTN API with timeframe:", timeFrame);

    // Construct URL with query parameters
    const url = new URL(ttnApiUrl);
    url.searchParams.append("last", timeFrame);

    // Fetch data from TTN
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${ttnApiKey}`,
        Accept: "application/json",
      },
    });

    // Log HTTP response status
    console.log("TTN API response status:", response.status);

    if (!response.ok) {
      // Get error details
      const errorText = await response.text();
      console.error("TTN API error:", errorText);
      return NextResponse.json(
        { error: `TTN API returned ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    // Get raw text first
    const rawText = await response.text();
    console.log(`Received response of length: ${rawText.length}`);

    // Debug: Check the first part of the response
    console.log("Response start:", rawText.substring(0, 200));

    // The response might be multiple JSON objects separated by newlines
    // Let's try to parse each line separately
    const jsonObjects = [];
    const lines = rawText.split("\n").filter((line) => line.trim().length > 0);

    console.log(`Found ${lines.length} non-empty lines in response`);

    for (let i = 0; i < lines.length; i++) {
      try {
        const parsedObj = JSON.parse(lines[i]);
        jsonObjects.push(parsedObj);
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        console.error(
          `Failed to parse line ${i}: ${lines[i].substring(0, 50)}... Error: ${
            error.message
          }`
        );
      }
    }

    console.log(`Successfully parsed ${jsonObjects.length} JSON objects`);

    // Process the objects
    const processedData: ProcessedDataItem[] = jsonObjects.map((item) => {
      // Handle the case where the result might be structured differently
      const result = item.result || item;

      if (result.uplink_message && result.uplink_message.decoded_payload) {
        return {
          device_id: result.end_device_ids?.device_id || "unknown-device",
          received_at: result.received_at,
          ...result.uplink_message.decoded_payload,
        };
      }
      return item; // Return the original item if it doesn't match the expected structure
    });

    console.log(`Processed ${processedData.length} data items`);

    // Validate and filter out invalid records
    const validData = processedData.filter((item) => {
      const isValid =
        item.device_id &&
        item.received_at &&
        item.location &&
        item.timestamp &&
        typeof item.total_detected === "number" &&
        Array.isArray(item.predictions);

      if (!isValid) {
        console.warn(`Skipping invalid data item:`, {
          device_id: item.device_id,
          received_at: item.received_at,
          location: item.location,
          timestamp: item.timestamp,
          total_detected: item.total_detected,
          predictions: Array.isArray(item.predictions)
            ? `array[${item.predictions.length}]`
            : item.predictions,
        });
      }

      return isValid;
    });

    console.log(
      `Filtered to ${validData.length} valid data items (${
        processedData.length - validData.length
      } invalid items skipped)`
    );

    // Save to database using optimized bulk operations
    let savedCount = 0;

    if (validData.length > 0) {
      try {
        // First, check which records already exist to avoid conflicts
        const existingRecordsQuery = `
          SELECT device_id, received_at 
          FROM ttn_data 
          WHERE (device_id, received_at) = ANY($1)
        `;

        const deviceTimeKeys = validData.map((item) => [
          item.device_id,
          item.received_at,
        ]);
        const existingResult = await pool.query(existingRecordsQuery, [
          deviceTimeKeys,
        ]);

        // Create a Set of existing keys for fast lookup
        const existingKeys = new Set(
          existingResult.rows.map(
            (row) => `${row.device_id}|${row.received_at}`
          )
        );

        // Filter out records that already exist
        const newRecords = validData.filter(
          (item) => !existingKeys.has(`${item.device_id}|${item.received_at}`)
        );

        const existingRecords = validData.filter((item) =>
          existingKeys.has(`${item.device_id}|${item.received_at}`)
        );

        console.log(
          `Found ${newRecords.length} new records and ${existingRecords.length} existing records`
        );

        // Bulk insert only new records (no conflicts)
        if (newRecords.length > 0) {
          const values = newRecords
            .map((_, index) => {
              const baseIndex = index * 7;
              return `($${baseIndex + 1}, $${baseIndex + 2}, $${
                baseIndex + 3
              }, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6}, $${
                baseIndex + 7
              })`;
            })
            .join(", ");

          const insertQuery = `
            INSERT INTO ttn_data (
              device_id, 
              received_at, 
              confidence_threshold, 
              location, 
              timestamp, 
              total_detected,
              predictions
            ) VALUES ${values}
          `;

          const queryParams = newRecords.flatMap((dataItem) => [
            dataItem.device_id,
            dataItem.received_at,
            0.5, // confidence_threshold
            dataItem.location,
            dataItem.timestamp,
            dataItem.total_detected,
            JSON.stringify(dataItem.predictions),
          ]);

          await pool.query(insertQuery, queryParams);
          savedCount += newRecords.length;
          console.log(`Bulk inserted ${newRecords.length} new records`);
        }

        // Update existing records if needed (optional - you might want to skip this)
        if (existingRecords.length > 0) {
          console.log(`Updating ${existingRecords.length} existing records`);

          for (const dataItem of existingRecords) {
            try {
              const updateQuery = `
                UPDATE ttn_data SET 
                  confidence_threshold = $3,
                  location = $4,
                  timestamp = $5,
                  total_detected = $6,
                  predictions = $7,
                  updated_at = CURRENT_TIMESTAMP
                WHERE device_id = $1 AND received_at = $2
              `;

              await pool.query(updateQuery, [
                dataItem.device_id,
                dataItem.received_at,
                0.5,
                dataItem.location,
                dataItem.timestamp,
                dataItem.total_detected,
                JSON.stringify(dataItem.predictions),
              ]);

              savedCount++;
            } catch (updateError) {
              console.error(
                `Failed to update record for device ${dataItem.device_id}:`,
                updateError
              );
            }
          }
        }
      } catch (dbError) {
        console.error(
          "Optimized database operation failed, falling back to individual upserts:",
          dbError
        );

        // Fallback to individual upserts if the optimized approach fails
        for (const dataItem of validData) {
          try {
            const upsertQuery = `
              INSERT INTO ttn_data (
                device_id, 
                received_at, 
                confidence_threshold, 
                location, 
                timestamp, 
                total_detected,
                predictions
              ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              ON CONFLICT (device_id, received_at) 
              DO UPDATE SET 
                confidence_threshold = EXCLUDED.confidence_threshold,
                location = EXCLUDED.location,
                timestamp = EXCLUDED.timestamp,
                total_detected = EXCLUDED.total_detected,
                predictions = EXCLUDED.predictions,
                updated_at = CURRENT_TIMESTAMP
            `;

            await pool.query(upsertQuery, [
              dataItem.device_id,
              dataItem.received_at,
              0.5,
              dataItem.location,
              dataItem.timestamp,
              dataItem.total_detected,
              JSON.stringify(dataItem.predictions),
            ]);

            savedCount++;
          } catch (individualError) {
            console.error(
              `Failed to save data item for device ${dataItem.device_id}:`,
              individualError
            );
          }
        }
      }
    }

    console.log(
      `Successfully processed ${savedCount} out of ${validData.length} valid records (${processedData.length} total processed)`
    );

    // Return the processed data
    return NextResponse.json({
      message: `Successfully processed ${processedData.length} TTN records (${validData.length} valid) and saved ${savedCount} to database`,
      data: validData,
      savedCount,
      totalProcessed: processedData.length,
      validRecords: validData.length,
      invalidRecords: processedData.length - validData.length,
      // Include the first JSON object for reference
      sampleObject: jsonObjects.length > 0 ? jsonObjects[0] : null,
    });
  } catch (error) {
    console.error("Error fetching TTN data:", error);
    return NextResponse.json(
      { error: "Failed to fetch TTN data", details: String(error) },
      { status: 500 }
    );
  }
}
