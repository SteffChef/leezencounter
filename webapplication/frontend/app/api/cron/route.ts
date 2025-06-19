import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Get TTN API configuration
    const ttnApiUrl =
      process.env.TTN_API_URL ||
      "https://eu1.cloud.thethings.network/api/v3/as/applications/leezencounter/packages/storage/uplink_message";
    const ttnApiKey = process.env.TTN_API_KEY;
    const timeFrame = process.env.TTN_TIME_FRAME || "48h";

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
        console.error(
          `Failed to parse line ${i}: ${lines[i].substring(0, 50)}...`
        );
      }
    }

    console.log(`Successfully parsed ${jsonObjects.length} JSON objects`);

    // Process the objects
    const processedData = jsonObjects.map((item) => {
      // Handle the case where the result might be structured differently
      const result = item.result || item;

      if (result.uplink_message && result.uplink_message.decoded_payload) {
        return {
          device_id: result.end_device_ids?.device_id,
          received_at: result.received_at,
          ...result.uplink_message.decoded_payload,
        };
      }
      return item; // Return the original item if it doesn't match the expected structure
    });

    // Return the processed data
    return NextResponse.json({
      message: `Successfully processed ${processedData.length} TTN records`,
      data: processedData,
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
