#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// ====== WiFi credentials ======
const char* WIFI_SSID = "CANALBOX-6049-2G";
const char* WIFI_PASS = "3yu57B7Mmw";

// ====== API endpoint URL ======
const char* API_BASE = "http://192.168.1.70:3000";

// ====== Device registration data ======
const char* DEVICE_ID = "689b5208a194b51f4c69e62f";
const char* DEVICE_SECRET = "ta7q5s5t2uonmf3alci1lkpnzroqqhgs";

// ====== Pin assignments ======
const int PIN_SENSOR = A0;   // ADC pin
const int PIN_PUMP   = 4;    // GPIO4 (D2)
const int PIN_LED    = 5;    // GPIO5 (D1)

// ====== Timing ======
unsigned long lastPost = 0;

// ====== State variables ======
bool pumpOn = false;
int threshold = 350; // Raw value threshold for dryness (adjust after calibration)


// ====== Read soil moisture as percentage ======
int readMoistureRaw() {
  int raw = analogRead(PIN_SENSOR); // Read raw value from sensor (0-1023)
  return raw;
}

int readMoisturePercent() {
  const int dry = 350;  // Calibrate for your sensor's dry value
  const int wet = 150;  // Calibrate for your sensor's wet value

  int raw = readMoistureRaw();

  // Map raw value to percentage (invert if needed)
  int pct = map(raw, dry, wet, 0, 100);

  // Clamp the value between 0% and 100%
  pct = constrain(pct, 0, 100);

  return pct;
}

// ====== Setup ======
void setup() {
  Serial.begin(115200);

  pinMode(PIN_PUMP, OUTPUT);
  pinMode(PIN_LED, OUTPUT);

  digitalWrite(PIN_PUMP, LOW);
  // digitalWrite(PIN_LED, LOW);

  // Wi-Fi connection
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long startAttemptTime = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 15000) {
    Serial.print(".");
    delay(500);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\nFailed to connect to WiFi. Check SSID/password or 2.4GHz setting.");
  }
}

// ====== Main Loop ======
void loop() {
  unsigned long now = millis();

  // ====== Poll for actions every 3s ======
  if (now % 3000 < 50) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      WiFiClient client;
      String url = String(API_BASE) + "/api/actions/pending?deviceId=" + DEVICE_ID + "&secret=" + DEVICE_SECRET;

      http.begin(client, url);
      int code = http.GET();

      if (code == 200) {
        String payload = http.getString();

        // Pump control from server
        if (payload.indexOf("\"action\":\"pump\"") >= 0) {
          bool next = payload.indexOf("\"state\":true") >= 0;
          pumpOn = next;
          digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW);
          digitalWrite(PIN_LED, pumpOn ? HIGH : LOW); // LED mirrors pump state here
        }

        // Update threshold if received
        int calPos = payload.indexOf("lowThreshold");
        if (calPos >= 0) {
          int start = payload.indexOf(":", calPos);
          int end = payload.indexOf("}", start);
          if (start > 0 && end > start) {
            int val = payload.substring(start + 1, end).toInt();
            if (val >= 0 && val <= 1023) threshold = val; // now raw value range
          }
        }
      }
      http.end();
    }
  }

  // ====== Send telemetry every 5s ======
  if (now - lastPost > 5000) {
    lastPost = now;

    int rawValue = analogRead(PIN_SENSOR);
    int moisture = readMoisturePercent();    // Converted to %

  // Print both values to Serial Monitor
    Serial.print("Raw Sensor Value: ");
    Serial.print(rawValue);
    Serial.print(" | Moisture: ");
    Serial.print(moisture);
    Serial.println("%");

    // Print for debugging
    Serial.print("Raw Sensor Value: ");
    Serial.println(rawValue);

    // LED & pump control based on dryness
    if (rawValue < threshold && !pumpOn) { 
      pumpOn = true;
      digitalWrite(PIN_PUMP, HIGH);
      digitalWrite(PIN_LED, HIGH); // LED ON for dryness
    } 
    else if (rawValue >= threshold && pumpOn) { 
      pumpOn = false;
      digitalWrite(PIN_PUMP, LOW);
      digitalWrite(PIN_LED, LOW); // LED OFF for moist soil
    }

    // Send raw value to API
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      WiFiClient client;
      String url = String(API_BASE) + "/api/telemetry/ingest";
      http.begin(client, url);
      http.addHeader("Content-Type", "application/json");

      String body = String("{\"deviceId\":\"") + DEVICE_ID +
                    "\",\"secret\":\"" + DEVICE_SECRET +
                    "\",\"moisture\":" + rawValue +   // Sending raw value now
                    ",\"pumpOn\":" + (pumpOn ? "true" : "false") + "}";

      int code = http.POST(body);
      String res = http.getString();
      Serial.printf("POST %d %s\n", code, res.c_str());

      http.end();
    }
  }

  delay(50);
}


