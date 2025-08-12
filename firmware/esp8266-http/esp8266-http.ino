#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>

// ====== WiFi credentials ======
const char* WIFI_SSID = "Richardson";
const char* WIFI_PASS = "Mulbah2003";

// ====== API endpoint URL ======
const char* API_BASE = "http://192.168.1.10:3000"; // Example: http://192.168.1.10:3000

// ====== Device registration data ======
const char* DEVICE_ID = "68978196a4509816f56be68e";
const char* DEVICE_SECRET = "qxboqpjldc1qt906kzwc72g2qc601ea5";

// ====== Pin assignments ======
const int PIN_SENSOR = A0; // Only ADC pin on ESP8266
const int PIN_PUMP = 4;    // GPIO4 = D2 on NodeMCU

// ====== Timing ======
unsigned long lastPost = 0; // Last telemetry post time

// ====== State variables ======
bool pumpOn = false;
int threshold = 35; // Moisture threshold (%)

// ====== Read soil moisture as percentage ======
int readMoisturePercent() {
  int raw = analogRead(PIN_SENSOR); // 0-1023
  int dry = 800; // Calibrate for your sensor
  int wet = 300; // Calibrate for your sensor
  int pct = map(raw, dry, wet, 0, 100);
  if (pct < 0) pct = 0;
  if (pct > 100) pct = 100;
  return pct;
}

void setup() {
  pinMode(PIN_PUMP, OUTPUT);
  digitalWrite(PIN_PUMP, LOW); // Pump off initially

  Serial.begin(115200);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");
}

void loop() {
  unsigned long now = millis();

  // ====== Poll for pending actions every ~3s ======
  if (now % 3000 < 50) {
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      WiFiClient client;
      String url = String(API_BASE) + "/api/actions/pending?deviceId=" + DEVICE_ID + "&secret=" + DEVICE_SECRET;

      http.begin(client, url);
      int code = http.GET();

      if (code == 200) {
        String payload = http.getString();

        // Pump control
        if (payload.indexOf("\"action\":\"pump\"") >= 0) {
          bool next = payload.indexOf("\"state\":true") >= 0;
          pumpOn = next;
          digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW);
        }

        // Update moisture threshold if received
        int calPos = payload.indexOf("lowThreshold");
        if (calPos >= 0) {
          int start = payload.indexOf(":", calPos);
          int end = payload.indexOf("}", start);
          if (start > 0 && end > start) {
            int val = payload.substring(start + 1, end).toInt();
            if (val >= 0 && val <= 100) threshold = val;
          }
        }
      }
      http.end();
    }
  }

  // ====== Send telemetry every 5s ======
  if (now - lastPost > 5000) {
    lastPost = now;

    int moisture = readMoisturePercent();

    // Local auto-watering logic
    if (moisture < threshold && !pumpOn) { pumpOn = true; digitalWrite(PIN_PUMP, HIGH); }
    else if (moisture >= threshold && pumpOn) { pumpOn = false; digitalWrite(PIN_PUMP, LOW); }

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      WiFiClient client;
      String url = String(API_BASE) + "/api/telemetry/ingest";
      http.begin(client, url);
      http.addHeader("Content-Type", "application/json");

      String body = String("{\"deviceId\":\"") + DEVICE_ID +
                    "\",\"secret\":\"" + DEVICE_SECRET +
                    "\",\"moisture\":" + moisture +
                    ",\"pumpOn\":" + (pumpOn ? "true" : "false") + "}";

      int code = http.POST(body);
      String res = http.getString();
      Serial.printf("POST %d %s\n", code, res.c_str());

      http.end();
    }
  }

  delay(50);
}











// #include <ESP8266WiFi.h>
// #include <ESP8266HTTPClient.h>

// // ====== WiFi credentials ======
// const char* WIFI_SSID = "ULK-MASTERS";     // Change to your Wi-Fi name
// const char* WIFI_PASS = "ulk@12345";     // Change to your Wi-Fi password

// // ====== API endpoint URL ======
// const char* API_BASE = "http://192.168.50.165:3000"; // No extra spaces!

// // ====== Device registration data ======
// const char* DEVICE_ID = "689b5208a194b51f4c69e62f";
// const char* DEVICE_SECRET = "ta7q5s5t2uonmf3alci1lkpnzroqqhgs";


// // ====== Pin assignments ======
// const int PIN_SENSOR = A0;   // Only ADC pin on ESP8266
// const int PIN_PUMP   = 4;    // GPIO4 = D2 on NodeMCU
// const int PIN_LED    = 5;    // GPIO5 = D1 on NodeMCU

// // ====== Timing ======
// unsigned long lastPost = 0; // Last telemetry post time

// // ====== State variables ======
// bool pumpOn = false;
// int threshold = 35; // Moisture threshold (%)

// // ====== Read soil moisture as percentage ======
// int readMoisturePercent() {
//   int raw = analogRead(PIN_SENSOR); // 0-1023
//   int dry = 800; // Calibrate for your sensor
//   int wet = 300; // Calibrate for your sensor
//   int pct = map(raw, dry, wet, 0, 100);
//   if (pct < 0) pct = 0;
//   if (pct > 100) pct = 100;
//   return pct;
// }

// void setup() {
//   Serial.begin(115200);

//   pinMode(PIN_PUMP, OUTPUT);
//   pinMode(PIN_LED, OUTPUT);

//   digitalWrite(PIN_PUMP, LOW); // Pump off initially
//   digitalWrite(PIN_LED, LOW);  // LED off initially

//   // ====== Connect to Wi-Fi ======
//   Serial.print("Connecting to WiFi: ");
//   Serial.println(WIFI_SSID);
//   WiFi.mode(WIFI_STA);
//   WiFi.begin(WIFI_SSID, WIFI_PASS);

//   unsigned long startAttemptTime = millis();
//   while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 15000) {
//     Serial.print(".");
//     delay(500);
//   }

//   if (WiFi.status() == WL_CONNECTED) {
//     Serial.println("\nWiFi connected!");
//     Serial.print("IP Address: ");
//     Serial.println(WiFi.localIP());
//   } else {
//     Serial.println("\nFailed to connect to WiFi. Check SSID/password or 2.4GHz setting.");
//   }
// }

// void loop() {
//   unsigned long now = millis();

//   // ====== Poll for pending actions every ~3s ======
//   if (now % 3000 < 50) {
//     if (WiFi.status() == WL_CONNECTED) {
//       HTTPClient http;
//       WiFiClient client;
//       String url = String(API_BASE) + "/api/actions/pending?deviceId=" + DEVICE_ID + "&secret=" + DEVICE_SECRET;

//       http.begin(client, url);
//       int code = http.GET();

//       if (code == 200) {
//         String payload = http.getString();

//         // Pump control
//         if (payload.indexOf("\"action\":\"pump\"") >= 0) {
//           bool next = payload.indexOf("\"state\":true") >= 0;
//           pumpOn = next;
//           digitalWrite(PIN_PUMP, pumpOn ? HIGH : LOW);
//           digitalWrite(PIN_LED, pumpOn ? HIGH : LOW); // LED follows pump
//         }

//         // Update moisture threshold if received
//         int calPos = payload.indexOf("lowThreshold");
//         if (calPos >= 0) {
//           int start = payload.indexOf(":", calPos);
//           int end = payload.indexOf("}", start);
//           if (start > 0 && end > start) {
//             int val = payload.substring(start + 1, end).toInt();
//             if (val >= 0 && val <= 100) threshold = val;
//           }
//         }
//       }
//       http.end();
//     }
//   }

//   // // ====== Send telemetry every 5s ======
//   // if (now - lastPost > 5000) {
//   //   lastPost = now;

//   //   int moisture = readMoisturePercent();

//   //   // Local auto-watering logic
//   //   if (moisture < threshold && !pumpOn) { 
//   //     pumpOn = true; 
//   //     digitalWrite(PIN_PUMP, HIGH); 
//   //     digitalWrite(PIN_LED, HIGH);
//   //   }
//   //   else if (moisture >= threshold && pumpOn) { 
//   //     pumpOn = false; 
//   //     digitalWrite(PIN_PUMP, LOW); 
//   //     digitalWrite(PIN_LED, LOW);
//   //   }

//   //   if (WiFi.status() == WL_CONNECTED) {
//   //     HTTPClient http;
//   //     WiFiClient client;
//   //     String url = String(API_BASE) + "/api/telemetry/ingest";
//   //     http.begin(client, url);
//   //     http.addHeader("Content-Type", "application/json");

//   //     String body = String("{\"deviceId\":\"") + DEVICE_ID +
//   //                   "\",\"secret\":\"" + DEVICE_SECRET +
//   //                   "\",\"moisture\":" + moisture +
//   //                   ",\"pumpOn\":" + (pumpOn ? "true" : "false") + "}";

//   //     int code = http.POST(body);
//   //     String res = http.getString();
//   //     Serial.printf("POST %d %s\n", code, res.c_str());

//   //     http.end();
//   //   }
//   // }


//   // ====== Send telemetry every 5s ======
// if (now - lastPost > 5000) {
//   lastPost = now;

//   int rawValue = analogRead(PIN_SENSOR);   // Raw reading from sensor
//   int moisture = readMoisturePercent();    // Converted to %

//   // Print both values to Serial Monitor
//   Serial.print("Raw Sensor Value: ");
//   Serial.print(rawValue);
//   Serial.print(" | Moisture: ");
//   Serial.print(moisture);
//   Serial.println("%");

//   // Local auto-watering logic
//   if (moisture < threshold && !pumpOn) { 
//     pumpOn = true; 
//     digitalWrite(PIN_PUMP, HIGH); 
//     digitalWrite(PIN_LED, HIGH);
//   }
//   else if (moisture >= threshold && pumpOn) { 
//     pumpOn = false; 
//     digitalWrite(PIN_PUMP, LOW); 
//     digitalWrite(PIN_LED, LOW);
//   }

//   if (WiFi.status() == WL_CONNECTED) {
//     HTTPClient http;
//     WiFiClient client;
//     String url = String(API_BASE) + "/api/telemetry/ingest";
//     http.begin(client, url);
//     http.addHeader("Content-Type", "application/json");

//     String body = String("{\"deviceId\":\"") + DEVICE_ID +
//                   "\",\"secret\":\"" + DEVICE_SECRET +
//                   "\",\"moisture\":" + moisture +
//                   ",\"pumpOn\":" + (pumpOn ? "true" : "false") + "}";

//     int code = http.POST(body);
//     String res = http.getString();
//     Serial.printf("POST %d %s\n", code, res.c_str());

//     http.end();
//   }
// }


//   delay(50);
// }
