#include <WiFi.h>
#include <HTTPClient.h>

// Wifi credentials
const char* WIFI_SSID = "Richardson";
const char* WIFI_PASS = "Mulbah2003";

// API endpoint URL
const char* API_BASE = " http://192.168.1.10:3000"; // e.g., http://192.168.1.10:3000 or https://yourdomain

// Device registration data
const char* DEVICE_ID = "68975ab0e1f66144708c621a";
const char* DEVICE_SECRET = "x76pyg5oo3gpcjoxf4mbmy4x149ci7av";
// const char* DEVICE_SECRET = "COPY_FROM_WEB_AFTER_REGISTER";

// Pin assignments
const int PIN_SENSOR = 34; // Soil moisture sensor output pin
const int PIN_PUMP = 26; // Relay pin for pump control

// Last time we posted telemetry data (in millis)
unsigned long lastPost = 0;

// Current pump state
bool pumpOn = false;

// Calibration setting for moisture threshold
int threshold = 35;

// Read the soil moisture sensor and map it to a percentage
int readMoisturePercent() {
  int raw = analogRead(PIN_SENSOR);
  int dry = 3000; // adjust this for your sensor
  int wet = 1200; // adjust this for your sensor
  int pct = map(raw, dry, wet, 0, 100);
  if (pct < 0) pct = 0; // clip to 0-100
  if (pct > 100) pct = 100;
  return pct;
}

void setup() {
  pinMode(PIN_PUMP, OUTPUT); // set pump pin to output
  digitalWrite(PIN_PUMP, LOW); // turn pump off at start
  analogReadResolution(12); // set ADC resolution to 12 bits (0-4095)
  Serial.begin(115200); // start serial console
  WiFi.mode(WIFI_STA); // set wifi mode to station
  WiFi.begin(WIFI_SSID, WIFI_PASS); // connect to wifi network
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); } // wait until connected
  Serial.println("WiFi connected");
}

void loop() {
  unsigned long now = millis();

  // Poll for pending actions every 3 seconds
  if (now % 3000 < 50) {
    // If wifi is connected, fetch pending actions
    if (WiFi.status() == WL_CONNECTED) {
      // Create an HTTP client
      HTTPClient http;
      // Construct the URL for the pending actions endpoint
      String url = String(API_BASE) + "/api/actions/pending?deviceId=" + DEVICE_ID + "&secret=" + DEVICE_SECRET;
      // Start the request
      http.begin(url);
      // Send the request and get the response code
      int code = http.GET();
      // If the response code was 200 (OK), parse the response
      if (code == 200) {
        // Get the response body as a string
        String payload = http.getString();
        // Use a very simple parsing technique to find the "pump" action
        if (payload.indexOf("\"action\":\"pump\"") >= 0) {
          // Find the "state" value, which is a boolean indicating whether the pump should be on or off
          bool next = payload.indexOf("\"state\":true") >= 0;
          // Update the pump state
          pumpOn = next;
          // Update the physical state of the pump
          digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW);
        }
        // Find the "lowThreshold" value, which is an integer indicating the moisture threshold
        int calPos = payload.indexOf("lowThreshold");
        if (calPos >= 0) {
          // Find the value after the key
          int start = payload.indexOf(":", calPos);
          int end = payload.indexOf("}", start);
          // If the value is a valid integer between 0 and 100, update the threshold
          if (start > 0 && end > start) {
            int val = payload.substring(start + 1, end).toInt();
            if (val >= 0 && val <= 100) threshold = val;
          }
        }
      }
      // Release the HTTP client
      http.end();
    }
  }

  // Telemetry every 5 seconds
  if (now - lastPost > 5000) {
    lastPost = now;

    int moisture = readMoisturePercent();

    // Auto-watering local logic
    if (moisture < threshold && !pumpOn) { pumpOn = true; digitalWrite(PIN_PUMP, HIGH); }
    else if (moisture >= threshold && pumpOn) { pumpOn = false; digitalWrite(PIN_PUMP, LOW); }

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      String url = String(API_BASE) + "/api/telemetry/ingest";
      http.begin(url);
      http.addHeader("Content-Type", "application/json");
      String body = String("{\"deviceId\":\"") + DEVICE_ID + "\",\"secret\":\"" + DEVICE_SECRET + "\",\"moisture\":" + moisture + ",\"pumpOn\":" + (pumpOn ? "true" : "false") + "}";
      int code = http.POST(body);
      String res = http.getString();
      Serial.printf("POST %d %s\n", code, res.c_str());
      http.end();
    }
  }

  delay(50);
}
