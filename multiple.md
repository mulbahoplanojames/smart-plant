"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { firebaseAuth } from "@/lib/firebase/client";
import { getIdToken } from "firebase/auth";
import { fetchJSON } from "@/lib/fetch-json";

type Plant = {
  id: string;
  name: string;
  species?: string;
  notes?: string;
  deviceId?: string | null;
  threshold?: number | null;
};

export default function PlantsPage() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [notes, setNotes] = useState("");
  const [threshold, setThreshold] = useState<number | "">("");

  const load = async () => {
    const user = firebaseAuth().currentUser;
    const idToken = user ? await getIdToken(user) : "";
    const res = await fetchJSON<{ data?: Plant[]; error?: string }>(
      "/api/plants",
      {
        headers: { Authorization: `Bearer ${idToken}` },
      }
    );
    if (!res.ok) {
      console.error("Plants load failed:", res.error);
      alert(`Failed to load plants: ${res.error}`);
      return;
    }
    setPlants(res.data?.data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const user = firebaseAuth().currentUser;
    const idToken = user ? await getIdToken(user) : "";
    const res = await fetchJSON("/api/plants", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        name,
        species,
        deviceId: deviceId || null,
        notes,
        threshold: threshold === "" ? null : threshold,
      }),
    });
    if (!res.ok) {
      alert(`Failed to create plant: ${res.error}`);
      return;
    }
    setName("");
    setSpecies("");
    setDeviceId("");
    setNotes("");
    setThreshold("");
    await load();
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Plant</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-1">
              <Label>Species</Label>
              <Input
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
              />
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="grid gap-1">
              <Label>Device ID (optional)</Label>
              <Input
                value={deviceId}
                onChange={(e) => setDeviceId(e.target.value)}
                placeholder="demo-device-1"
              />
            </div>
            <div className="grid gap-1">
              <Label>Threshold (%)</Label>
              <Input
                type="number"
                value={threshold}
                onChange={(e) =>
                  setThreshold(
                    e.target.value === "" ? "" : Number(e.target.value)
                  )
                }
                placeholder="35"
              />
            </div>
          </div>
          <div className="grid gap-1">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button onClick={create} disabled={!name}>
            Create
          </Button>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plants.map((p) => (
          <Card key={p.id}>
            <CardHeader>
              <CardTitle className="text-base">{p.name}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground grid gap-1">
              <div>Species: {p.species || "-"}</div>
              <div>Device: {p.deviceId || "-"}</div>
              <div>Threshold: {p.threshold ?? "-"}</div>
              <div className="text-xs">{p.notes || ""}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------

// #include <ESP8266WiFi.h>
// #include <ESP8266HTTPClient.h>
// #include "DHT.h"

// // ====== WiFi credentials ======
// const char* WIFI_SSID = "ChrisSolo2025-2G";
// const char* WIFI_PASS = "ournewpassword";

// // ====== API endpoint URL ======
// const char* API_BASE = "http://192.168.1.97:3000";

// // ====== Device registration data ======
// const char* DEVICE_ID = "689f7f27110c099dd866c8c0";
// const char* DEVICE_SECRET = "agnjclzx38el0zyjlz3r0yukoxzd9wkc";

// // ====== Pin assignments ======
// const int PIN_SENSOR      = A0;  // Soil moisture analog
// const int PIN_LED_NORMAL  = 5;   // D1 → GPIO5
// const int RELAY_PIN       = 0;   // D3 → GPIO0 (relay)
// const int DHTPIN          = 4;   // D2 → GPIO4 (DHT)
// const int PIN_LED_EXTRA   = 14;  // D5 → GPIO14 (extra LED)

// // ====== Sensor type ======
// #define DHTTYPE DHT11

// // ====== Timing ======
// unsigned long lastPost = 0;
// unsigned long lastBlink = 0;
// bool extraLedState = false;

// // ====== State variables ======
// bool pumpOn = false;
// int threshold = 350;         // Soil dryness threshold
// float tempThreshold = 28.0;  // °C

// // ====== Init DHT ======
// DHT dht(DHTPIN, DHTTYPE);

// int readMoistureRaw() {
//   return analogRead(PIN_SENSOR);
// }

// int readMoisturePercent() {
//   const int dry = 350;
//   const int wet = 150;
//   int raw = readMoistureRaw();
//   int pct = map(raw, dry, wet, 0, 100);
//   return constrain(pct, 0, 100);
// }

// void connectToWiFi() {
//   Serial.print("Connecting to WiFi: ");
//   Serial.println(WIFI_SSID);
//   WiFi.mode(WIFI_STA);
//   WiFi.begin(WIFI_SSID, WIFI_PASS);

//   unsigned long startAttemptTime = millis();
//   while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
//     Serial.print(".");
//     delay(500);
//   }

//   if (WiFi.status() == WL_CONNECTED) {
//     Serial.println("\n✅ Connected to WiFi");
//     Serial.print("📡 IP Address: ");
//     Serial.println(WiFi.localIP());
//   } else {
//     Serial.println("\n❌ Failed to connect to WiFi");
//   }
// }

// void setup() {
//   Serial.begin(115200);
//   delay(1000);
//   connectToWiFi();

//   pinMode(PIN_LED_NORMAL, OUTPUT);
//   pinMode(PIN_LED_EXTRA, OUTPUT);
//   pinMode(RELAY_PIN, OUTPUT);

//   digitalWrite(PIN_LED_NORMAL, LOW);
//   digitalWrite(PIN_LED_EXTRA, LOW);
//   digitalWrite(RELAY_PIN, LOW);

//   dht.begin();
// }

// void loop() {
//   unsigned long now = millis();

//   // Blink PIN_LED_EXTRA if pump is ON
//   if (pumpOn && now - lastBlink >= 500) {
//     lastBlink = now;
//     extraLedState = !extraLedState;
//     digitalWrite(PIN_LED_EXTRA, extraLedState ? HIGH : LOW);
//   }
//   else if (!pumpOn) {
//     digitalWrite(PIN_LED_EXTRA, HIGH); // stays ON when pump OFF
//   }

//   // Poll API every ~3s
//   if (now % 3000 < 50 && WiFi.status() == WL_CONNECTED) {
//     HTTPClient http;
//     WiFiClient client;
//     String url = String(API_BASE) + "/api/actions/pending?deviceId=" + DEVICE_ID + "&secret=" + DEVICE_SECRET;

//     http.begin(client, url);
//     int code = http.GET();

//     if (code == 200) {
//       String payload = http.getString();

//       if (payload.indexOf("\"action\":\"relay\"") >= 0) {
//         bool next = payload.indexOf("\"state\":true") >= 0;
//         pumpOn = next;
//         digitalWrite(RELAY_PIN, pumpOn ? HIGH : LOW);
//         digitalWrite(PIN_LED_NORMAL, pumpOn ? HIGH : LOW);

//         Serial.printf("[SERVER] Relay: %s | LED_NORMAL: %s | LED_EXTRA: %s (blink mode if pump ON)\n",
//           pumpOn ? "ON" : "OFF",
//           pumpOn ? "ON" : "OFF",
//           pumpOn ? "Blink" : "Solid ON"
//         );
//       }

//       int calPos = payload.indexOf("lowThreshold");
//       if (calPos >= 0) {
//         int start = payload.indexOf(":", calPos);
//         int end = payload.indexOf("}", start);
//         if (start > 0 && end > start) {
//           int val = payload.substring(start + 1, end).toInt();
//           if (val >= 0 && val <= 1023) threshold = val;
//         }
//       }
//     }
//     http.end();
//   }

//   // Telemetry every 5s
//   if (now - lastPost > 5000) {
//     lastPost = now;

//     int rawValue = readMoistureRaw();
//     int moisture = readMoisturePercent();
//     float temp = dht.readTemperature();
//     float hum = dht.readHumidity();

//     if (isnan(temp) || isnan(hum)) {
//       Serial.println("⚠️ Failed to read from DHT sensor!");
//       temp = -99;
//     }

//     Serial.printf("Soil: %d (%d%%) | Temp: %.1f°C | Hum: %.1f%%\n", rawValue, moisture, temp, hum);

//     // Local control
//     if (rawValue < threshold && !pumpOn) {
//       pumpOn = true;
//       digitalWrite(RELAY_PIN, HIGH);
//       digitalWrite(PIN_LED_NORMAL, HIGH);
//       Serial.println("[LOCAL] Soil dry → Pump ON | LED_NORMAL ON | LED_EXTRA Blink");
//     }
//     else if (rawValue >= threshold && pumpOn) {
//       pumpOn = false;
//       digitalWrite(RELAY_PIN, LOW);
//       digitalWrite(PIN_LED_NORMAL, LOW);
//       Serial.println("[LOCAL] Soil wet → Pump OFF | LED_NORMAL OFF | LED_EXTRA Solid ON");
//     }

//     // Send data to API
//     if (WiFi.status() == WL_CONNECTED) {
//       HTTPClient http;
//       WiFiClient client;
//       String url = String(API_BASE) + "/api/telemetry/ingest";
//       http.begin(client, url);
//       http.addHeader("Content-Type", "application/json");

//       String body = String("{\"deviceId\":\"") + DEVICE_ID +
//                     "\",\"secret\":\"" + DEVICE_SECRET +
//                     "\",\"moisture\":" + rawValue +
//                     ",\"pumpOn\":" + (pumpOn ? "true" : "false") +
//                     ",\"temperature\":" + temp +
//                     ",\"humidity\":" + hum + "}";

//       int code = http.POST(body);
//       String res = http.getString();
//       Serial.printf("POST %d %s\n", code, res.c_str());

//       http.end();
//     }
//   }

//   delay(50);
// }
